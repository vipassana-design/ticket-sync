import { useTickets } from '../../context/TicketContext';
import { priorityConfig } from '../../data/mockData';

// ─── Client Dashboard ─────────────────────────────────────────────────────────
// DB: SELECT * FROM tickets WHERE client_id = currentUser.clientId
// This view is ONLY for clients — agents see the agent Dashboard instead
export default function ClientDashboard() {
    const { tickets, setIsNewTicketModalOpen, reopenTicket, toggleSidebar, currentClientId, currentUser } = useTickets();

    // DB: SELECT * FROM tickets WHERE client_id = profiles.client_id (auth.uid() → profiles)
    const myTickets = tickets.filter(t => t.clientId === currentClientId);
    const activeTickets = myTickets.filter(t => t.status !== 'Cerrado' && t.status !== 'Archivado');
    const closedTickets = myTickets.filter(t => t.status === 'Cerrado' || t.status === 'Archivado');

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/60 chat-scrollbar min-w-0">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* Header */}
                <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        {/* Mobile hamburger */}
                        <button
                            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
                            onClick={toggleSidebar}
                        >
                            <span className="material-symbols-outlined select-none text-xl">menu</span>
                        </button>
                        <div>
                            {/* DB: currentUser.name from profiles.name */}
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Mi Resumen</h1>
                            <p className="text-sm text-slate-500 mt-1">
                                {currentUser?.name ? `Bienvenida, ${currentUser.name.split(' ')[0]}` : 'Historial de actividad y tickets de soporte'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsNewTicketModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-primary-accent to-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg select-none">add_circle</span>
                        Nuevo Ticket
                    </button>
                </div>

                {/* Stats */}
                {/* DB: SELECT count(*) GROUP BY status FROM tickets WHERE client_id = currentClientId */}
                <section className="mb-8">
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        {[
                            { icon: 'confirmation_number', value: myTickets.length, label: 'Total tickets', color: 'bg-primary/5 text-primary border-primary/20' },
                            { icon: 'pending', value: activeTickets.length, label: 'Activos', color: 'bg-orange-50 text-status-orange border-orange-200' },
                            { icon: 'check_circle', value: closedTickets.length, label: 'Cerrados', color: 'bg-green-50 text-status-green border-green-200' },
                        ].map(({ icon, value, label, color }) => (
                            <div key={label} className={`border rounded-2xl p-4 sm:p-5 text-center flex flex-col items-center gap-2 ${color}`}>
                                <span className="material-symbols-outlined text-2xl select-none">{icon}</span>
                                <p className="text-2xl sm:text-3xl font-extrabold">{value}</p>
                                <p className="text-xs font-semibold text-slate-500">{label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Closed / Archived ticket history */}
                {/* DB: SELECT id, title, channel, status FROM tickets              */}
                {/*     WHERE client_id = currentClientId                           */}
                {/*     AND status IN ('Cerrado','Archivado') ORDER BY created_at DESC */}
                <section>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                        Historial de Tickets Cerrados ({closedTickets.length})
                    </h2>

                    {closedTickets.length === 0 ? (
                        <div className="bg-white border border-border-gray rounded-2xl p-10 text-center">
                            <span className="material-symbols-outlined text-slate-200 text-4xl select-none">inbox</span>
                            <p className="text-sm font-bold text-slate-400 mt-3">Sin tickets cerrados aún</p>
                            <p className="text-xs text-slate-300 mt-1">Tus tickets Cerrados aparecerán aquí</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-border-gray rounded-2xl overflow-hidden shadow-sm">
                            {/* Table header */}
                            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border-gray bg-slate-50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asunto</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Canal</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prioridad</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acción</p>
                            </div>

                            <div className="divide-y divide-border-gray">
                                {closedTickets.map(ticket => {
                                    const badge = priorityConfig[ticket.priority] || priorityConfig['Media'];
                                    return (
                                        <div
                                            key={ticket.id}
                                            className="flex sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 sm:gap-4 px-5 py-4 items-center hover:bg-slate-50 transition-colors"
                                        >
                                            {/* Title */}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{ticket.title}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5 sm:hidden">
                                                    {ticket.channel} · {ticket.priority}
                                                </p>
                                            </div>

                                            {/* Channel */}
                                            <span className="hidden sm:block text-xs text-slate-500 shrink-0">{ticket.channel}</span>

                                            {/* Priority badge */}
                                            <span className={`hidden sm:inline-flex shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                                                {ticket.priority}
                                            </span>

                                            {/* Reopen action */}
                                            <button
                                                onClick={() => reopenTicket(ticket.id)}
                                                className="shrink-0 flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-accent transition-colors px-2 py-1.5 rounded-lg hover:bg-primary/5"
                                                title="Volver a abrir este ticket"
                                            >
                                                <span className="material-symbols-outlined text-sm select-none">refresh</span>
                                                <span className="hidden sm:inline">Volver a abrir</span>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}

