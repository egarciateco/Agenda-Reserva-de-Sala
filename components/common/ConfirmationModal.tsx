import { FC, useState } from 'react';
import { useAppContext } from '../../hooks/useAppContext';

const ConfirmationModal: FC = () => {
    const { confirmationState, closeConfirmation } = useAppContext();
    const [isConfirming, setIsConfirming] = useState(false);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await confirmationState.onConfirm();
        } finally {
            setIsConfirming(false);
            closeConfirmation();
        }
    };

    if (!confirmationState.isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[12000] p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl text-white w-full max-w-md">
                <h3 className="text-lg font-bold mb-4">Confirmar Acción</h3>
                <p className="text-gray-300 mb-6">{confirmationState.message}</p>
                <div className="flex justify-end gap-4">
                    <button onClick={closeConfirmation} disabled={isConfirming} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md transition disabled:opacity-50">Cancelar</button>
                    <button onClick={handleConfirm} disabled={isConfirming} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition disabled:opacity-50">
                        {isConfirming ? 'Confirmando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
