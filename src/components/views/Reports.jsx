import { useState } from 'react';
import { useTickets } from '../../context/TicketContext';

// ─── Simple Bar Chart ─────────────────────────────────────────────────────────
function BarChart({ data, maxVal, color = 'bg-primary' }) {
    return (
        <div className="flex items-end gap-1.5 h-32">
            {data.map(({ label, value }) => {
                const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
                return (
                    <div key={label} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-[10px] font-bold text-slate-500">{value}</span>
                        <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                            <div
                                className={`${color} rounded-t-lg transition-all duration-700 min-h-[4px]`}
                                style={{ height: `${Math.max(pct, 4)}%` }}
                            />
                        </div>
                        <span className="text-[9px] text-slate-400 text-center leading-tight">{label}</span>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, sub, color = 'text-primary' }) {
    return (
        <div className="bg-white border border-border-gray rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <span className={`material-symbols-outlined ${color} text-xl select-none`}>{icon}</span>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{value}</p>
            {sub && <p className="text-[11px] text-slate-400 mt-1">{sub}</p>}
        </div>
    );
}

// ─── Reports View ─────────────────────────────────────────────────────────────
export default function Reports() {
    const { tickets, clients, currentAgent, agents, toggleSidebar } = useTickets();
    const [dateRange, setDateRange] = useState('7d');

    // ── Date range filter ─────────────────────────────────────────────────────
    const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
    const cutoff = Date.now() - daysMap[dateRange] * 24 * 60 * 60 * 1000;
    const rangeTickets = tickets.filter(t => t.rawTs >= cutoff);

    // ── Data derivations ──────────────────────────────────────────────────────
    const resolved = rangeTickets.filter(t => t.status === 'Resuelto' || t.status === 'Archivado');
    const open = rangeTickets.filter(t => t.status !== 'Resuelto' && t.status !== 'Archivado');

    // Volume by day of week (buckets based on rawTs within range)
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const volumeByDay = days.map((label, idx) => ({
        label,
        value: rangeTickets.filter(t => new Date(t.rawTs).getDay() === idx).length,
    }));
    const maxVol = Math.max(...volumeByDay.map(d => d.value), 1);

    // Avg resolution time (mock: based on message counts × 15min estimate)
    const avgResolutionHrs = resolved.length > 0
        ? (resolved.reduce((sum, t) => sum + t.messages.length * 0.25, 0) / resolved.length).toFixed(1)
        : '—';

    // ── SLA compliance per priority (real computation) ────────────────────────
    const slaGroups = [
        {
            label: 'Urgente (SLA: 1h)',
            color: 'bg-red-400',
            tickets: rangeTickets.filter(t => t.status === 'Urgente' || t.priority === 'Urgente'),
        },
        {
            label: 'En Progreso (SLA: 4h)',
            color: 'bg-orange-400',
            tickets: rangeTickets.filter(t => t.status === 'En Progreso' || t.priority === 'En Progreso'),
        },
        {
            label: 'Nuevo (SLA: 48h)',
            color: 'bg-primary',
            tickets: rangeTickets.filter(t => t.status === 'Nuevo' || t.priority === 'Nuevo'),
        },
    ];
    // "met SLA" = resolved/archived within that group; if no tickets use static fallback %
    const slaData = slaGroups.map(g => {
        if (g.tickets.length === 0) {
            return { label: g.label, color: 'bg-slate-200', met: 0, total: 0 };
        }
        const metCount = g.tickets.filter(t => t.status === 'Resuelto' || t.status === 'Archivado').length;
        return {
            label: g.label,
            color: g.color,
            met: Math.round((metCount / g.tickets.length) * 100),
            total: g.tickets.length,
        };
    });

    const hasSlaData = slaData.some(g => g.total > 0);

    // ── Agent performance (real — per agent from agents list) ─────────────────
    const agentStats = (agents || []).map(agent => ({
        name: agent.name,
        initials: agent.initials,
        resolved: rangeTickets.filter(t =>
            t.assignedAgent?.id === agent.id && (t.status === 'Resuelto' || t.status === 'Archivado')
        ).length,
        open: rangeTickets.filter(t =>
            t.assignedAgent?.id === agent.id && t.status !== 'Resuelto' && t.status !== 'Archivado'
        ).length,
    })).filter(a => a.resolved + a.open > 0) // hide agents with 0 tickets in range
        .sort((a, b) => (b.resolved + b.open) - (a.resolved + a.open));

    const agentDisplay = agentStats;

    // ── Client ticket stats ───────────────────────────────────────────────────
    const clientStats = Object.values(clients).map(client => {
        const clientTickets = rangeTickets.filter(t => t.clientId === client.id);
        return {
            name: client.name,
            company: client.company,
            total: clientTickets.length,
            resolved: clientTickets.filter(t => t.status === 'Resuelto' || t.status === 'Archivado').length,
            open: clientTickets.filter(t => t.status !== 'Resuelto' && t.status !== 'Archivado').length,
        };
    }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

    const handleExport = (format) => {
        alert(`Exportando reporte en formato ${format}... (funcionalidad de exportación real requiere backend)`);
    };

    return (
        <div className="flex-1 overflow-y-auto bg-slate-50/60 chat-scrollbar min-w-0">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            {/* Mobile hamburger */}
                            <button
                                className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
                                onClick={toggleSidebar}
                            >
                                <span className="material-symbols-outlined select-none text-xl">menu</span>
                            </button>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Reportes</h1>
                                <p className="text-sm text-slate-500 mt-1">Analytics · Visión histórica del equipo</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {/* Date range selector */}
                            <div className="flex bg-white border border-border-gray rounded-xl p-1 gap-1">
                                {['7d', '30d', '90d'].map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setDateRange(r)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${dateRange === r ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        {r === '7d' ? '7 días' : r === '30d' ? '30 días' : '90 días'}
                                    </button>
                                ))}
                            </div>
                            {/* Export buttons */}
                            <button
                                onClick={() => handleExport('Excel')}
                                className="flex items-center gap-2 bg-white border border-border-gray hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95"
                            >
                                <span className="material-symbols-outlined text-base text-green-600 select-none">table_chart</span>
                                Excel
                            </button>
                            <button
                                onClick={() => handleExport('PDF')}
                                className="flex items-center gap-2 bg-white border border-border-gray hover:bg-slate-50 text-slate-700 rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm hover:shadow active:scale-95"
                            >
                                <span className="material-symbols-outlined text-base text-red-500 select-none">picture_as_pdf</span>
                                PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <section className="mb-8">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">KPIs Principales</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        <StatCard icon="confirmation_number" value={rangeTickets.length} label="Total tickets" sub={`Últimos ${daysMap[dateRange]} días`} />
                        <StatCard icon="check_circle" value={resolved.length} label="Resueltos" color="text-status-green" sub={`${rangeTickets.length > 0 ? Math.round((resolved.length / rangeTickets.length) * 100) : 0}% del total`} />
                        <StatCard icon="schedule" value={`${avgResolutionHrs}h`} label="Tiempo prom. resolución" color="text-status-orange" sub="FRT estimado" />
                        <StatCard icon="inbox" value={open.length} label="Pendientes" color="text-red-500" sub="Sin resolver" />
                    </div>
                </section>

                {/* Volume Chart */}
                <section className="mb-8">
                    <div className="bg-white border border-border-gray rounded-2xl p-5 sm:p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-sm font-bold text-slate-800">Volumen de Tickets por Día</h2>
                            <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-1 rounded-lg font-medium">
                                Últimos {daysMap[dateRange]} días
                            </span>
                        </div>
                        <BarChart data={volumeByDay} maxVal={maxVol} color="bg-primary" />
                    </div>
                </section>

                {/* SLA / Resolution Time — real data */}
                <section className="mb-8">
                    <div className="bg-white border border-border-gray rounded-2xl p-5 sm:p-6 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 mb-5">Cumplimiento de SLA por Prioridad</h2>
                        {!hasSlaData ? (
                            <p className="text-sm text-slate-400 italic py-6 text-center">Sin datos en este período</p>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {slaData.map(({ label, met, color, total }) => (
                                    <div key={label}>
                                        <div className="flex justify-between text-xs mb-1.5">
                                            <span className="font-semibold text-slate-600">
                                                {label}
                                                {total > 0 && <span className="text-slate-400 font-normal ml-1">({total} tickets)</span>}
                                            </span>
                                            <span className={`font-extrabold ${met >= 90 ? 'text-status-green' : met >= 75 ? 'text-status-orange' : 'text-slate-500'}`}>
                                                {met}%
                                            </span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${met}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
                    {/* Agent Performance — real data */}
                    <div className="bg-white border border-border-gray rounded-2xl p-5 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 mb-5">Rendimiento por Agente</h2>
                        {agentDisplay.length === 0 ? (
                            <p className="text-sm text-slate-400 italic py-6 text-center">Sin datos en este período</p>
                        ) : (
                            <div className="flex flex-col divide-y divide-border-gray">
                                {agentDisplay.map(agent => (
                                    <div key={agent.name} className="flex items-center gap-4 py-3">
                                        <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary-accent text-white flex items-center justify-center text-xs font-extrabold shrink-0">
                                            {agent.initials}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{agent.name}</p>
                                            <p className="text-[11px] text-slate-400">{agent.open} abiertos · {agent.resolved} resueltos</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className="text-sm font-extrabold text-status-green">{agent.resolved}</span>
                                            <span className="text-[10px] text-slate-400">resueltos</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Client Stats — real data */}
                    <div className="bg-white border border-border-gray rounded-2xl p-5 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-800 mb-5">Tickets por Cliente</h2>
                        {clientStats.length === 0 ? (
                            <p className="text-sm text-slate-400 italic py-6 text-center">Sin datos en este período</p>
                        ) : (
                            <div className="flex flex-col divide-y divide-border-gray">
                                {clientStats.map(client => (
                                    <div key={client.name} className="flex items-center gap-4 py-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{client.name}</p>
                                            <p className="text-[11px] text-slate-400 truncate">{client.company}</p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-center">
                                                <p className="text-sm font-extrabold text-status-green">{client.resolved}</p>
                                                <p className="text-[9px] text-slate-400">resueltos</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-extrabold text-red-400">{client.open}</p>
                                                <p className="text-[9px] text-slate-400">abiertos</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-extrabold text-slate-500">{client.total}</p>
                                                <p className="text-[9px] text-slate-400">total</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Export section */}
                <section>
                    <div className="bg-gradient-to-r from-primary/5 to-primary-accent/5 border border-primary/20 rounded-2xl p-5 sm:p-6">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex-1">
                                <h3 className="text-sm font-bold text-slate-800">Exportar Reporte Completo</h3>
                                <p className="text-xs text-slate-500 mt-1">Descargá todos los datos de este período para presentar a gerencia o clientes.</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleExport('Excel')}
                                    className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-border-gray text-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold transition-all hover:shadow active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-sm text-green-600 select-none">table_chart</span>
                                    Descargar Excel
                                </button>
                                <button
                                    onClick={() => handleExport('PDF')}
                                    className="flex items-center gap-2 bg-white hover:bg-slate-50 border border-border-gray text-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold transition-all hover:shadow active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-sm text-red-500 select-none">picture_as_pdf</span>
                                    Descargar PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
