import { useTickets } from '../../context/TicketContext';
import TicketCard from './TicketCard';

// DB: 'Asignados' is an agent-only concept, not visible to clients
const agentFilters = ['Abiertos', 'Asignados', 'Cerrados', 'Archivados'];
const clientFilters = ['Abiertos', 'Cerrados', 'Archivados'];

// Counts must mirror the exact logic of filteredTickets in TicketContext, using scopedTickets
// DB: SELECT count(*) GROUP BY filter_logic FROM tickets WHERE (client scoping applied)
function useFilterCounts(scopedTickets, currentAgentId) {
    return {
        // DB: COUNT WHERE status NOT IN ('Resuelto','Archivado') [+ client scope]
        Abiertos: scopedTickets.filter(t => t.status !== 'Resuelto' && t.status !== 'Archivado').length,
        // DB: COUNT WHERE assigned_agent_id = currentAgentId AND status != 'Archivado'
        Asignados: scopedTickets.filter(t => t.assignedAgent?.id === currentAgentId && t.status !== 'Archivado').length,
        // DB: COUNT WHERE status = 'Resuelto' [+ client scope]
        Cerrados: scopedTickets.filter(t => t.status === 'Resuelto').length,
        // DB: COUNT WHERE status = 'Archivado' [+ client scope]
        Archivados: scopedTickets.filter(t => t.status === 'Archivado').length,
    };
}

export default function TicketList() {
    const {
        filteredTickets, scopedTickets,
        searchTerm, setSearchTerm,
        activeFilter, setActiveFilter,
        toggleSidebar, showTicketList,
        setIsNewTicketModalOpen,
        currentUser, currentAgentId,
    } = useTickets();

    const isClient = currentUser?.role === 'client';
    const filters = isClient ? clientFilters : agentFilters;

    // Use scopedTickets (role-scoped, no filter/search applied) for correct badge counts
    const counts = useFilterCounts(scopedTickets, currentAgentId);

    return (
        <aside
            className={`
        ${showTicketList ? 'flex' : 'hidden lg:flex'}
        w-full lg:w-[30%] lg:min-w-[260px]
        bg-white border-r border-border-gray flex-col
        absolute lg:static inset-0 z-10
      `}
        >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <header className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-border-gray bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2 mb-4">
                    {/* Hamburger (mobile) */}
                    <button
                        className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
                        onClick={toggleSidebar}
                    >
                        <span className="material-symbols-outlined select-none text-xl">menu</span>
                    </button>

                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex-1 leading-tight">
                        {isClient ? 'Mis Tickets' : 'Tickets Activos'}
                    </h2>

                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold shrink-0">
                        {filteredTickets.length}
                    </span>
                </div>

                {/* Search */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg select-none pointer-events-none">
                        search
                    </span>
                    <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-gray focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-sm outline-none"
                        placeholder="Buscar por título o #ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filter chips */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1 no-scrollbar">
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`
                text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200 shrink-0 flex items-center gap-1.5
                ${activeFilter === f
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 active:bg-slate-200'
                                }
              `}
                        >
                            {f}
                            {counts[f] > 0 && (
                                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${activeFilter === f ? 'bg-primary/20 text-primary' : 'bg-slate-200 text-slate-500'}`}>
                                    {counts[f]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </header>

            {/* ── List ───────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-white chat-scrollbar pb-24 lg:pb-0">
                {filteredTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 py-20 text-center px-8">
                        <span className="material-symbols-outlined text-slate-200 text-5xl select-none">inbox</span>
                        <p className="text-sm font-bold text-slate-400">No se encontraron tickets</p>
                        <p className="text-xs text-slate-300">
                            {searchTerm ? 'Probá con otro término de búsqueda' : `No hay tickets en "${activeFilter}"`}
                        </p>
                    </div>
                ) : (
                    filteredTickets.map(ticket => (
                        <TicketCard key={ticket.id} ticket={ticket} />
                    ))
                )}
            </div>

            {/* Mobile FAB: Nuevo Ticket — Client only */}
            {/* DB: shown only when currentUser.role === 'client' */}
            {isClient && (
                <div className="lg:hidden absolute bottom-5 right-5 z-20">
                    <button
                        onClick={() => setIsNewTicketModalOpen(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-primary-accent to-primary text-white rounded-2xl px-5 py-3.5 text-sm font-bold shadow-xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg select-none">add</span>
                        <span>Nuevo Ticket</span>
                    </button>
                </div>
            )}
        </aside>
    );
}
