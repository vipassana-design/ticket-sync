import logoSidebar from '../../img/logo-ticket-sync.png';
import { useTickets } from '../../context/TicketContext';
import Avatar from '../ui/Avatar';

// ─── Nav items by role ────────────────────────────────────────────────────────
// DB: users.role → determines which nav items are shown
const adminNavItems = [
    { icon: 'dashboard', label: 'Resumen', view: 'dashboard' },
    { icon: 'confirmation_number', label: 'Tickets', view: 'tickets' },
    { icon: 'analytics', label: 'Reportes', view: 'reports' },
];

const agentNavItems = [
    { icon: 'dashboard', label: 'Resumen', view: 'dashboard' },
    { icon: 'confirmation_number', label: 'Tickets', view: 'tickets' },
    { icon: 'analytics', label: 'Reportes', view: 'reports' },
];

const clientNavItems = [
    { icon: 'confirmation_number', label: 'Tickets', view: 'tickets' },
    { icon: 'dashboard', label: 'Resumen', view: 'dashboard' },
];

function getNavItems(role) {
    if (role === 'admin_empresa') return adminNavItems;
    if (role === 'agent') return agentNavItems;
    return clientNavItems;
}

export default function Sidebar({ onLogout, currentUser }) {
    const {
        currentAgent,
        isSidebarOpen, toggleSidebar,
        setIsNewTicketModalOpen,
        activeView, setActiveView,
    } = useTickets();

    const role = currentUser?.role;
    const isAgent = role === 'agent' || role === 'admin_empresa';
    const isAdminEmpresa = role === 'admin_empresa';
    const navItems = getNavItems(role);

    const handleNav = (view) => {
        setActiveView(view);
        if (window.innerWidth < 1024) toggleSidebar();
    };

    const handleLogout = () => {
        if (window.innerWidth < 1024) toggleSidebar();
        onLogout?.();
    };

    // Display info for the bottom profile section
    const displayName = isAgent
        ? (currentUser?.name ?? currentAgent.name)
        : (currentUser?.name ?? currentUser?.email?.split('@')[0] ?? 'Cliente');

    const displayRole = role === 'admin_empresa'
        ? 'Admin Empresa'
        : role === 'agent'
            ? 'Agente'
            : 'Portal Cliente';

    const displayInitials = isAgent
        ? (currentAgent.initials || displayName.slice(0, 2).toUpperCase())
        : (currentUser?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'CL');

    return (
        <>
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Sidebar panel */}
            <aside className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-[220px] lg:w-[15%] min-w-[180px]
          bg-sidebar-dark text-slate-100
          flex flex-col justify-between py-6 px-4
          border-r border-dark-border
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
            >
                {/* ── Top ───────────────────────────────────────────────── */}
                <div className="flex flex-col gap-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3 px-2">
                        <img src={logoSidebar} alt="Ticket Sync" className="h-12 w-auto" />
                    </div>

                    {/* Admin Empresa badge — only for admin_empresa */}
                    {isAdminEmpresa && (
                        <div className="px-2">
                            <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest">
                                <span className="material-symbols-outlined text-xs select-none">manage_accounts</span>
                                Admin Empresa
                            </span>
                        </div>
                    )}

                    {/* Nav items */}
                    <nav className="flex flex-col gap-1">
                        {navItems.map(({ icon, label, view }) => {
                            const isActive = activeView === view;
                            return (
                                <button
                                    key={view}
                                    onClick={() => handleNav(view)}
                                    className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left
                    ${isActive
                                            ? 'bg-gradient-to-r from-primary to-primary-accent text-white shadow-lg shadow-primary/20'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                        }
                  `}
                                >
                                    <span className="material-symbols-outlined text-xl select-none">{icon}</span>
                                    <span className="text-sm font-medium">{label}</span>
                                </button>
                            );
                        })}

                        <div className="h-px bg-dark-border my-3" />

                        {/* Ajustes — admin_empresa ONLY */}
                        {/* DB: shown only when profiles.role === 'admin_empresa' */}
                        {isAdminEmpresa && (
                            <button
                                onClick={() => handleNav('settings')}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left
                  ${activeView === 'settings'
                                        ? 'bg-gradient-to-r from-primary to-primary-accent text-white shadow-lg shadow-primary/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                                    }
                `}
                            >
                                <span className="material-symbols-outlined text-xl select-none">settings</span>
                                <span className="text-sm font-medium">Ajustes</span>
                            </button>
                        )}

                        {/* Salir — all roles */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left text-slate-400 hover:bg-red-900/20 hover:text-red-400"
                        >
                            <span className="material-symbols-outlined text-xl select-none">logout</span>
                            <span className="text-sm font-medium">Salir</span>
                        </button>
                    </nav>
                </div>

                {/* ── Bottom: user profile ──────────────────────────────── */}
                <div className="flex flex-col gap-4">
                    {/* Nuevo Ticket button — Client only */}
                    {/* DB: shown only when profiles.role === 'client' */}
                    {!isAgent && (
                        <button
                            onClick={() => { setIsNewTicketModalOpen(true); if (window.innerWidth < 1024) toggleSidebar(); }}
                            className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-accent to-primary hover:opacity-90 active:scale-95 text-white rounded-xl py-3 px-4 text-sm font-bold transition-all duration-200 shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-sm select-none">add</span>
                            <span>Nuevo Ticket</span>
                        </button>
                    )}

                    {/* Profile */}
                    <div className="flex items-center gap-3 px-2">
                        {/* DB: profiles.avatar_url → fallback to initials */}
                        <Avatar
                            avatarUrl={currentUser?.avatarUrl}
                            name={displayName}
                            size="sm"
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{displayName}</p>
                            <p className="text-[10px] text-slate-500 truncate">{displayRole}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

