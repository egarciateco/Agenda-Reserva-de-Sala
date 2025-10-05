import { useState, FC } from 'react';
import { useAppContext } from '../../hooks/useAppContext';

const InstallPWAButton: FC = () => {
    const { logoUrl, isPwaInstallable, triggerPwaInstall, pwaInstalledOnce } = useAppContext();
    const [wasDismissed, setWasDismissed] = useState(false);

    const handleInstallClick = () => {
        triggerPwaInstall();
        setWasDismissed(true);
    };
    
    const handleDismiss = () => {
        setWasDismissed(true);
    }

    if (!isPwaInstallable || wasDismissed) {
        return null;
    }

    const isReinstall = pwaInstalledOnce;
    const modalTitle = isReinstall ? 'Reinstalar Aplicación' : 'Instalar Aplicación';
    const modalText = isReinstall
        ? 'Vuelve a añadir la app a tu pantalla de inicio para un acceso rápido.'
        : 'Añade la app a tu pantalla de inicio para un acceso rápido y directo.';
    const buttonText = isReinstall ? 'Reinstalar' : 'Instalar';
    const buttonClass = isReinstall ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700';


    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000] p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white w-full max-w-sm text-center transform transition-all animate-fade-in-scale">
                <img src={logoUrl} alt="App Icon" className="h-20 w-20 rounded-2xl bg-white p-2 mx-auto mb-6" />
                <h3 className="text-xl font-bold mb-2">{modalTitle}</h3>
                <p className="text-gray-300 mb-6">{modalText}</p>
                <div className="flex flex-col space-y-3">
                     <button
                        onClick={handleInstallClick}
                        className={`w-full px-4 py-3 text-sm font-bold text-white rounded-lg transition-colors ${buttonClass}`}
                    >
                        {buttonText}
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="w-full px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Ahora no
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default InstallPWAButton;