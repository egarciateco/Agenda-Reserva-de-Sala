import { useState, FC } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Sector } from '../../types';

const SectorsManager: FC = () => {
    const { sectors, addSector, updateSector, deleteSector, addToast, showConfirmation } = useAppContext();
    const [newSectorName, setNewSectorName] = useState('');
    const [editingSector, setEditingSector] = useState<Sector | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (newSectorName.trim()) {
            setIsAdding(true);
            try {
                await addSector(newSectorName.trim());
                setNewSectorName('');
            } catch (error) {
                console.error("Failed to add sector", error);
                addToast('Error al añadir el sector.', 'error');
            } finally {
                setIsAdding(false);
            }
        }
    };

    const handleSaveEdit = async () => {
        if (editingSector && editingSector.name.trim()) {
            setIsSaving(editingSector.id);
            try {
                await updateSector(editingSector);
                setEditingSector(null);
            } catch (error) {
                console.error("Failed to update sector", error);
                addToast('Error al actualizar el sector.', 'error');
            } finally {
                setIsSaving(null);
            }
        }
    };
    
    const handleDelete = (sector: Sector) => {
        showConfirmation(`¿Estás seguro de que quieres eliminar el sector "${sector.name}"?`, async () => {
            setDeletingId(sector.id);
            try {
                await deleteSector(sector.id);
            } catch (error) {
                console.error("Failed to delete sector", error);
                addToast('Error al eliminar el sector.', 'error');
            } finally {
                setDeletingId(null);
            }
        });
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-white">Gestionar Sectores</h2>
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    value={newSectorName}
                    onChange={(e) => setNewSectorName(e.target.value)}
                    placeholder="Nuevo sector"
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={isAdding}
                />
                <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition w-28" disabled={isAdding}>
                    {isAdding ? 'Agregando...' : 'Agregar'}
                </button>
            </div>
            <ul className="space-y-2">
                {sectors.map(sector => (
                    <li key={sector.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                        {editingSector?.id === sector.id ? (
                            <input
                                type="text"
                                value={editingSector.name}
                                autoFocus
                                onChange={(e) => setEditingSector({...editingSector, name: e.target.value})}
                                className="bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white"
                            />
                        ) : (
                            <span className="text-yellow-400">{sector.name}</span>
                        )}
                        <div className="flex gap-2 items-center">
                            {editingSector?.id === sector.id ? (
                                <>
                                <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300 w-20 text-center" disabled={isSaving === sector.id}>
                                    {isSaving === sector.id ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button onClick={() => setEditingSector(null)} className="text-gray-400 hover:text-white" disabled={isSaving === sector.id}>Cancelar</button>
                                </>
                            ) : (
                                <button onClick={() => setEditingSector({...sector})} className="text-yellow-400 hover:text-yellow-300" disabled={!!deletingId}>Editar</button>
                            )}
                            <button 
                                onClick={() => handleDelete(sector)} 
                                className="text-red-400 hover:text-red-300 w-20 text-center"
                                disabled={deletingId === sector.id}
                            >
                                {deletingId === sector.id ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default SectorsManager;