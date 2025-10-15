import { useState, useMemo, FC } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Booking, User } from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../constants';
import { getWeekStartDate, formatDate, formatUserText } from '../utils/helpers';
import Header from '../components/common/Header';

interface BookingModalProps {
    onClose: () => void;
    onConfirm: (duration: number) => void;
    date: Date;
    time: number;
    salaName: string;
    lastBookingDuration: number;
}

const BookingModal: FC<BookingModalProps> = ({ onClose, onConfirm, date, time, salaName, lastBookingDuration }) => {
    const [duration, setDuration] = useState(lastBookingDuration);

    const handleConfirm = () => {
        onConfirm(duration);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Confirmar Reserva</h2>
                <p className="mb-2"><span className="font-semibold">Sala:</span> {salaName}</p>
                <p className="mb-2"><span className="font-semibold">Fecha:</span> {formatDate(date)}</p>
                <p className="mb-6"><span className="font-semibold">Hora de Inicio:</span> {time}:00 hs</p>
                
                <div className="mb-6">
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-2">Duración (en horas)</label>
                    <select
                        id="duration"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>{h} hora{h > 1 ? 's' : ''}</option>)}
                    </select>
                </div>

                <div className="flex justify-end space-x-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition">Cancelar</button>
                    <button onClick={handleConfirm} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition">Confirmar Reserva</button>
                </div>
            </div>
        </div>
    );
};


const AgendaPage: FC = () => {
    const { 
        currentUser, salas, bookings, users, addBooking, deleteBooking, showConfirmation, 
        lastBookingDuration, setSettings, siteImageUrl
    } = useAppContext();
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSalaId, setSelectedSalaId] = useState<string>(salas[0]?.id || '');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: number } | null>(null);

    // Set default sala if not selected
    if (!selectedSalaId && salas.length > 0) {
        setSelectedSalaId(salas[0].id);
    }
    
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
    const weekStartDate = getWeekStartDate(currentDate);

    const weekDates = useMemo(() => {
        return DAYS_OF_WEEK.map((_, index) => {
            const date = new Date(weekStartDate);
            date.setDate(date.getDate() + index);
            return date;
        });
    }, [weekStartDate]);

    const bookingsForWeekAndSala = useMemo(() => {
        const weekEnd = new Date(weekStartDate);
        weekEnd.setDate(weekEnd.getDate() + 5);
        
        return bookings.filter(booking => {
            const bookingDate = new Date(booking.date + 'T00:00:00');
            return booking.roomId === selectedSalaId &&
                   bookingDate >= weekStartDate &&
                   bookingDate < weekEnd;
        });
    }, [bookings, selectedSalaId, weekStartDate]);

    const getBookingForSlot = (date: Date, time: number): (Booking & { user?: User }) | undefined => {
        const dateString = date.toISOString().split('T')[0];
        for (const booking of bookingsForWeekAndSala) {
            if (booking.date === dateString) {
                if (time >= booking.startTime && time < booking.startTime + booking.duration) {
                    return { ...booking, user: userMap.get(booking.userId) };
                }
            }
        }
        return undefined;
    };
    
    const handlePrevWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handleOpenBookingModal = (date: Date, time: number) => {
        setSelectedSlot({ date, time });
        setShowBookingModal(true);
    };

    const handleCloseBookingModal = () => {
        setShowBookingModal(false);
        setSelectedSlot(null);
    };

    const handleConfirmBooking = async (duration: number) => {
        if (!selectedSlot || !currentUser) return;
        
        // --- Conflict Check ---
        for (let i = 0; i < duration; i++) {
            if (getBookingForSlot(selectedSlot.date, selectedSlot.time + i)) {
                showConfirmation('El horario seleccionado se superpone con otra reserva. Por favor, elige otro horario.', () => {}, { confirmText: 'Entendido', confirmButtonClass: 'bg-blue-600 hover:bg-blue-700', cancelText: ''});
                return;
            }
        }

        const newBooking = {
            userId: currentUser.id,
            roomId: selectedSalaId,
            date: selectedSlot.date.toISOString().split('T')[0],
            startTime: selectedSlot.time,
            duration,
        };
        await addBooking(newBooking);
        await setSettings({ lastBookingDuration: duration });
        handleCloseBookingModal();
    };

    const handleDeleteBooking = (booking: Booking) => {
        const message = `¿Estás seguro de que quieres cancelar tu reserva para el ${formatDate(new Date(booking.date + 'T00:00:00'))} a las ${booking.startTime}:00 hs?`;
        showConfirmation(message, () => deleteBooking(booking.id));
    };

    const selectedSala = salas.find(s => s.id === selectedSalaId);
    const today = new Date();
    today.setHours(0,0,0,0);

    return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 p-4 md:p-6 overflow-auto bg-gray-800 bg-opacity-50">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-white w-full md:w-auto text-center md:text-left">Agenda de Sala</h1>
                        <select
                            value={selectedSalaId}
                            onChange={(e) => setSelectedSalaId(e.target.value)}
                            className="bg-cyan-900/70 border border-cyan-700 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {salas.map(sala => <option key={sala.id} value={sala.id} className="bg-gray-800 text-white">{sala.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrevWeek} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white">{'<'}</button>
                        <button onClick={handleToday} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm">Hoy</button>
                        <button onClick={handleNextWeek} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-white">{'>'}</button>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <span className="text-lg text-white font-semibold">
                       Semana del {formatDate(weekStartDate)} al {formatDate(weekDates[weekDates.length - 1])}
                    </span>
                    <div className="flex items-center gap-2 p-2 bg-cyan-900/70 rounded-md border border-cyan-700">
                        <img src={siteImageUrl} alt="Ubicación de sala" className="h-8 w-8 object-cover rounded"/>
                        <p className="text-xs text-gray-300">{selectedSala?.address || 'Sin domicilio'}</p>
                    </div>
                </div>

                <div className="overflow-x-auto bg-gray-900 bg-opacity-60 rounded-lg shadow-lg">
                    <table className="w-full text-center text-white min-w-[800px]">
                        <thead className="bg-black">
                            <tr className="border-b border-gray-700">
                                <th className="p-3 w-32">Hora</th>
                                {weekDates.map((date, index) => (
                                    <th key={index} className={`p-3 ${date.getTime() === today.getTime() ? 'bg-blue-900/50' : ''}`}>
                                        <div className="text-base font-bold">{DAYS_OF_WEEK[index]}</div>
                                        <div className="text-sm text-gray-400">{formatDate(date)}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {TIME_SLOTS.map(time => (
                                <tr key={time} className="border-b border-gray-700">
                                    <td className="p-3 border-r border-gray-700 font-mono text-sm bg-black">{time}:00 a {time + 1}:00</td>
                                    {weekDates.map((date, index) => {
                                        const booking = getBookingForSlot(date, time);
                                        const isPast = date < today || (date.getTime() === today.getTime() && time < new Date().getHours());
                                        const isFirstSlotOfBooking = booking && booking.startTime === time;

                                        if (booking) {
                                            if (isFirstSlotOfBooking) {
                                                const isCurrentUserBooking = booking.userId === currentUser?.id;
                                                const isAdmin = currentUser?.role === 'Administrador';
                                                const bookingUser = userMap.get(booking.userId);
                                                const isBookingUserAdmin = bookingUser?.role === 'Administrador';
                                                const sectorToDisplay = isBookingUserAdmin ? 'Facilities & Servicios' : formatUserText(bookingUser?.sector || 'N/A');
                                                
                                                return (
                                                    <td key={index} rowSpan={booking.duration} className="p-2 border-r border-gray-700 align-top text-xs bg-red-800/50">
                                                        <div className="h-full flex flex-col justify-between p-1 rounded">
                                                            <div>
                                                                <p className="font-bold">{formatUserText(booking.user?.lastName || '')}, {formatUserText(booking.user?.firstName || '')}</p>
                                                                <p className="text-gray-300">{sectorToDisplay}</p>
                                                            </div>
                                                            {(isCurrentUserBooking || isAdmin) && !isPast && (
                                                                <button onClick={() => handleDeleteBooking(booking)} className="text-red-300 hover:text-red-200 text-xs mt-2 self-end">
                                                                    Cancelar
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            }
                                            return null; // This cell is covered by a rowSpan
                                        }
                                        
                                        return (
                                            <td key={index} className={`p-2 border-r border-gray-700 ${date.getTime() === today.getTime() ? 'bg-blue-900/10' : ''}`}>
                                                {isPast ? (
                                                     <span className="text-gray-600 text-sm">-</span>
                                                ) : (
                                                     <button onClick={() => handleOpenBookingModal(date, time)} className="w-full h-full text-xs text-green-300 bg-green-800/20 hover:bg-green-700 hover:text-white rounded transition-colors py-2">
                                                        Disponible
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
            {showBookingModal && selectedSlot && selectedSala && (
                <BookingModal
                    onClose={handleCloseBookingModal}
                    onConfirm={handleConfirmBooking}
                    date={selectedSlot.date}
                    time={selectedSlot.time}
                    salaName={selectedSala.name}
                    lastBookingDuration={lastBookingDuration}
                />
            )}
        </div>
    );
};

export default AgendaPage;