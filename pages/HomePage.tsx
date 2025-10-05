import { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';

const HomePage: FC = () => {
    const { logoUrl, homeBackgroundImageUrl } = useAppContext();
    const navigate = useNavigate();

    const handleAccessWeb = async () => {
        const elem = document.documentElement as any;

        try {
            // Check if we are not already in fullscreen mode using all vendor prefixes
            const isNotFullscreen = !document.fullscreenElement &&
                                    !(document as any).webkitFullscreenElement &&
                                    !(document as any).mozFullScreenElement &&
                                    !(document as any).msFullscreenElement;

            if (isNotFullscreen) {
                // Find the correct request method for the browser
                const requestFullscreen = 
                    elem.requestFullscreen || 
                    elem.webkitRequestFullscreen || 
                    elem.mozRequestFullScreen || 
                    elem.msRequestFullscreen;

                // If a method exists, call it
                if (requestFullscreen) {
                    await requestFullscreen.call(elem);
                }
            }
        } catch (err) {
            // Log any errors but don't block navigation
            console.error(`Error attempting to enable full-screen mode: ${(err as Error).message} (${(err as Error).name})`);
        } finally {
            // Add a small delay to prevent a race condition where navigation
            // interrupts the fullscreen transition on mobile devices.
            setTimeout(() => {
                navigate('/login');
            }, 150);
        }
    };

    return (
        <div 
            className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center"
            style={{ backgroundImage: `url(${homeBackgroundImageUrl})` }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-60"></div>
            
            <main className="relative z-10 w-full max-w-md text-center">
                <div className="bg-gray-900 bg-opacity-80 p-10 rounded-xl shadow-2xl backdrop-blur-md">
                    
                    <img 
                        src={logoUrl} 
                        alt="TELECOM Logo" 
                        className="h-16 object-contain mx-auto mb-6"
                    />
                    
                    <h1 className="text-5xl font-bold text-white mb-4 flex items-baseline justify-center gap-x-1">
                        <span>Bienvenid</span>
                        <span className="text-blue-400">@</span>
                    </h1>
                    
                    <p className="text-lg text-gray-300 mb-8">Gestión de Salas de Reuniones</p>
                    
                    <div className="space-y-4">
                        <button
                            onClick={handleAccessWeb}
                            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span>Acceder a la Web</span>
                        </button>
                    </div>
                </div>
            </main>

            <footer className="absolute bottom-4 left-4 text-xs text-left text-gray-300 z-10">
                <div>
                    <p className="font-bold">Realizado por:</p>
                    <p>Esteban García. - Para uso exclusivo de Telecom Argentina S.A.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;