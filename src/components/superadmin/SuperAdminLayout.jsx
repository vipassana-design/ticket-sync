import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import logoSidebar from '../../img/logo-ticket-sync.png';
import Avatar from '../ui/Avatar';

// ─── SuperAdminLayout ─────────────────────────────────────────────────────────
// Standalone layout for super_admin — completely separate from the ticket system.
// DB: rendered when profiles.role === 'super_admin'
export default function SuperAdminLayout({ children, onLogout }) {
    const { currentUser } = useAdmin();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#0f1319] text-slate-100 font-display">

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:static inset-y-0 left-0 z-40
                w-[220px] lg:w-[15%] min-w-[200px]
                bg-[#151a23] border-r border-slate-800
                flex flex-col justify-between py-6 px-4
                transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex flex-col gap-8">
                    {/* Logo */}
                    <div className="px-2">
                        <img src={logoSidebar} alt="Ticket Sync" className="h-10 w-auto" />
                    </div>

                    {/* Super Admin badge */}
                    <div className="px-2">
                        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-primary/20 to-primary-accent/20 border border-primary/30 text-primary text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest">
                            <span className="material-symbols-outlined text-xs select-none">shield</span>
                            Super Admin
                        </span>
                    </div>

                    {/* Nav */}
                    <nav className="flex flex-col gap-1">
                        <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-accent text-white shadow-lg shadow-primary/20 w-full text-left">
                            <span className="material-symbols-outlined text-xl select-none">business</span>
                            <span className="text-sm font-medium">Empresas</span>
                        </button>
                        <div className="h-px bg-slate-800 my-3" />
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left text-slate-400 hover:bg-red-900/20 hover:text-red-400"
                        >
                            <span className="material-symbols-outlined text-xl select-none">logout</span>
                            <span className="text-sm font-medium">Salir</span>
                        </button>
                    </nav>
                </div>

                {/* Profile */}
                <div className="flex items-center gap-3 px-2">
                    <Avatar
                        avatarUrl={currentUser?.avatarUrl}
                        name={currentUser?.name || 'Super Admin'}
                        size="sm"
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
                        <p className="text-[10px] text-slate-500 truncate">Super Admin</p>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile top bar */}
                <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-slate-800 bg-[#151a23]">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined select-none">menu</span>
                    </button>
                    <span className="text-sm font-bold text-white">Administración Global</span>
                </div>
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
