
import { FC } from 'react';
import { useAppContext } from '../../hooks/useAppContext';

const ManualInstallModal: FC = () => {
    const { isManualInstallModalOpen, closeManualInstallModal } = useAppContext();

    if (!isManualInstallModalOpen) return null;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000] p-4 animate-fade-in"
            onClick={closeManualInstallModal}
        >
            <div 
                className="bg-gray-800 p-8 rounded-lg shadow-xl text-white w-full max-w-md transform transition-all animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <button 
                    onClick={closeManualInstallModal} 
                    className="absolute top-3 right-3 text-gray-400 hover:text-white"
                    aria-label="Cerrar modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h3 className="text-xl font-bold mb-4">Instalar Aplicación</h3>
                <p className="text-gray-300 mb-6">Para un acceso rápido, puedes añadir esta aplicación a tu pantalla de inicio.</p>

                {isIOS && (
                    <div className="text-left space-y-3">
                        <p>1. Toca el botón de <strong>Compartir</strong> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg> en la barra de navegación de Safari.</p>
                        <p>2. Desplázate hacia abajo y selecciona <strong>'Añadir a la pantalla de inicio'</strong>.</p>
                        <p>3. Confirma tocando <strong>'Añadir'</strong>.</p>
                    </div>
                )}

                {isAndroid && (
                     <div className="text-left space-y-3">
                        <p>1. Toca el menú de <strong>tres puntos</strong> <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg> en la esquina superior derecha de Chrome.</p>
                        <p>2. Selecciona <strong>'Instalar aplicación'</strong> o <strong>'Añadir a pantalla de inicio'</strong>.</p>
                        <p>3. Sigue las instrucciones para confirmar la instalación.</p>
                    </div>
                )}

                {!isIOS && !isAndroid && (
                     <div className="text-left space-y-3">
                        <p>Busca una opción en el menú de tu navegador que diga <strong>'Instalar'</strong>, <strong>'Añadir a...'</strong> o <strong>'Crear acceso directo'</strong> para anclar la aplicación a tu escritorio o pantalla de inicio.</p>
                    </div>
                )}
            </div>
             <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes scale-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ManualInstallModal;
