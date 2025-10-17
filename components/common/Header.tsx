import { FC, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../hooks/useAppContext';
import { formatUserText } from '../../utils/helpers';

const Header: FC = () => {
    const { user, logoUrl, siteImageUrl, openQrModal, openManualInstallModal } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        navigate('/logout');
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isAdminPage = location.pathname.startsWith('/admin');

    return (
        <header className="bg-gray-900 bg-opacity-80 text-white p-4 flex justify-between items-center shadow-md backdrop-blur-md">
            <Link to="/agenda" className="flex items-center gap-3">
                <img src={logoUrl} alt="TELECOM Logo" className="h-10 object-contain" />
                <span className="hidden sm:inline font-bold text-lg">Reserva de Salas</span>
            </Link>

            <div className="flex items-center gap-2 sm:gap-4">
                {user && (
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-700 transition-colors"
                        >
                            <div className="hidden md:flex flex-col text-right">
                                <span className="text-sm font-semibold text-white">
                                    {formatUserText(user.firstName)} {formatUserText(user.lastName)}
                                </span>
                                <span className="text-xs text-gray-400">{user.role}</span>
                            </div>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                        {isMenuOpen && (
                             <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 animate-fade-in-fast">
                                <div className="p-4 border-b border-gray-700 flex items-start gap-4">
                                    <img 
                                        src={siteImageUrl} 
                                        alt="Icono de la App" 
                                        className="h-16 w-16 object-contain bg-white p-1 rounded-lg mt-1"
                                     />
                                    <div>
                                        <p className="font-bold text-md">{formatUserText(user.firstName)} {formatUserText(user.lastName)}</p>
                                        <p className="text-sm text-gray-400">{user.email}</p>
                                    </div>
                                </div>
                                <div className="py-2">
                                    {user.role === 'Administrador' && !isAdminPage && (
                                         <Link to="/admin" className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setIsMenuOpen(false)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            Administración
                                         </Link>
                                    )}
                                </div>
                             </div>
                        )}
                    </div>
                )}

                <button onClick={openQrModal} className="p-2 hover:bg-gray-700 rounded-full transition-colors" title="Compartir Aplicación">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                </button>
                
                <button onClick={openManualInstallModal} className="p-2 hover:bg-gray-700 rounded-full transition-colors" title="Instrucciones de Instalación">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                     </svg>
                </button>
                
                <button
                    onClick={handleLogout}
                    className="p-2 hover:bg-red-800 bg-red-600 rounded-full transition-colors"
                    title="Cerrar Sesión"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
            <style>{`
                @keyframes fade-in-fast {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-fast {
                    animation: fade-in-fast 0.2s ease-out forwards;
                }
            `}</style>
        </header>
    );
};

export default Header;