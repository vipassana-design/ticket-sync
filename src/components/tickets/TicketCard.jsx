import { priorityConfig } from '../../data/mockData';
import { useTickets } from '../../context/TicketContext';
import { clients } from '../../data/mockData';

export default function TicketCard({ ticket }) {
    const { activeTicketId, selectTicket, currentAgent, activeFilter } = useTickets();
    const isActive = ticket.id === activeTicketId;
    const pConf = priorityConfig[ticket.priority] ?? priorityConfig['Media'];
    const client = clients[ticket.clientId];

    // Show "Asignado a vos" badge when viewing Abiertos and this ticket is assigned to me
    const isMineBadge =
        activeFilter === 'Abiertos' &&
        ticket.assignedAgent?.id === currentAgent?.id;

    return (
        <div
            onClick={() => selectTicket(ticket.id)}
            className={`
        p-5 border-b border-border-gray cursor-pointer transition-all duration-150 relative border-l-4
        ${isActive
                    ? `bg-slate-50 ${pConf.border}`
                    : `bg-white border-l-transparent hover:bg-slate-50/70`
                }
      `}
        >
            {/* Top row: ID + timestamp / Priority badge */}
            <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    #{ticket.id.toString().split('-')[0]} • {ticket.timestamp}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {isMineBadge && (
                        <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-[9px] font-extrabold rounded uppercase tracking-wider">
                            Asignado a vos
                        </span>
                    )}
                    <span className={`px-2 py-0.5 ${pConf.bg} ${pConf.text} text-[10px] font-extrabold rounded uppercase tracking-wider`}>
                        {ticket.priority}
                    </span>
                </div>
            </div>

            {/* Title */}
            <h3 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">{ticket.title}</h3>

            {/* Summary */}
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{ticket.summary}</p>

            {/* Bottom row: client name + stats */}
            <div className="flex items-center justify-between mt-4">
                {/* Client info — always shown */}
                <div className="flex items-center gap-2 min-w-0">
                    {client?.avatarUrl ? (
                        <div className="size-6 rounded-full border-2 border-white bg-slate-200 overflow-hidden shrink-0">
                            <img src={client.avatarUrl} alt={client.name} className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="size-6 rounded-full bg-slate-300 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-slate-600">
                                {(client?.initials || client?.name?.slice(0, 2) || 'CL').toUpperCase()}
                            </span>
                        </div>
                    )}
                    <span className="text-[11px] font-semibold text-slate-600 truncate">
                        {client?.name || 'Cliente'}
                    </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {ticket.hasAttachment && (
                        <span className="material-symbols-outlined text-slate-300 text-sm select-none">attachment</span>
                    )}
                    {ticket.commentCount > 0 && (
                        <>
                            <span className="material-symbols-outlined text-slate-300 text-sm select-none">comment</span>
                            <span className="text-[10px] font-bold text-slate-400">{ticket.commentCount}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

