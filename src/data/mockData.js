// ─── Role Hierarchy ───────────────────────────────────────────────────────────
// DB: ENUM role_type = 'super_admin' | 'admin_empresa' | 'agent' | 'client'
// super_admin   → Manages all companies globally. Redirected to SuperAdminApp.
// admin_empresa → Agent with elevated permissions; sees Settings view.
// agent         → Standard support agent.
// client        → End-user of support portal.

// ─── Demo Users (Auth) ────────────────────────────────────────────────────────
// DB table: auth.users + profiles(id, role, name, company_id, agent_id, client_id)
export const DEMO_USERS = [
    {
        id: 'user-superadmin-1',            // DB: auth.users.id
        email: 'admin@ticketsync.com',      // DB: auth.users.email
        password: '1234',                   // DB: stored as bcrypt hash
        role: 'super_admin',               // DB: profiles.role
        name: 'Super Admin',               // DB: profiles.name
        company: 'Ticket Sync',            // DB: profiles.company (platform owner)
        companyId: 'company-1',            // DB: profiles.company_id → companies.id
        agentId: null,
        clientId: null,
        avatarUrl: null,
    },
    {
        id: 'user-agent-1',                        // DB: auth.users.id
        email: 'matias@ticketsync.com',            // DB: auth.users.email
        password: '1234',                          // DB: stored as bcrypt hash
        role: 'admin_empresa',                     // DB: profiles.role (elevated agent)
        name: 'Matias Abelleira',                  // DB: profiles.name
        company: 'Ticket Sync',                    // DB: profiles.company
        companyId: 'company-1',                    // DB: profiles.company_id
        agentId: 'agent-1',                        // DB: profiles.agent_id → agents.id
        clientId: null,
        avatarUrl: null,
    },
    {
        id: 'user-client-1',                       // DB: auth.users.id
        email: 'maria@industrialcorp.com',         // DB: auth.users.email
        password: '1234',                          // DB: stored as bcrypt hash
        role: 'client',                            // DB: profiles.role
        name: 'Maria Rodriguez',                   // DB: profiles.name
        company: 'Industrial Corp',                // DB: profiles.company
        companyId: 'company-2',                    // DB: profiles.company_id
        agentId: null,
        clientId: 'client-1',                      // DB: profiles.client_id → clients.id
        avatarUrl: null,
    },
];

// ─── Companies ───────────────────────────────────────────────────────────────
// DB table: companies(id, name, logo_url, status, created_at)
export const initialCompanies = [
    {
        id: 'company-1',                    // DB: companies.id (uuid)
        name: 'Ticket Sync',               // DB: companies.name
        logoUrl: null,                     // DB: companies.logo_url (storage URL)
        status: 'Activo',                  // DB: companies.status ENUM('Activo','Inactivo')
        createdAt: '03/03/26',             // DB: companies.created_at (formatted)
        rawTs: Date.now() - 86400000 * 30, // DB: companies.created_at (unix ms)
    },
    {
        id: 'company-2',
        name: 'Industrial Corp',
        logoUrl: null,
        status: 'Activo',
        createdAt: '03/03/26',
        rawTs: Date.now() - 86400000 * 5,
    },
];

// ─── All Users (agents + clients across all companies) ─────────────────────
// DB table: profiles(id, email, name, role, company_id, status, agent_id, client_id)
// Used by admin_empresa and super_admin to manage users in Settings view.
export const initialAllUsers = [
    {
        id: 'user-agent-1',                        // DB: profiles.id (auth.users.id)
        email: 'matias@ticketsync.com',            // DB: profiles.email / auth.users.email
        name: 'Matias Abelleira',                  // DB: profiles.name
        role: 'admin_empresa',                     // DB: profiles.role
        companyId: 'company-1',                    // DB: profiles.company_id
        companyName: 'Ticket Sync',                // DB: companies.name (joined)
        status: 'Activo',                          // DB: profiles.status ENUM('Activo','Inactivo')
        initials: 'MA',                            // DB: derived or stored
        agentId: 'agent-1',
        clientId: null,
        avatarUrl: null,
    },
    {
        id: 'user-client-1',
        email: 'maria@industrialcorp.com',
        name: 'Maria Rodriguez',
        role: 'client',
        companyId: 'company-2',
        companyName: 'Industrial Corp',
        status: 'Activo',
        initials: 'MR',
        agentId: null,
        clientId: 'client-1',
        avatarUrl: null,
    },
];

// ─── Agents ──────────────────────────────────────────────────────────────────
// DB table: agents(id, name, initials, role, avatar_url, company_id)
export const currentAgent = {
    id: 'agent-1',                  // DB: agents.id
    name: 'Matias Abelleira',       // DB: agents.name
    initials: 'MA',                 // DB: agents.initials
    role: 'Administrador',          // DB: agents.job_title
    avatarUrl: null,                // DB: agents.avatar_url
    companyId: 'company-1',         // DB: agents.company_id
};

export const agents = [
    { id: 'agent-1', name: 'Matias Abelleira', initials: 'MA', role: 'Administrador', avatarUrl: null, companyId: 'company-1' },
];

// ─── Clients ──────────────────────────────────────────────────────────────────
// DB table: clients(id, name, company, avatar_url, initials, status, timezone, created_at, company_id)
export const clients = {
    'client-1': {
        id: 'client-1',
        name: 'Maria Rodriguez',
        company: 'Industrial Corp',
        avatarUrl: null,
        initials: 'MR',
        status: 'Activo',
        timezone: 'ART (GMT-3)',
        createdAt: '03/03/26 15:50hs',
        companyId: 'company-2',             // DB: clients.company_id → companies.id
    },
};

// ─── Tickets ─────────────────────────────────────────────────────────────────
// DB table: tickets(id, title, status, priority, channel, sla, client_id, assigned_agent_id, company_id, ...)
export const initialTickets = [];

// ─── Priority config ──────────────────────────────────────────────────────────
export const priorityConfig = {
    'Urgente': { bg: 'bg-red-100', text: 'text-red-600', border: 'border-l-accent-red' },
    'En Progreso': { bg: 'bg-status-orange/10', text: 'text-status-orange', border: 'border-l-status-orange' },
    'Resuelto': { bg: 'bg-status-green/10', text: 'text-status-green', border: 'border-l-status-green' },
    'Nuevo': { bg: 'bg-primary/10', text: 'text-primary', border: 'border-l-primary' },
    'Archivado': { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-l-slate-300' },
};
