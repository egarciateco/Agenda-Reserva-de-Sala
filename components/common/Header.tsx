
import { FC, useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAppContext } from '../../hooks/useAppContext';
import { formatUserText } from '../../utils/helpers';

const Header: FC = () => {
    const { user, logoUrl, logout, openQrModal, openManualInstallModal, isPwaInstallable } = useAppContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!user) return null;

    const isAdmin = user.role === 'Administrador';

    return (
        <header className="bg-black bg-opacity-80 backdrop-blur-sm shadow-lg text-white p-4 flex justify-between items-center z-50">
            <Link to="/agenda">
                <img src={logoUrl} alt="TELECOM Logo" className="h-10 object-contain" />
            </Link>
            
            <div className="flex items-center gap-4">
                <nav className="hidden md:flex items-center gap-6">
                    <NavLink to="/agenda" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}>Agenda</NavLink>
                    {isAdmin && <NavLink to="/admin" className={({ isActive }) => `text-sm font-medium ${isActive ? 'text-blue-400' : 'text-gray-300 hover:text-white'}`}>Admin</NavLink>}
                </nav>

                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 p-2 rounded-full transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
                            {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
                        </div>
                        <span className="hidden lg:inline text-sm font-semibold">{formatUserText(user.firstName)} {formatUserText(user.lastName)}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 hidden lg:inline" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-md shadow-lg py-1 z-50 animate-fade-in-down">
                             <div className="px-4 py-2 border-b border-gray-700">
                                <p className="text-sm font-bold truncate">{formatUserText(user.firstName)} {formatUserText(user.lastName)}</p>
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                            <div className="md:hidden">
                                <Link to="/agenda" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Agenda</Link>
                                {isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Admin</Link>}
                                <div className="border-t border-gray-700 my-1"></div>
                            </div>
                            <button onClick={() => { openQrModal(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Compartir App</button>
                            {!isPwaInstallable && (
                                <button onClick={() => { openManualInstallModal(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">Instalar App</button>
                            )}
                            <div className="border-t border-gray-700 my-1"></div>
                            <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800">Cerrar Sesión</button>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down { animation: fade-in-down 0.2s ease-out forwards; }
            `}</style>
        </header>
    );
};

export default Header;
