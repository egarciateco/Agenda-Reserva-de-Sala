import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';

const HomePage: FC = () => {
    const { logoUrl, homeBackgroundImageUrl } = useAppContext();
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

                    <button
                        onClick={handleEnter}
                        className="w-full px-6 py-3 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                    >
                        Ingresar
                    </button>
                </div>
            </main>

            <footer className="absolute bottom-4 left-4 text-xs text-left text-gray-300 z-10">
                <div>
                    <p className="font-bold">Realizado por:</p>
                    <p>Esteban García. - Para uso exclusivo de Telecom Argentina S.A.</p>
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