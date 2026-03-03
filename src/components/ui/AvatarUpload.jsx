// ─── AvatarUpload — shared input widget for user creation modals ──────────────
// Validates 1 MB max. Returns preview URL or null.
// Dark variant for the Super Admin modals, light for agent/client modals.
import { useState } from 'react';
import Avatar from './Avatar';

const MAX_BYTES = 1024 * 1024; // 1 MB

/**
 * @param {string|null} value      — current preview URL (avatarUrl state)
 * @param {function}    onChange   — (url: string|null, file: File|null) => void
 * @param {string}      name       — user name for fallback initials
 * @param {boolean}     dark       — true → super admin dark style
 * @param {function}    onError    — toast/alert callback for size error
 */
export default function AvatarUpload({ value, onChange, name = '', dark = false, onError }) {
    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        if (file.size > MAX_BYTES) {
            onError?.(`El archivo "${file.name}" supera el límite de 1 MB (${(file.size / MAX_BYTES).toFixed(1)} MB). No se subió el avatar.`);
            return;
        }

        const url = URL.createObjectURL(file);
        onChange(url, file);
    };

    const handleRemove = () => {
        if (value) URL.revokeObjectURL(value);
        onChange(null, null);
    };

    const borderCls = dark
        ? 'border-slate-700 hover:border-primary-accent bg-slate-800/50'
        : 'border-border-gray hover:border-primary/50 bg-slate-50';

    const labelTextCls = dark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-500 group-hover:text-primary/70';
    const subTextCls = dark ? 'text-slate-600' : 'text-slate-300';

    return (
        <div>
            <label className={`block text-[10px] font-bold uppercase tracking-widest mb-1.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                Foto de perfil <span className={`normal-case font-normal ${dark ? 'text-slate-600' : 'text-slate-400'}`}>(opcional · máx. 1 MB)</span>
            </label>
            <div className="flex items-center gap-4">
                {/* Avatar preview */}
                <div className="shrink-0 relative">
                    <Avatar avatarUrl={value} name={name} size="lg" />
                    {value && (
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute -top-1 -right-1 size-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                            title="Quitar foto"
                        >
                            <span className="material-symbols-outlined text-[9px] select-none">close</span>
                        </button>
                    )}
                </div>

                {/* Upload area */}
                <label className={`flex-1 cursor-pointer group border border-dashed rounded-xl px-3 py-3 text-center transition-colors ${borderCls}`}>
                    <span className={`material-symbols-outlined text-xl select-none block mb-0.5 transition-colors ${labelTextCls}`}>
                        {value ? 'swap_horiz' : 'add_a_photo'}
                    </span>
                    <p className={`text-[11px] transition-colors ${labelTextCls}`}>
                        {value ? 'Cambiar foto' : 'Subir foto'}
                    </p>
                    <p className={`text-[9px] mt-0.5 ${subTextCls}`}>PNG · JPG · WEBP</p>
                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleFile}
                    />
                </label>
            </div>
        </div>
    );
}
