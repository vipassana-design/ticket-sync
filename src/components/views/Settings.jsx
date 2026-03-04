import { useState, useEffect } from 'react';
import { useTickets } from '../../context/TicketContext';
import { useAdmin } from '../../context/AdminContext';
import AgentsTab from '../settings/AgentsTab';
import ClientsTab from '../settings/ClientsTab';

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({ label, icon, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                ${active
                    ? 'bg-gradient-to-r from-primary-accent to-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                }`}
        >
            <span className="material-symbols-outlined text-lg select-none">{icon}</span>
            {label}
        </button>
    );
}

// ─── Settings View ────────────────────────────────────────────────────────────
// DB: accessible when profiles.role IN ('admin_empresa')
// Renders Agents and Clients management tabs for the logged-in company.
export default function Settings() {
    const { currentUser, toggleSidebar } = useTickets();
    const { companies } = useAdmin();

    // DB: profiles.company_id → companies.name
    const companyId = currentUser?.companyId ?? null;
    const company = companies.find(c => c.id === companyId);
    const companyName = company?.name ?? currentUser?.company ?? 'Mi Empresa';

    const { getAgentsByCompany } = useAdmin();
    const agents = getAgentsByCompany(companyId);

    const [activeTab, setActiveTab] = useState('agents'); // 'agents' | 'clients'

    // ── Auto-Assign Config ────────────────────────────────────────────────────
    const [autoAssignAgent, setAutoAssignAgent] = useState('');

    useEffect(() => {
        if (companyId) {
            const saved = localStorage.getItem(`TicketSync:autoAssign:${companyId}`);
            if (saved) setAutoAssignAgent(saved);
        }
    }, [companyId]);

    const handleAutoAssignChange = (e) => {
        const val = e.target.value;
        setAutoAssignAgent(val);
        if (companyId) {
            localStorage.setItem(`TicketSync:autoAssign:${companyId}`, val);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/60 chat-scrollbar min-w-0">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* Header */}
                <div className="mb-8 flex items-start gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        {/* Mobile hamburger */}
                        <button
                            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
                            onClick={toggleSidebar}
                        >
                            <span className="material-symbols-outlined select-none text-xl">menu</span>
                        </button>
                        <div>
                            {/* DB: companies.name WHERE id = currentUser.companyId */}
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                                Ajustes de <span className="text-primary">{companyName}</span>
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Gestioná los usuarios de tu equipo y tus clientes
                            </p>
                        </div>
                    </div>
                </div>

                {/* Settings Panels */}
                <div className="flex flex-col sm:flex-row gap-6 mb-6">
                    {/* Company badge */}
                    <div className="flex items-center gap-3 bg-white border border-border-gray rounded-2xl px-4 py-3 shadow-sm w-fit">
                        <div className="size-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                            {company?.logoUrl
                                ? <img src={company.logoUrl} alt={companyName} className="w-full h-full object-contain p-0.5 rounded-xl" />
                                : <span className="material-symbols-outlined text-slate-400 text-base select-none">business</span>
                            }
                        </div>
                        <div>
                            <p className="text-xs font-extrabold text-slate-800">{companyName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{companyId}</p>
                        </div>
                        <span className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${company?.status === 'Activo' ? 'bg-status-green/10 text-status-green' : 'bg-slate-100 text-slate-400'}`}>
                            {company?.status ?? 'Activo'}
                        </span>
                    </div>

                    {/* Auto-assign Dropdown */}
                    <div className="bg-white border border-border-gray rounded-2xl px-5 py-3 shadow-sm flex items-center gap-4 flex-1">
                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-base select-none">smart_toy</span>
                        </div>
                        <div className="flex-1">
                            <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                                Asignar tickets nuevos automáticamente a:
                            </label>
                            <select
                                value={autoAssignAgent}
                                onChange={handleAutoAssignChange}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl px-3 py-2 outline-none focus:border-primary-accent transition-colors"
                            >
                                <option value="">Sin Asignar (Manual)</option>
                                {agents.map(ag => (
                                    <option key={ag.id} value={ag.id}>{ag.name} ({ag.role})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <TabBtn
                        label="Gestión de Agentes"
                        icon="support_agent"
                        active={activeTab === 'agents'}
                        onClick={() => setActiveTab('agents')}
                    />
                    <TabBtn
                        label="Gestión de Clientes"
                        icon="groups"
                        active={activeTab === 'clients'}
                        onClick={() => setActiveTab('clients')}
                    />
                </div>

                {/* Tab content */}
                {activeTab === 'agents' && (
                    <AgentsTab companyId={companyId} companyName={companyName} />
                )}
                {activeTab === 'clients' && (
                    <ClientsTab companyId={companyId} companyName={companyName} />
                )}

            </div>
        </div>
    );
}

