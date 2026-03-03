-- ====================================================================
-- TICKET SYNC - SCRIPT DE BASE DE DATOS PARA SUPABASE (POSTGRESQL)
-- ====================================================================
-- Este script crea las tablas, enums, índices y la configuración
-- básica de Row Level Security (RLS) orientada a Multi-Tenancy.
-- ====================================================================

-- Habilitar extensión para UUIDs (aunque en Supabase gen_random_uuid() viene por defecto)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. ENUMS (Tipos de datos personalizados según mockData.js)
-- ====================================================================

-- Roles del sistema
CREATE TYPE role_type AS ENUM (
    'super_admin',
    'admin_empresa',
    'agent',
    'client'
);

-- Estados para entidades (Soft Delete)
CREATE TYPE status_type AS ENUM (
    'Activo',
    'Inactivo'
);

-- Prioridades (y estados de ticket, según la UI actual combinada)
CREATE TYPE priority_type AS ENUM (
    'Urgente',
    'En Progreso',
    'Resuelto',
    'Nuevo',
    'Archivado'
);


-- ====================================================================
-- 2. TABLAS CORE Y MULTI-TENANCY
-- ====================================================================

-- Tabla compañias (Multi-tenancy parent)
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT, -- URL apuntando a Supabase Storage
    status status_type DEFAULT 'Activo' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla perfiles (Conecta Auth con datos de la app)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role role_type NOT NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    status status_type DEFAULT 'Activo' NOT NULL,
    avatar_url TEXT, -- URL apuntando a Supabase Storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla clientes (Datos extendidos para el rol "client")
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    client_company_name TEXT, -- Empresa específica del cliente (ej. Industrial Corp)
    timezone TEXT DEFAULT 'ART (GMT-3)',
    initials TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla agentes (Datos extendidos para el rol "agent" y "admin_empresa")
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    job_title TEXT DEFAULT 'Soporte',
    initials TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ====================================================================
-- 3. TICKETS Y MENSAJERIA
-- ====================================================================

-- Tabla tickets
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status priority_type DEFAULT 'Nuevo' NOT NULL,
    priority priority_type DEFAULT 'Nuevo' NOT NULL,
    channel TEXT DEFAULT 'Portal' NOT NULL,
    sla TEXT, -- Por ejemplo: "24h"
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Usuario creador
    assigned_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Asignado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla mensajes del hilo del ticket
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL, -- HTML o JSON del TipTap
    is_internal BOOLEAN DEFAULT false NOT NULL, -- True si es "Nota Interna" visible solo para agentes
    attachments JSONB, -- Estructura JSON con info de archivos adjuntos (size, url, type, name)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla historial (Auditoría: ticket_logs)
CREATE TABLE public.ticket_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    field_changed TEXT NOT NULL, -- ej: "status", "assigned_agent", "priority"
    old_value TEXT,
    new_value TEXT,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ====================================================================
-- 4. ÍNDICES DE RENDIMIENTO
-- ====================================================================

CREATE INDEX idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX idx_tickets_company_id ON public.tickets(company_id);
CREATE INDEX idx_tickets_client_id ON public.tickets(client_id);
CREATE INDEX idx_tickets_assigned_agent_id ON public.tickets(assigned_agent_id);
CREATE INDEX idx_messages_ticket_id ON public.messages(ticket_id);
CREATE INDEX idx_messages_company_id ON public.messages(company_id);
CREATE INDEX idx_ticket_logs_ticket_id ON public.ticket_logs(ticket_id);
CREATE INDEX idx_ticket_logs_company_id ON public.ticket_logs(company_id);


-- ====================================================================
-- 5. SEGURIDAD A NIVEL DE FILAS (ROW LEVEL SECURITY - RLS)
-- ====================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_logs ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 6. POLÍTICAS RLS (CORREGIDAS: PREVENCIÓN DE BUCLE INFINITO)
-- ====================================================================

-- 6.1 Funciones Helper (Pase VIP para evitar la recursión)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_company()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ===== POLÍTICAS PARA PROFILES =====
-- Puede ver su propio perfil, los de su empresa, o todos si es super_admin
CREATE POLICY "Users can view profiles in their company or if super_admin"
ON public.profiles FOR SELECT
USING (
    id = auth.uid() 
    OR company_id = public.get_user_company()
    OR public.get_user_role() = 'super_admin'
);

-- Solo super_admin o admin_empresa pueden crear/editar perfiles
CREATE POLICY "Admin/SuperAdmin can manage profiles"
ON public.profiles FOR ALL
USING (
    public.get_user_role() = 'super_admin'
    OR 
    (
        public.get_user_role() = 'admin_empresa' 
        AND 
        company_id = public.get_user_company()
    )
);

-- ===== POLÍTICAS PARA TICKETS =====
CREATE POLICY "Tickets visibility by role"
ON public.tickets FOR SELECT
USING (
    company_id = public.get_user_company()
    AND (
        public.get_user_role() IN ('agent', 'admin_empresa', 'super_admin')
        OR 
        client_id = auth.uid()
    )
);

-- ===== POLÍTICAS PARA MESSAGES =====
CREATE POLICY "Messages visibility by role"
ON public.messages FOR SELECT
USING (
    company_id = public.get_user_company()
    AND (
        public.get_user_role() IN ('agent', 'admin_empresa', 'super_admin')
        OR 
        (
            ticket_id IN (SELECT id FROM public.tickets WHERE client_id = auth.uid()) 
            AND 
            is_internal = false
        )
    )
);


-- ====================================================================
-- Funciones Trigger para actualizar "updated_at" dinámicamente
-- ====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
