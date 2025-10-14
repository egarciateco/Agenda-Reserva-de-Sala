import { useState, useMemo, FC, ChangeEvent } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Booking } from '../../types';
import { formatUserText, formatDateForInput } from '../../utils/helpers';
import { TIME_SLOTS } from '../../constants';

const BookingsManager: FC = () => {
    const { bookings, users, sectors, salas, updateBooking, deleteBooking, showConfirmation } = useAppContext();
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterSector, setFilterSector] = useState('');
    const [filterSala, setFilterSala] = useState('');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userMap = useMemo(() => new Map(users.map(user => [user.id, user])), [users]);

    const filteredAndSortedBookings = useMemo(() => {
        const lowercasedQuery = searchQuery.toLowerCase();

        return bookings
            .filter(booking => {
                const bookingDate = new Date(booking.date + 'T00:00:00');
                const user = userMap.get(booking.userId);

                if (lowercasedQuery && user) {
                    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
                    const email = user.email.toLowerCase();
                    if (!fullName.includes(lowercasedQuery) && !email.includes(lowercasedQuery)) {
                        return false;
                    }
                }

                if (filterUser && booking.userId !== filterUser) return false;
                if (filterSector && user?.sector !== filterSector) return false;
                if (filterSala && booking.roomId !== filterSala) return false;
                if (filterStartDate && bookingDate < new Date(filterStartDate + 'T00:00:00')) return false;
                if (filterEndDate && bookingDate > new Date(filterEndDate + 'T23:59:59')) return false;
                
                return true;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [bookings, userMap, searchQuery, filterUser, filterSector, filterSala, filterStartDate, filterEndDate]);

    const handleResetFilters = () => {
        setSearchQuery('');
        setFilterUser('');
        setFilterSector('');
        setFilterSala('');
        setFilterStartDate('');
        setFilterEndDate('');
    };

    const handleSaveEdit = async () => {
        if (editingBooking) {
            setIsSaving(true);
            try {
                await updateBooking(editingBooking);
                setEditingBooking(null);
            } catch (error) {
                // Error toast is shown by context
            } finally {
                setIsSaving(false);
            }
        }
    };
    
    const handleDelete = (booking: Booking) => {
        const user = userMap.get(booking.userId);
        const userName = user ? `${formatUserText(user.lastName)}, ${formatUserText(user.firstName)}` : 'Usuario Desconocido';
        const bookingDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
        const message = `¿Seguro que quieres eliminar la reserva de ${userName} para el ${bookingDate} a las ${booking.startTime}:00? Esta acción es irreversible.`;

        showConfirmation(message, async () => {
            setDeletingId(booking.id);
            try {
                await deleteBooking(booking.id);
            } catch (error) {
                // Error toast is shown by context
            } finally {
                setDeletingId(null);
            }
        });
    };

    const handleEditChange = (e: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
        if (!editingBooking) return;
        const { name, value } = e.target;
        setEditingBooking({ 
            ...editingBooking, 
            [name]: (name === 'startTime' || name === 'duration') 
                ? parseInt(value, 10) 
                : value
        });
    };
    
    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-white">Historial y Gestión de Reservas</h2>
            
            <div className="bg-gray-800 p-4 rounded-lg mb-6 space-y-4 text-xs">
                <div>
                    <label className="block text-gray-300 mb-1 font-semibold">Buscar por Nombre/Email</label>
                    <input 
                        type="text" 
                        placeholder="Escriba para buscar..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="filter-input-style"
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-gray-300 mb-1">Usuario</label>
                        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="filter-input-style">
                            <option value="">Todos</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>{`${user.lastName}, ${user.firstName}`}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                         <label className="block text-gray-300 mb-1">Sector</label>
                         <select value={filterSector} onChange={e => setFilterSector(e.target.value)} className="filter-input-style">
                            <option value="">Todos</option>
                            {sectors.map(sector => (
                                <option key={sector.id} value={sector.name}>{sector.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                         <label className="block text-gray-300 mb-1">Sala</label>
                         <select value={filterSala} onChange={e => setFilterSala(e.target.value)} className="filter-input-style">
                            <option value="">Todas</option>
                            {salas.map(sala => (
                                <option key={sala.id} value={sala.id}>{sala.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-1">Desde</label>
                        <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="filter-input-style"/>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-1">Hasta</label>
                        <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="filter-input-style"/>
                    </div>
                     <div>
                        <label className="block text-gray-300 mb-1 invisible">Acción</label> {/* Invisible label for alignment */}
                        <button onClick={handleResetFilters} className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition h-[38px]">
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-white text-xs">
                    <thead>
                        <tr className="bg-black">
                            <th className="p-2">Fecha</th>
                            <th className="p-2">Horario</th>
                            <th className="p-2">Sala</th>
                            <th className="p-2">Usuario</th>
                            <th className="p-2">Sector</th>
                            <th className="p-2 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedBookings.map(booking => {
                            const user = users.find(u => u.id === booking.userId);
                            const sala = salas.find(s => s.id === booking.roomId);
                            const date = new Date(booking.date + 'T00:00:00');
                            const isPast = date < today;

                            return (
                                <tr key={booking.id} className="border-b border-gray-700 hover:bg-gray-800">
                                    <td className="p-2">{date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                                    <td className="p-2">{`${booking.startTime}:00 - ${booking.startTime + booking.duration}:00`}</td>
                                    <td className="p-2">{sala ? sala.name : 'N/A'}</td>
                                    <td className="p-2">{user ? `${formatUserText(user.lastName)}, ${formatUserText(user.firstName)}` : 'Usuario no encontrado'}</td>
                                    <td className="p-2">{user ? formatUserText(user.sector) : 'N/A'}</td>
                                    <td className="p-2 text-center space-x-2">
                                        {isPast ? (
                                            <span className="text-gray-400">No editable</span>
                                        ) : (
                                            <>
                                                <button onClick={() => setEditingBooking(booking)} className="text-yellow-400 hover:text-yellow-300" disabled={!!deletingId || isSaving}>Editar</button>
                                                <button 
                                                    onClick={() => handleDelete(booking)} 
                                                    className="text-red-400 hover:text-red-300 w-20 text-center"
                                                    disabled={deletingId === booking.id}
                                                >
                                                   {deletingId === booking.id ? 'Eliminando...' : 'Eliminar'}
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                 {filteredAndSortedBookings.length === 0 && (
                    <div className="text-center py-8 bg-gray-800 rounded-b-lg">
                        <p className="text-gray-400">No se encontraron reservas que coincidan con los filtros.</p>
                    </div>
                )}
            </div>

            {/* Edit Booking Modal */}
            {editingBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-6">Editar Reserva</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Sala</label>
                                <select name="roomId" value={editingBooking.roomId} onChange={handleEditChange} className="input-style">
                                    {salas.map(sala => <option key={sala.id} value={sala.id}>{sala.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Fecha</label>
                                <input type="date" name="date" value={formatDateForInput(new Date(editingBooking.date + 'T00:00:00'))} onChange={handleEditChange} className="input-style" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Hora de Inicio</label>
                                <select name="startTime" value={editingBooking.startTime} onChange={handleEditChange} className="input-style">
                                    {TIME_SLOTS.map(time => <option key={time} value={time}>{`${time}:00`}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">Duración (hs)</label>
                                <input type="number" name="duration" value={editingBooking.duration} min="1" max="8" onChange={handleEditChange} className="input-style" />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-4 mt-8">
                            <button onClick={() => setEditingBooking(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition" disabled={isSaving}>Cancelar</button>
                            <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition w-36" disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .input-style { background-color: #374151; border: 1px solid #4B5563; border-radius: 0.375rem; padding: 0.5rem 0.75rem; color: white; width: 100%; }
                .filter-input-style { background-color: #4B5563; border: 1px solid #6B7280; border-radius: 0.375rem; padding: 0.5rem; color: white; width: 100%; height: 38px; }
            `}</style>
        </div>
    );
};

export default BookingsManager;