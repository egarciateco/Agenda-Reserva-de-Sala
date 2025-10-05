import { useState, useEffect, useRef, FC } from 'react';
import Header from '../components/common/Header';
import { useAppContext } from '../hooks/useAppContext';
import { TIME_SLOTS, DAYS_OF_WEEK } from '../constants';
import { getWeekStartDate, formatUserText, formatDateForInput } from '../utils/helpers';
import { Booking, User } from '../types';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

interface SlotInfo {
    date: string; // YYYY-MM-DD
    startTime: number;
}

type ActiveButton = 'prev' | 'today' | 'next';

const AgendaPage: FC = () => {
    const { bookings, users, currentUser, addBooking, deleteBooking, addToast, showConfirmation, salas, siteImageUrl, lastBookingDuration, setSettings } = useAppContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
    const [duration, setDuration] = useState(1);
    const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [bookingRoomId, setBookingRoomId] = useState<string | null>(null);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [activeButton, setActiveButton] = useState<ActiveButton>('today');

    const formRef = useRef(null);
    const successRef = useRef(null);

    useEffect(() => {
        const currentRoomExists = selectedRoomId && salas.some(s => s.id === selectedRoomId);

        if (salas.length > 0) {
            if (!currentRoomExists) {
                setSelectedRoomId(salas[0].id);
            }
        } else {
            setSelectedRoomId(null);
        }
    }, [salas, selectedRoomId]);

    useEffect(() => {
        if (selectedSlot) {
            setDuration(lastBookingDuration || 1);
        }
    }, [selectedSlot, lastBookingDuration]);

    const now = new Date();
    const todayStringForPastCheck = formatDateForInput(now);
    const currentHourForPastCheck = now.getHours();
    const weekStart = getWeekStartDate(new Date(currentDate));

    const getBookingAt = (date: string, time: number, roomId: string | null) => {
        if (!roomId) return undefined;
        return bookings.find(b => {
            if (b.date !== date || b.roomId !== roomId) return false;
            return time >= b.startTime && time < b.startTime + b.duration;
        });
    };

    const handleCellClick = (date: string, time: number) => {
        const isPast = date < todayStringForPastCheck || (date === todayStringForPastCheck && time <= currentHourForPastCheck);
        if (isPast) {
            return; // No action for past slots
        }

        const booking = getBookingAt(date, time, selectedRoomId);
        if (booking) {
            setViewingBooking(booking);
        } else {
            setSelectedSlot({ date, startTime: time });
            setBookingRoomId(selectedRoomId);
        }
    };
    
    const handleCancelBooking = () => {
        setSelectedSlot(null);
        setBookingRoomId(null);
        setBookingSuccess(false);
    };

    const confirmBooking = async () => {
        if (!selectedSlot || !currentUser || !bookingRoomId) return;

        for (let i = 0; i < duration; i++) {
            if (getBookingAt(selectedSlot.date, selectedSlot.startTime + i, bookingRoomId)) {
                addToast('El horario seleccionado se superpone con otra reserva en esta sala.', 'error');
                return;
            }
        }

        setIsCreating(true);
        try {
            const bookingData = {
                userId: currentUser.id,
                roomId: bookingRoomId,
                date: selectedSlot.date,
                startTime: selectedSlot.startTime,
                duration: duration
            };
            const emailStatus = await addBooking(bookingData);
            addToast(`¡Reserva confirmada! ${emailStatus}`, 'success');
            setBookingSuccess(true);
            setTimeout(() => {
                handleCancelBooking();
            }, 3000);
        } catch (error) {
            console.error('Failed to add booking', error);
            addToast('Error al confirmar la reserva.', 'error');
        } finally {
            setIsCreating(false);
        }
    };
    
    const handleDeleteBooking = (bookingId: string) => {
        const bookingToDelete = bookings.find(b => b.id === bookingId);
        if (!bookingToDelete) return;
        
        const bookingUser = users.find(u => u.id === bookingToDelete.userId);
        const userName = bookingUser ? `${formatUserText(bookingUser.lastName)}, ${formatUserText(bookingUser.firstName)}` : "este usuario";
        
        showConfirmation(`¿Estás seguro que quieres eliminar la reserva de ${userName}?`, async () => {
            setIsDeleting(true);
            try {
                await deleteBooking(bookingId);
                setViewingBooking(null);
            } catch (error) {
                console.error("Failed to delete booking", error);
                addToast('Error al eliminar la reserva.', 'error');
            } finally {
                setIsDeleting(false);
            }
        });
    };
    
    const changeWeek = (direction: ActiveButton) => {
        setActiveButton(direction);
        if (direction === 'today') {
            setCurrentDate(new Date());
        } else {
            const newDate = new Date(currentDate);
            const increment = direction === 'prev' ? -7 : 7;
            newDate.setDate(newDate.getDate() + increment);
            setCurrentDate(newDate);
        }
    };
    
    const weekDates = DAYS_OF_WEEK.map((_, i) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + i);
        return date;
    });

    const getUserFromBooking = (booking: Booking | null): User | undefined => {
        if (!booking) return undefined;
        return users.find(u => u.id === booking.userId);
    };
    
    const renderCell = (date: Date, time: number) => {
        const dateString = formatDateForInput(date);
        const booking = getBookingAt(dateString, time, selectedRoomId);
        const isPast = dateString < todayStringForPastCheck || (dateString === todayStringForPastCheck && time <= currentHourForPastCheck);

        let cellContent;
        let cellClass = 'p-1 h-12 border-b border-r border-gray-700 text-center relative text-xs';

        if (isPast) {
            cellClass += ' bg-gray-700 cursor-not-allowed text-gray-400';
            if (booking) {
                const user = getUserFromBooking(booking);
                const isStartOfBooking = booking.startTime === time;
                if (isStartOfBooking) {
                    cellContent = (
                        <div className="flex flex-col justify-center items-center h-full p-1 leading-tight opacity-60">
                            <span className="font-bold text-center">
                                {user ? `${formatUserText(user.lastName)}, ${formatUserText(user.firstName)}` : 'Reservado'}
                            </span>
                            <span className="text-[10px] text-center">{user ? formatUserText(user.sector) : ''}</span>
                        </div>
                    );
                } else {
                    cellClass = cellClass.replace('bg-gray-700', 'bg-gray-700/80');
                    cellContent = <div className="h-full"></div>;
                }
            } else {
                cellContent = <span className="text-[10px]">Vencida</span>;
            }
        } else if (booking) { // Not past, but booked
            const user = getUserFromBooking(booking);
            const isStartOfBooking = booking.startTime === time;
            if (isStartOfBooking) {
                cellClass += ' bg-red-800 text-white cursor-pointer hover:bg-red-700';
                cellContent = (
                    <div className="flex flex-col justify-center items-center h-full p-1 leading-tight">
                        <span className="font-bold text-center">
                            {user ? `${formatUserText(user.lastName)}, ${formatUserText(user.firstName)}` : 'Reservado'}
                        </span>
                        <span className="text-[10px] text-center text-gray-200">{user ? formatUserText(user.sector) : ''}</span>
                    </div>
                );
            } else {
                cellClass += ' bg-red-800/80';
                cellContent = <div className="h-full"></div>;
            }
        } else { // Not past, and free
            cellClass += ' bg-green-700 text-white hover:bg-green-600 cursor-pointer';
            cellContent = <span className="font-bold">Libre</span>;
        }

        return (
            <td key={`${dateString}-${time}`} className={cellClass} onClick={() => handleCellClick(dateString, time)} rowSpan={booking && booking.startTime === time ? booking.duration : 1}>
                {cellContent}
            </td>
        );
    };

    const selectedSala = salas.find(s => s.id === selectedRoomId);

    return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 p-2 md:p-6 overflow-auto bg-gray-800 bg-opacity-50">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 text-white">
                        <div className="flex items-center gap-4 mb-4 md:mb-0 text-center md:text-left">
                           {selectedSala ? (
                                <h1 className="text-2xl font-bold">
                                    {selectedSala.name}
                                    {selectedSala.address && <span className="text-xl font-normal text-gray-300"> - {selectedSala.address}</span>}
                                </h1>
                            ) : (
                                <h1 className="text-2xl font-bold">Agenda de Sala</h1>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                             <button onClick={() => changeWeek('prev')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeButton === 'prev' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Semana Anterior</button>
                             <button onClick={() => changeWeek('today')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeButton === 'today' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Semana Actual</button>
                             <button onClick={() => changeWeek('next')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeButton === 'next' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Semana Siguiente</button>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-4">
                        <div className="flex flex-col md:w-1/2">
                            <label htmlFor="sala-select" className="text-sm font-medium text-white whitespace-nowrap mb-1">Seleccionar Sala:</label>
                            <select
                                id="sala-select"
                                value={selectedRoomId || ''}
                                onChange={(e) => setSelectedRoomId(e.target.value)}
                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                disabled={salas.length === 0}
                            >
                                {salas.length > 0 ? (
                                    salas.map(sala => (
                                        <option key={sala.id} value={sala.id}>
                                            {sala.name}{sala.address ? ` - ${sala.address}` : ''}
                                        </option>
                                    ))
                                ) : (
                                    <option>No hay salas disponibles</option>
                                )}
                            </select>
                        </div>
                         {siteImageUrl && (
                            <img src={siteImageUrl} alt="Ubicación del site" className="h-24 w-auto rounded-lg object-cover shadow-lg hidden md:block" />
                        )}
                    </div>

                    <div className="overflow-x-auto bg-gray-900 bg-opacity-70 rounded-lg shadow-lg">
                        <table className="w-full table-fixed">
                            <thead className="text-white bg-black">
                                <tr>
                                    <th className="p-2 w-28 border-r border-gray-700">Horario</th>
                                    {weekDates.map((date, i) => (
                                        <th key={i} className="p-2 border-r border-gray-700 text-center">
                                            <span className="font-bold text-base">{DAYS_OF_WEEK[i]}</span><br/>
                                            <span className="font-normal text-sm">{date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {TIME_SLOTS.map(time => (
                                    <tr key={time}>
                                        <td className="p-2 border-r border-b border-gray-700 text-center font-semibold text-white text-sm bg-black">
                                            {`${String(time).padStart(2, '0')} a ${String(time + 1).padStart(2, '0')}`}
                                        </td>
                                        {weekDates.map(date => {
                                            const booking = getBookingAt(formatDateForInput(date), time, selectedRoomId);
                                            // Only render the cell if it's not part of an ongoing booking from a previous timeslot
                                            if (booking && booking.startTime < time) {
                                                return null;
                                            }
                                            return renderCell(date, time);
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Create Booking Modal */}
            {selectedSlot && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-0 rounded-lg shadow-xl text-white w-full max-w-md relative overflow-hidden" style={{ minHeight: '420px' }}>
                        <TransitionGroup component={null}>
                            {!bookingSuccess ? (
                                <CSSTransition
                                    key="form"
                                    nodeRef={formRef}
                                    timeout={300}
                                    classNames="fade"
                                >
                                    <div ref={formRef} className="absolute inset-0 p-8">
                                        <h2 className="text-xl font-bold mb-6">Confirmar Reserva</h2>
                                        <p className="mb-2"><strong>Fecha:</strong> {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        <p className="mb-4"><strong>Hora de Inicio:</strong> {selectedSlot.startTime}:00</p>
                                         <div className="mb-4">
                                            <label htmlFor="booking-sala-select" className="block text-sm font-medium text-white mb-1">Sala:</label>
                                            <select
                                                id="booking-sala-select"
                                                value={bookingRoomId || ''}
                                                onChange={(e) => setBookingRoomId(e.target.value)}
                                                className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
                                            >
                                                {salas.map(sala => <option key={sala.id} value={sala.id}>{sala.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="mb-6 flex flex-col items-center">
                                            <label htmlFor="duration" className="block text-sm font-medium mb-2">Duración (horas):</label>
                                            <input
                                                id="duration"
                                                type="number"
                                                min="1"
                                                max="8"
                                                value={duration}
                                                onChange={(e) => {
                                                    const newDuration = parseInt(e.target.value, 10);
                                                    if (!isNaN(newDuration) && newDuration >= 1 && newDuration <= 8) {
                                                        setDuration(newDuration);
                                                        setSettings({ lastBookingDuration: newDuration });
                                                    }
                                                }}
                                                className="w-14 h-10 bg-gray-700 border border-gray-600 rounded-md text-white text-2xl text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-4">
                                            <button onClick={handleCancelBooking} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition" disabled={isCreating}>Cancelar</button>
                                            <button onClick={confirmBooking} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition w-32" disabled={isCreating}>
                                                {isCreating ? 'Reservando...' : 'Confirmar'}
                                            </button>
                                        </div>
                                    </div>
                                </CSSTransition>
                            ) : (
                                <CSSTransition
                                    key="success"
                                    nodeRef={successRef}
                                    timeout={300}
                                    classNames="fade"
                                >
                                    <div ref={successRef} className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center">
                                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-4">
                                            <svg className="h-10 w-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">¡Reserva Confirmada!</h2>
                                        <p className="text-gray-300">La agenda ha sido actualizada.</p>
                                    </div>
                                </CSSTransition>
                            )}
                        </TransitionGroup>
                    </div>
                </div>
            )}

            {/* View Booking Modal */}
            {viewingBooking && (() => {
                const bookingUser = getUserFromBooking(viewingBooking);
                const sala = salas.find(s => s.id === viewingBooking.roomId);
                const bookingDateTimeEnd = new Date(`${viewingBooking.date}T${String(viewingBooking.startTime + viewingBooking.duration).padStart(2, '0')}:00:00`);
                const canDelete = (currentUser?.id === viewingBooking.userId || currentUser?.role === 'Administrador') && (bookingDateTimeEnd > new Date());

                return (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                        <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white w-full max-w-md">
                            <h2 className="text-xl font-bold mb-6">Detalle de la Reserva</h2>
                            {bookingUser ? (
                                <>
                                    <p className="mb-2"><strong>Usuario:</strong> {formatUserText(bookingUser.lastName)}, {formatUserText(bookingUser.firstName)}</p>
                                    <p className="mb-2"><strong>Sector:</strong> {formatUserText(bookingUser.sector) || 'N/A'}</p>
                                    <p className="mb-2"><strong>Email:</strong> {bookingUser.email}</p>
                                    <p className="mb-4"><strong>Celular:</strong> {bookingUser.phone || 'N/A'}</p>
                                </>
                            ) : <p className="mb-4 text-red-400">Usuario no encontrado</p>}
                            <p className="mb-2"><strong>Sala:</strong> {sala?.name || 'N/A'}</p>
                            <p className="mb-2"><strong>Fecha:</strong> {new Date(viewingBooking.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="mb-6"><strong>Horario:</strong> {viewingBooking.startTime}:00 - {viewingBooking.startTime + viewingBooking.duration}:00</p>
                            <div className="flex justify-between items-center">
                                <button onClick={() => setViewingBooking(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition">Cerrar</button>
                                {canDelete && (
                                    <button onClick={() => handleDeleteBooking(viewingBooking.id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition w-32" disabled={isDeleting}>
                                        {isDeleting ? 'Eliminando...' : 'Eliminar Reserva'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default AgendaPage;