import { FC, useState, useMemo, useEffect } from 'react';
import Header from '../components/common/Header';
import { useAppContext } from '../hooks/useAppContext';
import { Booking, Sala, User } from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../constants';
import { formatUserText } from '../utils/helpers';

const AgendaPage: FC = () => {
    const { user, users, bookings, salas, addBooking, deleteBooking, showConfirmation, backgroundImageUrl, siteImageUrl } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSalaId, setSelectedSalaId] = useState<string | null>(null);
    const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; date: Date; time: number }>({ isOpen: false, date: new Date(), time: 0 });

    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    useEffect(() => {
        if (salas.length > 0 && !selectedSalaId) {
            setSelectedSalaId(salas[0].id);
        }
    }, [salas, selectedSalaId]);

    const startOfWeek = useMemo(() => {
        const date = new Date(currentDate);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        date.setHours(0, 0, 0, 0);
        return new Date(date.setDate(diff));
    }, [currentDate]);

    const weekDates = useMemo(() => {
        return Array.from({ length: 5 }).map((_, i) => {
            const date = new Date(startOfWeek);
            date.setDate(date.getDate() + i);
            return date;
        });
    }, [startOfWeek]);

    const bookingsBySlot = useMemo(() => {
        const map = new Map<string, Booking>();
        if (!selectedSalaId) return map;

        bookings
            .filter(b => b.roomId === selectedSalaId)
            .forEach(booking => {
                const dateKey = new Date(booking.date + 'T00:00:00').toDateString();
                for (let i = 0; i < booking.duration; i++) {
                    const time = booking.startTime + i;
                    map.set(`${dateKey}-${time}`, booking);
                }
            });
        return map;
    }, [bookings, selectedSalaId]);

    const handleBooking = (date: Date, time: number) => {
        const now = new Date();
        const slotDateTime = new Date(date);
        slotDateTime.setHours(time, 0, 0, 0);
        if (slotDateTime < now) return; // Cannot book in the past

        const isAlreadyBooked = bookingsBySlot.get(`${date.toDateString()}-${time}`);
        if(isAlreadyBooked) {
             // The check in the context is the definitive one, this is a quick UI check.
            return;
        }

        setBookingModal({ isOpen: true, date, time });
    };

    const confirmBooking = async (duration: number) => {
        if (!user || !selectedSalaId) return;
        
        const newBooking = {
            userId: user.id,
            roomId: selectedSalaId,
            date: bookingModal.date.toISOString().split('T')[0],
            startTime: bookingModal.time,
            duration,
        };
        try {
            await addBooking(newBooking);
            setBookingModal({ isOpen: false, date: new Date(), time: 0 });
        } catch (error) {
            // Error toast is shown by context, so we just need to close the modal
            setBookingModal({ isOpen: false, date: new Date(), time: 0 });
        }
    };

    const handleDelete = (booking: Booking) => {
        showConfirmation(
            `¿Estás seguro de que quieres cancelar tu reserva para el ${new Date(booking.date + 'T00:00:00').toLocaleDateString()} a las ${booking.startTime}:00?`,
            () => deleteBooking(booking.id)
        );
    };
    
    const changeWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + (direction === 'prev' ? -7 : 7));
        setCurrentDate(newDate);
    };

    const selectedSala = salas.find(s => s.id === selectedSalaId);
    
    return (
        <div 
            className="flex flex-col h-screen bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-70"></div>
            <div className="relative flex flex-col h-full">
                <Header />
                <main className="flex-1 p-4 md:p-6 overflow-auto text-white">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 bg-black bg-opacity-30 p-4 rounded-lg">
                            <div className='w-full md:w-auto'>
                                <label htmlFor="sala-select" className="block text-lg font-bold mb-1">UD. ESTA RESERVANDO EN SALA:</label>
                                <select 
                                    id="sala-select"
                                    value={selectedSalaId || ''} 
                                    onChange={(e) => setSelectedSalaId(e.target.value)}
                                    className="w-full md:w-96 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white text-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {salas.map(sala => <option key={sala.id} value={sala.id}>{sala.name}</option>)}
                                </select>
                            </div>
                            {selectedSala && (
                                <div className="w-full md:w-96 text-left md:text-right">
                                    <p className="font-bold text-lg text-cyan-400">{selectedSala.address}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center items-center mb-4 gap-6">
                             <img src={siteImageUrl} alt="Icono" className="h-20 w-20 object-contain bg-white p-1 rounded-md hidden md:block" />
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => changeWeek('prev')} 
                                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-bold text-2xl"
                                >
                                    &lt;
                                </button>
                                <div className="text-center w-56">
                                    <h2 className="text-2xl font-semibold text-white">
                                        {startOfWeek.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                    </h2>
                                    <button onClick={() => setCurrentDate(new Date())} className="text-sm text-blue-400 hover:underline">Hoy</button>
                                </div>
                                <button 
                                    onClick={() => changeWeek('next')} 
                                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-bold text-2xl"
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <div className="flex">
                                <div className="w-40 flex-shrink-0">
                                    <div className="h-16 bg-black text-white flex items-center justify-center p-2 border-r border-b border-gray-700">Horario</div>
                                    {TIME_SLOTS.map(time => (
                                         <div key={time} className="h-16 bg-black text-white flex items-center justify-center p-2 border-r border-b border-gray-700 text-xs font-semibold">
                                            {`${time.toString().padStart(2, '0')}:00 a ${(time + 1).toString().padStart(2, '0')}:00`}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex-grow grid grid-cols-5">
                                    {weekDates.map((date, dateIndex) => (
                                        <div key={date.toISOString()} className="flex flex-col">
                                            <div className="h-16 bg-black text-white flex flex-col items-center justify-center p-2 border-b border-gray-700">
                                                <span className="text-lg font-bold">{DAYS_OF_WEEK[date.getDay() - 1]}</span>
                                                <span className="text-sm">{date.getDate()}</span>
                                            </div>
                                            {TIME_SLOTS.map(time => {
                                                const now = new Date();
                                                const slotDateTime = new Date(date);
                                                slotDateTime.setHours(time + 1, 0, 0, 0); // Check against the end of the slot
                                                
                                                const booking = bookingsBySlot.get(`${date.toDateString()}-${time}`);
                                                const isPast = slotDateTime < now;
                                                const isOwner = user && booking && booking.userId === user.id;
                                                const isAdmin = user?.role === 'Administrador';
                                                const bookedByUser = booking ? userMap.get(booking.userId) : null;
                                                
                                                let cellContent;
                                                let cellClassName = "h-16 p-1 border-b border-r border-gray-700 text-xs text-center flex flex-col items-center justify-center";

                                                if (isPast) {
                                                    cellClassName += " bg-gray-600 text-gray-400 cursor-not-allowed";
                                                    cellContent = "NO DISPONIBLE";
                                                } else if (booking && bookedByUser) {
                                                    cellClassName += " bg-red-800 text-white";
                                                    cellContent = (
                                                        <>
                                                            <div className="font-bold truncate">{`${formatUserText(bookedByUser.lastName)}, ${formatUserText(bookedByUser.firstName)}`}</div>
                                                            <div className="text-gray-300 truncate">{isAdmin ? "Facilities & Servicios" : formatUserText(bookedByUser.sector)}</div>
                                                            {(isOwner || isAdmin) && (
                                                                <button onClick={() => handleDelete(booking)} className="absolute top-0 right-0 text-white hover:text-red-400 p-1 text-xs">
                                                                    X
                                                                </button>
                                                            )}
                                                        </>
                                                    );
                                                } else {
                                                    cellClassName += " bg-green-800 hover:bg-green-700 text-white cursor-pointer transition-colors";
                                                    cellContent = "DISPONIBLE";
                                                }

                                                return (
                                                    <div key={time} className={`${cellClassName} relative`} onClick={() => handleBooking(date, time)}>
                                                        {cellContent}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Booking Modal */}
            {bookingModal.isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white w-full max-w-md">
                        <h3 className="text-xl font-bold mb-2">Confirmar Reserva</h3>
                        <p className="text-gray-300 mb-6">
                            Sala: {salas.find(s => s.id === selectedSalaId)?.name}<br/>
                            Fecha: {bookingModal.date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br/>
                            Hora de inicio: {bookingModal.time}:00
                        </p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setBookingModal({ ...bookingModal, isOpen: false })} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition">Cancelar</button>
                            <button onClick={() => confirmBooking(1)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition">Confirmar (1 hr)</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgendaPage;