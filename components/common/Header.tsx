import { FC } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../hooks/useAppContext';
import { formatUserText } from '../../utils/helpers';
import { DEFAULT_SHAREABLE_URL } from '../../constants';

const Header: FC = () => {
    const { currentUser, logoUrl, addToast } = useAppContext();
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate('/logout');
    };

    const handleShare = async () => {
        const title = 'Reserva de Sala - TELECOM';
        const text = 'Gestiona y reserva salas de reuniones de forma eficiente.';
        
        const urlToShare = DEFAULT_SHAREABLE_URL;

        const shareData: ShareData = { title, text, url: urlToShare };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.url);
                addToast('¡Enlace de la aplicación copiado!', 'success');
            }
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                // El usuario canceló la operación de compartir, no hacer nada.
                return;
            }
            console.error('Error al compartir:', err);
            addToast('No se pudo compartir la aplicación.', 'error');
        }
    };

    return (
        <header className="bg-gray-900 bg-opacity-70 text-white p-4 flex justify-between items-center shadow-lg">
            <Link to="/agenda" className="flex items-center space-x-3">
                <img src={logoUrl} alt="TELECOM Logo" className="h-10 object-contain" />
                <span className="text-xl font-bold tracking-wider">Reserva de Sala de Reuniones</span>
            </Link>
            <div className="flex items-center space-x-2 md:space-x-4">
                 {currentUser && (
                    <div className="text-right hidden md:block" style={{ fontSize: '8px', lineHeight: '1.2' }}>
                        <p className="font-semibold">{formatUserText(currentUser.lastName)}, {formatUserText(currentUser.firstName)}</p>
                        <p>{formatUserText(currentUser.role)}</p>
                    </div>
                )}
                {currentUser?.role === 'Administrador' && (
                    <Link to="/admin" className="px-3 md:px-6 py-2 text-xs md:text-base font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                        Panel Admin
                    </Link>
                )}
                <button
                    onClick={handleShare}
                    title="Compartir aplicación"
                    aria-label="Compartir aplicación"
                    className="p-2.5 text-sm rounded-full transition-colors bg-teal-600 hover:bg-teal-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                </button>
                <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-xs bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                    aria-label="Cerrar sesión y volver a la página de inicio"
                >
                    Cerrar Sesión
                </button>
            </div>
        </header>
    );
};

export default Header;