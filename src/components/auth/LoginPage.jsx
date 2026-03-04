import { useState } from 'react';
import logoLogin from '../../img/logo-ticket-sync_login.png';
import logoLoginMobile from '../../img/logo-ticket-sync_login-mobile.png';


// ─── LoginPage ────────────────────────────────────────────────────────────────
// DB: auth.users (via Supabase Auth)
// On successful login: navigate to main app and set currentUser in context
export default function LoginPage({ onLogin, loginError = '' }) {
    const [selectedRole, setSelectedRole] = useState('agent'); // DB: users.role
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [remember, setRemember] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim() || !password.trim()) {
            setError('Por favor completá todos los campos.');
            return;
        }
        setIsLoading(true);
        // DB: supabase.auth.signInWithPassword({ email, password })
        await new Promise(r => setTimeout(r, 600));
        setIsLoading(false);
        onLogin({ role: selectedRole, email, password });
    };

    return (
        <div className="min-h-screen w-full font-display relative overflow-hidden bg-background-light">

            {/* ── Two-column grid (desktop) / single column (mobile) ─────── */}
            <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

                {/* ── LEFT PANEL — dark, brand info ─────────────────────────── */}
                <div className="hidden lg:flex flex-col justify-center items-end bg-sidebar-dark relative overflow-hidden">

                    {/* Background texture */}
                    <div
                        className="absolute inset-0 opacity-[0.04]"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #FFFFFF 1px, transparent 1px)',
                            backgroundSize: '28px 28px',
                        }}
                    />
                    {/* Glow */}
                    <div className="absolute top-1/3 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

                    {/* Content — right-aligned with inner margin so it's near the center divide */}
                    <div className="relative z-10 pr-12 pl-8 py-16 max-w-sm w-full">
                        {/* Logo */}
                        <div className="flex items-center mb-12">
                            <img src={logoLogin} alt="Ticket Sync" className="h-20 w-auto" />
                        </div>

                        {/* Tagline */}
                        <h2 className="text-4xl font-extrabold text-white leading-tight mb-4">
                            Portal de Soporte<br />
                            <span className="text-primary">Empresarial</span>
                        </h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-10">
                            Acceso seguro para agentes y clientes. Gestioná tickets, consultá el historial y coordiná con tu equipo desde un solo lugar.
                        </p>

                        {/* Feature pills */}
                        <div className="flex flex-col gap-3">
                            {[
                                { icon: 'confirmation_number', text: 'Gestión de tickets en tiempo real' },
                                { icon: 'analytics', text: 'Reportes y analytics del equipo' },
                                { icon: 'shield', text: 'Historial centralizado de consultas' },
                            ].map(({ icon, text }) => (
                                <div key={text} className="flex items-center gap-3">
                                    <div className="size-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-primary text-base select-none">{icon}</span>
                                    </div>
                                    <p className="text-slate-300 text-sm font-medium">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT PANEL — login form ───────────────────────────────── */}
                <div className="flex flex-col justify-center items-start bg-background-light relative">
                    {/* Content — left-aligned with inner margin so it's near the center divide */}
                    <div className="pl-10 lg:pl-12 pr-8 py-16 max-w-sm w-full mx-auto lg:mx-0">

                        {/* Mobile-only logo */}
                        <div className="flex lg:hidden flex-col items-center mb-10">
                            <img src={logoLoginMobile} alt="Ticket Sync" className="w-auto mb-2" />
                            <p className="text-slate-400 text-xs mt-1">Portal de Soporte</p>
                        </div>

                        {/* Card header */}
                        <div className="mb-7">
                            <h2 className="text-2xl font-extrabold text-slate-900">Iniciar Sesión</h2>
                            <p className="text-slate-400 text-sm mt-1">Acceso empresarial seguro</p>
                        </div>

                        {/* Role selector */}
                        {/* DB: users.role → determines which views are shown after login */}
                        <div className="mb-6">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Seleccionar rol de acceso</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { role: 'agent', icon: 'support_agent', label: 'Agente' },
                                    { role: 'client', icon: 'person', label: 'Cliente' },
                                ].map(({ role, icon, label }) => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setSelectedRole(role)}
                                        className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 font-semibold text-sm
                      ${selectedRole === role
                                                ? 'border-primary bg-primary/5 text-primary shadow-sm shadow-primary/10'
                                                : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                                            }`}
                                    >
                                        <span className={`material-symbols-outlined text-3xl select-none ${selectedRole === role ? 'text-primary' : 'text-slate-300'}`}>{icon}</span>
                                        <span>{label}</span>
                                        {selectedRole === role && (
                                            <div className="absolute top-2 right-2">
                                                <span className="material-symbols-outlined text-primary text-sm select-none">check_circle</span>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Email */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block" htmlFor="email">
                                    Email corporativo
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg select-none pointer-events-none">mail</span>
                                    <input
                                        id="email"
                                        type="email"
                                        autoComplete="email"
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-gray bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-300"
                                        placeholder="nombre@empresa.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="text-xs font-bold text-slate-500 mb-1.5 block" htmlFor="password">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg select-none pointer-events-none">lock</span>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password"
                                        className="w-full pl-10 pr-10 py-3 rounded-xl border border-border-gray bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-300"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(p => !p)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-lg select-none">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Remember + Forgot */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={remember}
                                        onChange={e => setRemember(e.target.checked)}
                                        className="rounded border-slate-300 text-primary focus:ring-primary"
                                    />
                                    <span className="text-xs text-slate-500">Recordar sesión</span>
                                </label>
                                <button type="button" className="text-xs font-bold text-primary hover:underline transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </button>
                            </div>

                            {/* Error (local validation or auth error from App.jsx) */}
                            {(error || loginError) && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-3 py-2 rounded-xl">
                                    <span className="material-symbols-outlined text-sm select-none shrink-0">error</span>
                                    {error || loginError}
                                </div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-extrabold text-white transition-all
                  ${isLoading
                                        ? 'bg-primary/50 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-primary-accent to-primary shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.98]'
                                    }`}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="material-symbols-outlined text-sm select-none animate-spin">progress_activity</span>
                                        Ingresando...
                                    </>
                                ) : (
                                    <>
                                        Ingresar de forma segura
                                        <span className="material-symbols-outlined text-base select-none">login</span>
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Security badges */}
                        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-5 text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-lg select-none">verified_user</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider">MFA Required</span>
                            </div>
                            <div className="h-3 w-px bg-slate-200" />
                            <div className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-lg select-none">encrypted</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider">AES-256</span>
                            </div>
                        </div>

                        <p className="mt-4 text-center text-[10px] text-slate-300 leading-snug">
                            Sistema propietario de Ticket Sync.<br />Acceso no autorizado está prohibido y monitoreado.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

