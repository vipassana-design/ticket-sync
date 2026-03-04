// ─── Avatar component ─────────────────────────────────────────────────────────
// Shared across all user types (super_admin, admin_empresa, agent, client).
// Shows avatarUrl if available; falls back to initials circle.
// DB: profiles.avatar_url → stored in Supabase Storage

// Derives initials from a full name string (first letter of first + last word)
export function getInitials(name = '') {
    if (!name.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Size map: 'xs'=24px, 'sm'=32px, 'md'=40px, 'lg'=48px, 'xl'=64px
const sizeMap = {
    xs: 'size-6 text-[9px]',
    sm: 'size-8 text-[10px]',
    md: 'size-10 text-xs',
    lg: 'size-12 text-sm',
    xl: 'size-16 text-base',
};

// Gradient palettes for initials avatars — hashed deterministically from name
const GRADIENTS = [
    'from-primary to-primary-accent',        // red
    'from-teal-600 to-teal-800',             // teal
    'from-violet-600 to-purple-800',         // purple
    'from-blue-600 to-blue-800',             // blue
    'from-orange-500 to-orange-700',         // orange
    'from-emerald-600 to-emerald-800',       // green
    'from-pink-500 to-rose-700',             // pink
    'from-slate-600 to-slate-800',           // slate
];

function hashGradient(name = '') {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

/**
 * @param {string}  avatarUrl  — DB: profiles.avatar_url / clients.avatar_url
 * @param {string}  name       — Full name for initials fallback
 * @param {string}  size       — 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 * @param {string}  className  — extra classes
 * @param {string}  ring       — optional ring class (e.g. 'ring-2 ring-white')
 */
export default function Avatar({ avatarUrl, name = '', size = 'md', className = '', ring = '' }) {
    const sizeClass = sizeMap[size] || sizeMap.md;
    const initials = getInitials(name);
    const gradient = hashGradient(name);
    const base = `${sizeClass} rounded-full overflow-hidden shrink-0 flex items-center justify-center font-extrabold text-white select-none ${ring} ${className}`;

    if (avatarUrl) {
        return (
            <div className={`${base} bg-slate-200`}>
                <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={e => { e.target.style.display = 'none'; }}
                />
            </div>
        );
    }

    return (
        <div className={`${base} bg-gradient-to-br ${gradient}`}>
            {initials}
        </div>
    );
}

