import { createContext, useState, useEffect, useCallback, FC, ReactNode } from 'react';
import { User, Sector, Role, Booking, AppSettings, ToastMessage, AppContextType, ConfirmationState, Sala, ConfirmationOptions } from '../types';
import { INITIAL_ROLES, INITIAL_SECTORS, DEFAULT_LOGO_URL, DEFAULT_BACKGROUND_URL, INITIAL_ADMIN_SECRET_CODE, DEFAULT_HOME_BACKGROUND_URL, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, INITIAL_SALAS, DEFAULT_SITE_IMAGE_URL } from '../constants';
import { mockUsers, mockBookings } from '../utils/mockData';
import { getItem, setItem } from '../utils/idb';
import { formatDate } from '../utils/helpers';

declare global {
    interface Window {
        emailjs: any;
        deferredInstallPrompt: any;
    }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- Audio Context for Bell Sound ---
let audioContext: AudioContext | null = null;
const playNotificationSound = () => {
    if (typeof window.AudioContext === 'undefined' && typeof (window as any).webkitAudioContext === 'undefined') {
        return;
    }
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
};

export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [salas, setSalas] = useState<Sala[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [settings, setSettingsState] = useState<AppSettings>({
        logoUrl: DEFAULT_LOGO_URL,
        backgroundImageUrl: DEFAULT_BACKGROUND_URL,
        homeBackgroundImageUrl: DEFAULT_HOME_BACKGROUND_URL,
        adminSecretCode: INITIAL_ADMIN_SECRET_CODE,
        siteImageUrl: DEFAULT_SITE_IMAGE_URL,
        lastBookingDuration: 1,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [confirmation, setConfirmation] = useState<ConfirmationState>({
        isOpen: false,
        message: '',
        onConfirm: () => {},
        onCancel: () => {},
    });
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [pwaInstalledOnce, setPwaInstalledOnce] = useState(false);
    const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);


    useEffect(() => {
        const handleSwUpdate = (e: CustomEvent<ServiceWorkerRegistration>) => {
            console.log("App received 'sw-update' event.");
            setUpdateRegistration(e.detail);
        };
        window.addEventListener('sw-update', handleSwUpdate as EventListener);
        return () => window.removeEventListener('sw-update', handleSwUpdate as EventListener);
    }, []);

    const applyUpdate = () => {
        if (updateRegistration && updateRegistration.waiting) {
            updateRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (refreshing) return;
                window.location.reload();
                refreshing = true;
            });
        }
    };

    // --- BLINDADO Data Loading and Seeding ---
    useEffect(() => {
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
        
        const loadData = async () => {
            setIsLoading(true);
            try {
                const isInitialized = await getItem<boolean>('db_initialized');

                if (!isInitialized) {
                    console.log("BLINDADO: Primera ejecución. Inicializando base de datos...");
                    // First time run: Seed the database with default values
                    await setItem('users', mockUsers);
                    await setItem('sectors', INITIAL_SECTORS);
                    await setItem('roles', INITIAL_ROLES);
                    await setItem('salas', INITIAL_SALAS);
                    await setItem('bookings', mockBookings);
                    await setItem('appSettings', settings);
                    await setItem('db_initialized', true);
                    await setItem('pwa_installed_once', false);


                    // Set initial state from default values
                    setUsers(mockUsers);
                    setSectors(INITIAL_SECTORS);
                    setRoles(INITIAL_ROLES);
                    setSalas(INITIAL_SALAS);
                    setBookings(mockBookings);
                    setPwaInstalledOnce(false);
                    // Settings are already at default
                } else {
                    // Subsequent runs: Load all data from DB
                    console.log("BLINDADO: Cargando datos desde IndexedDB.");
                    const [
                        loadedUsers,
                        loadedSectors,
                        loadedRoles,
                        loadedSalas,
                        loadedBookings,
                        loadedSettings,
                        loadedCurrentUser,
                        loadedPwaInstalledOnce
                    ] = await Promise.all([
                        getItem<User[]>('users'),
                        getItem<Sector[]>('sectors'),
                        getItem<Role[]>('roles'),
                        getItem<Sala[]>('salas'),
                        getItem<Booking[]>('bookings'),
                        getItem<AppSettings>('appSettings'),
                        getItem<User | null>('currentUser'),
                        getItem<boolean>('pwa_installed_once')
                    ]);

                    setUsers(loadedUsers || []);
                    setSectors(loadedSectors || []);
                    setRoles(loadedRoles || []);
                    setSalas(loadedSalas || []);
                    setBookings(loadedBookings || []);
                    // Merge settings to ensure new defaults are applied if not present in saved data
                    setSettingsState(s => ({ ...s, ...(loadedSettings || {}) }));
                    setCurrentUser(loadedCurrentUser || null);
                    setPwaInstalledOnce(loadedPwaInstalledOnce || false);
                }
            } catch (error) {
                console.error("BLINDADO: Error crítico al cargar datos. Se usarán valores por defecto para esta sesión, pero no se sobrescribirán los datos guardados.", error);
                // Fallback to defaults for the session, but DO NOT overwrite DB
                setUsers(mockUsers);
                setSectors(INITIAL_SECTORS);
                setRoles(INITIAL_ROLES);
                setSalas(INITIAL_SALAS);
                setBookings(mockBookings);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);
    
    // --- Wrapped Setters for Persistence ---
    const persistCurrentUser = async (user: User | null) => {
        setCurrentUser(user);
        await setItem('currentUser', user);
    };
    const persistUsers = async (newUsers: User[]) => {
        setUsers(newUsers);
        await setItem('users', newUsers);
    };
    const persistSectors = async (newSectors: Sector[]) => {
        setSectors(newSectors);
        await setItem('sectors', newSectors);
    };
    const persistRoles = async (newRoles: Role[]) => {
        setRoles(newRoles);
        await setItem('roles', newRoles);
    };
     const persistSalas = async (newSalas: Sala[]) => {
        setSalas(newSalas);
        await setItem('salas', newSalas);
    };
    const persistBookings = async (newBookings: Booking[]) => {
        setBookings(newBookings);
        await setItem('bookings', newBookings);
    };
    const persistSettings = async (newSettings: AppSettings) => {
        setSettingsState(newSettings);
        await setItem('appSettings', newSettings);
    };

    // --- PWA Installation Logic ---
    useEffect(() => {
        const handleInstallReady = () => {
            console.log('`pwa-install-ready` event received by context.');
            setDeferredPrompt(window.deferredInstallPrompt);
        };

        // Check if the prompt is already available
        if (window.deferredInstallPrompt) {
            handleInstallReady();
        }

        window.addEventListener('pwa-install-ready', handleInstallReady);
        return () => {
            window.removeEventListener('pwa-install-ready', handleInstallReady);
        };
    }, []);

    const triggerPwaInstall = async () => {
        if (!deferredPrompt) {
            console.log("Install prompt not available.");
            addToast('La aplicación no se puede instalar en este momento.', 'error');
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            addToast('¡Aplicación instalada exitosamente!', 'success');
            setPwaInstalledOnce(true);
            await setItem('pwa_installed_once', true);
        }
        // After being used, the prompt is gone.
        window.deferredInstallPrompt = null;
        setDeferredPrompt(null);
    };


    useEffect(() => {
        if (!isLoading && bookings.length > 0 && salas.length > 0) {
            const bookingsToUpdate = bookings.filter(b => !b.roomId);
            if (bookingsToUpdate.length > 0) {
                console.log(`Migrating ${bookingsToUpdate.length} bookings to have a default room ID.`);
                const defaultRoomId = salas[0].id;
                const updatedBookings = bookings.map(b => 
                    b.roomId ? b : { ...b, roomId: defaultRoomId }
                );
                persistBookings(updatedBookings);
            }
        }
    }, [isLoading, bookings, salas]);

    const addToast = (message: string, type: 'success' | 'error') => {
        setToasts(prev => [...prev, { id: Date.now(), message, type }]);
        if(type === 'success') {
            playNotificationSound();
        }
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const hideConfirmation = () => {
        setConfirmation({ ...confirmation, isOpen: false });
    };

    const showConfirmation = (message: string, onConfirm: () => void, options?: ConfirmationOptions) => {
        setConfirmation({
            isOpen: true,
            message,
            onConfirm: () => {
                onConfirm();
                hideConfirmation();
            },
            onCancel: hideConfirmation,
            confirmText: options?.confirmText,
            cancelText: options?.cancelText,
            confirmButtonClass: options?.confirmButtonClass,
        });
    };

    const sendBookingNotificationEmail = useCallback(async (action: 'creada' | 'modificada' | 'eliminada', booking: Booking) => {
        const user = users.find(u => u.id === booking.userId);
        if (!user) return "Usuario de la reserva no encontrado.";

        try {
            if (typeof window.emailjs === 'undefined') {
                console.error('EmailJS SDK not loaded. Skipping email notifications.');
                return '';
            }
            
            const isEmailJsConfigured =
                EMAILJS_SERVICE_ID &&
                EMAILJS_TEMPLATE_ID &&
                EMAILJS_PUBLIC_KEY;

            if (!isEmailJsConfigured) {
                console.warn('AVISO: Las notificaciones por email están desactivadas porque las credenciales de EmailJS no están configuradas.');
                return '';
            }
            
            const bookingDate = new Date(booking.date + 'T00:00:00');
            const templateParams = {
                action,
                user_name: `${user.lastName}, ${user.firstName}`,
                user_sector: user.sector,
                booking_day: formatDate(bookingDate),
                booking_time: `${booking.startTime}:00 - ${booking.startTime + booking.duration}:00`,
            };

            const usersToNotify = users.filter(u => u.role !== 'Administrador');
            if (usersToNotify.length === 0) {
                return 'No hay usuarios para notificar.';
            }

            let successCount = 0;
            let quotaReached = false;
            
            for (const targetUser of usersToNotify) {
                try {
                    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                        ...templateParams,
                        to_email: targetUser.email,
                    }, EMAILJS_PUBLIC_KEY);
                    successCount++;
                } catch (error: any) {
                    if (error?.status === 426) {
                        console.warn("EmailJS quota reached. Stopping email notifications.");
                        quotaReached = true;
                        break; 
                    }

                    const errorText = (error instanceof Error) ? error.toString() : JSON.stringify(error);
                     if (errorText.includes("The recipients address is empty")) {
                        console.error(`%c[AYUDA EMAILJS] El error "The recipients address is empty" significa que tu plantilla de correo en EmailJS no está configurada para recibir la dirección del destinatario. \nSolución: Ve a tu plantilla en el panel de EmailJS -> Pestaña "Settings" -> y en el campo "To Email", escribe exactamente: {{to_email}}`, 'color: yellow; font-weight: bold; font-size: 14px;');
                    } else {
                        console.error(`Failed to send email to ${targetUser.email}:`, errorText);
                    }
                }
            }

            if (quotaReached) {
                return `pero se ha alcanzado la cuota de envío de emails.`;
            }

            if (successCount === 0) {
                return `pero falló el envío de todas las notificaciones.`;
            } else {
                return `Notificaciones enviadas a ${successCount} de ${usersToNotify.length} usuarios.`;
            }
        } catch (error) {
            console.error("Error catastrófico en sendBookingNotificationEmail:", error);
            return `pero ocurrió un error grave al intentar enviar notificaciones.`;
        }
    }, [users]);

    const login = async (email: string, pass: string): Promise<boolean> => {
        const user = users.find(u => u.email === email.toLowerCase());
        if (user && user.passwordHash === `hashed_${pass}`) {
            await persistCurrentUser(user);
            return true;
        }
        return false;
    };

    const logout = () => {
        persistCurrentUser(null);
    };

    const register = async (userData: Omit<User, 'id' | 'passwordHash'>, pass: string): Promise<boolean> => {
        if (users.some(u => u.email === userData.email.toLowerCase())) {
            return false;
        }
        const newUser: User = { ...userData, id: Date.now().toString(), email: userData.email.toLowerCase(), passwordHash: `hashed_${pass}` };
        await persistUsers([...users, newUser]);
        return true;
    };

    const addBooking = async (bookingData: Omit<Booking, 'id'>): Promise<string> => {
        const newBooking: Booking = { ...bookingData, id: Date.now().toString() };
        await persistBookings([...bookings, newBooking]);
        const emailStatus = await sendBookingNotificationEmail('creada', newBooking);
        return emailStatus;
    };

    const deleteBooking = async (bookingId: string) => {
        const bookingToDelete = bookings.find(b => b.id === bookingId);
        if (bookingToDelete) {
            await persistBookings(bookings.filter(b => b.id !== bookingId));
            const emailStatus = await sendBookingNotificationEmail('eliminada', bookingToDelete);
            addToast(`Reserva eliminada. ${emailStatus}`, 'success');
        } else {
            throw new Error("Reserva no encontrada.");
        }
    };

    const updateBooking = async (updatedBooking: Booking) => {
        await persistBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
        const emailStatus = await sendBookingNotificationEmail('modificada', updatedBooking);
        addToast(`Reserva modificada. ${emailStatus}`, 'success');
    };

    const updateUser = async (updatedUser: User) => {
        const originalUser = users.find(u => u.id === updatedUser.id);
        if (!originalUser) {
            throw new Error("Usuario no encontrado para actualizar.");
        }

        let userToSave = { ...updatedUser };
        let toastMessage = 'Usuario actualizado.';

        const wasAdmin = originalUser.role === 'Administrador';
        const isAdmin = updatedUser.role === 'Administrador';

        if (!wasAdmin && isAdmin) { // Promoted to Admin
            userToSave.passwordHash = `hashed_${settings.adminSecretCode}`;
            toastMessage = `Usuario promovido a Administrador. Contraseña cambiada al código secreto.`;
        } else if (wasAdmin && !isAdmin) { // Demoted from Admin
             // When demoting, ensure the password hash reverts to the user's original hash,
             // not the admin secret hash they were temporarily using.
            userToSave.passwordHash = originalUser.passwordHash;
            toastMessage = `Administrador degradado. La contraseña del usuario ha sido conservada.`;
        }

        await persistUsers(users.map(u => u.id === userToSave.id ? userToSave : u));
        addToast(toastMessage, 'success');
    };

    const deleteUser = async (userId: string) => {
        await persistUsers(users.filter(u => u.id !== userId));
        await persistBookings(bookings.filter(b => b.userId !== userId));
        addToast('Usuario y sus reservas eliminados.', 'success');
    };

    const addSector = async (sectorName: string) => {
        await persistSectors([...sectors, { id: Date.now().toString(), name: sectorName }]);
        addToast('Sector añadido.', 'success');
    };

    const updateSector = async (updatedSector: Sector) => {
        await persistSectors(sectors.map(s => s.id === updatedSector.id ? updatedSector : s));
        addToast('Sector actualizado.', 'success');
    };

    const deleteSector = async (sectorId: string) => {
        await persistSectors(sectors.filter(s => s.id !== sectorId));
        addToast('Sector eliminado.', 'success');
    };

    const addRole = async (roleName: string) => {
        await persistRoles([...roles, { id: Date.now().toString(), name: roleName }]);
        addToast('Rol añadido.', 'success');
    };

    const updateRole = async (updatedRole: Role) => {
        await persistRoles(roles.map(r => r.id === updatedRole.id ? updatedRole : r));
        addToast('Rol actualizado.', 'success');
    };

    const deleteRole = async (roleId: string) => {
        await persistRoles(roles.filter(r => r.id !== roleId));
        addToast('Rol eliminado.', 'success');
    };

    const addSala = async (salaName: string, address: string) => {
        await persistSalas([...salas, { id: Date.now().toString(), name: salaName, address }]);
        addToast('Sala añadida.', 'success');
    };

    const updateSala = async (updatedSala: Sala) => {
        await persistSalas(salas.map(s => s.id === updatedSala.id ? updatedSala : s));
        addToast('Sala actualizada.', 'success');
    };

    const deleteSala = async (salaId: string) => {
        await persistSalas(salas.filter(s => s.id !== salaId));
        await persistBookings(bookings.filter(b => b.roomId !== salaId));
        addToast('Sala y sus reservas han sido eliminadas.', 'success');
    };

    const setSettings = async (newSettings: Partial<AppSettings>) => {
        const settingsToSave = { ...settings, ...newSettings };
        
        // Blindado: Previene que las URLs fijas sean modificadas por el usuario.
        settingsToSave.logoUrl = DEFAULT_LOGO_URL;
        settingsToSave.backgroundImageUrl = DEFAULT_BACKGROUND_URL;
        settingsToSave.homeBackgroundImageUrl = DEFAULT_HOME_BACKGROUND_URL;
        settingsToSave.siteImageUrl = DEFAULT_SITE_IMAGE_URL;

        await persistSettings(settingsToSave);
    };

    const value: AppContextType = {
        currentUser, users, sectors, roles, salas, bookings,
        logoUrl: DEFAULT_LOGO_URL,
        backgroundImageUrl: DEFAULT_BACKGROUND_URL,
        homeBackgroundImageUrl: DEFAULT_HOME_BACKGROUND_URL,
        siteImageUrl: DEFAULT_SITE_IMAGE_URL,
        adminSecretCode: settings.adminSecretCode,
        lastBookingDuration: settings.lastBookingDuration ?? 1,
        toasts, confirmation, isLoading,
        isPwaInstallable: !!deferredPrompt,
        isStandalone,
        pwaInstalledOnce,
        triggerPwaInstall,
        login, logout, register,
        addBooking, deleteBooking, updateBooking,
        updateUser, deleteUser,
        addSector, updateSector, deleteSector,
        addRole, updateRole, deleteRole,
        addSala, updateSala, deleteSala,
        setSettings, addToast, removeToast,
        showConfirmation, hideConfirmation,
        isUpdateAvailable: !!updateRegistration,
        applyUpdate,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export { AppContext };