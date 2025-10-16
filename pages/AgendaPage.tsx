import { FC, useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { getWeekStartDate, formatDate, formatDateForInput, formatUserText } from '../helpers';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../constants';
import { Sala, Booking, User } from '../types';
import Header from '../components/common/Header';

// --- Booking Modal Component (incluido aquí para simplicidad) ---
interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedSlot: { sala: Sala; date: Date; time: number } | null;
    existingBooking: Booking | null;
}
const BookingModal: FC<BookingModalProps> = ({ isOpen, onClose, selectedSlot, existingBooking }) => {
    const { user, users, salas, addBooking, deleteBooking, showConfirmation, addToast, bookings } = useAppContext();
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
            try {
                // Validación de superposición antes de guardar
                const newBookingEnd = selectedSlot.time + duration;
                const requestedDate = formatDateForInput(selectedSlot.date);

                const hasOverlap = bookings.some(booking => {
                    if (booking.roomId !== selectedSlot.sala.id || booking.date !== requestedDate) {
                        return false;
                    }
                    const existingBookingEnd = booking.startTime + booking.duration;
                    // Chequea si el nuevo booking empieza durante uno existente o si uno existente empieza durante el nuevo
                    return (selectedSlot.time >= booking.startTime && selectedSlot.time < existingBookingEnd) ||
                           (booking.startTime >= selectedSlot.time && booking.startTime < newBookingEnd);
                });

                if (hasOverlap) {
                    addToast('Este horario ya no está disponible. Por favor, actualiza la agenda.', 'error');
                    setIsSaving(false);
                    onClose();
                    return;
                }

                const newBooking = {
                    userId: user.id,
                    roomId: selectedSlot.sala.id,
                    date: requestedDate,
                    startTime: selectedSlot.time,
                    duration: duration,
                };
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
// --- Fin del Componente Booking Modal ---


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
        const now = new Date();
        const cellDate = new Date(date);
        cellDate.setHours(time);

        if (cellDate < now) return;

        const key = `${formatDateForInput(date)}-${time}`;
        const existingBooking = bookingsBySlot.get(key);
        
        if (existingBooking) {
            setViewingBooking(existingBooking);
        } else {
            setModalSlot({ sala, date, time });
        }
    };
    
    const selectedSala = salas.find(s => s.id === selectedSalaId);

    return (
        <div className="relative min-h-screen w-full">
            {/* Capa de Fondo */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-fixed z-0"
                style={{ backgroundImage: `url(${backgroundImageUrl})` }}
            />
            
            {/* Capa de Contenido Superpuesta */}
            <div className="absolute inset-0 flex flex-col bg-gray-900/80 text-white z-10">
                <Header />
                <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto flex flex-col">
                    <div className="flex flex-col xl:flex-row justify-between items-center mb-6 gap-4">
                        {/* Controles de Navegación y Sala */}
                        <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                            <img src={siteImageUrl} alt="Site" className="rounded-lg object-cover w-28 h-28 hidden md:block" />
                            <div className="flex-grow flex flex-col gap-4 w-full">
                                <div className="flex items-center justify-center gap-3">
                                    <button onClick={handlePrevWeek} title="Semana anterior" className="p-3 rounded-full hover:bg-gray-700 text-4xl font-bold flex items-center justify-center">&lt;</button>
                                    <div className="text-center">
                                        <button onClick={handleToday} className="text-lg px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold">Hoy</button>
                                        <h2 className="text-xl sm:text-2xl font-bold mt-2 whitespace-nowrap">Semana del {formatDate(weekStartDate)}</h2>
                                    </div>
                                    <button onClick={handleNextWeek} title="Semana siguiente" className="p-3 rounded-full hover:bg-gray-700 text-4xl font-bold flex items-center justify-center">&gt;</button>
                                </div>
                                {salas.length > 0 && (
                                    <div className="flex flex-col md:flex-row gap-4 w-full">
                                        <select value={selectedSalaId} onChange={e => setSelectedSalaId(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-md p-3 w-full md:w-1/2 text-lg">
                                            {salas.map(sala => <option key={sala.id} value={sala.id}>{sala.name}</option>)}
                                        </select>
                                        {selectedSala && <div className="bg-gray-800 border border-gray-600 rounded-md p-3 w-full md:w-1/2 text-lg text-gray-300 flex items-center justify-center md:justify-start"><p>{selectedSala.address}</p></div>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-grow">
                        <div className="grid grid-cols-[140px,repeat(5,minmax(120px,1fr))] min-w-[800px] h-full">
                            {/* Esquina vacía */}
                            <div className="sticky top-0 left-0 bg-black z-20"></div> 
                            {/* Cabecera de Días */}
                            {DAYS_OF_WEEK.map((day, i) => (
                                <div key={day} className="text-center font-bold p-2 border-b border-l border-gray-700 bg-black text-white sticky top-0 z-10">
                                    <p className="text-xl font-bold">{day}</p>
                                    <p className="text-base text-gray-300">{weekDates[i].toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</p>
                                </div>
                            ))}

                            {/* Columna de Horas y Celdas */}
                            {TIME_SLOTS.map(time => (
                                <>
                                    <div className="text-center text-sm p-2 border-r border-t border-gray-700 sticky left-0 bg-black text-white z-10 flex items-center justify-center font-semibold">
                                        {`${String(time).padStart(2, '0')}:00 a ${String(time + 1).padStart(2, '0')}:00`}
                                    </div>
                                    {weekDates.map(date => {
                                        const key = `${formatDateForInput(date)}-${time}`;
                                        const booking = bookingsBySlot.get(key);
                                        const userOfBooking = booking ? users.find(u => u.id === booking.userId) : null;
                                        const isStartOfBooking = booking && booking.startTime === time;
                                        
                                        const now = new Date();
                                        const cellDate = new Date(date);
                                        cellDate.setHours(time, 59, 59, 999); // Comparamos contra el final de la hora
                                        const isPast = cellDate < now;
                                        
                                        let cellContent;
                                        let cellClasses = `relative border-b border-r border-gray-700 transition-colors p-2 flex flex-col items-center justify-center text-center text-xs`;

                                        if (isStartOfBooking) {
                                            cellClasses += ' bg-red-800/90 text-white';
                                            cellContent = (
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-sm truncate">{userOfBooking ? `${formatUserText(userOfBooking.lastName)}, ${formatUserText(userOfBooking.firstName)}` : 'Reservado'}</p>
                                                    <p className="text-gray-200 truncate">{userOfBooking?.sector}</p>
                                                </div>
                                            );
                                            return (
                                                <div key={key} className={cellClasses} style={{ gridRowEnd: `span ${booking.duration}` }} onClick={() => handleCellClick(selectedSala!, date, time)}>
                                                    {cellContent}
                                                </div>
                                            );
                                        }

                                        if (booking) return null; // Slot cubierto por reserva de varias horas

                                        if (isPast) {
                                            cellClasses += ' bg-gray-700/80 text-gray-400';
                                            cellContent = <p>NO DISPONIBLE</p>;
                                        } else {
                                            cellClasses += ' bg-green-800/80 text-white hover:bg-green-700 cursor-pointer';
                                            cellContent = <p>DISPONIBLE</p>;
                                        }
                                        
                                        return (
                                            <div key={key} className={cellClasses} onClick={() => handleCellClick(selectedSala!, date, time)}>
                                                {cellContent}
                                            </div>
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
                `}</style>
            </div>
        </div>
    );
};

export default AgendaPage;
