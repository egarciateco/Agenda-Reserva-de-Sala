import { FC } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';

const TermsOfServicePage: FC = () => {
    const { homeBackgroundImageUrl } = useAppContext();

    return (
        <div
            className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-cover bg-center"
            style={{ backgroundImage: `url(${homeBackgroundImageUrl})` }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-70"></div>
            
            <main className="relative z-10 w-full max-w-3xl text-left text-white animate-fade-in">
                <div className="bg-gray-900 bg-opacity-80 p-8 md:p-10 rounded-xl shadow-2xl backdrop-blur-md">
                    <h1 className="text-3xl font-bold text-center mb-6 text-blue-400">Términos y Condiciones del Servicio</h1>
                    
                    <div className="space-y-4 text-sm text-gray-300 max-h-[60vh] overflow-y-auto pr-4">
                        <p><strong>Última actualización:</strong> 17 de Octubre de 2025</p>
                        
                        <h2 className="text-lg font-semibold text-white pt-2">1. Aceptación de los Términos</h2>
                        <p>Al acceder y utilizar la aplicación "Reserva de Sala de TELECOM" (en adelante, "el Servicio"), usted acepta y se compromete a cumplir con los presentes Términos y Condiciones del Servicio. Este Servicio es una herramienta corporativa interna, propiedad de Telecom Argentina S.A., y su uso está estrictamente limitado a los empleados autorizados de la compañía. El uso del Servicio también se rige por el código de conducta y las políticas internas de Telecom Argentina S.A.</p>

                        <h2 className="text-lg font-semibold text-white pt-2">2. Descripción del Servicio</h2>
                        <p>El Servicio proporciona una plataforma para la gestión y reserva de salas de reuniones en las instalaciones de Telecom Argentina S.A. Las funcionalidades incluyen, entre otras, la visualización de la disponibilidad de salas, la creación, modificación y cancelación de reservas.</p>

                        <h2 className="text-lg font-semibold text-white pt-2">3. Obligaciones del Usuario</h2>
                        <p>Como usuario del Servicio, usted se compromete a:</p>
                        <ul className="list-disc list-inside pl-4">
                            <li>Proporcionar información veraz y precisa durante el registro y mantenerla actualizada.</li>
                            <li>Utilizar el Servicio de manera responsable y profesional.</li>
                            <li>Hacer un uso adecuado de las salas reservadas, respetando el equipamiento y las normativas de cada espacio.</li>
                            <li>Cancelar con antelación las reservas que no vaya a utilizar para liberar el espacio para otros compañeros.</li>
                            <li>Mantener la confidencialidad de su contraseña y no compartir su cuenta con terceros.</li>
                        </ul>

                        <h2 className="text-lg font-semibold text-white pt-2">4. Uso Aceptable</h2>
                        <p>Queda estrictamente prohibido utilizar el Servicio para cualquier fin ilícito, no autorizado o que contravenga las políticas de Telecom Argentina S.A. Esto incluye, entre otros, la reserva de salas para fines no laborales, la suplantación de identidad o cualquier actividad que pueda perjudicar el funcionamiento del Servicio o las instalaciones de la compañía.</p>

                        <h2 className="text-lg font-semibold text-white pt-2">5. Propiedad Intelectual</h2>
                        <p>Todo el software, diseño, textos, imágenes y demás contenido del Servicio son propiedad exclusiva de Telecom Argentina S.A. o sus licenciantes. No está permitida su reproducción, distribución o modificación sin autorización expresa.</p>

                        <h2 className="text-lg font-semibold text-white pt-2">6. Terminación</h2>
                        <p>Telecom Argentina S.A. se reserva el derecho de suspender o cancelar su acceso al Servicio en cualquier momento, sin previo aviso, en caso de incumplimiento de estos términos o de las políticas internas de la compañía.</p>
                        
                        <h2 className="text-lg font-semibold text-white pt-2">7. Limitación de Responsabilidad</h2>
                        <p>El Servicio se proporciona "tal cual". Telecom Argentina S.A. no se hace responsable de posibles interrupciones del servicio, pérdida de datos o cualquier otro inconveniente derivado de su uso. La responsabilidad sobre el uso correcto de las salas reservadas recae exclusivamente en el usuario que realiza la reserva.</p>

                        <h2 className="text-lg font-semibold text-white pt-2">8. Contacto</h2>
                        <p>Para cualquier consulta relacionada con estos Términos y Condiciones, por favor, contacte a la Gerencia de Facilities & Servicios.</p>
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
                .max-h-\\[60vh\\]::-webkit-scrollbar {
                    width: 8px;
                }
                .max-h-\\[60vh\\]::-webkit-scrollbar-track {
                    background: #2d3748;
                }
                .max-h-\\[60vh\\]::-webkit-scrollbar-thumb {
                    background-color: #4a5568;
                    border-radius: 4px;
                }
            `}</style>
        </div>
    );
};

export default TermsOfServicePage;