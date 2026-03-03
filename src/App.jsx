import { useState, useEffect } from 'react';
import { useTickets, TicketProvider } from './context/TicketContext';
import { AdminProvider } from './context/AdminContext';
import { ToastProvider } from './context/ToastContext';
import { DEMO_USERS } from './data/mockData';
import { supabase } from './config/supabase';


// ─── Agent/Client app imports ─────────────────────────────────────────────────
import Sidebar from './components/layout/Sidebar';
import TicketList from './components/tickets/TicketList';
import ChatPanel from './components/chat/ChatPanel';
import ClientPanel from './components/client/ClientPanel';
import NewTicketModal from './components/tickets/NewTicketModal';
import EmptyState from './components/layout/EmptyState';
import Dashboard from './components/views/Dashboard';
import ClientDashboard from './components/views/ClientDashboard';
import Reports from './components/views/Reports';
import Settings from './components/views/Settings';
import LoginPage from './components/auth/LoginPage';

// ─── Super Admin app imports ──────────────────────────────────────────────────
import SuperAdminLayout from './components/superadmin/SuperAdminLayout';
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard';

// ─── Super Admin App ──────────────────────────────────────────────────────────
// DB: rendered when profiles.role === 'super_admin'
// Has its own layout — completely separate from the ticket system.
function SuperAdminApp({ currentUser, onLogout }) {
    return (
        <AdminProvider currentUser={currentUser}>
            <SuperAdminLayout onLogout={onLogout}>
                <SuperAdminDashboard />
            </SuperAdminLayout>
        </AdminProvider>
    );
}

// ─── Agent / Client App Content ───────────────────────────────────────────────
// DB: rendered when profiles.role IN ('admin_empresa', 'agent', 'client')
function AppContent({ currentUser, onLogout }) {
    const { activeView, setActiveView, activeTicketId, showTicketList } = useTickets();

    const isAgent = currentUser?.role === 'agent' || currentUser?.role === 'admin_empresa';
    const isAdminEmpresa = currentUser?.role === 'admin_empresa';
    const showTicketsView = activeView === 'tickets';

    // ─── Route Protection ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!isAgent && (activeView === 'reports' || activeView === 'settings')) {
            setActiveView('dashboard');
        } else if (isAgent && !isAdminEmpresa && activeView === 'settings') {
            setActiveView('dashboard');
        }
    }, [activeView, isAgent, isAdminEmpresa, setActiveView]);

    return (
        <div className="flex h-screen w-full overflow-hidden font-display bg-background-light text-slate-900">
            <Sidebar onLogout={onLogout} currentUser={currentUser} />

            <div className="flex flex-1 overflow-hidden relative">

                {/* Dashboard / Resumen — routes by role */}
                {activeView === 'dashboard' && (
                    isAgent
                        ? <Dashboard />
                        : <ClientDashboard />
                )}

                {/* Reports — Agent + admin_empresa only */}
                {/* DB: route guard — profiles.role IN ('agent','admin_empresa') */}
                {activeView === 'reports' && isAgent && <Reports />}

                {/* Settings — admin_empresa only */}
                {/* DB: route guard — profiles.role === 'admin_empresa' */}
                {activeView === 'settings' && isAdminEmpresa && <Settings />}

                {/* Tickets view */}
                {showTicketsView && (
                    <>
                        <TicketList />
                        {activeTicketId ? (
                            <>
                                <ChatPanel />
                                {isAgent && <ClientPanel />}
                            </>
                        ) : (
                            <div className={`flex-1 ${showTicketList ? 'hidden lg:flex' : 'flex'} min-w-0`}>
                                <EmptyState />
                            </div>
                        )}
                    </>
                )}
            </div>

            <NewTicketModal />
        </div>
    );
}

// ─── Root App with Auth Gate ──────────────────────────────────────────────────
// DB: replace with supabase.auth.getSession() + onAuthStateChange
export default function App() {
    const [currentUser, setCurrentUser] = useState(null);
    const [loginError, setLoginError] = useState('');
    const [isInitializing, setIsInitializing] = useState(true);

    // ─── Rehidratación (Simulada para Supabase) ───────────────────────────────
    useEffect(() => {
        const checkSession = async () => {
            try {
                // TODO: Reemplazar con supabase.auth.getSession() / getUser()
                // await new Promise(resolve => setTimeout(resolve, 300)); // Simulando delay de red
                const storedUser = localStorage.getItem('@TicketSync:user');
                if (storedUser) {
                    setCurrentUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Error al restaurar sesión:', error);
            } finally {
                setIsInitializing(false);
            }
        };

        checkSession();
    }, []);

    const handleLogin = async ({ role, email, password }) => {
        // Validación con Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            setLoginError('Email o contraseña incorrectos. Verificá tus credenciales.');
            return;
        }

        // Consultar el rol real en la base de datos usando el ID autenticado
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

        if (profileError || !profile) {
            setLoginError('Hubo un problema obteniendo tu perfil en la base de datos.');
            await supabase.auth.signOut();
            return;
        }

        const realRole = profile.role;

        // Recuperar perfil desde mockData (Aislamiento para mantener UI funcionando)
        const user = DEMO_USERS.find(
            u => u.email.toLowerCase() === email.toLowerCase()
        );

        if (!user) {
            setLoginError('Autenticado en Supabase pero perfil no encontrado en mockData.');
            await supabase.auth.signOut();
            return;
        }

        // Validación de rol cruzado con la UI selector
        const isAgentFamily = realRole === 'agent' || realRole === 'admin_empresa';
        if (realRole === 'super_admin' && role !== 'agent') {
            // super_admin always logs in via the "Agente" selector
        } else if (isAgentFamily && role === 'client') {
            setLoginError('Esta cuenta es de tipo Agente. Seleccioná el rol "Agente".');
            await supabase.auth.signOut();
            return;
        } else if (realRole === 'client' && role === 'agent') {
            setLoginError('Esta cuenta es de tipo Cliente. Seleccioná el rol "Cliente".');
            await supabase.auth.signOut();
            return;
        }

        setLoginError('');
        const userData = {
            id: user.id, // Se mantiene el id mockeado para el resto del sistema
            email: user.email,
            role: realRole, // Usamos el rol real de public.profiles
            name: user.name,
            company: user.company,
            companyId: user.companyId,
            agentId: user.agentId,
            clientId: user.clientId,
        };

        setCurrentUser(userData);
        // Persistir en localStorage
        localStorage.setItem('@TicketSync:user', JSON.stringify(userData));
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setLoginError('');
        // Limpiar persistencia
        localStorage.removeItem('@TicketSync:user');
    };

    if (isInitializing) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background-light">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
                    <p className="text-slate-400 font-bold text-sm tracking-widest uppercase animate-pulse">Iniciando</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return <LoginPage onLogin={handleLogin} loginError={loginError} />;
    }

    // ── Route by role ──────────────────────────────────────────────────────────
    // DB: read from profiles.role after login

    // super_admin → standalone company management app
    if (currentUser.role === 'super_admin') {
        return (
            <ToastProvider>
                <SuperAdminApp currentUser={currentUser} onLogout={handleLogout} />
            </ToastProvider>
        );
    }

    // agent / admin_empresa / client → ticket system
    return (
        <ToastProvider>
            <AdminProvider currentUser={currentUser}>
                <TicketProvider currentUser={currentUser}>
                    <AppContent currentUser={currentUser} onLogout={handleLogout} />
                </TicketProvider>
            </AdminProvider>
        </ToastProvider>
    );
}
