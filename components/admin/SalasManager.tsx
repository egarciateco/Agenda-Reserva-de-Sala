import { useState, FC, FormEvent } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Sala } from '../../types';

const SalasManager: FC = () => {
    const { salas, addSala, updateSala, deleteSala, addToast, showConfirmation } = useAppContext();
    const [newSalaName, setNewSalaName] = useState('');
    const [newSalaAddress, setNewSalaAddress] = useState('');
    const [editingSala, setEditingSala] = useState<Sala | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!newSalaName.trim()) {
            addToast('El nombre de la sala no puede estar vacío.', 'error');
            return;
        }

        setIsAdding(true);
        try {
            await addSala(newSalaName.trim(), newSalaAddress.trim());
            setNewSalaName('');
            setNewSalaAddress('');
        } catch (error) {
            // Error toast is shown by context
        } finally {
            setIsAdding(false);
        }
    };

    const handleSaveEdit = async () => {
        if (editingSala && editingSala.name.trim()) {
            setIsSaving(editingSala.id);
            try {
                await updateSala(editingSala);
                setEditingSala(null);
            } catch (error) {
                // Error toast is shown by context
            } finally {
                setIsSaving(null);
            }
        }
    };
    
    const handleDelete = (sala: Sala) => {
        showConfirmation(`¿Estás seguro de que quieres eliminar la sala "${sala.name}"? Todas las reservas asociadas a esta sala también serán eliminadas.`, async () => {
            setDeletingId(sala.id);
            try {
                await deleteSala(sala.id);
            } catch (error) {
                // Error toast is shown by context
            } finally {
                setDeletingId(null);
            }
        });
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-white">Gestionar Salas</h2>
            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-6 items-end">
                <div className="flex-grow w-full">
                    <label className="text-xs text-gray-300">Nombre de la Sala</label>
                    <input
                        type="text"
                        value={newSalaName}
                        onChange={(e) => setNewSalaName(e.target.value)}
                        placeholder="Ej: Sala de reuniones 1"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={isAdding}
                    />
                </div>
                 <div className="flex-grow w-full">
                     <label className="text-xs text-gray-300">Domicilio del Edificio</label>
                    <input
                        type="text"
                        value={newSalaAddress}
                        onChange={(e) => setNewSalaAddress(e.target.value)}
                        placeholder="Ej: Av. Corrientes 246"
                        className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        disabled={isAdding}
                    />
                </div>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition w-full md:w-36" disabled={isAdding}>
                    {isAdding ? 'Guardando...' : 'Guardar Sala'}
                </button>
            </form>
            <ul className="space-y-2">
                {salas.map(sala => (
                    <li key={sala.id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gray-800 p-3 rounded-md gap-2">
                        {editingSala?.id === sala.id ? (
                            <div className="flex-grow space-y-2">
                                <input
                                    type="text"
                                    value={editingSala.name}
                                    autoFocus
                                    onChange={(e) => setEditingSala({...editingSala, name: e.target.value})}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white"
                                />
                                <input
                                    type="text"
                                    value={editingSala.address || ''}
                                    onChange={(e) => setEditingSala({...editingSala, address: e.target.value})}
                                    placeholder="Domicilio"
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white"
                                />
                            </div>
                        ) : (
                            <div className="flex-grow">
                                <span className="text-cyan-400 font-semibold">{sala.name}</span>
                                <span className="block text-xs text-gray-400 mt-1">{sala.address}</span>
                            </div>
                        )}
                        <div className="flex gap-2 items-center self-end md:self-center">
                            {editingSala?.id === sala.id ? (
                                <>
                                <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300 w-20 text-center" disabled={isSaving === sala.id}>
                                    {isSaving === sala.id ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button onClick={() => setEditingSala(null)} className="text-gray-400 hover:text-white" disabled={isSaving === sala.id}>Cancelar</button>
                                </>
                            ) : (
                                <button onClick={() => setEditingSala({...sala})} className="text-yellow-400 hover:text-yellow-300" disabled={!!deletingId}>Editar</button>
                            )}
                            <button 
                                onClick={() => handleDelete(sala)} 
                                className="text-red-400 hover:text-red-300 w-20 text-center"
                                disabled={deletingId === sala.id}
                            >
                                {deletingId === sala.id ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
             {salas.length === 0 && (
                <div className="text-center py-8 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">No hay salas creadas. Agregue una para empezar a gestionar reservas.</p>
                </div>
            )}
        </div>
    );
};

export default SalasManager;