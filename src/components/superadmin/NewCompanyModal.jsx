import { useState } from 'react';
import { useAdmin } from '../../context/AdminContext';

// ─── Toggle Switch component ──────────────────────────────────────────────────
function StatusToggle({ active, onChange, size = 'sm' }) {
    return (
        <button
            onClick={onChange}
            title={active ? 'Desactivar' : 'Activar'}
            className={`relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none shrink-0
                ${size === 'sm' ? 'w-9 h-5' : 'w-11 h-6'}
                ${active ? 'bg-status-green' : 'bg-slate-600'}
            `}
        >
            <span className={`inline-block rounded-full bg-white shadow transition-transform duration-200
                ${size === 'sm' ? 'size-3.5' : 'size-4'}
                ${active
                    ? (size === 'sm' ? 'translate-x-5' : 'translate-x-6')
                    : 'translate-x-0.5'
                }
            `} />
        </button>
    );
}

// ─── New Company Modal ────────────────────────────────────────────────────────
// DB: INSERT INTO companies(name, logo_url, status)
export default function NewCompanyModal({ onClose }) {
    const { addCompany } = useAdmin();
    const [name, setName] = useState('');                 // DB: companies.name
    const [logoPreview, setLogoPreview] = useState(null); // DB: companies.logo_url
    const [logoFile, setLogoFile] = useState(null);       // File for upload
    const [active, setActive] = useState(true);           // DB: companies.status
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { setError('El nombre de la empresa es requerido.'); return; }
        setError('');
        setSaving(true);
        // DB: supabase.storage.upload() then supabase.from('companies').insert()
        await new Promise(r => setTimeout(r, 500));
        addCompany({
            name: name.trim(),
            logoUrl: logoPreview,   // DB: storage URL after upload
            status: active ? 'Activo' : 'Inactivo',
        });
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-[#151a23] border border-slate-700 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 z-10">

                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-extrabold text-white">Nueva Empresa</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Registrá un nuevo cliente en la plataforma</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl select-none">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    {/* Nombre */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Nombre de la Empresa *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Industrias García S.A."
                            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-primary-accent transition-colors placeholder:text-slate-600"
                            autoFocus
                        />
                    </div>

                    {/* Logo upload */}
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                            Logo de la Empresa <span className="normal-case font-normal text-slate-500">(opcional)</span>
                        </label>
                        <div className="flex items-center gap-4">
                            {/* Preview */}
                            <div className="size-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                {logoPreview
                                    ? <img src={logoPreview} alt="Preview" className="w-full h-full object-contain p-1" />
                                    : <span className="material-symbols-outlined text-slate-600 text-2xl select-none">business</span>
                                }
                            </div>
                            <label className="flex-1 cursor-pointer">
                                <div className="border border-dashed border-slate-600 hover:border-primary-accent rounded-xl px-4 py-3 text-center transition-colors group">
                                    <span className="material-symbols-outlined text-slate-500 group-hover:text-primary-accent text-xl select-none block mb-1">upload</span>
                                    <p className="text-[11px] text-slate-500 group-hover:text-slate-300 transition-colors">
                                        {logoFile ? logoFile.name : 'Subir imagen (PNG / SVG)'}
                                    </p>
                                </div>
                                <input type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="hidden" onChange={handleLogoChange} />
                            </label>
                        </div>
                    </div>

                    {/* Estado inicial */}
                    <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3">
                        <div>
                            <p className="text-sm font-semibold text-white">Estado inicial</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {/* DB: companies.status */}
                                {active ? 'La empresa estará activa inmediatamente' : 'La empresa quedará inactiva'}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${active ? 'text-status-green' : 'text-slate-500'}`}>
                                {active ? 'Activo' : 'Inactivo'}
                            </span>
                            <StatusToggle active={active} onChange={() => setActive(p => !p)} size="md" />
                        </div>
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
                            className="flex-1 rounded-xl bg-gradient-to-r from-primary-accent to-primary text-white py-3 text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving
                                ? <><span className="material-symbols-outlined text-base select-none animate-spin">progress_activity</span> Guardando...</>
                                : <><span className="material-symbols-outlined text-base select-none">add</span> Sumar Empresa</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
