import { useState, useRef } from 'react';
import { useTickets } from '../../context/TicketContext';
import { useToast } from '../../context/ToastContext';
import { clients } from '../../data/mockData';

const CHANNELS = ['Portal', 'Email', 'API', 'Chat', 'Teléfono'];
const PRIORITIES = ['Baja', 'Media', 'Alta', 'Urgente'];
const CLIENT_IDS = Object.keys(clients);

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function NewTicketModal() {
    const { isNewTicketModalOpen, setIsNewTicketModalOpen, addTicket, currentUser } = useTickets();
    const { addToast } = useToast();
    const [form, setForm] = useState({
        clientId: currentUser?.id || '',
        title: '',
        priority: 'Media',
        channel: 'Portal',
        description: '',
    });
    const [attachments, setAttachments] = useState([]);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    if (!isNewTicketModalOpen) return null;

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
            url: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
            rawFile: f,
        }));
        setAttachments(prev => [...prev, ...mapped]);
        // Reset input so same file can be re-added if removed
        e.target.value = '';
    };

    const removeAttachment = (idx) => {
        setAttachments(prev => {
            const copy = [...prev];
            if (copy[idx].url) URL.revokeObjectURL(copy[idx].url);
            copy.splice(idx, 1);
            return copy;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title.trim() || !form.description.trim()) return;

        setSaving(true);
        try {
            // Pasamos los archivos 'rawFile' a TicketContext
            await addTicket({
                ...form,
                attachments: attachments.map(a => a.rawFile)
            });
            setForm({ clientId: CLIENT_IDS[0], title: '', priority: 'Nuevo', channel: 'Portal', description: '' });
            setAttachments([]);
            setSaving(false);
        } catch (error) {
            console.error('Error al subir ticket:', error);
            addToast({ message: error.message || 'Error al guardar el ticket', type: 'error' });
            setSaving(false);
        }
    };

    const field = 'block w-full rounded-xl border border-border-gray bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all';

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setIsNewTicketModalOpen(false)}
            />

            {/* Modal — bottom sheet on mobile, centered dialog on sm+ */}
            <div className="relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92dvh] flex flex-col">
                {/* Drag handle (mobile only) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border-gray shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 rounded-xl p-2 shrink-0">
                            <span className="material-symbols-outlined text-primary text-xl select-none">add_circle</span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Nuevo Ticket</h2>
                            <p className="text-xs text-slate-400">Completa los datos</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsNewTicketModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-xl hover:bg-slate-100"
                    >
                        <span className="material-symbols-outlined select-none">close</span>
                    </button>
                </div>

                {/* Scrollable form body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
                    <div className="px-5 py-4 flex flex-col gap-4">

                        {/* Client */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Cliente</label>
                            <select
                                className={field + ' opacity-70 cursor-not-allowed'}
                                value={currentUser?.id || ''}
                                disabled
                            >
                                <option value={currentUser?.id || ''}>{currentUser?.name || 'Cargando...'} — {currentUser?.company || 'Empresa'}</option>
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Título</label>
                            <input
                                type="text"
                                className={field}
                                placeholder="Descripción breve del problema..."
                                value={form.title}
                                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                required
                            />
                        </div>

                        {/* Priority + Channel row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Prioridad</label>
                                <select
                                    className={field}
                                    value={form.priority}
                                    onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                                >
                                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Canal</label>
                                <select
                                    className={field}
                                    value={form.channel}
                                    onChange={e => setForm(p => ({ ...p, channel: e.target.value }))}
                                >
                                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Descripción</label>
                            <textarea
                                className={`${field} resize-none`}
                                placeholder="Detalla el problema o solicitud..."
                                rows={3}
                                value={form.description}
                                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                required
                            />
                        </div>

                        {/* Attachments */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">
                                Archivos adjuntos
                            </label>

                            {/* Drop zone / upload button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full border-2 border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-all rounded-xl py-4 px-4 flex flex-col items-center gap-2 text-center group"
                            >
                                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary/50 text-3xl select-none transition-colors">cloud_upload</span>
                                <span className="text-xs font-bold text-slate-400 group-hover:text-primary/70 transition-colors">
                                    Adjuntar archivos o imágenes
                                </span>
                                <span className="text-[10px] text-slate-300">PDF, PNG, JPG, JSON, ZIP — máx. <span className="font-bold text-slate-400">1 MB</span> por archivo</span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf,.json,.zip,.txt,.csv,.xlsx,.log"
                                className="hidden"
                                onChange={handleFileChange}
                            />

                            {/* Attachment previews */}
                            {attachments.length > 0 && (
                                <div className="mt-3 flex flex-col gap-2">
                                    {attachments.map((att, idx) => (
                                        <div key={idx} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                                            {att.type === 'image' && att.url
                                                ? <img src={att.url} alt={att.name} className="size-10 object-cover rounded-lg shrink-0" />
                                                : <div className="size-10 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                                                    <span className="material-symbols-outlined text-slate-400 text-sm select-none">description</span>
                                                </div>
                                            }
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-slate-700 truncate">{att.name}</p>
                                                <p className="text-[10px] text-slate-400">{att.size}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeAttachment(idx)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1 shrink-0"
                                            >
                                                <span className="material-symbols-outlined text-sm select-none">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions — sticky at bottom */}
                    <div className="px-5 py-4 border-t border-border-gray bg-white shrink-0 flex gap-3">
                        <button
                            type="button"
                            onClick={() => setIsNewTicketModalOpen(false)}
                            disabled={saving}
                            className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-primary-accent to-primary shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <><span className="material-symbols-outlined text-base select-none animate-spin">progress_activity</span> Guardando...</>
                            ) : (
                                'Crear Ticket'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

