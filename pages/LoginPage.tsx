import { useState, FC, FormEvent, ChangeEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';

const LoginPage: FC = () => {
    const { login, logoUrl } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/agenda';

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(formData.email.trim(), formData.password);
            // The PublicRoute will automatically navigate to /agenda on successful login
        } catch (error) {
            // Error toast is handled by the context
            setFormData(prev => ({...prev, password: ''}));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-4 bg-black bg-opacity-50">
            <header className="absolute top-0 left-0 right-0 p-4 flex justify-start z-10">
                 <img src={logoUrl} alt="TELECOM Logo" className="h-12 object-contain" />
            </header>

            <main className="w-full max-w-sm">
                <div className="bg-gray-900 bg-opacity-80 p-8 rounded-xl shadow-2xl backdrop-blur-md text-white">
                    <h2 className="text-3xl font-bold text-center mb-8">Iniciar Sesión</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="input-style"
                            autoComplete="email"
                        />
                        <div className="relative">
                            <input
                                type={isPasswordVisible ? 'text' : 'password'}
                                name="password"
                                placeholder="Contraseña"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="input-style pr-10"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
                                aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {isPasswordVisible ? (
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.27 5.943 14.478 3 10 3a9.953 9.953 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2 2 0 012.828 2.828l1.515 1.515A4 4 0 0011 8c-2.21 0-4 1.79-4 4a4.006 4.006 0 00.97 2.473l.603.602z" clipRule="evenodd" /></svg>
                                ) : (
                                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                                )}
                            </button>
                        </div>
                        
                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:bg-blue-800" disabled={isLoading}>
                            {isLoading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-400">
                        ¿No tienes una cuenta?{' '}
                        <Link to="/register" className="font-medium text-blue-400 hover:text-blue-300">
                            Regístrate
                        </Link>
                    </p>
                </div>
            </main>
             <footer className="absolute bottom-4 left-4 text-xs text-left text-gray-300">
                <div>
                    <p className="font-bold">Realizado por:</p>
                    <p>Esteban García. - Para uso exclusivo de Telecom Argentina S.A.</p>
                </div>
                 <div className="mt-2 flex gap-4">
                    <Link to="/privacy-policy" className="text-gray-400 hover:text-white underline transition-colors">
                        Política de Privacidad
                    </Link>
                    <Link to="/terms-of-service" className="text-gray-400 hover:text-white underline transition-colors">
                        Términos de Servicio
                    </Link>
                </div>
            </footer>
            <style>{`
                .input-style {
                    background-color: #374151; /* bg-gray-700 */
                    border: 1px solid #4B5563; /* border-gray-600 */
                    border-radius: 0.375rem; /* rounded-md */
                    padding: 0.75rem;
                    color: white;
                    width: 100%;
                }
                .input-style:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px #3B82F6; /* focus:ring-blue-500 */
                    border-color: #3B82F6; /* focus:border-blue-500 */
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
