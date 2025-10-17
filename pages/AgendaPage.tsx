import { FC, useState, useMemo, useEffect } from 'react';
import Header from '../components/common/Header';
import { useAppContext } from '../hooks/useAppContext';
import { Booking, Sala } from '../types';
import { DAYS_OF_WEEK, TIME_SLOTS } from '../constants';
import { formatUserText } from '../utils/helpers';

const AgendaPage: FC = () => {
    const { user, bookings, salas, addBooking, deleteBooking, showConfirmation, backgroundImageUrl, siteImageUrl } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSalaId, setSelectedSalaId] = useState<string | null>(null);
    const [bookingModal, setBookingModal] = useState<{ isOpen: boolean; date: Date; time: number }>({ isOpen: false, date: new Date(), time: 0 });

    useEffect(() => {
        if (salas.length > 0 && !selectedSalaId) {
            setSelectedSalaId(salas[0].id);
        }
    }, [salas, selectedSalaId]);

    const startOfWeek = useMemo(() => {
        const date = new Date(currentDate);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
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
        const today = new Date();
        today.setHours(0,0,0,0);
        if (date < today) {
            return; // Cannot book in the past
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
        await addBooking(newBooking);
        setBookingModal({ isOpen: false, date: new Date(), time: 0 });
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
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-white">Agenda de Salas</h1>
                                <p className="text-gray-300">Selecciona una sala y un horario para reservar.</p>
                            </div>
                            <div className="w-full md:w-auto">
                                <label htmlFor="sala-select" className="sr-only">Seleccionar Sala</label>
                                <select 
                                    id="sala-select"
                                    value={selectedSalaId || ''} 
                                    onChange={(e) => setSelectedSalaId(e.target.value)}
                                    className="w-full md:w-64 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    {salas.map(sala => <option key={sala.id} value={sala.id}>{sala.name}</option>)}
                                </select>
                            </div>
                        </div>

                         {selectedSala && (
                            <div className="mb-4 bg-black bg-opacity-30 p-3 rounded-lg">
                                <p className="font-bold text-cyan-400">{selectedSala.name}</p>
                                <p className="text-xs text-gray-300">{selectedSala.address}</p>
                            </div>
                         )}

                        <div className="flex justify-center items-center mb-4 gap-6">
                             <img src={siteImageUrl} alt="Icono" className="h-16 w-16 object-contain bg-white p-1 rounded-md hidden md:block" />
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => changeWeek('prev')} 
                                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-bold text-xl"
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
                                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-md text-white font-bold text-xl"
                                >
                                    &gt;
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-center">
                                <thead>
                                    <tr>
                                        <th className="p-2 w-24 border-r border-gray-700">Horario</th>
                                        {weekDates.map(date => (
                                            <th key={date.toISOString()} className="p-2 border-r border-gray-700">
                                                {DAYS_OF_WEEK[date.getDay() - 1]}<br/>
                                                <span className="font-normal text-sm">{date.getDate()}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {TIME_SLOTS.map(time => (
                                        <tr key={time} className="border-t border-gray-700">
                                            <td className="p-2 border-r border-gray-700 text-xs">{`${time}:00`}</td>
                                            {weekDates.map(date => {
                                                const booking = bookingsBySlot.get(`${date.toDateString()}-${time}`);
                                                const isOwner = user && booking && booking.userId === user.id;
                                                const isAdmin = user?.role === 'Administrador';
                                                
                                                if (booking) {
                                                    const bookedUser = bookings.find(b => b.id === booking.id)?.userId;
                                                    return (
                                                        <td key={date.toISOString()} className="p-1 border-r border-gray-700 bg-blue-800 bg-opacity-70" style={{ height: '50px' }}>
                                                            <div className="text-xs text-white">
                                                                Reservado
                                                                {(isOwner || isAdmin) && (
                                                                    <button onClick={() => handleDelete(booking)} className="ml-1 text-red-400 hover:text-red-300">
                                                                        (X)
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                }
                                                return (
                                                    <td key={date.toISOString()} className="p-1 border-r border-gray-700 hover:bg-green-800 transition-colors cursor-pointer" style={{ height: '50px' }} onClick={() => handleBooking(date, time)}>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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