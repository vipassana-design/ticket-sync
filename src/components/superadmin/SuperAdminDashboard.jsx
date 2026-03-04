import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import NewCompanyModal from './NewCompanyModal';
import AvatarUpload from '../ui/AvatarUpload';
import Avatar from '../ui/Avatar';

// ─── Company Status Toggle ────────────────────────────────────────────────────
function StatusToggle({ active, onChange }) {
    return (
        <button
            onClick={onChange}
            title={active ? 'Desactivar empresa' : 'Activar empresa'}
            className={`relative inline-flex items-center shrink-0 rounded-full transition-colors duration-200 focus:outline-none w-9 h-5 ${active ? 'bg-status-green' : 'bg-slate-600'}`}
        >
            <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
    );
}

// ─── Create Admin Agent Modal ─────────────────────────────────────────────────
// DB: INSERT INTO auth.users + INSERT INTO profiles(role='admin_empresa', company_id)
// Exclusively for super_admin to assign an admin to a company.
function CreateAdminModal({ company, onClose }) {
    const { addUser } = useAdmin();
    const { addToast } = useToast();
    const [name, setName] = useState('');           // DB: profiles.name
    const [email, setEmail] = useState('');         // DB: auth.users.email
    const [password, setPassword] = useState('');   // DB: bcrypt hashed in auth.users
    const [avatarUrl, setAvatarUrl] = useState(null); // DB: profiles.avatar_url visual preview
    const [avatarFile, setAvatarFile] = useState(null); // File para Storage
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
            await addUser({
                email,
                name,
                role: 'admin_empresa',
                companyId: company.id,
                companyName: company.name,
                password,
                avatarFile,              // Pasa el File para subir a Supabase Storage
            });
            setSaving(false);
            onClose();
        } catch (err) {
            console.error('Error al registrar Agente Admin:', err);
            setError(err.message || 'Ocurrió un error inesperado. Revisa la consola para más detalles.');
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-[#151a23] border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 z-10">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-extrabold text-white">Crear Agente Admin</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Nuevo administrador para <span className="text-primary font-semibold">{company.name}</span>
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-xl select-none">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    {/* Avatar upload */}
                    <AvatarUpload
                        value={avatarUrl}
                        name={name}
                        dark={true}
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
                            placeholder="Ej: Carlos García"
                            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-primary-accent transition-colors placeholder:text-slate-600"
                            autoFocus
                        />
                    </div>

                    {/* Company (locked) */}
                    {/* DB: profiles.company_id locked to the selected company */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Empresa asignada</label>
                        <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
                            <span className="material-symbols-outlined text-slate-500 text-sm select-none">lock</span>
                            <span className="text-sm text-slate-400">{company.name}</span>
                            <span className="ml-auto text-[10px] font-mono text-slate-600">{company.id}</span>
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="admin@empresa.com"
                            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-primary-accent transition-colors placeholder:text-slate-600"
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
                            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-primary-accent transition-colors placeholder:text-slate-600"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">El usuario deberá cambiarla en su primer inicio de sesión.</p>
                    </div>

                    {/* Role badge preview */}
                    <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-xl px-4 py-2.5">
                        <span className="material-symbols-outlined text-primary text-sm select-none">manage_accounts</span>
                        <p className="text-xs text-primary font-semibold">
                            Este usuario tendrá acceso como <strong>Admin Empresa</strong> — podrá gestionar agentes y clientes.
                        </p>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg">
                            <span className="material-symbols-outlined text-sm select-none">error</span>
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 mt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 py-3 text-sm font-bold transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 rounded-xl bg-gradient-to-r from-primary-accent to-primary text-white py-3 text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {saving
                                ? <><span className="material-symbols-outlined text-base select-none animate-spin">progress_activity</span> Creando...</>
                                : <><span className="material-symbols-outlined text-base select-none">person_add</span> Crear Admin</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Company Row ──────────────────────────────────────────────────────────────
function CompanyRow({ company }) {
    const { toggleCompanyStatus, getUserCountByCompany, getAgentsByCompany } = useAdmin();
    const [showAdminModal, setShowAdminModal] = useState(false);

    const userCount = getUserCountByCompany(company.id);
    const hasAdmin = getAgentsByCompany(company.id).some(u => u.role === 'admin_empresa');
    const isActive = company.status === 'Activo';

    return (
        <>
            {/* cols: empresa | fecha | usuarios | crear admin | estado */}
            <div className="grid grid-cols-[2fr_1fr_1fr_auto_auto] items-center gap-3 sm:gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors border-b border-slate-800/80 last:border-b-0">

                {/* Company name + logo */}
                <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {company.logoUrl
                            ? <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain p-0.5" />
                            : <span className="material-symbols-outlined text-slate-500 text-base select-none">business</span>
                        }
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{company.name}</p>
                        <p className="text-[10px] text-slate-500 truncate font-mono">{company.id}</p>
                    </div>
                </div>

                {/* Fecha de Alta — DB: companies.created_at */}
                <p className="text-xs text-slate-400 hidden sm:block">{company.createdAt}</p>

                {/* Usuarios — DB: COUNT(*) FROM profiles WHERE company_id */}
                <div className="hidden sm:flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-slate-500 text-sm select-none">group</span>
                    <span className="text-xs font-bold text-slate-300">{userCount}</span>
                </div>

                {/* Crear Agente Admin */}
                {/* DB: INSERT INTO profiles(role='admin_empresa', company_id=company.id) */}
                <div className="flex items-center justify-center">
                    {hasAdmin ? (
                        <span
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-status-green bg-status-green/10 border border-status-green/20 rounded-full px-2.5 py-1 whitespace-nowrap"
                            title="Esta empresa ya tiene un Admin asignado"
                        >
                            <span className="material-symbols-outlined text-xs select-none">check_circle</span>
                            <span className="hidden sm:inline">Admin asignado</span>
                        </span>
                    ) : (
                        <button
                            onClick={() => setShowAdminModal(true)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-white bg-primary/10 hover:bg-primary border border-primary/30 hover:border-primary rounded-xl px-3 py-1.5 transition-all duration-200 whitespace-nowrap active:scale-95"
                            title="Crear un Agente Admin para esta empresa"
                        >
                            <span className="material-symbols-outlined text-sm select-none">person_add</span>
                            <span className="hidden sm:inline">Crear Admin</span>
                        </button>
                    )}
                </div>

                {/* Estado toggle — DB: companies.status */}
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold hidden sm:block ${isActive ? 'text-status-green' : 'text-slate-500'}`}>
                        {company.status}
                    </span>
                    <StatusToggle active={isActive} onChange={() => toggleCompanyStatus(company.id)} />
                </div>
            </div>

            {showAdminModal && (
                <CreateAdminModal company={company} onClose={() => setShowAdminModal(false)} />
            )}
        </>
    );
}

// ─── SuperAdminDashboard ──────────────────────────────────────────────────────
// DB: SELECT * FROM companies ORDER BY created_at DESC
export default function SuperAdminDashboard() {
    const { companies, loadingCompanies } = useAdmin();
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');

    const filtered = companies.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    const activeCount = companies.filter(c => c.status === 'Activo').length;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

            {/* Header */}
            <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                        Administración Global de Empresas
                    </h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {companies.length} empresa{companies.length !== 1 ? 's' : ''} registrada{companies.length !== 1 ? 's' : ''} · {activeCount} activa{activeCount !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary-accent to-primary text-white rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg shadow-primary/30 hover:opacity-90 active:scale-95 transition-all shrink-0"
                >
                    <span className="material-symbols-outlined text-lg select-none">add_business</span>
                    Sumar nueva Empresa
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
                {[
                    { icon: 'business', label: 'Total Empresas', value: companies.length, color: 'text-primary' },
                    { icon: 'check_circle', label: 'Activas', value: activeCount, color: 'text-status-green' },
                    { icon: 'block', label: 'Inactivas', value: companies.length - activeCount, color: 'text-slate-400' },
                ].map(({ icon, label, value, color }) => (
                    <div key={label} className="bg-[#1a2030] border border-slate-800 rounded-2xl p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`material-symbols-outlined ${color} text-lg select-none`}>{icon}</span>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                        </div>
                        <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-[#1a2030] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">

                {/* Search */}
                <div className="px-5 py-4 border-b border-slate-800">
                    <div className="relative max-w-xs">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg select-none pointer-events-none">search</span>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar empresa..."
                            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-9 pr-4 py-2 focus:outline-none focus:border-primary-accent transition-colors placeholder:text-slate-600"
                        />
                    </div>
                </div>

                {/* Table header — 5 cols to match row */}
                <div className="grid grid-cols-[2fr_1fr_1fr_auto_auto] gap-3 sm:gap-4 px-5 py-3 border-b border-slate-800 bg-slate-800/30">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Empresa</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">Fecha de Alta</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">Usuarios</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Crear Admin</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estado</p>
                </div>

                {/* Rows */}
                {loadingCompanies ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <span className="material-symbols-outlined text-primary text-4xl select-none animate-spin">progress_activity</span>
                        <p className="text-sm font-bold text-slate-400 animate-pulse">Cargando empresas registradas...</p>
                    </div>
                ) : companies.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                        <div className="size-16 rounded-2xl bg-slate-800/50 border border-slate-700 flex items-center justify-center mb-2">
                            <span className="material-symbols-outlined text-slate-500 text-3xl select-none">domain_disabled</span>
                        </div>
                        <div>
                            <p className="text-base font-bold text-white mb-1">Aún no hay empresas en el sistema</p>
                            <p className="text-xs text-slate-400 max-w-sm mx-auto">Comienza agregando la primera empresa u organización para empezar a gestionar sus tickets y agentes.</p>
                        </div>
                        <button
                            onClick={() => setShowModal(true)}
                            className="mt-2 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl px-5 py-2.5 text-sm font-bold border border-slate-600 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-base">add_business</span>
                            Crear primera empresa
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                        <span className="material-symbols-outlined text-slate-700 text-5xl select-none">search_off</span>
                        <p className="text-sm font-bold text-slate-500">No se encontraron empresas con esa búsqueda</p>
                        <p className="text-xs text-slate-600">Probá con otro término de búsqueda</p>
                    </div>
                ) : (
                    filtered.map(company => (
                        <CompanyRow key={company.id} company={company} />
                    ))
                )}
            </div>

            {showModal && <NewCompanyModal onClose={() => setShowModal(false)} />}
        </div>
    );
}
