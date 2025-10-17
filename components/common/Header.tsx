import { FC, useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppContext } from '../../hooks/useAppContext';
import { formatUserText } from '../../utils/helpers';

const Header: FC = () => {
    const { user, logoUrl, logout, showConfirmation, openQrModal } = useAppContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    const isAdmin = user?.role === 'Administrador';
    const onAdminPage = location.pathname.startsWith('/admin');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        showConfirmation('¿Estás seguro de que quieres cerrar la sesión?', () => {
            logout();
        });
    };

    if (!user) return null;

    return (
        <header className="bg-gray-900 bg-opacity-80 backdrop-blur-md shadow-md p-4 flex justify-between items-center text-white sticky top-0 z-50">
            <Link to="/agenda">
                <img src={logoUrl} alt="TELECOM Logo" className="h-10 object-contain" />
            </Link>

            <div className="flex items-center gap-4">
                <button
                    onClick={openQrModal}
                    className="p-2 rounded-full hover:bg-gray-700 transition-colors"
                    title="Compartir Aplicación"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                </button>
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded-md transition-colors"
                    >
                        <div className="text-right">
                            <p className="font-bold text-sm leading-tight">{formatUserText(user.firstName)} {formatUserText(user.lastName)}</p>
                            <p className="text-xs text-gray-400 leading-tight">{formatUserText(user.role)}</p>
                        </div>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20 animate-fade-in-down">
                            <div className="p-2 border-b border-gray-700">
                                <p className="text-xs text-gray-400 truncate">{user.email}</p>
                            </div>
                            {isAdmin && !onAdminPage && (
                                <Link to="/admin" className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700">Administración</Link>
                            )}
                            {isAdmin && onAdminPage && (
                                <Link to="/agenda" className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-700">Volver a Agenda</Link>
                            )}
                            <Link to="/logout" onClick={(e) => { e.preventDefault(); handleLogout(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
                                Cerrar Sesión
                            </Link>
                        </div>
                    )}
                </div>
            </div>
             <style>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.2s ease-out forwards;
                }
            `}</style>
        </header>
    );
};

export default Header;
