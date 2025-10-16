import { FC, useState, useEffect } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { DEFAULT_SHAREABLE_URL } from '../../constants';

const QRCodeModal: FC = () => {
    const { isQrModalOpen, closeQrModal, addToast, siteImageUrl } = useAppContext();
    const [isWebShareSupported, setIsWebShareSupported] = useState(false);
    const [isSharing, setIsSharing] = useState(false);

    useEffect(() => {
        if (navigator.share) {
            setIsWebShareSupported(true);
        }
    }, []);

    const shareUrl = `${DEFAULT_SHAREABLE_URL}?t=${Date.now()}`;

    const handleNativeShare = async () => {
        setIsSharing(true);
        try {
            // Compartir solo la URL es la forma más robusta de asegurar que las apps generen una vista previa.
            await navigator.share({ url: shareUrl });
        } catch (err) {
            const error = err as Error;
            if (error.name !== 'AbortError') {
                 addToast('No se pudo compartir la aplicación.', 'error');
                 console.error('Error sharing:', error);
            }
        } finally {
            setIsSharing(false);
        }
    };
    
    if (!isQrModalOpen) {
        return null;
    }

    const whatsappLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareUrl)}`;
    const emailSubject = 'App de Reserva de Salas - TELECOM';
    const emailBody = `
        <p style="font-family: sans-serif; color: #333;">Hola,</p>
        <p style="font-family: sans-serif; color: #333;">Te comparto el acceso a la aplicación de reserva de salas de Telecom.</p>
        <p style="font-family: sans-serif; color: #333;">Puedes hacer clic en la imagen o en el botón de abajo para acceder.</p>
        <br>
        <a href="${shareUrl}" style="display: inline-block;">
            <img src="${siteImageUrl}" alt="Reserva de Sala - TELECOM" style="width: 100px; height: auto; border-radius: 12px; border: 1px solid #ddd;" />
        </a>
        <br><br>
        <a href="${shareUrl}" style="font-family: sans-serif; font-size: 14px; text-decoration: none; background-color: #2563eb; color: white; padding: 12px 20px; border-radius: 8px; display: inline-block;">Abrir la aplicación</a>
        <br><br>
    `;
    const mailtoLink = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;


    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[11000] p-4 animate-fade-in"
            onClick={closeQrModal}
        >
            <div 
                className="relative bg-gray-800 p-8 rounded-xl shadow-2xl text-white w-full max-w-xs text-center transform transition-all animate-scale-in"
                onClick={(e) => e.stopPropagation()}
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
                <p className="text-gray-300 text-sm mb-6">Se enviará una vista previa con un enlace para abrir la app.</p>
                
                <div className="bg-white p-4 rounded-lg inline-block">
                    <img src={siteImageUrl} alt="Icono de la aplicación" className="w-[200px] h-[200px] object-contain" />
                </div>

                <div className="mt-6 space-y-3">
                    {isWebShareSupported ? (
                        <button
                            onClick={handleNativeShare}
                            disabled={isSharing}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:bg-green-800"
                        >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" /></svg>
                             {isSharing ? 'Compartiendo...' : 'Compartir App...'}
                        </button>
                    ) : (
                         <div className="flex gap-3">
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white bg-[#25D366] hover:bg-[#1EAE54] rounded-lg transition-colors">
                                WhatsApp
                            </a>
                            <a href={mailtoLink} className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-white bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors">
                                Email
                            </a>
                        </div>
                    )}
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