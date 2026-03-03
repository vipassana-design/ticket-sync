import { createContext, useContext, useState, useCallback } from 'react';
import { initialTickets, clients, currentAgent, agents } from '../data/mockData';

const TicketContext = createContext(null);

let nextMsgId = 9000;
let nextTicketNum = 1001;

export function TicketProvider({ children, currentUser }) {
    const [tickets, setTickets] = useState(initialTickets);
    const [activeTicketId, setActiveTicketId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('Abiertos');
    const [isClientPanelOpen, setIsClientPanelOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
    const [showTicketList, setShowTicketList] = useState(true);
    const [activeView, setActiveView] = useState('tickets'); // DB: persisted in user session
    const [resolvedMenuTicketId, setResolvedMenuTicketId] = useState(null);

    // ── Role & Identity ───────────────────────────────────────────────────────
    const isClientRole = currentUser?.role === 'client';
    // DB: currentUser.clientId comes from profiles.client_id (set on login)
    const currentClientId = currentUser?.clientId ?? null;
    // DB: currentUser.agentId comes from profiles.agent_id (set on login)
    const currentAgentId = currentUser?.agentId ?? currentAgent.id;

    // ── Derived Active ────────────────────────────────────────────────────────
    const activeTicket = tickets.find(t => t.id === activeTicketId) ?? null;
    // DB: JOIN tickets ON clients.id = tickets.client_id
    const activeClient = activeTicket ? clients[activeTicket.clientId] : null;

    // ── Role-scoped tickets ───────────────────────────────────────────────────
    // DB: clients → WHERE client_id = auth.uid() mapped to profiles.client_id
    //     agents  → all tickets in their team
    const scopedTickets = isClientRole
        ? tickets.filter(t => t.clientId === currentClientId)
        : tickets;

    // ── Filtered + Searched tickets (for the ticket list) ─────────────────────
    const filteredTickets = scopedTickets.filter(t => {
        const matchSearch =
            searchTerm === '' ||
            t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.id.toLowerCase().includes(searchTerm.toLowerCase());

        let matchFilter = false;
        if (activeFilter === 'Abiertos') {
            matchFilter = t.status !== 'Resuelto' && t.status !== 'Archivado';
        } else if (activeFilter === 'Asignados') {
            // Agent only: tickets assigned specifically to the logged-in agent
            // DB: WHERE assigned_agent_id = auth.uid() mapped to profiles.agent_id
            matchFilter = t.assignedAgent?.id === currentAgentId && t.status !== 'Archivado';
        } else if (activeFilter === 'Cerrados') {
            matchFilter = t.status === 'Resuelto';
        } else if (activeFilter === 'Archivados') {
            matchFilter = t.status === 'Archivado';
        }

        return matchSearch && matchFilter;
    });

    // Sort descending by rawTs (most recent first)
    const sortedFilteredTickets = [...filteredTickets].sort((a, b) => b.rawTs - a.rawTs);

    // ── Actions ───────────────────────────────────────────────────────────────
    const selectTicket = useCallback((id) => {
        setActiveTicketId(id);
        setShowTicketList(false);
        setResolvedMenuTicketId(null);
    }, []);

    const closeTicket = useCallback(() => {
        setActiveTicketId(null);
        setShowTicketList(true);
    }, []);

    const resolveTicket = useCallback(() => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const systemMsg = {
            id: `msg-sys-${nextMsgId++}`,
            senderId: 'system',
            senderType: 'system',
            type: 'system-event',
            // DB: content built from agents.name WHERE id = tickets.assigned_agent_id
            content: `Ticket resuelto por ${currentUser?.name ?? currentAgent.name} a las ${timeStr}`,
            time: timeStr,
        };
        setTickets(prev => prev.map(t =>
            t.id === activeTicketId
                ? { ...t, status: 'Resuelto', priority: 'Resuelto', sla: 'Completado', messages: [...t.messages, systemMsg] }
                : t
        ));
    }, [activeTicketId, currentUser]);

    const reopenTicket = useCallback((ticketId) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const systemMsg = {
            id: `msg-sys-${nextMsgId++}`,
            senderId: 'system',
            senderType: 'system',
            type: 'system-event',
            content: `Ticket reabierto por ${currentUser?.name ?? currentAgent.name} a las ${timeStr}`,
            time: timeStr,
        };
        setTickets(prev => prev.map(t =>
            t.id === ticketId
                ? { ...t, status: 'En Progreso', priority: 'En Progreso', sla: '4h restante', messages: [...t.messages, systemMsg] }
                : t
        ));
        setResolvedMenuTicketId(null);
    }, [currentUser]);

    const archiveTicket = useCallback((ticketId) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const systemMsg = {
            id: `msg-sys-${nextMsgId++}`,
            senderId: 'system',
            senderType: 'system',
            type: 'system-event',
            content: `Ticket archivado por ${currentUser?.name ?? currentAgent.name} a las ${timeStr}`,
            time: timeStr,
        };
        setTickets(prev => prev.map(t =>
            t.id === ticketId
                ? { ...t, status: 'Archivado', priority: 'Archivado', messages: [...t.messages, systemMsg] }
                : t
        ));
        setResolvedMenuTicketId(null);
        if (activeTicketId === ticketId) {
            setActiveTicketId(null);
            setShowTicketList(true);
        }
    }, [activeTicketId, currentUser]);

    const assignTicket = useCallback((ticketId, agent) => {
        // DB: UPDATE tickets SET assigned_agent_id = agent.id WHERE id = ticketId
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const systemMsg = {
            id: `msg-sys-${nextMsgId++}`,
            senderId: 'system',
            senderType: 'system',
            type: 'system-event',
            content: `Ticket asignado a ${agent.name} a las ${timeStr}`,
            time: timeStr,
        };
        setTickets(prev => prev.map(t =>
            t.id === ticketId
                ? { ...t, isAssigned: true, assignedAgent: agent, messages: [...t.messages, systemMsg] }
                : t
        ));
    }, []);

    const sendMessage = useCallback((content, isPublic, attachments = []) => {
        if (!content.trim() && attachments.length === 0) return;
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        // DB: sender_id = auth.uid(), sender_type from profiles.role
        const senderType = isClientRole ? 'client' : 'agent';
        const senderId = isClientRole ? currentClientId : currentAgentId;
        const newMsg = {
            id: `msg-${nextMsgId++}`,       // DB: messages.id (uuid)
            senderId,                        // DB: messages.sender_id
            senderType,                      // DB: messages.sender_type
            type: senderType === 'client' ? 'public' : (isPublic ? 'public' : 'internal'),
            content: content.trim(),         // DB: messages.content
            time: timeStr,                   // DB: messages.created_at (formatted on client)
            // DB: attachments stored in message_attachments(message_id, file_url, file_name, file_size, mime_type)
            attachments: attachments.length > 0 ? attachments : undefined,
        };
        setTickets(prev => prev.map(t =>
            t.id === activeTicketId
                ? { ...t, commentCount: t.commentCount + 1, messages: [...t.messages, newMsg] }
                : t
        ));
    }, [activeTicketId, isClientRole, currentClientId, currentAgentId]);

    const addTicket = useCallback((ticketData) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const newId = `TK-${nextTicketNum++}`;
        // DB: clientId from profiles.client_id when role === 'client'
        const clientId = isClientRole ? currentClientId : (ticketData.clientId || currentClientId);
        const newMsg = {
            id: `msg-init-${nextMsgId++}`,  // DB: messages.id
            senderId: clientId,              // DB: messages.sender_id
            senderType: 'client',
            type: 'public',
            content: ticketData.description, // DB: messages.content
            time: timeStr,
            attachments: ticketData.attachments?.length > 0 ? ticketData.attachments : undefined,
        };
        const newTicket = {
            id: newId,                                          // DB: tickets.id (uuid, shown as TK-XXXX)
            title: ticketData.title,                            // DB: tickets.title
            summary: ticketData.description,                    // DB: tickets.summary
            status: 'Nuevo',                                    // DB: tickets.status
            priority: 'Nuevo',                                  // DB: tickets.priority
            channel: ticketData.channel || 'Portal',            // DB: tickets.channel
            sla: '48h restante',                                // DB: tickets.sla (computed from SLA rules)
            timestamp: 'Ahora',                                 // DB: derived from tickets.created_at
            rawTs: Date.now(),                                  // DB: tickets.created_at (unix ms)
            clientId: clientId,                                 // DB: tickets.client_id → FK clients.id
            commentCount: 1,                                    // DB: COUNT(messages) WHERE ticket_id
            hasAttachment: (ticketData.attachments?.length ?? 0) > 0, // DB: EXISTS(message_attachments)
            isEscalated: false,                                 // DB: tickets.is_escalated
            isAssigned: false,                                  // DB: tickets.assigned_agent_id IS NOT NULL
            assignedAgent: null,                                // DB: JOIN agents ON tickets.assigned_agent_id
            openedAt: timeStr,                                  // DB: tickets.created_at (formatted)
            messages: [newMsg],
        };
        setTickets(prev => [newTicket, ...prev]);
        setActiveTicketId(newId);
        setIsNewTicketModalOpen(false);
        setShowTicketList(false);
        setActiveView('tickets');
        setActiveFilter('Abiertos');
    }, [isClientRole, currentClientId]);

    const toggleClientPanel = useCallback(() => setIsClientPanelOpen(p => !p), []);
    const toggleSidebar = useCallback(() => setIsSidebarOpen(p => !p), []);
    const goBackToList = useCallback(() => setShowTicketList(true), []);

    return (
        <TicketContext.Provider value={{
            tickets,
            scopedTickets,             // role-filtered tickets (for counts)
            filteredTickets: sortedFilteredTickets,
            activeTicket,
            activeClient,
            activeTicketId,
            searchTerm, setSearchTerm,
            activeFilter, setActiveFilter,
            isClientPanelOpen, toggleClientPanel,
            isSidebarOpen, toggleSidebar,
            isNewTicketModalOpen, setIsNewTicketModalOpen,
            showTicketList,
            currentAgent,              // DB: agents row for the logged-in agent
            clients,                   // DB: clients table (all accessible clients)
            activeView, setActiveView,
            resolvedMenuTicketId, setResolvedMenuTicketId,
            selectTicket,
            closeTicket,
            resolveTicket,
            reopenTicket,
            archiveTicket,
            sendMessage,
            assignTicket,
            addTicket,
            goBackToList,
            currentUser,               // DB: auth.users + profiles (role, clientId, agentId)
            agents,                    // DB: SELECT * FROM agents WHERE team_id = current_team
            currentAgentId,            // DB: profiles.agent_id for the logged-in user
            currentClientId,           // DB: profiles.client_id for the logged-in user
        }}
        >
            {children}
        </TicketContext.Provider>
    );
}

export function useTickets() {
    const ctx = useContext(TicketContext);
    if (!ctx) throw new Error('useTickets must be used within TicketProvider');
    return ctx;
}
