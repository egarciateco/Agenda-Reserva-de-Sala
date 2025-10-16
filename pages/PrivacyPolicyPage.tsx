import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';

const PrivacyPolicyPage: FC = () => {
    const { homeBackgroundImageUrl } = useAppContext();

    return (
        <div
            className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center"
            style={{ backgroundImage: `url(${homeBackgroundImageUrl})` }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-70"></div>
            
            <main className="relative z-10 w-full max-w-3xl text-left text-white animate-fade-in">
                <div className="bg-gray-900 bg-opacity-80 p-8 md:p-10 rounded-xl shadow-2xl backdrop-blur-md">
                    <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">Política de Privacidad</h1>
                    
                    <div className="space-y-4 text-sm text-gray-300 max-h-[60vh] overflow-y-auto pr-4">
                        <p><strong>Última actualización:</strong> 17 de Octubre de 2025</p>
                        
                        <h2 className="text-lg font-semibold text-white pt-2">1. Introducción</h2>
                        <p>Bienvenido a la aplicación "Reserva de Sala de TELECOM". Esta política de privacidad explica cómo recopilamos, usamos, compartimos y protegemos su información personal. Esta aplicación es una herramienta de uso interno y exclusivo para los empleados de Telecom Argentina S.A. y su uso está sujeto a las políticas internas de la compañía.</p>

                        <h2 className="text-lg font-semibold text-white pt-2">2. Información que Recopilamos</h2>
                        <p>Para el correcto funcionamiento de la aplicación, recopilamos los siguientes datos personales durante el proceso de registro y uso:</p>
                        <ul className="list-disc list-inside pl-4">
                            <li><strong>Datos de Identificación:</strong> Nombre, Apellido, Email corporativo.</li>
                            <li><strong>Datos de Contacto:</strong> Número de celular.</li>
                            <li><strong>Datos Laborales:</strong> Sector y Rol dentro de la compañía.</li>
                            <li><strong>Datos de Uso:</strong> Información sobre las reservas que realiza, incluyendo sala, fecha, hora y duración.</li>
                        </ul>

                        <h2 className="text-lg font-semibold text-white pt-2">3. Uso de la Información</h2>
                        <p>La información recopilada se utiliza exclusivamente para los siguientes propósitos:</p>
                        <ul className="list-disc list-inside pl-4">
                            <li>Gestionar y administrar el sistema de reservas de salas.</li>
                            <li>Identificar al usuario que realiza una reserva.</li>
                            <li>Facilitar la comunicación interna relacionada con la gestión de las salas.</li>
                            <li>Permitir a los administradores supervisar el uso de las instalaciones.</li>
                            <li>Mejorar la funcionalidad y seguridad de la aplicación.</li>
                        </ul>

                        <h2 className="text-lg font-semibold text-white pt-2">4. Cómo Compartimos la Información</h2>
                        <p>Su información personal es visible para otros empleados de Telecom Argentina S.A. dentro de la aplicación con el único fin de identificar al responsable de una reserva. No compartimos su información personal con terceros externos a la compañía bajo ninguna circunstancia, salvo que sea requerido por ley.</p>

                        <h2 className="text-lg font-semibold text-white pt-2">5. Seguridad de los Datos</h2>
                        <p>Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal contra el acceso no autorizado, la alteración, la divulgación o la destrucción. El acceso a los datos está restringido al personal autorizado que necesita conocer dicha información para los fines descritos en esta política.</p>

                        <h2 className="text-lg font-semibold text-white pt-2">6. Derechos del Usuario</h2>
                        <p>De acuerdo con las políticas internas de la compañía, usted tiene derecho a acceder, rectificar o solicitar la eliminación de sus datos personales. Para ejercer estos derechos, por favor, póngase en contacto con el administrador de la aplicación o el departamento correspondiente.</p>
                        
                        <h2 className="text-lg font-semibold text-white pt-2">7. Cambios en la Política de Privacidad</h2>
                        <p>Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento. Cualquier cambio será comunicado a través de los canales internos de la compañía.</p>

                        <h2 className="text-lg font-semibold text-white pt-2">8. Contacto</h2>
                        <p>Si tiene alguna pregunta sobre esta Política de Privacidad, por favor, contacte a la Gerencia de Facilities & Servicios o al departamento de Capital Humano.</p>
                    </div>

                    <div className="text-center mt-8">
                        <Link to="/" className="px-6 py-2 text-md font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                            Volver al Inicio
                        </Link>
                    </div>
                </div>
            </main>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
                /* Simple scrollbar styling for webkit browsers */
                .max-h-\\[60vh\\]::-webkit-scrollbar {
                    width: 8px;
                }
                .max-h-\\[60vh\\]::-webkit-scrollbar-track {
                    background: #2d3748; /* gray-800 */
                }
                .max-h-\\[60vh\\]::-webkit-scrollbar-thumb {
                    background-color: #4a5568; /* gray-600 */
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default PrivacyPolicyPage;
