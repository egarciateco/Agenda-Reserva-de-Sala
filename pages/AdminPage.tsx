import { useState, FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '../components/common/Header';
import SectorsManager from '../components/admin/SectorsManager';
import UsersManager from '../components/admin/UsersManager';
import ConfigManager from '../components/admin/ConfigManager';
import RolesManager from '../components/admin/RolesManager';
import BookingsManager from '../components/admin/BookingsManager';
import SalasManager from '../components/admin/SalasManager';

type AdminSection = 'Sectores' | 'Usuarios' | 'Configuración' | 'Roles' | 'Reservas' | 'Salas';

const AdminPage: FC = () => {
    const location = useLocation();
    const navButtons: AdminSection[] = ['Salas', 'Sectores', 'Usuarios', 'Reservas', 'Roles', 'Configuración'];

    const getInitialSection = (): AdminSection => {
        const sectionFromState = location.state?.activeSection;
        if (sectionFromState && navButtons.includes(sectionFromState)) {
            return sectionFromState;
        }
        return 'Salas';
    };

    const [activeSection, setActiveSection] = useState<AdminSection>(getInitialSection());

    const renderSection = () => {
        switch (activeSection) {
            case 'Salas':
                return <SalasManager />;
            case 'Sectores':
                return <SectorsManager />;
            case 'Usuarios':
                return <UsersManager />;
            case 'Configuración':
                return <ConfigManager />;
            case 'Roles':
                return <RolesManager />;
            case 'Reservas':
                return <BookingsManager />;
            default:
                return null;
        }
    };
    
    return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-1 p-6 overflow-auto bg-gray-800 bg-opacity-50">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
                    <Link to="/agenda" className="px-4 py-2 text-sm bg-green-600 text-white hover:bg-green-700 rounded-md transition-colors flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver a la Agenda
                    </Link>
                </div>
                 <nav className="flex rounded-t-lg overflow-hidden mb-0">
                    {navButtons.map(name => (
                        <button
                            key={name}
                            onClick={() => setActiveSection(name)}
                            className={`flex-1 p-3 text-center text-[9px] font-bold uppercase tracking-wider transition-colors focus:outline-none ${
                                activeSection === name
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-black text-white hover:bg-gray-800'
                            }`}
                        >
                            {name}
                        </button>
                    ))}
                </nav>
                <div className="bg-gray-900 bg-opacity-60 p-6 rounded-b-lg">
                    {renderSection()}
                </div>
            </main>
        </div>
    );
};

export default AdminPage;