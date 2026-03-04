import { useRef, useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useTickets } from '../../context/TicketContext';
import { useToast } from '../../context/ToastContext';
import Avatar from '../ui/Avatar';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Renders message content: HTML (from WYSIWYG) or legacy markdown
function renderContent(content) {
    if (!content) return null;
    // If it starts with an HTML tag, render it directly
    if (content.trimStart().startsWith('<')) {
        return (
            <div
                className="wysiwyg-content text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }
    // Legacy fallback: plain text / markdown
    return renderMarkdown(content);
}

// Legacy markdown renderer (kept for old messages in mockData)
function renderMarkdown(text) {
    if (!text) return null;
    const lines = text.split('\n');
    const result = [];
    let listItems = [];
    let orderedItems = [];

    const flushLists = () => {
        if (listItems.length) {
            result.push(
                <ul key={`ul-${result.length}`} className="list-disc pl-5 my-1 space-y-0.5">
                    {listItems.map((li, i) => <li key={i} className="text-sm">{applyInline(li)}</li>)}
                </ul>
            );
            listItems = [];
        }
        if (orderedItems.length) {
            result.push(
                <ol key={`ol-${result.length}`} className="list-decimal pl-5 my-1 space-y-0.5">
                    {orderedItems.map((li, i) => <li key={i} className="text-sm">{applyInline(li)}</li>)}
                </ol>
            );
            orderedItems = [];
        }
    };

    lines.forEach((line, idx) => {
        if (line.startsWith('> ')) {
            flushLists();
            result.push(
                <blockquote key={idx} className="border-l-4 border-slate-300 pl-3 my-1 text-slate-500 italic text-sm">
                    {applyInline(line.slice(2))}
                </blockquote>
            );
        } else if (/^- (.+)/.test(line)) {
            orderedItems.length && flushLists();
            listItems.push(line.slice(2));
        } else if (/^\d+\. (.+)/.test(line)) {
            listItems.length && flushLists();
            orderedItems.push(line.replace(/^\d+\. /, ''));
        } else {
            flushLists();
            if (line.trim() === '') {
                result.push(<br key={idx} />);
            } else {
                result.push(<p key={idx} className="text-sm leading-relaxed">{applyInline(line)}</p>);
            }
        }
    });
    flushLists();
    return result;
}

function applyInline(text) {
    const parts = [];
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let last = 0, m;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) parts.push(text.slice(last, m.index));
        if (m[2]) parts.push(<strong key={m.index}>{m[2]}</strong>);
        else if (m[3]) parts.push(<em key={m.index}>{m[3]}</em>);
        else if (m[4]) parts.push(<code key={m.index} className="bg-black/10 rounded px-1 font-mono text-xs">{m[4]}</code>);
        last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length > 0 ? parts : text;
}

// ─── Attachment renderers ─────────────────────────────────────────────────────
function AttachmentBlock({ file, dark = false }) {
    const isImage = file.type === 'image' || file.mimeType?.startsWith('image/');
    const downloadFile = () => {
        if (file.url) {
            const a = document.createElement('a');
            a.href = file.url;
            a.download = file.name;
            a.click();
        }
    };

    if (isImage && file.url) {
        return (
            <div className="mt-2 relative group/img">
                <img
                    src={file.url}
                    alt={file.name}
                    className="max-w-full max-h-60 rounded-xl object-contain border border-white/10"
                    title={file.name}
                />
                {/* Download overlay — visible on hover (desktop) or always on mobile */}
                <a
                    href={file.url}
                    download={file.name}
                    onClick={e => e.stopPropagation()}
                    className="
                        absolute bottom-2 right-2
                        flex items-center gap-1 bg-black/60 hover:bg-black/80 text-white
                        text-[10px] font-bold px-2 py-1 rounded-lg
                        transition-opacity duration-200
                        opacity-100 sm:opacity-0 sm:group-hover/img:opacity-100
                    "
                    title={`Descargar ${file.name}`}
                >
                    <span className="material-symbols-outlined text-sm select-none">download</span>
                    <span className="hidden sm:inline">{file.name}</span>
                </a>
                <p className="text-[10px] mt-1 opacity-60">{file.name}</p>
            </div>
        );
    }

    // File attachment
    const extIcons = { pdf: 'picture_as_pdf', xls: 'table_chart', xlsx: 'table_chart', csv: 'table_chart', zip: 'folder_zip', json: 'data_object', doc: 'description', docx: 'description' };
    const ext = file.name?.split('.').pop().toLowerCase();
    const icon = extIcons[ext] || 'description';

    return (
        <div className={`mt-2 flex items-center gap-3 rounded-xl p-3 border ${dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-border-gray'}`}>
            <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${dark ? 'bg-white/10' : 'bg-slate-200'}`}>
                <span className={`material-symbols-outlined text-lg select-none ${dark ? 'text-white/70' : 'text-slate-500'}`}>{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold truncate ${dark ? 'text-white/90' : 'text-slate-700'}`}>{file.name}</p>
                {file.size && <p className={`text-[10px] ${dark ? 'text-white/40' : 'text-slate-400'}`}>{file.size}</p>}
            </div>
            {file.url && (
                <button
                    onClick={downloadFile}
                    className={`shrink-0 p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-slate-200 text-slate-400 hover:text-primary'}`}
                    title={`Descargar ${file.name}`}
                >
                    <span className="material-symbols-outlined text-sm select-none">download</span>
                </button>
            )}
        </div>
    );
}

// ─── Message renderers ────────────────────────────────────────────────────────
function ClientMessage({ msg, client }) {
    const name = msg.senderName || client?.name || 'Cliente';
    const avatar = msg.senderAvatar || client?.avatarUrl;
    return (
        <div className="flex gap-3 max-w-[90%] sm:max-w-[85%]">
            <Avatar avatarUrl={avatar} name={name} size="sm" className="mt-1" />
            <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">{name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">{msg.time}</span>
                </div>
                <div className="bg-white border border-border-gray p-3 sm:p-4 rounded-r-2xl rounded-bl-2xl shadow-sm text-slate-700 leading-relaxed">
                    {renderContent(msg.content)}
                    {msg.attachments?.map((att, i) => <AttachmentBlock key={i} file={att} dark={false} />)}
                    {msg.attachment && <AttachmentBlock file={msg.attachment} dark={false} />}
                </div>
            </div>
        </div>
    );
}

function AgentMessage({ msg, agent }) {
    const name = msg.senderName || agent?.name || 'Agente';
    const avatar = msg.senderAvatar || agent?.avatarUrl;
    return (
        <div className="flex gap-3 max-w-[90%] sm:max-w-[85%] self-end flex-row-reverse">
            <Avatar avatarUrl={avatar} name={name} size="sm" className="mt-1" />
            <div className="flex flex-col gap-1.5 items-end min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 shrink-0">{msg.time}</span>
                    <span className="text-xs font-bold text-primary-accent truncate">{name} (Soporte)</span>
                </div>
                <div className="bg-sidebar-dark text-white p-3 sm:p-4 rounded-l-2xl rounded-br-2xl shadow-sm leading-relaxed">
                    {renderContent(msg.content)}
                    {msg.attachments?.map((att, i) => <AttachmentBlock key={i} file={att} dark={true} />)}
                    {msg.attachment && <AttachmentBlock file={msg.attachment} dark={true} />}
                </div>
            </div>
        </div>
    );
}

function InternalNote({ msg }) {
    return (
        <div className="bg-primary/5 border border-primary/20 p-3 sm:p-4 rounded-xl flex gap-3">
            <span className="material-symbols-outlined text-primary-accent text-lg sm:text-xl select-none shrink-0">lock</span>
            <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-primary-accent uppercase tracking-wider">Nota Interna</span>
                    <span className="text-[10px] text-slate-400">{msg.time}</span>
                </div>
                <div className="text-sm text-slate-600 italic break-words">{renderContent(msg.content)}</div>
            </div>
        </div>
    );
}

function SystemEvent({ msg }) {
    return (
        <div className="flex justify-center px-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full text-center">
                {msg.content}
            </span>
        </div>
    );
}

function MessageBubble({ msg, client, agent }) {
    if (msg.type === 'internal') return <InternalNote msg={msg} />;
    if (msg.type === 'system' || msg.type === 'system-event') return <SystemEvent msg={msg} />;
    if (msg.senderType === 'agent') return <AgentMessage msg={msg} agent={agent} />;
    return <ClientMessage msg={msg} client={client} />;
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
const EMOJI_GROUPS = [
    { label: 'Frecuentes', emojis: ['👍', '👎', '❤️', '😊', '🙏', '✅', '❌', '⚠️', '🔥', '💡', '📎', '🔗'] },
    { label: 'Caras', emojis: ['😀', '😂', '😅', '😆', '🤔', '😐', '😕', '😢', '😡', '🤯', '😎', '🥳'] },
    { label: 'Trabajo', emojis: ['💼', '📊', '📈', '📉', '🖥️', '⌨️', '🖱️', '🔧', '⚙️', '🛠️', '📝', '📋'] },
    { label: 'Manos', emojis: ['👋', '👏', '🤝', '✋', '🙌', '💪', '☝️', '👉', '👈', '👆', '👇', '🤞'] },
];

function EmojiPicker({ onSelect, onClose }) {
    const [tab, setTab] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div ref={ref} className="absolute bottom-full mb-2 right-0 w-72 bg-white border border-border-gray rounded-2xl shadow-2xl z-50 overflow-hidden">
            <div className="flex border-b border-border-gray overflow-x-auto no-scrollbar">
                {EMOJI_GROUPS.map((g, i) => (
                    <button
                        key={i}
                        onClick={() => setTab(i)}
                        className={`px-3 py-2 text-[10px] font-bold whitespace-nowrap transition-colors ${tab === i ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {g.label}
                    </button>
                ))}
            </div>
            <div className="p-3 grid grid-cols-6 gap-1 max-h-40 overflow-y-auto chat-scrollbar">
                {EMOJI_GROUPS[tab].emojis.map(e => (
                    <button
                        key={e}
                        onClick={() => onSelect(e)}
                        className="text-xl p-1.5 hover:bg-slate-100 rounded-lg transition-colors active:scale-90"
                    >
                        {e}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── WYSIWYG Toolbar Button ───────────────────────────────────────────────────
function ToolbarButton({ icon, title, isActive, onClick, disabled }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={`material-symbols-outlined text-[18px] select-none p-1 rounded-lg transition-colors
                ${isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-400 hover:text-primary hover:bg-primary/8'
                }
                ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
            `}
        >
            {icon}
        </button>
    );
}

// ─── Chat Input — TipTap WYSIWYG ──────────────────────────────────────────────
function ChatInput({ activeTicket, sendMessage, assignTicket, agents, currentUser }) {
    const { drafts, setDrafts, chatDirtyRef, editorStateRef } = useTickets();
    const [isPublic, setIsPublic] = useState(true);
    const [assignOpen, setAssignOpen] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [sending, setSending] = useState(false);
    const [hasText, setHasText] = useState(false);
    const assignRef = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const { addToast } = useToast();                         // for 1MB attachment errors
    const isDisabled = activeTicket?.status === 'Cerrado' || activeTicket?.status === 'Archivado';
    const isAgent = currentUser?.role === 'agent' || currentUser?.role === 'admin_empresa';
    const canSendInternal = isAgent;

    // ── TipTap Editor ─────────────────────────────────────────────────────────
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: false,
                horizontalRule: false,
                codeBlock: false,
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-primary underline cursor-pointer' },
            }),
            Placeholder.configure({
                placeholder: isDisabled
                    ? 'Ticket cerrado — reabrilo para responder'
                    : isAgent
                        ? (isPublic ? 'Escribe tu respuesta... (Ctrl+Enter para enviar)' : 'Nota interna (solo equipo)...')
                        : 'Escribe tu mensaje... (Ctrl+Enter para enviar)',
            }),
        ],
        editorProps: {
            attributes: {
                class: 'wysiwyg-input min-h-[44px] max-h-32 overflow-y-auto focus:outline-none text-sm text-slate-800 leading-relaxed',
            },
            handleKeyDown: (_view, event) => {
                if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    handleSend();
                    return true;
                }
                return false;
            },
        },
        onUpdate: ({ editor }) => {
            setHasText(editor.getText().trim().length > 0);
        },
        editable: !isDisabled,
    });

    // Keep editable in sync with ticket status
    useEffect(() => {
        if (editor) editor.setEditable(!isDisabled);
    }, [editor, isDisabled]);

    // Restore draft when ticket changes or mounts
    useEffect(() => {
        if (!editor) return;
        const draft = drafts[activeTicket.id];
        if (draft && draft.html) {
            editor.commands.setContent(draft.html);
            setHasText(true);
        } else {
            editor.commands.clearContent();
            setHasText(false);
        }
        setPendingFiles(draft?.files || []);
        chatDirtyRef.current = !!(draft?.html || draft?.files?.length > 0);
    }, [activeTicket.id, editor]); // Only runs when ticket changes or editor mounts

    // Sync dirty state
    useEffect(() => {
        if (!editor) return;
        editorStateRef.current.getHTML = () => editor.getHTML();
        editorStateRef.current.getFiles = () => pendingFiles;
        chatDirtyRef.current = hasText || pendingFiles.length > 0;
    }, [hasText, pendingFiles, editor, chatDirtyRef, editorStateRef]);

    // Update placeholder when isPublic toggles
    useEffect(() => {
        if (!editor) return;
        editor.extensionManager.extensions
            .find(e => e.name === 'placeholder')
            ?.options && editor.view.dispatch(editor.state.tr);
    }, [editor, isPublic]);

    // Close assign dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (assignRef.current && !assignRef.current.contains(e.target)) setAssignOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const isEditorEmpty = () => {
        if (!editor) return true;
        const html = editor.getHTML();
        return html === '<p></p>' || editor.isEmpty;
    };

    const handleSend = useCallback(async () => {
        if (!editor || sending) return;
        const isEmpty = !hasText;
        if ((isEmpty && pendingFiles.length === 0) || isDisabled) return;

        setSending(true);
        try {
            const htmlContent = isEmpty ? '' : editor.getHTML();
            await sendMessage(htmlContent, isPublic, pendingFiles.map(f => f.rawFile || f));
            editor.commands.clearContent(true);
            editor.commands.focus();
            setPendingFiles([]);
            setHasText(false);
            setDrafts(prev => {
                const copy = { ...prev };
                delete copy[activeTicket.id];
                return copy;
            });
            chatDirtyRef.current = false;
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            addToast({ message: error.message || 'Error al enviar el mensaje', type: 'error' });
        } finally {
            setSending(false);
        }
    }, [editor, isPublic, pendingFiles, isDisabled, sendMessage, sending, addToast, activeTicket.id, setDrafts, chatDirtyRef]);

    const handleAssign = (agent) => { assignTicket(activeTicket.id, agent); setAssignOpen(false); };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        const MAX = 1024 * 1024; // 1 MB
        const overLimit = files.filter(f => f.size > MAX);
        const valid = files.filter(f => f.size <= MAX);

        overLimit.forEach(f => {
            addToast({
                message: `"${f.name}" supera el límite de 1 MB (${(f.size / MAX).toFixed(1)} MB). No se adjuntó.`,
                type: 'error',
            });
        });

        if (valid.length === 0) { e.target.value = ''; return; }
        const mapped = valid.map(f => ({
            name: f.name,
            size: formatBytes(f.size),
            type: f.type.startsWith('image/') ? 'image' : 'file',
            mimeType: f.type,
            url: URL.createObjectURL(f),
            rawFile: f,
        }));
        setPendingFiles(prev => [...prev, ...mapped]);
        e.target.value = '';
    };

    const removePending = (idx) => {
        setPendingFiles(prev => {
            const copy = [...prev];
            if (copy[idx].url) URL.revokeObjectURL(copy[idx].url);
            copy.splice(idx, 1);
            return copy;
        });
    };

    const insertEmoji = useCallback((emoji) => {
        if (!editor) return;
        editor.chain().focus().insertContent(emoji).run();
        setShowEmoji(false);
    }, [editor]);

    // ── Link prompt ───────────────────────────────────────────────────────────
    const handleLink = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL del enlace:', previousUrl ?? 'https://');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    };

    if (!editor) return null;

    const canSend = hasText || pendingFiles.length > 0;

    return (
        <div className={`px-3 sm:px-5 py-3 sm:py-4 border-t border-border-gray transition-colors duration-200 ${!isPublic ? 'bg-amber-50/60' : 'bg-white'}`}>

            {/* ── Pending file previews ─────────────────────────────── */}
            {pendingFiles.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {pendingFiles.map((f, idx) => (
                        <div key={idx} className="relative group">
                            {f.type === 'image'
                                ? <img src={f.url} alt={f.name} className="size-14 object-cover rounded-xl border border-border-gray" />
                                : <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 border border-slate-200 max-w-[160px]">
                                    <span className="material-symbols-outlined text-slate-400 text-sm select-none shrink-0">description</span>
                                    <p className="text-xs text-slate-600 truncate">{f.name}</p>
                                </div>
                            }
                            <button
                                onClick={() => removePending(idx)}
                                className="absolute -top-1.5 -right-1.5 size-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <span className="material-symbols-outlined text-[10px] select-none">close</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className={`border rounded-2xl p-3 sm:p-4 transition-all duration-200 ${!isPublic ? 'border-amber-300 bg-amber-50/40' : 'border-border-gray bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10'}`}>

                {/* ── WYSIWYG Formatting Toolbar ─────────────────────── */}
                {!isDisabled && (
                    <div className="flex items-center gap-0.5 mb-2 pb-2 border-b border-slate-100 flex-wrap">
                        <ToolbarButton
                            icon="format_bold"
                            title="Negrita (Ctrl+B)"
                            isActive={editor.isActive('bold')}
                            onClick={() => editor.chain().focus().toggleBold().run()}
                        />
                        <ToolbarButton
                            icon="format_italic"
                            title="Cursiva (Ctrl+I)"
                            isActive={editor.isActive('italic')}
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                        />
                        <ToolbarButton
                            icon="strikethrough_s"
                            title="Tachado"
                            isActive={editor.isActive('strike')}
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                        />
                        <ToolbarButton
                            icon="code"
                            title="Código inline"
                            isActive={editor.isActive('code')}
                            onClick={() => editor.chain().focus().toggleCode().run()}
                        />

                        {/* Separator */}
                        <div className="w-px h-4 bg-slate-200 mx-0.5" />

                        <ToolbarButton
                            icon="format_quote"
                            title="Cita"
                            isActive={editor.isActive('blockquote')}
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        />
                        <ToolbarButton
                            icon="format_list_bulleted"
                            title="Lista de viñetas"
                            isActive={editor.isActive('bulletList')}
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                        />
                        <ToolbarButton
                            icon="format_list_numbered"
                            title="Lista numerada"
                            isActive={editor.isActive('orderedList')}
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        />
                        <ToolbarButton
                            icon="link"
                            title="Insertar enlace"
                            isActive={editor.isActive('link')}
                            onClick={handleLink}
                        />
                    </div>
                )}

                {/* ── TipTap Editor Content ──────────────────────────── */}
                <EditorContent editor={editor} />

            </div>

            {/* ── Bottom Toolbar: Attach / Emoji / Assign / Send ────── */}
            <div className="flex items-center justify-between mt-2 pt-2 gap-2 flex-wrap">
                <div className="flex gap-1 items-center">
                    {/* Attach file */}
                    <button
                        type="button"
                        title="Adjuntar archivo"
                        onClick={() => fileInputRef.current?.click()}
                        className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors text-xl select-none p-1 rounded-lg hover:bg-primary/5 active:bg-primary/10"
                    >attach_file</button>
                    <input ref={fileInputRef} type="file" multiple accept=".pdf,.json,.zip,.txt,.csv,.xlsx,.xls,.doc,.docx,.log" className="hidden" onChange={handleFileChange} />

                    {/* Emoji */}
                    <div className="relative">
                        <button
                            type="button"
                            title="Emoji"
                            onClick={() => setShowEmoji(p => !p)}
                            className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors text-xl select-none p-1 rounded-lg hover:bg-primary/5 active:bg-primary/10"
                        >mood</button>
                        {showEmoji && <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmoji(false)} />}
                    </div>

                    {/* Attach image */}
                    <button
                        type="button"
                        title="Adjuntar imagen"
                        onClick={() => imageInputRef.current?.click()}
                        className="material-symbols-outlined text-slate-400 hover:text-primary transition-colors text-xl select-none p-1 rounded-lg hover:bg-primary/5 active:bg-primary/10"
                    >image</button>
                    <input ref={imageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {/* Asignar a — Agent only */}
                    {isAgent && (
                        <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all duration-200
                            ${activeTicket?.assignedAgent
                                ? 'bg-primary/5 text-primary border-primary/20'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm select-none">
                                {activeTicket?.assignedAgent ? 'person' : 'person_off'}
                            </span>
                            <span className="hidden sm:inline">
                                {activeTicket?.assignedAgent
                                    ? `Asignado: ${activeTicket.assignedAgent.name.split(' ')[0]}`
                                    : 'Sin asignar'
                                }
                            </span>
                        </div>
                    )}

                    {/* Visible para cliente toggle — Agent ONLY */}
                    {canSendInternal && (
                        <button
                            type="button"
                            onClick={() => setIsPublic(p => !p)}
                            title={isPublic ? 'Visible para cliente' : 'Nota interna'}
                            className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all duration-200
                                ${isPublic ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-amber-100 text-amber-700 border border-amber-300'}
                            `}
                        >
                            <span className="material-symbols-outlined text-sm select-none">{isPublic ? 'visibility' : 'lock'}</span>
                            <span className="hidden sm:inline">{isPublic ? 'Visible para cliente' : 'Nota interna'}</span>
                        </button>
                    )}

                    {/* Send */}
                    <button
                        onClick={handleSend}
                        disabled={isDisabled || !canSend || sending}
                        className={`
                            text-white rounded-xl px-4 sm:px-5 py-2 text-sm font-bold transition-all duration-200 flex items-center justify-center gap-1 min-w-[100px]
                            ${isDisabled || !canSend || sending
                                ? 'bg-slate-300 cursor-not-allowed opacity-70'
                                : 'bg-gradient-to-r from-primary-accent to-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95'
                            }
                        `}
                    >
                        {sending ? (
                            <><span className="material-symbols-outlined text-base select-none animate-spin">progress_activity</span> <span className="hidden sm:inline">Enviando...</span></>
                        ) : (
                            <><span className="hidden sm:inline">Enviar</span><span className="material-symbols-outlined text-base select-none sm:hidden">send</span></>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}


// ─── Resolved Action Dropdown ─────────────────────────────────────────────────
function ResolvedDropdown({ ticketId, reopenTicket, archiveTicket, resolvedMenuTicketId, setResolvedMenuTicketId }) {
    const isOpen = resolvedMenuTicketId === ticketId;

    return (
        <div className="relative">
            <button
                onClick={() => setResolvedMenuTicketId(isOpen ? null : ticketId)}
                className="flex items-center gap-1 bg-status-green/10 text-status-green border border-status-green/30 px-2 sm:px-3 py-2 rounded-lg text-sm font-bold transition-all hover:bg-status-green/20 active:scale-95"
            >
                <span className="material-symbols-outlined text-base select-none">check_circle</span>
                <span className="hidden sm:inline">Cerrado</span>
                <span className="material-symbols-outlined text-sm select-none">{isOpen ? 'expand_less' : 'expand_more'}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-border-gray rounded-2xl shadow-xl z-50 overflow-hidden">
                    <button
                        onClick={() => reopenTicket(ticketId)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                    >
                        <span className="material-symbols-outlined text-status-orange text-lg select-none">refresh</span>
                        Volver a abrir
                    </button>
                    <div className="h-px bg-border-gray mx-3" />
                    <button
                        onClick={() => archiveTicket(ticketId)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors text-left"
                    >
                        <span className="material-symbols-outlined text-slate-400 text-lg select-none">archive</span>
                        Archivar ticket
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Main ChatPanel ───────────────────────────────────────────────────────────
export default function ChatPanel() {
    const {
        activeTicket, activeClient, currentAgent,
        resolveTicket, toggleClientPanel, goBackToList, showTicketList,
        closeTicket,
        reopenTicket, archiveTicket,
        resolvedMenuTicketId, setResolvedMenuTicketId,
        sendMessage, assignTicket, agents, currentUser,
    } = useTickets();

    const isAgent = currentUser?.role === 'agent' || currentUser?.role === 'admin_empresa';

    const chatEndRef = useRef(null);

    // Auto-scroll to latest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeTicket?.messages?.length]);

    // Close resolved dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (!e.target.closest('[data-resolved-menu]')) {
                setResolvedMenuTicketId(null);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [setResolvedMenuTicketId]);

    if (!activeTicket) return null;

    const isResolved = activeTicket.status === 'Cerrado';
    const isArchived = activeTicket.status === 'Archivado';
    const isClosed = isResolved || isArchived;

    return (
        <section
            className={`
        ${showTicketList ? 'hidden lg:flex' : 'flex'}
        flex-1 bg-white flex-col min-w-0
        absolute lg:static inset-0 z-10
      `}
        >
            <div className="flex h-full min-w-0">
                <div className="flex-1 flex flex-col min-w-0">

                    {/* ── Header ─────────────────────────────────────────────── */}
                    <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border-gray flex items-center justify-between gap-2 bg-white shrink-0">
                        {/* Left: back + title */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                                className="lg:hidden text-slate-400 hover:text-slate-700 transition-colors shrink-0 p-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200"
                                onClick={goBackToList}
                                aria-label="Volver al listado"
                            >
                                <span className="material-symbols-outlined select-none text-xl leading-none">arrow_back</span>
                            </button>
                            <button
                                className="hidden lg:flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0 p-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200"
                                onClick={closeTicket}
                                aria-label="Cerrar ticket"
                            >
                                <span className="material-symbols-outlined select-none text-xl leading-none">arrow_back</span>
                            </button>

                            <div className="min-w-0 flex-1">
                                <h1 className="text-sm sm:text-base lg:text-lg font-bold text-slate-900 leading-tight truncate">
                                    {activeTicket.title}
                                </h1>
                                <div className="hidden sm:flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                        Canal: {activeTicket.channel}
                                    </span>
                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${isClosed ? 'bg-status-green/10 text-status-green' : 'text-slate-400 bg-slate-100'}`}>
                                        SLA: {activeTicket.sla}
                                    </span>
                                    {isArchived && (
                                        <span className="text-[11px] font-bold px-2 py-0.5 rounded uppercase bg-slate-200 text-slate-500">
                                            Archivado
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: actions */}
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0" data-resolved-menu>
                            {isAgent && (
                                <>
                                    <button className="hidden sm:block bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg transition-colors">
                                        <span className="material-symbols-outlined text-xl select-none">share</span>
                                    </button>
                                    <button className="hidden sm:block bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg transition-colors">
                                        <span className="material-symbols-outlined text-xl select-none">more_vert</span>
                                    </button>
                                </>
                            )}

                            {isAgent && (
                                <button
                                    onClick={toggleClientPanel}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-lg transition-colors"
                                    title="Ficha del ticket"
                                >
                                    <span className="material-symbols-outlined text-xl select-none">info</span>
                                </button>
                            )}

                            {isAgent && (
                                isResolved || isArchived ? (
                                    <ResolvedDropdown
                                        ticketId={activeTicket.id}
                                        reopenTicket={reopenTicket}
                                        archiveTicket={archiveTicket}
                                        resolvedMenuTicketId={resolvedMenuTicketId}
                                        setResolvedMenuTicketId={setResolvedMenuTicketId}
                                    />
                                ) : (
                                    <button
                                        onClick={resolveTicket}
                                        className="px-2 sm:px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1 bg-status-green hover:bg-green-600 text-white active:scale-95 shadow-sm shadow-green-400/20"
                                    >
                                        <span className="material-symbols-outlined text-base select-none">done_all</span>
                                        <span className="hidden sm:inline">Resolver</span>
                                    </button>
                                )
                            )}
                        </div>
                    </div>

                    {/* ── Messages ───────────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-4 sm:gap-5 bg-white chat-scrollbar">
                        <div className="flex justify-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                                Ticket abierto a las {activeTicket.openedAt}
                            </span>
                        </div>

                        {activeTicket.messages
                            .filter(msg => isAgent || msg.type !== 'internal')
                            .map(msg => (
                                <MessageBubble
                                    key={msg.id}
                                    msg={msg}
                                    client={activeClient}
                                    agent={currentAgent}
                                />
                            ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* ── Chat Input ─────────────────────────────────────────── */}
                    <ChatInput
                        key={activeTicket.id}
                        activeTicket={activeTicket}
                        sendMessage={sendMessage}
                        assignTicket={assignTicket}
                        agents={agents}
                        currentUser={currentUser}
                    />
                </div>
            </div>
        </section>
    );
}

