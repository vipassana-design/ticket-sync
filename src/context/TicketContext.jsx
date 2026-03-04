import { createContext, useContext, useState, useCallback } from 'react';
import { initialTickets, clients, currentAgent, agents } from '../data/mockData';
import { supabase } from '../config/supabase';

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

    const sendMessage = useCallback(async (content, isPublic, attachments = []) => {
        if (!content.trim() && attachments.length === 0) return;

        try {
            const senderType = isClientRole ? 'client' : 'agent';
            const senderId = currentUser?.id ?? (isClientRole ? currentClientId : currentAgentId);
            const companyId = currentUser?.companyId;

            // 1. Subir archivos si los hay
            const uploadedAttachments = [];
            if (attachments.length > 0) {
                for (const file of attachments) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `${activeTicketId}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('tickets-attachments')
                        .upload(filePath, file);

                    if (uploadError) throw new Error('Error al subir un adjunto del mensaje.');

                    const { data: publicUrlData } = supabase.storage
                        .from('tickets-attachments')
                        .getPublicUrl(filePath);

                    uploadedAttachments.push({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: publicUrlData.publicUrl
                    });
                }
            }

            // 2. Insertar mensaje en BD
            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .insert([{
                    ticket_id: activeTicketId,
                    company_id: companyId,
                    sender_id: senderId,
                    content: content.trim(),
                    is_internal: !isPublic,
                    attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null
                }])
                .select()
                .single();

            if (msgError) throw new Error('Error al guardar el mensaje en la base de datos.');

            // 3. Actualizar UI
            const timeStr = new Date(msgData.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            const newMsg = {
                id: msgData.id,
                senderId,
                senderType,
                type: senderType === 'client' ? 'public' : (isPublic ? 'public' : 'internal'),
                content: msgData.content,
                time: timeStr,
                attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
            };

            setTickets(prev => prev.map(t =>
                t.id === activeTicketId
                    ? { ...t, commentCount: t.commentCount + 1, messages: [...t.messages, newMsg] }
                    : t
            ));
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            throw error;
        }
    }, [activeTicketId, isClientRole, currentClientId, currentAgentId, currentUser]);

    const addTicket = useCallback(async (ticketData) => {
        try {
            // DB: clientId from authenticated user or selected client
            const clientId = isClientRole ? currentUser.id : (ticketData.clientId || currentUser.id);
            const companyId = currentUser?.companyId;

            // 1. Insertar ticket
            const { data: ticketRow, error: ticketError } = await supabase
                .from('tickets')
                .insert([{
                    company_id: companyId,
                    title: ticketData.title,
                    description: ticketData.description,
                    status: 'Nuevo',
                    priority: 'Nuevo',
                    channel: ticketData.channel || 'Portal',
                    sla: '48h',
                    client_id: clientId
                }])
                .select()
                .single();

            if (ticketError) throw new Error('Error al crear el ticket.');

            const ticketId = ticketRow.id;

            // 2. Subir adjuntos iniciales
            const uploadedAttachments = [];
            if (ticketData.attachments && ticketData.attachments.length > 0) {
                for (const file of ticketData.attachments) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = `${ticketId}/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('tickets-attachments')
                        .upload(filePath, file);

                    if (uploadError) throw new Error('Error subiendo adjunto del ticket.');

                    const { data: publicUrlData } = supabase.storage
                        .from('tickets-attachments')
                        .getPublicUrl(filePath);

                    uploadedAttachments.push({
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        url: publicUrlData.publicUrl
                    });
                }
            }

            // 3. Insertar primer mensaje
            const { data: msgData, error: msgError } = await supabase
                .from('messages')
                .insert([{
                    ticket_id: ticketId,
                    company_id: companyId,
                    sender_id: clientId,
                    content: ticketData.description,
                    is_internal: false,
                    attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null
                }])
                .select()
                .single();

            if (msgError) throw new Error('Error al registrar el mensaje inicial.');

            // 4. Actualizar interfaz local
            const timeStr = new Date(ticketRow.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

            const newMsg = {
                id: msgData.id,
                senderId: clientId,
                senderType: 'client',
                type: 'public',
                content: msgData.content,
                time: timeStr,
                attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
            };

            const newTicket = {
                id: ticketId,
                title: ticketRow.title,
                summary: ticketRow.description,
                status: 'Nuevo',
                priority: 'Nuevo',
                channel: ticketRow.channel,
                sla: '48h restante',
                timestamp: 'Ahora',
                rawTs: new Date(ticketRow.created_at).getTime(),
                clientId: clientId,
                commentCount: 1,
                hasAttachment: uploadedAttachments.length > 0,
                isEscalated: false,
                isAssigned: false,
                assignedAgent: null,
                openedAt: timeStr,
                messages: [newMsg],
            };

            setTickets(prev => [newTicket, ...prev]);
            setActiveTicketId(ticketId);
            setIsNewTicketModalOpen(false);
            setShowTicketList(false);
            setActiveView('tickets');
            setActiveFilter('Abiertos');

            return newTicket;

        } catch (error) {
            console.error('Error insertando ticket/mensaje:', error);
            throw error;
        }
    }, [isClientRole, currentUser]);

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
