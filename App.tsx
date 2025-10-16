

import { FC, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { useAppContext } from './hooks/useAppContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AgendaPage from './pages/AgendaPage';
import AdminPage from './pages/AdminPage';
import LogoutPage from './pages/LogoutPage';
import InstallPWAButton from './components/common/InstallPWAButton';
import ManualInstallModal from './components/common/ManualInstallModal';
import QRCodeModal from './components/common/QRCodeModal';
import ConfirmationModal from './components/common/ConfirmationModal';

interface RouteProps {
    children: ReactNode;
}

const PrivateRoute: FC<RouteProps> = ({ children }) => {
    const { user, loading } = useAppContext();
    const location = useLocation();

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">Cargando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

const AdminRoute: FC<RouteProps> = ({ children }) => {
    const { user, loading } = useAppContext();
    const location = useLocation();

    if (loading) {
         return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">Cargando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    
    if (user.role !== 'Administrador') {
        return <Navigate to="/agenda" replace />;
    }

    return <>{children}</>;
};

const PublicRoute: FC<RouteProps> = ({ children }) => {
    const { user, loading } = useAppContext();
    
    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white">Cargando...</div>;
    }

    if (user) {
        return <Navigate to="/agenda" replace />;
    }
    
    return <>{children}</>;
};


const App: FC = () => {
    const { backgroundImageUrl } = useAppContext();
    
    return (
        <div className="font-sans bg-gray-900" style={{ backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: 'cover', backgroundAttachment: 'fixed', minHeight: '100vh' }}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<PublicRoute><HomePage /></PublicRoute>} />
                    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
                    <Route path="/logout" element={<LogoutPage />} />

                    <Route path="/agenda" element={<PrivateRoute><AgendaPage /></PrivateRoute>} />
                    <Route path="/admin" element={<AdminRoute><AdminPage /></PrivateRoute>} />
                    
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <Toaster position="bottom-center" toastOptions={{
                    style: { background: '#333', color: '#fff' },
                }} />
                <InstallPWAButton />
                <ManualInstallModal />
                <QRCodeModal />
                <ConfirmationModal />
            </BrowserRouter>
        </div>
    );
};

export default App;