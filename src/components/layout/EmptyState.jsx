import { useTickets } from '../../context/TicketContext';

export default function EmptyState() {
    const { setIsNewTicketModalOpen, setActiveView, currentUser } = useTickets();

    const isClient = currentUser?.role === 'client';

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50/60 min-w-0 p-8 gap-8">
            {/* Illustration */}
            <div className="flex flex-col items-center gap-4 text-center max-w-xs">
                <div className="size-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary-accent/20 flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-4xl text-primary select-none">confirmation_number</span>
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">
                        {isClient ? 'Tu centro de soporte' : 'Bienvenido al Centro de Soporte'}
                    </h2>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        {isClient
                            ? 'Seleccioná un ticket del panel izquierdo o creá uno nuevo para contactar al equipo de soporte.'
                            : 'Seleccioná un ticket del panel izquierdo para comenzar a atender.'}
                    </p>
                </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                {/* Clients can create tickets; agents cannot */}
                {/* DB: shown only when currentUser.role === 'client' */}
                {isClient && (
                    <button
                        onClick={() => setIsNewTicketModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary-accent to-primary text-white rounded-2xl px-6 py-4 text-sm font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all duration-200"
                    >
                        <span className="material-symbols-outlined text-lg select-none">add_circle</span>
                        <span>Nuevo Ticket</span>
                    </button>
                )}

                <button
                    onClick={() => setActiveView('dashboard')}
                    className={`flex-1 flex items-center justify-center gap-2 bg-white border border-border-gray text-slate-700 hover:bg-slate-50 rounded-2xl px-6 py-4 text-sm font-bold transition-all duration-200 hover:shadow-md active:scale-95 ${!isClient ? 'max-w-xs' : ''}`}
                >
                    <span className="material-symbols-outlined text-lg select-none">dashboard</span>
                    <span>Ver Resumen</span>
                </button>
            </div>

            {/* Decorative dots */}
            <div className="flex gap-2 mt-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className={`rounded-full bg-slate-200 ${i === 2 ? 'size-3' : 'size-1.5'}`} />
                ))}
            </div>
        </div>
    );
}

