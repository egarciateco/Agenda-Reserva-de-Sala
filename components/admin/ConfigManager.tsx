import { useState, FC } from 'react';
import { useAppContext } from '../../hooks/useAppContext';
import { DEFAULT_SHAREABLE_URL } from '../../constants';

const StaticImageDisplay = ({ label, value }: { label: string, value: string }) => (
    <div>
        <label className="block text-sm font-medium text-white mb-2">{label}</label>
        <div className="flex items-center gap-4 bg-gray-700 p-2 rounded-md">
            <img src={value} alt={label} className="h-12 w-16 object-contain bg-white p-1 rounded-md"/>
            <p className="text-xs text-gray-300 break-all">{value}</p>
        </div>
    </div>
);

const StaticUrlDisplay: FC<{ label: string; value: string; addToast: (msg: string, type: 'success' | 'error') => void; }> = ({ label, value, addToast }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        addToast('¡Enlace copiado al portapapeles!', 'success');
    };

    return (
        <div>
            <label className="block text-sm font-medium text-white mb-2">{label}</label>
            <div className="flex items-center gap-2 bg-gray-700 p-2 rounded-md">
                <p className="flex-grow text-xs text-gray-300 break-all">{value}</p>
                <button 
                    onClick={handleCopy}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex-shrink-0"
                    title="Copiar enlace"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

const ConfigManager: FC = () => {
    const { 
        logoUrl, backgroundImageUrl, homeBackgroundImageUrl, adminSecretCode, 
        siteImageUrl, setSettings, addToast 
    } = useAppContext();
    
    const [newAdminCode, setNewAdminCode] = useState(adminSecretCode);
    const [isCodeVisible, setIsCodeVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const handleSave = async () => {
        if (!newAdminCode.trim()) {
            addToast('El código de administrador no puede estar vacío.', 'error');
            return;
        }
        setIsSaving(true);
        try {
            await setSettings({ 
                adminSecretCode: newAdminCode
            });
        } catch(error) {
            // Error toast is shown by context
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-bold mb-4 text-white">Configuración Visual y de Acceso</h2>
            <div className="space-y-6">
                
                <StaticImageDisplay label="Imagen del Logotipo de TELECOM (Fija)" value={logoUrl} />
                <StaticImageDisplay label="Imagen de Fondo - General (Fija)" value={backgroundImageUrl} />
                <StaticImageDisplay label="Imagen de Fondo - Página de Inicio (Fija)" value={homeBackgroundImageUrl} />
                <StaticImageDisplay label="Imagen Site - Ubicación en Agenda (Fija)" value={siteImageUrl} />

                <StaticUrlDisplay label="URL Base de la Aplicación" value={DEFAULT_SHAREABLE_URL} addToast={addToast} />

                 <div>
                    <label className="block text-sm font-medium text-white mb-2">Código de Administrador</label>
                    <div className="relative">
                        <input
                            type={isCodeVisible ? 'text' : 'password'}
                            value={newAdminCode}
                            onChange={(e) => setNewAdminCode(e.target.value)}
                            placeholder="Código secreto para registro de admin"
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white pr-10"
                        />
                         <button
                            type="button"
                            onClick={() => setIsCodeVisible(!isCodeVisible)}
                            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
                        >
                            {isCodeVisible ? (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 5.943 14.478 3 10 3a9.953 9.953 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2 2 0 012.828 2.828l1.515 1.515A4 4 0 0011 8c-2.21 0-4 1.79-4 4a4.006 4.006 0 00.97 2.473l.603.602z" clipRule="evenodd" /></svg>
                            ) : (
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-white mt-1">Este código se utiliza como contraseña al registrar una nueva cuenta de administrador.</p>
                </div>

                <div className="pt-4">
                    <button onClick={handleSave} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition w-40" disabled={isSaving}>
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigManager;