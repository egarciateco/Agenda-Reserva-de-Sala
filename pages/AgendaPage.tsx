import { FC, useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { getWeekStartDate, formatDate, formatDateForInput, formatUserText } from '../utils/helpers';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../constants';
import { Sala, Booking, User } from '../types';
import Header from '../components/common/Header';

// --- Booking Modal Component (included here for simplicity) ---
interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSlot: { sala: Sala; date: Date; time: number } | null;
    existingBooking: Booking | null;
}
const BookingModal: FC<BookingModalProps> = ({ isOpen, onClose, selectedSlot, existingBooking }) => {
    const { user, users, salas, addBooking, deleteBooking, showConfirmation } = useAppContext();
    const [duration, setDuration] = useState(1);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (existingBooking) {
            setDuration(existingBooking.duration);
        } else {
            setDuration(1);
        }
    }, [existingBooking]);


    if (!isOpen || (!selectedSlot && !existingBooking)) return null;
    
    const bookingUser = existingBooking ? users.find(u => u.id === existingBooking.userId) : user;
    const isOwner = user?.id === existingBooking?.userId;
    const isAdmin = user?.role === 'Administrador';

    const handleSave = async () => {
        if (selectedSlot && user) {
            setIsSaving(true);
            const newBooking = {
                userId: user.id,
                roomId: selectedSlot.sala.id,
                date: formatDateForInput(selectedSlot.date),
                startTime: selectedSlot.time,
                duration: duration,
            };
            try {
                await addBooking(newBooking)
                onClose();
            } finally {
                setIsSaving(false);
            }
        }
    };
    
    const handleDelete = () => {
        if (existingBooking) {
            showConfirmation('¿Estás seguro de que quieres cancelar esta reserva?', async () => {
                await deleteBooking(existingBooking.id);
                onClose();
            });
        }
    };
    
    const salaForBooking = existingBooking ? salas.find(s => s.id === existingBooking.roomId) : selectedSlot?.sala;

    const date = existingBooking ? new Date(existingBooking.date + 'T00:00:00') : selectedSlot!.date;
    const time = existingBooking ? existingBooking.startTime : selectedSlot!.time;
    const currentDuration = existingBooking ? existingBooking.duration : duration;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4" onClick={onClose}>
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-white w-full max-w-md animate-scale-in" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold mb-4">{existingBooking ? 'Detalles de la Reserva' : 'Nueva Reserva'}</h2>
                <div className="space-y-2 text-sm">
                    <p><strong>Sala:</strong> {salaForBooking?.name || 'N/A'}</p>
                    <p><strong>Fecha:</strong> {formatDate(date)}</p>
                    <p><strong>Hora:</strong> {`${time}:00 - ${time + currentDuration}:00`}</p>
                    {bookingUser && <p className="mb-4"><strong>Reservado por:</strong> {`${formatUserText(bookingUser.lastName)}, ${formatUserText(bookingUser.firstName)}`}</p>}
                </div>
                
                {!existingBooking && (
                    <div className="my-4">
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-300">Duración (horas)</label>
                        <input id="duration" type="number" min="1" max="4" value={duration} onChange={e => setDuration(parseInt(e.target.value, 10))} className="w-full bg-gray-700 p-2 rounded mt-1 border border-gray-600" />
                    </div>
                )}

                <div className="flex justify-end gap-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition" disabled={isSaving}>Cerrar</button>
                    {!existingBooking && <button onClick={handleSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition w-28" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Confirmar'}</button>}
                    {existingBooking && (isOwner || isAdmin) && <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition">Eliminar</button>}
                </div>
            </div>
        </div>
    );
};
// --- End of Booking Modal Component ---


const AgendaPage: FC = () => {
    const { salas, bookings, siteImageUrl, users, backgroundImageUrl } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSalaId, setSelectedSalaId] = useState<string>('');
    const [modalSlot, setModalSlot] = useState<{ sala: Sala; date: Date; time: number } | null>(null);
    const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

    useEffect(() => {
      if(salas.length > 0 && !selectedSalaId){
        setSelectedSalaId(salas[0].id)
      }
    }, [salas, selectedSalaId]);

    const weekStartDate = getWeekStartDate(currentDate);

    const weekDates = useMemo(() => {
        return Array.from({ length: 5 }, (_, i) => {
            const date = new Date(weekStartDate);
            date.setDate(weekStartDate.getDate() + i);
            return date;
        });
    }, [weekStartDate]);
    
    const bookingsBySlot = useMemo(() => {
        const map = new Map<string, Booking>();
        bookings
            .filter(b => b.roomId === selectedSalaId)
            .forEach(booking => {
                for (let i = 0; i < booking.duration; i++) {
                    const key = `${booking.date}-${booking.startTime + i}`;
                    map.set(key, booking);
                }
            });
        return map;
    }, [bookings, selectedSalaId]);

    const handlePrevWeek = () => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)));
    const handleNextWeek = () => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)));
    const handleToday = () => setCurrentDate(new Date());

    const handleCellClick = (sala: Sala, date: Date, time: number) => {
        const key = `${formatDateForInput(date)}-${time}`;
        const existingBooking = bookingsBySlot.get(key);
        if (date < new Date(new Date().toDateString())) return; // Prevent booking in the past
        
        if (existingBooking) {
            setViewingBooking(existingBooking);
        } else {
            setModalSlot({ sala, date, time });
        }
    };
    
    const selectedSala = salas.find(s => s.id === selectedSalaId);

    return (
        <div 
            className="h-screen bg-cover bg-center bg-fixed"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        >
            <div className="flex flex-col h-full bg-gray-900/80 text-white">
                <Header />
                <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                        <div className="flex items-center gap-6">
                            <img src={siteImageUrl} alt="Site" className="rounded-lg object-cover w-24 h-24 hidden sm:block" />
                            <div className="flex items-center gap-3">
                                <button onClick={handlePrevWeek} title="Semana anterior" className="p-3 rounded-full hover:bg-gray-700 text-3xl font-bold flex items-center justify-center">&lt;</button>
                                <div className="text-center">
                                    <button onClick={handleToday} className="text-base px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold">Hoy</button>
                                    <h2 className="text-lg sm:text-xl font-bold mt-2 whitespace-nowrap">Semana del {formatDate(weekStartDate)}</h2>
                                </div>
                                <button onClick={handleNextWeek} title="Semana siguiente" className="p-3 rounded-full hover:bg-gray-700 text-3xl font-bold flex items-center justify-center">&gt;</button>
                            </div>
                        </div>

                        {salas.length > 0 && (
                            <div className="w-full md:w-auto md:max-w-xs">
                                <select value={selectedSalaId} onChange={e => setSelectedSalaId(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-md p-2 w-full text-sm">
                                    {salas.map(sala => <option key={sala.id} value={sala.id}>{sala.name}</option>)}
                                </select>
                                {selectedSala && <div className="mt-1 text-xs text-gray-400 w-full text-right"><p>{selectedSala.address}</p></div>}
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-[auto,repeat(5,minmax(80px,1fr))] min-w-[700px]">
                            <div className="text-center font-bold sticky left-0 bg-gray-900/80 z-10"></div>
                            {DAYS_OF_WEEK.map((day, i) => (
                                <div key={day} className="text-center font-bold p-2 border-b border-gray-700">
                                    <p className="text-xs sm:text-sm">{day}</p>
                                    <p className="text-xs text-gray-400">{weekDates[i].toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</p>
                                </div>
                            ))}

                            {TIME_SLOTS.map(time => (
                                <>
                                    <div className="text-center text-xs p-2 border-r border-gray-700 sticky left-0 bg-gray-900/80 z-10 flex items-center justify-center">{`${time}:00`}</div>
                                    {weekDates.map((date, dayIndex) => {
                                        const key = `${formatDateForInput(date)}-${time}`;
                                        const booking = bookingsBySlot.get(key);
                                        const userOfBooking = booking ? users.find(u => u.id === booking.userId) : null;
                                        const isStartOfBooking = booking && booking.startTime === time;
                                        const isPast = date < new Date(new Date().toDateString());
                                        const cellClasses = `relative h-16 border-b border-r border-gray-700 transition-colors ${ isPast ? 'bg-gray-800 opacity-50' : booking ? '' : 'hover:bg-blue-900 cursor-pointer'}`;
                                        
                                        if (isStartOfBooking) {
                                            return (
                                                <div
                                                    key={key}
                                                    className={`${cellClasses} bg-green-800/80 p-1 flex flex-col justify-center items-center text-center`}
                                                    onClick={() => !isPast && handleCellClick(selectedSala!, date, time)}
                                                    style={{ gridRowEnd: `span ${booking.duration}` }}
                                                >
                                                    <p className="text-xs font-semibold break-words">{userOfBooking ? `${formatUserText(userOfBooking.firstName)} ${formatUserText(userOfBooking.lastName.charAt(0))}.` : 'Reservado'}</p>
                                                </div>
                                            );
                                        }

                                        if (booking) return null; // This slot is covered by a multi-hour booking starting earlier
                                        
                                        return (
                                            <div
                                                key={key}
                                                className={cellClasses}
                                                onClick={() => !isPast && handleCellClick(selectedSala!, date, time)}
                                            ></div>
                                        );
                                    })}
                                </>
                            ))}
                        </div>
                    </div>
                </main>
                <BookingModal 
                    isOpen={!!modalSlot || !!viewingBooking} 
                    onClose={() => { setModalSlot(null); setViewingBooking(null); }} 
                    selectedSlot={modalSlot}
                    existingBooking={viewingBooking}
                />
                <style>{`
                .animate-scale-in { animation: scale-in 0.2s ease-out forwards; }
                @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .sticky {
                    background-color: rgba(17, 24, 39, 0.8) !important;
                }
                `}</style>
            </div>
        </div>
    );
};

export default AgendaPage;