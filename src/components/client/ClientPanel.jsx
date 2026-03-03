import { useTickets } from '../../context/TicketContext';
import Avatar from '../ui/Avatar';

// ─── Color dot map for ticket history timeline ────────────────────────────────
const historyDotColor = {
    orange: 'border-status-orange',
    green: 'border-status-green',
    slate: 'border-slate-600 bg-slate-700',
};

// ─── Status → color map for ticket history derived from real tickets ──────────
// DB: tickets.status → UI color token
function statusToColor(status) {
    if (status === 'Resuelto' || status === 'Archivado') return 'green';
    if (status === 'Urgente') return 'orange';
    return 'slate';
}

// ─── Truncate helper ──────────────────────────────────────────────────────────
function truncate(str, maxLen = 38) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
}

// ─── Format relative time ─────────────────────────────────────────────────────
function formatRelative(rawTs) {
    if (!rawTs) return '';
    const diff = Date.now() - rawTs;
    const min = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (min < 60) return `Hace ${min}m`;
    if (hrs < 24) return `Hace ${hrs}h`;
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
}

// ─── Panel Content ────────────────────────────────────────────────────────────
// AGENT-ONLY panel. Displays ticket info + client profile. No internal note here.
// DB source fields annotated inline.
function ClientPanelContent({ activeTicket, activeClient, tickets, onClose }) {

    // DB: SELECT id, title, status, created_at FROM tickets WHERE client_id = activeClient.id
    //     ORDER BY created_at DESC LIMIT 3 (excluding the currently open ticket)
    const recentHistory = tickets
        .filter(t => t.clientId === activeClient.id && t.id !== activeTicket?.id)
        .sort((a, b) => b.rawTs - a.rawTs)
        .slice(0, 3)
        .map(t => ({
            title: t.title,
            ago: formatRelative(t.rawTs),
            status: t.status,
            color: statusToColor(t.status),
        }));

    return (
        <div className="flex flex-col h-full">

            {/* ── Profile Header ──────────────────────────────────────────── */}
            <div className="p-5 border-b border-dark-border shrink-0">
                {/* Close button */}
                <div className="flex justify-end mb-3">
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-800"
                        title="Cerrar panel"
                    >
                        <span className="material-symbols-outlined text-xl select-none lg:block hidden">keyboard_double_arrow_right</span>
                        <span className="material-symbols-outlined text-xl select-none lg:hidden">keyboard_arrow_down</span>
                    </button>
                </div>

                {/* Avatar + Name + Company */}
                {/* DB: clients.avatar_url, clients.name, clients.company */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <Avatar
                            avatarUrl={activeClient.avatarUrl}
                            name={activeClient.name}
                            size="xl"
                            ring="ring-4 ring-[#151a23]"
                        />
                    </div>
                    <div className="text-center">
                        {/* DB: clients.name */}
                        <h3 className="text-white font-bold text-base lg:text-lg leading-tight">{activeClient.name}</h3>
                        {/* DB: clients.company */}
                        <p className="text-slate-400 text-xs mt-0.5">{activeClient.company}</p>
                    </div>
                </div>

                {/* Status + Created At grid */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    {/* DB: clients.status */}
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Estado</p>
                        <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-status-green shrink-0" />
                            <p className="text-xs text-status-green font-bold">{activeClient.status}</p>
                        </div>
                    </div>
                    {/* DB: clients.created_at */}
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Fecha Creación</p>
                        <p className="text-[11px] text-white font-bold leading-tight">{activeClient.createdAt}</p>
                    </div>
                </div>
            </div>

            {/* ── Scrollable Details ───────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 chat-scrollbar">

                {/* ── Ticket (Asunto) ────────────────────────────────────────── */}
                {/* DB: tickets.title, tickets.id WHERE tickets.id = activeTicket.id */}
                {activeTicket && (
                    <section>
                        <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Ticket</h4>
                        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-primary-accent text-sm select-none shrink-0 mt-0.5">confirmation_number</span>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">#{activeTicket.id}</p>
                                    <p className="text-xs text-slate-200 leading-snug">{activeTicket.title}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ── Asignado a ─────────────────────────────────────────────── */}
                {/* DB: agents.name WHERE agents.id = tickets.assigned_agent_id */}
                {activeTicket && (
                    <section>
                        <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">Asignado a</h4>
                        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-3">
                            {activeTicket.assignedAgent ? (
                                <div className="flex items-center gap-2">
                                    <Avatar
                                        avatarUrl={activeTicket.assignedAgent.avatarUrl}
                                        name={activeTicket.assignedAgent.name}
                                        size="sm"
                                    />
                                    <div className="min-w-0">
                                        <p className="text-xs text-white font-bold truncate">{activeTicket.assignedAgent.name}</p>
                                        <p className="text-[10px] text-slate-400">{activeTicket.assignedAgent.role}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-slate-600 text-base select-none">person_off</span>
                                    <p className="text-xs text-slate-500 italic">Sin asignar</p>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── Historial Reciente ─────────────────────────────────────── */}
                {/* DB: SELECT id, title, status, created_at FROM tickets              */}
                {/*     WHERE client_id = activeClient.id AND id != activeTicket.id    */}
                {/*     ORDER BY created_at DESC LIMIT 3                               */}
                <section>
                    <h4 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">Historial Reciente</h4>
                    {recentHistory.length === 0 ? (
                        <p className="text-xs text-slate-600 italic">Sin historial previo</p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {recentHistory.map((item, i) => {
                                const isLast = i === recentHistory.length - 1;
                                const dotClass = historyDotColor[item.color] || 'border-slate-600';
                                return (
                                    <div key={i} className={`flex gap-3 relative ${!isLast ? 'before:content-[""] before:absolute before:left-[7px] before:top-5 before:bottom-[-16px] before:w-px before:bg-slate-800' : ''}`}>
                                        <div className={`size-4 rounded-full border-2 ${dotClass} ${item.color === 'slate' ? 'bg-slate-700' : 'bg-transparent'} shrink-0 z-10 mt-0.5`} />
                                        <div className="flex flex-col min-w-0">
                                            <p className="text-slate-200 text-xs font-bold leading-tight truncate" title={item.title}>
                                                {truncate(item.title)}
                                            </p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">{item.ago} · {item.status}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}

// ─── Main ClientPanel ─────────────────────────────────────────────────────────
// AGENT-ONLY panel: Shows ticket info + client profile data.
export default function ClientPanel() {
    const {
        activeClient, activeTicket,
        isClientPanelOpen, toggleClientPanel,
        tickets,
    } = useTickets();

    if (!activeClient) return null;

    const content = (
        <ClientPanelContent
            activeTicket={activeTicket}          // DB: tickets row
            activeClient={activeClient}          // DB: clients row
            tickets={tickets}                    // DB: all tickets (to derive real history)
            onClose={toggleClientPanel}
        />
    );

    return (
        <>
            {/* ── Desktop sidebar (lg+) ─────────────────────────────────────── */}
            <aside
                className={`
          hidden lg:flex flex-col
          border-l border-dark-border bg-sidebar-dark
          overflow-hidden
          transition-all duration-300 ease-in-out
          ${isClientPanelOpen ? 'w-[280px] min-w-[280px]' : 'w-0 min-w-0'}
        `}
            >
                {isClientPanelOpen && content}
            </aside>

            {/* ── Mobile bottom sheet (<lg) ────────────────────────────────── */}
            {isClientPanelOpen && (
                <div className="lg:hidden fixed inset-0 z-40">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={toggleClientPanel}
                    />
                    {/* Sheet */}
                    <div
                        className="absolute bottom-0 left-0 right-0 bg-sidebar-dark rounded-t-3xl flex flex-col"
                        style={{ maxHeight: '88dvh' }}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center pt-3 pb-1 shrink-0">
                            <div className="w-10 h-1 rounded-full bg-slate-700" />
                        </div>
                        {content}
                    </div>
                </div>
            )}
        </>
    );
}
