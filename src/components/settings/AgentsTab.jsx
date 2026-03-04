import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import AvatarUpload from '../ui/AvatarUpload';
import Avatar from '../ui/Avatar';

// ─── Shared StatusToggle ──────────────────────────────────────────────────────
export function StatusToggle({ active, onChange }) {
    return (
        <button
            onClick={onChange}
            title={active ? 'Desactivar usuario' : 'Activar usuario'}
            className={`relative inline-flex items-center shrink-0 rounded-full transition-colors duration-200 focus:outline-none w-9 h-5 ${active ? 'bg-status-green' : 'bg-slate-300'}`}
        >
            <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
    );
}

// ─── Invite Agent Modal ───────────────────────────────────────────────────────
// DB: INSERT INTO auth.users + INSERT INTO profiles(role='agent', company_id)
function InviteAgentModal({ companyId, companyName, onClose }) {
    const { addUser } = useAdmin();
    const { addToast } = useToast();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null); // DB: profiles.avatar_url vista previa
    const [avatarFile, setAvatarFile] = useState(null); // File para almacenamiento real
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !email.trim() || !password.trim()) {
            setError('Todos los campos son requeridos.');
            return;
        }
        setError('');
        setSaving(true);
        try {
            await addUser({ email, name, role: 'agent', companyId, companyName, password, avatarFile });
            setSaving(false);
            onClose();
        } catch (err) {
            console.error('Error al invitar agente:', err);
            setError(err.message || 'Se produjo un error al registrar el usuario.');
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white border border-border-gray rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 z-10 max-h-[90dvh] overflow-y-auto chat-scrollbar">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-900">Invitar Agente</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Nuevo miembro del equipo de soporte</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
                        <span className="material-symbols-outlined text-xl select-none">close</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Avatar upload */}
                    <AvatarUpload
                        value={avatarUrl}
                        name={name}
                        dark={false}
                        onChange={(url, file) => {
                            setAvatarUrl(url);
                            setAvatarFile(file);
                        }}
                        onError={(msg) => addToast({ message: msg, type: 'error' })}
                    />

                    {/* Name */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre completo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Carlos López"
                            className="w-full border border-border-gray rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary transition-colors"
                            autoFocus
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="carlos@empresa.com"
                            className="w-full border border-border-gray rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Contraseña provisional</label>
                        <input
                            type="text"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Mín. 6 caracteres"
                            className="w-full border border-border-gray rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Company (locked) */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Empresa</label>
                        <div className="flex items-center gap-2 bg-slate-50 border border-border-gray rounded-xl px-4 py-2.5">
                            <span className="material-symbols-outlined text-slate-400 text-sm select-none">lock</span>
                            <span className="text-sm text-slate-500">{companyName}</span>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg">
                            <span className="material-symbols-outlined text-sm select-none">error</span>
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 mt-1">
                        <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border-gray text-slate-500 hover:bg-slate-50 py-3 text-sm font-bold transition-all">Cancelar</button>
                        <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-gradient-to-r from-primary-accent to-primary text-white py-3 text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving
                                ? <><span className="material-symbols-outlined text-base select-none animate-spin">progress_activity</span> Guardando...</>
                                : <><span className="material-symbols-outlined text-base select-none">person_add</span> Invitar Agente</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── AgentsTab ────────────────────────────────────────────────────────────────
// DB: SELECT * FROM profiles WHERE company_id = currentUser.companyId AND role != 'client'
export default function AgentsTab({ companyId, companyName }) {
    const { getAgentsByCompany, toggleUserStatus } = useAdmin();
    const [showModal, setShowModal] = useState(false);

    const agentUsers = getAgentsByCompany(companyId);

    const roleLabel = {
        admin_empresa: { label: 'Admin', color: 'bg-primary/10 text-primary' },
        agent: { label: 'Agente', color: 'bg-slate-100 text-slate-600' },
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400">
                    {agentUsers.length} agente{agentUsers.length !== 1 ? 's' : ''} en el equipo
                </p>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary-accent to-primary text-white rounded-xl px-4 py-2 text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-sm select-none">person_add</span>
                    Invitar Agente
                </button>
            </div>

            {/* Agent list */}
            <div className="bg-white border border-border-gray rounded-2xl overflow-hidden shadow-sm">
                {agentUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                        <span className="material-symbols-outlined text-slate-200 text-4xl select-none">group_off</span>
                        <p className="text-sm font-bold text-slate-400">Sin agentes registrados</p>
                        <p className="text-xs text-slate-300">Invitá al primer agente de soporte</p>
                    </div>
                ) : (
                    <>
                        {/* Table header */}
                        <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border-gray bg-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</p>
                        </div>
                        <div className="divide-y divide-border-gray">
                            {agentUsers.map(user => {
                                const active = user.status === 'Activo';
                                const badge = roleLabel[user.role] || roleLabel.agent;
                                return (
                                    <div key={user.id} className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-4 items-center hover:bg-slate-50/50 transition-colors">
                                        {/* Avatar + Name */}
                                        <div className="flex items-center gap-3 min-w-0 col-span-2 sm:col-span-1">
                                            {/* DB: profiles.avatar_url → Avatar fallback to initials */}
                                            <Avatar avatarUrl={user.avatarUrl} name={user.name} size="sm" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
                                                <p className="text-[11px] text-slate-400 truncate sm:hidden">{user.email}</p>
                                            </div>
                                        </div>
                                        {/* Email */}
                                        <p className="text-xs text-slate-500 hidden sm:block truncate">{user.email}</p>
                                        {/* Role badge */}
                                        <span className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wide shrink-0 ${badge.color}`}>
                                            {badge.label}
                                        </span>
                                        {/* Status toggle */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`text-[10px] font-bold hidden sm:block ${active ? 'text-status-green' : 'text-slate-400'}`}>{user.status}</span>
                                            <StatusToggle active={active} onChange={() => toggleUserStatus(user.id)} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {showModal && <InviteAgentModal companyId={companyId} companyName={companyName} onClose={() => setShowModal(false)} />}
        </div>
    );
}

