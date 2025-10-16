import { FC } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';

const HomePage: FC = () => {
    const { logoUrl, homeBackgroundImageUrl, isPwaInstallable, triggerPwaInstall } = useAppContext();
    const navigate = useNavigate();

    const handleEnter = () => {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            // La solicitud de pantalla completa debe ser manejada en un evento de usuario.
            // Los errores son esperados si el usuario deniega el permiso, por lo que los registramos de forma segura.
            elem.requestFullscreen().catch(err => {
                console.error(`Error al intentar activar el modo de pantalla completa: ${String(err)}`);
            });
        }
        // Navegar a la página de inicio de sesión después del clic.
        navigate('/login');
    };

    return (
        <div 
            className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center"
            style={{ backgroundImage: `url(${homeBackgroundImageUrl})` }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-60"></div>
            
            <main className="relative z-10 w-full max-w-md text-center animate-fade-in-scale">
                <div className="bg-gray-900 bg-opacity-80 p-10 rounded-xl shadow-2xl backdrop-blur-md">
                    
                    <img 
                        src={logoUrl} 
                        alt="TELECOM Logo" 
                        className="h-20 object-contain mx-auto mb-6"
                    />
                    
                    <h1 className="text-5xl font-bold text-white mb-4 flex items-baseline justify-center gap-x-1">
                        <span>Bienvenid</span>
                        <span className="text-blue-400">@</span>
                    </h1>
                    
                    <p className="text-lg text-gray-300 mb-8">Gestión de Salas de Reuniones</p>

                    <div className="space-y-4">
                        <button
                            onClick={handleEnter}
                            className="w-full px-6 py-3 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                        >
                            Ingresar
                        </button>
                         {isPwaInstallable && (
                            <button
                                onClick={triggerPwaInstall}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-md font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Instalar Aplicación
                            </button>
                        )}
                    </div>
                </div>
            </main>

            <footer className="absolute bottom-4 left-4 text-xs text-left text-gray-300 z-10">
                <div>
                    <p className="font-bold">Realizado por:</p>
                    <p>Esteban García. - Para uso exclusivo de Telecom Argentina S.A.</p>
                </div>
                <div className="mt-2">
                    <Link to="/privacy-policy" className="text-gray-400 hover:text-white underline transition-colors">
                        Política de Privacidad
                    </Link>
                </div>
            </footer>
            <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 1.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default HomePage;