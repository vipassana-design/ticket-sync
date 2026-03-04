import { useTickets } from '../../context/TicketContext';

// ─── Metric Card ─────────────────────────────────────────────────────────────
function MetricCard({ icon, value, label, color, trend }) {
    const colorMap = {
        red: 'from-red-500/10 to-red-600/5 border-red-200 text-red-600',
        orange: 'from-orange-500/10 to-orange-600/5 border-orange-200 text-orange-600',
        blue: 'from-primary/10 to-primary-accent/5 border-primary/20 text-primary',
        green: 'from-status-green/10 to-green-600/5 border-green-200 text-status-green',
        slate: 'from-slate-100 to-slate-50 border-slate-200 text-slate-600',
    };
    const cls = colorMap[color] || colorMap.blue;

    return (
        <div className={`bg-gradient-to-br ${cls} border rounded-2xl p-5 flex flex-col gap-3`}>
            <div className="flex items-start justify-between">
                <div className={`size-10 rounded-xl flex items-center justify-center ${color === 'red' ? 'bg-red-100' : color === 'orange' ? 'bg-orange-100' : color === 'green' ? 'bg-green-100' : 'bg-primary/10'}`}>
                    <span className="material-symbols-outlined text-xl select-none">{icon}</span>
                </div>
                {trend && (
                    <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-status-green'}`}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}
                    </span>
                )}
            </div>
            <div>
                <p className="text-3xl font-extrabold">{value}</p>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

// ─── Priority Row ─────────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
    const map = {
        'Urgente': 'bg-red-100 text-red-600',
        'Alta': 'bg-orange-100 text-status-orange',
        'Media': 'bg-amber-100/50 text-amber-600',
        'Baja': 'bg-status-green/10 text-status-green',
    };
    return (
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${map[priority] || 'bg-slate-100 text-slate-500'}`}>
            {priority}
        </span>
    );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
    const { tickets, currentAgent, setActiveView, toggleSidebar } = useTickets();

    // Real-time metrics
    const openTickets = tickets.filter(t => t.status !== 'Cerrado' && t.status !== 'Archivado');
    const unassigned = openTickets.filter(t => !t.isAssigned);
    const openedToday = openTickets.filter(t => {
        const oneDay = 24 * 60 * 60 * 1000;
        return Date.now() - t.rawTs < oneDay;
    });
    const slaRed = openTickets.filter(t => t.sla && t.sla.includes('1h'));
    const myTickets = tickets.filter(t => t.isAssigned && t.status !== 'Cerrado' && t.status !== 'Archivado');

    // Sort my tickets by priority weight
    const priorityWeight = { 'Urgente': 0, 'Alta': 1, 'Media': 2, 'Baja': 3 };
    const sortedMyTickets = [...myTickets].sort((a, b) =>
        (priorityWeight[a.priority] ?? 3) - (priorityWeight[b.priority] ?? 3)
    );

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/60 chat-scrollbar min-w-0">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            {/* Mobile hamburger — sidebar navigation */}
                            <button
                                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
                                onClick={toggleSidebar}
                            >
                                <span className="material-symbols-outlined select-none text-xl">menu</span>
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Resumen</h1>
                                <p className="text-sm text-slate-500 mt-1">Operación en tiempo real · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pulse Metrics */}
                <section className="mb-8">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Pulso del Equipo</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <MetricCard icon="inbox" value={unassigned.length} label="Sin asignar" color="orange" trend={unassigned.length > 2 ? unassigned.length : null} />
                        <MetricCard icon="today" value={openedToday.length} label="Abiertos hoy" color="blue" />
                        <MetricCard icon="alarm" value={slaRed.length} label="SLA en riesgo" color="red" trend={slaRed.length > 0 ? slaRed.length : null} />
                        <MetricCard icon="confirmation_number" value={openTickets.length} label="Tickets activos" color="slate" />
                    </div>
                </section>

                {/* My Workload */}
                <section className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mis Tickets Asignados</h2>
                        <span className="text-[11px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">{myTickets.length} activos</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-border-gray overflow-hidden shadow-sm">
                        {sortedMyTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-8">
                                <span className="material-symbols-outlined text-slate-200 text-4xl select-none">task_alt</span>
                                <p className="text-sm font-bold text-slate-400">Sin tickets asignados</p>
                                <p className="text-xs text-slate-300">Todo al día ✓</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border-gray">
                                {sortedMyTickets.map(ticket => {
                                    return (
                                        <div
                                            key={ticket.id}
                                            onClick={() => { /* navigate to ticket */ }}
                                            className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                        >
                                            <PriorityBadge priority={ticket.priority} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary transition-colors">{ticket.title}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{ticket.clientName} · {ticket.channel}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${ticket.sla?.includes('1h') ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    {ticket.sla}
                                                </span>
                                                <span className="material-symbols-outlined text-slate-300 text-sm select-none group-hover:text-primary transition-colors">chevron_right</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Team overview */}
                <section className="mb-8">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Estado del Equipo</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Quick stats */}
                        <div className="bg-white border border-border-gray rounded-2xl p-5 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Distribución por Prioridad</p>
                            {['Urgente', 'Alta', 'Media', 'Baja'].map(priority => {
                                const count = tickets.filter(t => t.priority === priority && t.status !== 'Archivado').length;
                                const total = openTickets.length || 1;
                                const pct = Math.round((count / total) * 100);
                                const barColor = priority === 'Urgente' ? 'bg-red-400' : priority === 'Alta' ? 'bg-orange-400' : priority === 'Media' ? 'bg-amber-400' : 'bg-status-green';
                                return (
                                    <div key={priority} className="mb-3">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-semibold text-slate-600">{priority}</span>
                                            <span className="font-bold text-slate-400">{count}</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Quick actions */}
                        <div className="bg-white border border-border-gray rounded-2xl p-5 shadow-sm">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Acciones Rápidas</p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => setActiveView('tickets')}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors text-sm font-semibold text-left"
                                >
                                    <span className="material-symbols-outlined text-lg select-none">confirmation_number</span>
                                    Ver todos los tickets
                                </button>
                                <button
                                    onClick={() => setActiveView('reports')}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors text-sm font-semibold text-left"
                                >
                                    <span className="material-symbols-outlined text-lg select-none">analytics</span>
                                    Ver reportes &amp; analytics
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

