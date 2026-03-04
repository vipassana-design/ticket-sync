import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import AvatarUpload from '../ui/AvatarUpload';
import Avatar from '../ui/Avatar';
import { StatusToggle } from './AgentsTab';

// ─── Create Client Modal ──────────────────────────────────────────────────────
// DB: INSERT INTO auth.users + INSERT INTO profiles(role='client', company_id) + INSERT INTO clients
function CreateClientModal({ companyId, companyName, onClose }) {
    const { addUser } = useAdmin();
    const { addToast } = useToast();
    const [name, setName] = useState('');           // DB: profiles.name / clients.name
    const [email, setEmail] = useState('');         // DB: auth.users.email
    const [password, setPassword] = useState('');   // DB: hashed in auth.users
    const [avatarUrl, setAvatarUrl] = useState(null); // DB: profiles.avatar_url vista previa
    const [avatarFile, setAvatarFile] = useState(null); // File local a enviar a Storage
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
            await addUser({ email, name, role: 'client', companyId, companyName, password, avatarFile });
            setSaving(false);
            onClose();
        } catch (err) {
            console.error('Error al crear usuario cliente:', err);
            setError(err.message || 'Se produjo un error al registrar el cliente.');
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white border border-border-gray rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 z-10 max-h-[90dvh] overflow-y-auto chat-scrollbar">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-extrabold text-slate-900">Crear Usuario Cliente</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Nuevo acceso al portal de soporte</p>
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

                    {/* Nombre */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nombre completo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Ana González"
                            className="w-full border border-border-gray rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-primary transition-colors"
                            autoFocus
                        />
                    </div>

                    {/* Empresa (pre-filled + locked) */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Empresa <span className="text-slate-500 font-normal normal-case">(asignada automáticamente)</span>
                        </label>
                        <div className="flex items-center gap-2 bg-slate-50 border border-border-gray rounded-xl px-4 py-2.5">
                            <span className="material-symbols-outlined text-slate-400 text-sm select-none">lock</span>
                            <span className="text-sm text-slate-500">{companyName}</span>
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="ana@empresa.com"
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
                        <p className="text-[10px] text-slate-400 mt-1">El usuario deberá cambiarla en su primer inicio de sesión.</p>
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
                                ? <><span className="material-symbols-outlined text-base select-none animate-spin">progress_activity</span> Creando...</>
                                : <><span className="material-symbols-outlined text-base select-none">person_add</span> Crear Cliente</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── ClientsTab ───────────────────────────────────────────────────────────────
// DB: SELECT * FROM profiles WHERE company_id = currentUser.companyId AND role = 'client'
export default function ClientsTab({ companyId, companyName }) {
    const { getClientsByCompany, toggleUserStatus } = useAdmin();
    const [showModal, setShowModal] = useState(false);

    const clientUsers = getClientsByCompany(companyId);

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400">
                    {clientUsers.length} cliente{clientUsers.length !== 1 ? 's' : ''} registrado{clientUsers.length !== 1 ? 's' : ''}
                </p>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary-accent to-primary text-white rounded-xl px-4 py-2 text-xs font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                >
                    <span className="material-symbols-outlined text-sm select-none">person_add</span>
                    Crear Usuario Cliente
                </button>
            </div>

            {/* Client list */}
            <div className="bg-white border border-border-gray rounded-2xl overflow-hidden shadow-sm">
                {clientUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                        <span className="material-symbols-outlined text-slate-200 text-4xl select-none">person_search</span>
                        <p className="text-sm font-bold text-slate-400">Sin clientes registrados</p>
                        <p className="text-xs text-slate-300">Creá el primer usuario cliente de esta empresa</p>
                    </div>
                ) : (
                    <>
                        <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto] gap-4 px-5 py-3 border-b border-border-gray bg-slate-50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Empresa</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</p>
                        </div>
                        <div className="divide-y divide-border-gray">
                            {clientUsers.map(user => {
                                const active = user.status === 'Activo';
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
                                        {/* Empresa */}
                                        <span className="hidden sm:inline text-xs text-slate-400 truncate">{user.companyName}</span>
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

            {showModal && <CreateClientModal companyId={companyId} companyName={companyName} onClose={() => setShowModal(false)} />}
        </div>
    );
}
