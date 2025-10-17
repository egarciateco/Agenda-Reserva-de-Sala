import { useState, useMemo, FC } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Booking } from '../types';
import Header from '../components/common/Header';
import { TIME_SLOTS } from '../constants';
import { formatUserText, formatDateForInput } from '../utils/helpers';

const AgendaPage: FC = () => {
    const { 
        user, bookings, salas, users, addBooking, deleteBooking, showConfirmation, 
        backgroundImageUrl, openQrModal 
    } = useAppContext();
    
    const [selectedSala, setSelectedSala] = useState(salas[0]?.id || '');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; time: number | null }>({ isOpen: false, time: null });
    const [bookingDuration, setBookingDuration] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleToday = () => setCurrentDate(new Date());

    const handleOpenBookingModal = (time: number) => {
        setBookingModal({ isOpen: true, time });
        setBookingDuration(1);
    };

    const handleCloseBookingModal = () => {
        setBookingModal({ isOpen: false, time: null });
    };

    const handleBookingSubmit = async () => {
        if (!bookingModal.time || !user) return;

        setIsSubmitting(true);
        
        const newBooking = {
            userId: user.id,
            roomId: selectedSala,
            date: formatDateForInput(currentDate),
            startTime: bookingModal.time,
            duration: bookingDuration,
        };
        try {
            await addBooking(newBooking);
            handleCloseBookingModal();
        } catch (e) {
            // Error handled by context
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteBooking = (booking: Booking) => {
        const salaName = salas.find(s => s.id === booking.roomId)?.name || 'esta sala';
        const bookingDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('es-ES');
        showConfirmation(
            `¿Estás seguro de que quieres cancelar tu reserva en ${salaName} el ${bookingDate} a las ${booking.startTime}:00?`,
            () => deleteBooking(booking.id)
        );
    };

    const bookingsForDay = useMemo(() => {
        const dateStr = formatDateForInput(currentDate);
        return bookings.filter(b => b.roomId === selectedSala && b.date === dateStr);
    }, [bookings, selectedSala, currentDate]);
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [year, month, day] = e.target.value.split('-').map(Number);
        // Using UTC to avoid timezone shifts when creating date from string
        setCurrentDate(new Date(Date.UTC(year, month - 1, day)));
    };

    return (
        <div 
            className="flex flex-col h-screen bg-cover bg-center bg-fixed"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        >
            <Header />
            <main className="flex-1 p-4 md:p-6 overflow-auto bg-gray-900 bg-opacity-60 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto">
                    {/* Controls */}
                    <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex-1 w-full md:w-auto">
                             <label htmlFor="sala-select" className="text-white text-sm font-bold mb-2 block">Seleccionar Sala</label>
                            <select
                                id="sala-select"
                                value={selectedSala}
                                onChange={(e) => setSelectedSala(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
                            >
                                {salas.map(sala => (
                                    <option key={sala.id} value={sala.id}>{sala.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 w-full md:w-auto text-center">
                             <label htmlFor="date-select" className="text-white text-sm font-bold mb-2 block">Seleccionar Fecha</label>
                            <div className="flex items-center justify-center gap-2">
                                <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md">{"<"}</button>
                                <input type="date" id="date-select" value={formatDateForInput(currentDate)} onChange={handleDateChange} className="bg-gray-700 border border-gray-600 rounded-md p-1 text-white text-center" />
                                <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md">{">"}</button>
                            </div>
                        </div>
                         <div className="flex-1 w-full md:w-auto flex justify-end items-end gap-2">
                             <button onClick={handleToday} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm">Hoy</button>
                             <button onClick={openQrModal} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm">Compartir</button>
                         </div>
                    </div>

                    {/* Agenda Grid */}
                    <div className="bg-gray-800 bg-opacity-80 p-4 rounded-lg">
                        <div className="grid grid-cols-1 gap-2">
                            {TIME_SLOTS.map(time => {
                                let occupiedBy: Booking | undefined;
                                for (const booking of bookingsForDay) {
                                    if (time >= booking.startTime && time < booking.startTime + booking.duration) {
                                        occupiedBy = booking;
                                        break;
                                    }
                                }

                                const isBookedByCurrentUser = occupiedBy && user && occupiedBy.userId === user.id;
                                const isPastTime = new Date().setHours(time, 0, 0, 0) < new Date().getTime() && formatDateForInput(currentDate) === formatDateForInput(new Date());

                                if (occupiedBy) {
                                    if (time !== occupiedBy.startTime) return null;

                                    const bookingUser = users.find(u => u.id === occupiedBy!.userId);

                                    return (
                                        <div key={time} style={{ gridRow: `span ${occupiedBy.duration}` }}
                                            className={`p-3 rounded-md flex justify-between items-start text-sm ${isBookedByCurrentUser ? 'bg-blue-800' : 'bg-red-800'} border-l-4 ${isBookedByCurrentUser ? 'border-blue-400' : 'border-red-400'}`}
                                        >
                                            <div>
                                                <p className="font-bold">{`${occupiedBy.startTime}:00 - ${occupiedBy.startTime + occupiedBy.duration}:00`}</p>
                                                <p className="text-xs text-gray-200">Reservado por: {bookingUser ? `${formatUserText(bookingUser.lastName)}, ${formatUserText(bookingUser.firstName)}` : 'Usuario desconocido'}</p>
                                            </div>
                                            {isBookedByCurrentUser && !isPastTime && (
                                                <button onClick={() => handleDeleteBooking(occupiedBy!)} className="text-red-400 hover:text-white p-1 rounded-full bg-black bg-opacity-20">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    );
                                } else {
                                    return (
                                        <div key={time} className="p-3 bg-gray-700 hover:bg-gray-600 rounded-md flex justify-between items-center text-sm transition-colors">
                                            <span className="font-mono text-gray-300">{`${time}:00`}</span>
                                            {!isPastTime ? (
                                                <button onClick={() => handleOpenBookingModal(time)} className="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 rounded-md">Reservar</button>
                                            ) : (
                                                <span className="text-xs text-gray-500">Pasado</span>
                                            )}
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    </div>
                </div>
            </main>

            {/* Booking Modal */}
            {bookingModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Confirmar Reserva</h3>
                        <p className="text-gray-300 mb-2">Sala: <span className="font-semibold">{salas.find(s => s.id === selectedSala)?.name}</span></p>
                        <p className="text-gray-300 mb-2">Fecha: <span className="font-semibold">{currentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span></p>
                        <p className="text-gray-300 mb-6">Hora de Inicio: <span className="font-semibold">{bookingModal.time}:00</span></p>
                        <div>
                             <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">Duración (horas)</label>
                            <input
                                id="duration"
                                type="number"
                                min="1"
                                max={TIME_SLOTS.length - TIME_SLOTS.indexOf(bookingModal.time!)}
                                value={bookingDuration}
                                onChange={(e) => setBookingDuration(parseInt(e.target.value, 10))}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
                            />
                        </div>
                        <div className="flex justify-end gap-4 mt-8">
                            <button onClick={handleCloseBookingModal} disabled={isSubmitting} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition disabled:opacity-50">Cancelar</button>
                            <button onClick={handleBookingSubmit} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition disabled:opacity-50 w-32">
                                {isSubmitting ? 'Reservando...' : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgendaPage;
