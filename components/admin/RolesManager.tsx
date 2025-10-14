import { useState, FC } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { Role } from '../../types';

const RolesManager: FC = () => {
    const { roles, addRole, updateRole, deleteRole, showConfirmation } = useAppContext();
    const [newRoleName, setNewRoleName] = useState('');
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<string | null>(null);
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        if (newRoleName.trim()) {
            setIsAdding(true);
            try {
                await addRole(newRoleName.trim());
                setNewRoleName('');
            } catch (error) {
                // Error toast is shown by context
            } finally {
                setIsAdding(false);
            }
        }
    };
    
    const handleSaveEdit = async () => {
        if (editingRole && editingRole.name.trim()) {
            setIsSaving(editingRole.id);
            try {
                await updateRole(editingRole);
                setEditingRole(null);
            } catch (error) {
                // Error toast is shown by context
            } finally {
                setIsSaving(null);
            }
        }
    };

    const handleDelete = (role: Role) => {
        showConfirmation(`¿Estás seguro de que quieres eliminar el rol "${role.name}"?`, async () => {
            setDeletingId(role.id);
            try {
                await deleteRole(role.id);
            } catch (error) {
                // Error toast is shown by context
            } finally {
                setDeletingId(null);
            }
        });
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-white">Gestionar Roles</h2>
            <div className="flex gap-4 mb-6">
                <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="Nuevo rol"
                    className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    disabled={isAdding}
                />
                <button onClick={handleAdd} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition w-28" disabled={isAdding}>
                    {isAdding ? 'Agregando...' : 'Agregar'}
                </button>
            </div>
            <ul className="space-y-2">
                {roles.map(role => (
                    <li key={role.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-md">
                        {editingRole?.id === role.id ? (
                            <input
                                type="text"
                                value={editingRole.name}
                                autoFocus
                                onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
                                className="bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white"
                            />
                        ) : (
                            <span className="text-white">{role.name}</span>
                        )}
                        <div className="flex gap-2 items-center">
                            {editingRole?.id === role.id ? (
                                <>
                                <button onClick={handleSaveEdit} className="text-green-400 hover:text-green-300 w-20 text-center" disabled={isSaving === role.id}>
                                    {isSaving === role.id ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button onClick={() => setEditingRole(null)} className="text-gray-400 hover:text-white" disabled={isSaving === role.id}>Cancelar</button>
                                </>
                            ) : (
                                <button onClick={() => setEditingRole({...role})} className="text-yellow-400 hover:text-yellow-300" disabled={!!deletingId}>Editar</button>
                            )}
                            <button 
                                onClick={() => handleDelete(role)} 
                                className="text-red-400 hover:text-red-300 w-20 text-center"
                                disabled={deletingId === role.id}
                            >
                                {deletingId === role.id ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RolesManager;