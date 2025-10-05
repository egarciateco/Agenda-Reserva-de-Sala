import { useState, useRef, useEffect, FC, ChangeEvent, MouseEvent } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { formatUserText } from '../../utils/helpers';
import { User } from '../../types';

const UsersManager: FC = () => {
    const { users, sectors, roles, updateUser, deleteUser, addToast, showConfirmation } = useAppContext();
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showMenu, setShowMenu] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: globalThis.MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleEditChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!editingUser) return;
        const { name, value } = e.target;
        setEditingUser(prev => {
           if(!prev) return null;
           const newState = { ...prev, [name]: value };
            if (name === 'role' && value === 'Administrador') {
                newState.sector = ''; 
            }
            return newState;
        });
    };
    
    const handleSaveEdit = async () => {
        if (editingUser) {
            setIsSaving(true);
            try {
                await updateUser(editingUser);
                setEditingUser(null);
            } catch (error) {
                 console.error("Failed to update user", error);
                 addToast('Error al actualizar el usuario.', 'error');
            } finally {
                setIsSaving(false);
            }
        }
    };
    
    const handleDelete = (user: User) => {
        showConfirmation(`¿Seguro que quieres eliminar a ${user.firstName} ${user.lastName}?`, async () => {
            setDeletingId(user.id);
            setShowMenu(null);
            try {
                await deleteUser(user.id);
            } catch (error) {
                console.error("Failed to delete user", error);
                addToast('Error al eliminar el usuario.', 'error');
            } finally {
                setDeletingId(null);
            }
        });
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-white">Gestionar Usuarios</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-white text-xs">
                    <thead>
                        <tr className="bg-black">
                            <th className="p-2">Apellido</th>
                            <th className="p-2">Nombre</th>
                            <th className="p-2">Celular</th>
                            <th className="p-2">Email</th>
                            <th className="p-2">Sector</th>
                            <th className="p-2">Rol</th>
                            <th className="p-2 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-800">
                                <td className="p-2">{formatUserText(user.lastName)}</td>
                                <td className="p-2">{formatUserText(user.firstName)}</td>
                                <td className="p-2">{user.phone}</td>
                                <td className="p-2">{user.email.toLowerCase()}</td>
                                <td className="p-2">{formatUserText(user.sector)}</td>
                                <td className="p-2">{formatUserText(user.role)}</td>
                                <td className="p-2 text-center">
                                    <div className="relative inline-block" ref={showMenu === user.id ? menuRef : null}>
                                        <button onClick={() => setShowMenu(showMenu === user.id ? null : user.id)} className="font-bold text-lg leading-none p-1 -mt-1" disabled={!!deletingId || isSaving}>...</button>
                                        {showMenu === user.id && (
                                            <div className="absolute right-0 z-10 mt-1 w-32 bg-gray-900 border border-gray-600 rounded-md shadow-lg">
                                                <button onClick={() => { setEditingUser(user); setShowMenu(null); }} className="block w-full text-left px-4 py-2 text-xs text-yellow-400 hover:bg-gray-700">Editar</button>
                                                <button 
                                                    onClick={() => handleDelete(user)} 
                                                    className="block w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-gray-700"
                                                    disabled={deletingId === user.id}
                                                >
                                                    {deletingId === user.id ? 'Eliminando...' : 'Eliminar'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-6">Editar Usuario</h2>
                        <div className="grid grid-cols-2 gap-4">
                             <input name="lastName" value={editingUser.lastName} onChange={handleEditChange} placeholder="Apellido" className="input-style"/>
                             <input name="firstName" value={editingUser.firstName} onChange={handleEditChange} placeholder="Nombre" className="input-style"/>
                             <input name="phone" value={editingUser.phone} onChange={handleEditChange} placeholder="Celular" className="input-style"/>
                             <select name="sector" value={editingUser.sector} onChange={handleEditChange} className="input-style" disabled={editingUser.role === 'Administrador'}>
                                {editingUser.role === 'Administrador' ? <option>N/A</option> : sectors.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                             </select>
                             <select name="role" value={editingUser.role} onChange={handleEditChange} className="col-span-2 input-style">
                                {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                             </select>
                        </div>
                        <div className="flex justify-end space-x-4 mt-8">
                            <button onClick={() => setEditingUser(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition" disabled={isSaving}>Cancelar</button>
                            <button onClick={handleSaveEdit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition w-36" disabled={isSaving}>
                                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <style>{`.input-style { background-color: #374151; border: 1px solid #4B5563; border-radius: 0.375rem; padding: 0.5rem 0.75rem; color: white; width: 100%; }`}</style>
        </div>
    );
};

export default UsersManager;