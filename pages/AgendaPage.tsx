import { FC, useState, useMemo } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { Booking, Sala } from '../types';
import Header from '../components/common/Header';
import { TIME_SLOTS, DAYS_OF_WEEK } from '../constants';
import { formatUserText } from '../utils/helpers';

// Helper to get week dates
const getWeekDates = (currentDate: Date): Date[] => {
    const dates: Date[] = [];
    const dayOfWeek = currentDate.getDay(); // 0 (Sun) to 6 (Sat)
    const startOfWeek = new Date(currentDate);
    // Adjust to Monday (if Sunday, go back 6 days, else go back day-1 days)
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startOfWeek.setDate(currentDate.getDate() + diff);

    for (let i = 0; i < 5; i++) { // Monday to Friday
        const weekDay = new Date(startOfWeek);
        weekDay.setDate(startOfWeek.getDate() + i);
        dates.push(weekDay);
    }
    return dates;
};

const AgendaPage: FC = () => {
    const { user, bookings, salas, users, addBooking, deleteBooking, showConfirmation } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<{ sala: Sala; date: Date; startTime: number } | null>(null);
    const [bookingDuration, setBookingDuration] = useState(1);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSalaId, setSelectedSalaId] = useState<string>('all');
    
    const weekDates = getWeekDates(currentDate);
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    const displayedSalas = useMemo(() => {
        if (selectedSalaId === 'all') {
            return salas;
        }
        return salas.filter(s => s.id === selectedSalaId);
    }, [salas, selectedSalaId]);
    
    const selectedSalaDetails = useMemo(() => {
        return salas.find(s => s.id === selectedSalaId);
    }, [salas, selectedSalaId]);

    const bookingsBySlot = useMemo(() => {
        const map = new Map<string, Booking>();
        bookings.forEach(booking => {
            for (let i = 0; i < booking.duration; i++) {
                const key = `${booking.roomId}-${booking.date}-${booking.startTime + i}`;
                map.set(key, booking);
            }
        });
        return map;
    }, [bookings]);

    const handleCellClick = (sala: Sala, date: Date, time: number) => {
        const key = `${sala.id}-${date.toISOString().split('T')[0]}-${time}`;
        if (bookingsBySlot.has(key)) return; // Can't book an occupied slot
        
        const today = new Date();
        today.setHours(0,0,0,0);
        if (date < today) return; // Can't book in the past

        setSelectedSlot({ sala, date, startTime: time });
        setBookingDuration(1); // Reset duration on new selection
    };
    
    const handleAddBooking = async () => {
        if (!selectedSlot || !user) return;
        setIsSaving(true);
        try {
            await addBooking({
                userId: user.id,
                roomId: selectedSlot.sala.id,
                date: selectedSlot.date.toISOString().split('T')[0],
                startTime: selectedSlot.startTime,
                duration: bookingDuration
            });
            setSelectedSlot(null);
        } catch (error) {
            // error handled by context
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteBooking = (bookingId: string) => {
        showConfirmation('¿Estás seguro de que quieres cancelar esta reserva?', () => deleteBooking(bookingId));
    };

    const changeWeek = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + offset * 7);
            return newDate;
        });
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            <Header />
            <main className="flex-1 p-4 sm:p-6 overflow-auto">
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="flex-shrink-0">
                        <label htmlFor="sala-selector" className="block text-lg font-bold font-serif mb-2 text-white" style={{ fontFamily: 'Georgia, serif' }}>Ud. está reservando en:</label>
                        <select 
                            id="sala-selector"
                            value={selectedSalaId}
                            onChange={(e) => setSelectedSalaId(e.target.value)}
                            className="bg-black/30 backdrop-blur-sm border border-cyan-400/50 text-white text-lg rounded-lg p-3 focus:ring-2 focus:ring-cyan-300 focus:outline-none transition w-full sm:w-auto"
                            style={{minWidth: '250px'}}
                        >
                            <option value="all">Todas las Salas</option>
                            {salas.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-grow w-full sm:w-auto">
                         <div className="bg-black/30 backdrop-blur-sm border border-cyan-400/50 text-white/80 text-lg rounded-lg p-3 h-[58px] flex items-center w-full">
                            {selectedSalaDetails ? selectedSalaDetails.address : 'Seleccione una sala para ver el domicilio'}
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">Agenda de Salas</h1>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button onClick={() => changeWeek(-1)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md">&lt; Ant</button>
                        <span className="text-center w-48 text-sm sm:text-base">
                            {weekDates[0].toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })} - {weekDates[4].toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeWeek(1)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md">Sig &gt;</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-black">
                                <th className="sticky left-0 bg-black p-2 border border-gray-700 min-w-[150px]">Sala</th>
                                {TIME_SLOTS.map(time => (
                                    <th key={time} className="p-2 border border-gray-700 min-w-[80px] text-center">{time}:00</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {weekDates.map((date, dayIndex) => (
                                <>
                                    <tr key={date.toISOString()} className="bg-gray-800">
                                        <td colSpan={TIME_SLOTS.length + 1} className="sticky left-0 bg-gray-800 p-2 font-bold text-cyan-400 border border-gray-700">
                                            {DAYS_OF_WEEK[dayIndex]}, {date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                        </td>
                                    </tr>
                                    {displayedSalas.map(sala => {
                                        const dateString = date.toISOString().split('T')[0];
                                        return (
                                            <tr key={`${sala.id}-${dateString}`} className="hover:bg-gray-700/50">
                                                <td className="sticky left-0 bg-gray-900 p-2 border border-gray-700 font-semibold">{sala.name}</td>
                                                {TIME_SLOTS.map(time => {
                                                    const key = `${sala.id}-${dateString}-${time}`;
                                                    const booking = bookingsBySlot.get(key);
                                                    if (booking) {
                                                        const bookingUser = userMap.get(booking.userId);
                                                        const isFirstSlot = booking.startTime === time;
                                                        if (!isFirstSlot) return null; // Rendered by colSpan
                                                        
                                                        const isOwner = user?.id === booking.userId;
                                                        return (
                                                            <td
                                                                key={key}
                                                                colSpan={booking.duration}
                                                                className={`p-2 border border-gray-600 text-xs text-center relative group ${isOwner ? 'bg-green-800' : 'bg-red-900'}`}
                                                            >
                                                                <p className="font-bold">{bookingUser ? `${formatUserText(bookingUser.lastName)}, ${formatUserText(bookingUser.firstName)}` : 'Reservado'}</p>
                                                                <p className="text-gray-300">{bookingUser ? formatUserText(bookingUser.sector) : ''}</p>
                                                                {isOwner && (
                                                                     <button onClick={() => handleDeleteBooking(booking.id)} className="absolute top-1 right-1 p-1 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                )}
                                                            </td>
                                                        );
                                                    }
                                                    
                                                    const today = new Date(); today.setHours(0,0,0,0);
                                                    const cellDate = new Date(date); cellDate.setHours(0,0,0,0);
                                                    const isPast = cellDate < today;

                                                    return (
                                                        <td key={key} onClick={() => handleCellClick(sala, date, time)} className={`border border-gray-700 h-16 ${isPast ? 'bg-gray-800' : 'cursor-pointer hover:bg-blue-900'}`}></td>
                                                    );
                                                })}
                                            </tr>
                                        )
                                    })}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Booking Modal */}
            {selectedSlot && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-6 rounded-lg shadow-xl text-white w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4">Confirmar Reserva</h2>
                        <p><strong>Sala:</strong> {selectedSlot.sala.name}</p>
                        <p><strong>Fecha:</strong> {selectedSlot.date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        <p><strong>Hora de Inicio:</strong> {selectedSlot.startTime}:00</p>
                        <div className="mt-4">
                            <label htmlFor="duration" className="block text-sm font-medium text-gray-300 mb-1">Duración (horas)</label>
                            <input
                                id="duration"
                                type="number"
                                min="1"
                                max="8" // Or some other logic
                                value={bookingDuration}
                                onChange={e => setBookingDuration(parseInt(e.target.value, 10))}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3"
                            />
                        </div>
                        <div className="flex justify-end space-x-4 mt-6">
                            <button onClick={() => setSelectedSlot(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition" disabled={isSaving}>Cancelar</button>
                            <button onClick={handleAddBooking} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition w-28" disabled={isSaving}>
                                {isSaving ? 'Reservando...' : 'Reservar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgendaPage;