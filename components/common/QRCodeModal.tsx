import { FC } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { DEFAULT_SHAREABLE_URL } from '../../constants';

const QRCodeModal: FC = () => {
    const { isQrModalOpen, closeQrModal, addToast } = useAppContext();

    const handleCopyLink = async () => {
        const shareUrl = DEFAULT_SHAREABLE_URL;
        
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                addToast('¡Enlace de la aplicación copiado!', 'success');
                return;
            } catch (err) {
                console.error('La API de Clipboard falló, intentando método alternativo.', err);
            }
        }
    
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
    
        try {
            document.execCommand('copy');
            addToast('¡Enlace de la aplicación copiado!', 'success');
        } catch (err) {
            addToast('No se pudo copiar el enlace.', 'error');
        }
    
        document.body.removeChild(textArea);
    };

    if (!isQrModalOpen) {
        return null;
    }

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(DEFAULT_SHAREABLE_URL)}`;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[11000] p-4 animate-fade-in"
            onClick={closeQrModal}
        >
            <div 
                className="relative bg-gray-800 p-8 rounded-xl shadow-2xl text-white w-full max-w-xs text-center transform transition-all animate-scale-in"
                onClick={(e) => e.stopPropagation()} // Prevent closing modal when clicking inside
            >
                <button 
                    onClick={closeQrModal} 
                    className="absolute top-2 right-2 text-gray-400 hover:text-white"
                    aria-label="Cerrar modal"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <h3 className="text-xl font-bold mb-4">Compartir Aplicación</h3>
                <p className="text-gray-300 text-sm mb-6">Escanea el código para abrir la app en otro dispositivo.</p>
                
                <div className="bg-white p-4 rounded-lg inline-block">
                    <img src={qrCodeUrl} alt="Código QR de la aplicación" width="200" height="200" />
                </div>

                <div className="mt-6">
                    <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copiar Enlace
                    </button>
                </div>
            </div>
             <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in {
                    animation: scale-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default QRCodeModal;