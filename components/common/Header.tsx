import { FC } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../hooks/useAppContext';
import { DEFAULT_SHAREABLE_URL } from '../../constants';

const Header: FC = () => {
    const { currentUser, logoUrl, addToast, isPwaInstallable, isStandalone, pwaInstalledOnce, triggerPwaInstall } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const handleShare = async () => {
        const shareData = {
            title: 'Reserva de Sala - TELECOM',
            text: 'Aplicación para la reserva de salas de reuniones en Telecom.',
            url: DEFAULT_SHAREABLE_URL,
        };
    
        // Use the modern Web Share API if available (common on mobile)
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                // The browser's share dialog provides user feedback, so a toast is not necessary.
            } catch (err) {
                const errorString = String(err);
                // Don't show an error if the user simply closed the share dialog.
                if (!errorString.includes('AbortError')) {
                    console.error('Error con la API de Web Share:', err);
                    addToast('Ocurrió un error al intentar compartir.', 'error');
                }
            }
        } else {
            // Fallback to copying to the clipboard for desktop browsers
            try {
                await navigator.clipboard.writeText(DEFAULT_SHAREABLE_URL);
                addToast('¡Enlace de la aplicación copiado al portapapeles!', 'success');
            } catch (err) {
                console.error('Error al copiar el enlace al portapapeles:', err);
                addToast('No se pudo copiar el enlace. Verifique los permisos del navegador.', 'error');
            }
        }
    };

    const isAdminPage = location.pathname.startsWith('/admin');
    const showInstallButton = isPwaInstallable && !isStandalone;
    const showInstalledBadge = isStandalone || (pwaInstalledOnce && !isPwaInstallable);


    return (
        <header className="bg-gray-900 bg-opacity-70 text-white p-4 shadow-md flex justify-between items-center z-20 relative">
            <Link to="/agenda">
                <img src={logoUrl} alt="TELECOM Logo" className="h-10 object-contain" />
            </Link>
            {currentUser && (
                <div className="flex items-center gap-1 md:gap-3">
                    {currentUser.role === 'Administrador' && !isAdminPage && (
                        <Link to="/admin" className="header-button bg-purple-600 hover:bg-purple-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0012 11z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden md:inline">Panel Admin</span>
                        </Link>
                    )}
                    
                    {showInstallButton && (
                        <button onClick={triggerPwaInstall} className="header-button bg-blue-600 hover:bg-blue-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="hidden md:inline">Instalar App</span>
                        </button>
                    )}
                    
                    {showInstalledBadge && (
                         <div className="header-button bg-green-600 cursor-default">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="hidden md:inline">App Instalada</span>
                        </div>
                    )}

                    <button onClick={handleShare} className="header-button bg-indigo-600 hover:bg-indigo-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                           <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                        </svg>
                        <span className="hidden md:inline">Compartir</span>
                    </button>

                    <button onClick={() => navigate('/logout')} className="header-button bg-red-600 hover:bg-red-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="hidden md:inline">Salir</span>
                    </button>
                </div>
            )}
            <style>{`.header-button { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; border-radius: 0.375rem; font-size: 0.875rem; font-weight: 500; transition: background-color 0.2s; } @media (min-width: 768px) { .header-button { padding: 0.5rem 1rem; } }`}</style>
        </header>
    );
};

export default Header;