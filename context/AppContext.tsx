import { createContext, useState, useEffect, FC, ReactNode, useRef } from 'react';
import { 
    AppContextType, User, Sector, Role, Sala, Booking, AppSettings, 
    ToastMessage, ConfirmationState, ConfirmationOptions 
} from '../types';
import { auth, db } from '../utils/firebase';
import { getFirebaseErrorMessage } from '../utils/helpers';
import emailjs from '@emailjs/browser';
import { 
    INITIAL_ADMIN_SECRET_CODE, INITIAL_SALAS, INITIAL_ROLES, INITIAL_SECTORS,
    DEFAULT_LOGO_URL, DEFAULT_BACKGROUND_URL, DEFAULT_HOME_BACKGROUND_URL, DEFAULT_SITE_IMAGE_URL,
    EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY
} from '../constants';

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: FC<AppProviderProps> = ({ children }) => {
    // STATE DECLARATIONS
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [salas, setSalas] = useState<Sala[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [settings, setSettings] = useState<AppSettings>({
        logoUrl: DEFAULT_LOGO_URL,
        backgroundImageUrl: DEFAULT_BACKGROUND_URL,
        homeBackgroundImageUrl: DEFAULT_HOME_BACKGROUND_URL,
        siteImageUrl: DEFAULT_SITE_IMAGE_URL,
        adminSecretCode: INITIAL_ADMIN_SECRET_CODE,
        lastBookingDuration: 1,
    });
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, message: '' });
    const onConfirmRef = useRef<(() => void) | null>(null);
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const serviceWorkerRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const pwaInstalledOnce = localStorage.getItem('pwaInstalled') === 'true';

    // Derived state for PWA installability. This is more robust than a separate state.
    const isPwaInstallable = !!deferredInstallPrompt && !isStandalone;

    // --- PWA & Service Worker Logic ---
    useEffect(() => {
        const handleInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredInstallPrompt(e);
        };
        
        const handleSwUpdate = (event: Event) => {
            const registration = (event as CustomEvent).detail;
            serviceWorkerRegistrationRef.current = registration;
            setIsUpdateAvailable(true);
        };

        window.addEventListener('beforeinstallprompt', handleInstallPrompt);
        window.addEventListener('sw-update', handleSwUpdate);
        
        return () => {
            window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
            window.removeEventListener('sw-update', handleSwUpdate);
        };
    }, []);

    const triggerPwaInstall = () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                    addToast('¡Aplicación instalada con éxito!', 'success');
                    localStorage.setItem('pwaInstalled', 'true');
                }
                // The prompt can only be used once. Clear it.
                setDeferredInstallPrompt(null);
            });
        }
    };
    
    const applyUpdate = () => {
        if (serviceWorkerRegistrationRef.current?.waiting) {
            serviceWorkerRegistrationRef.current.waiting.postMessage({ type: 'SKIP_WAITING' });
            setIsUpdateAvailable(false);
            // The page will reload once the new service worker is active.
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    window.location.reload();
                    refreshing = true;
                }
            });
        }
    };

    // --- Authentication ---
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
            if (firebaseUser) {
                const userDoc = await db.collection('users').doc(firebaseUser.uid).get();
                if (userDoc.exists) {
                    setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
                } else {
                    // User exists in auth but not in Firestore, likely an error state.
                    // Log them out to prevent being stuck in a broken state.
                    await auth.signOut();
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- Firestore Data Fetching ---
    useEffect(() => {
        const collections = ['users', 'sectors', 'roles', 'salas', 'bookings'];
        const setters: any = {
            users: setUsers,
            sectors: setSectors,
            roles: setRoles,
            salas: setSalas,
            bookings: setBookings,
        };
        const unsubscribes = collections.map(col =>
            db.collection(col).onSnapshot(snapshot => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setters[col](data);
            }, error => {
                console.error(`Error fetching ${col}:`, error);
                addToast(`No se pudo cargar ${col}. La aplicación podría mostrar datos desactualizados.`, 'error');
            })
        );
        
        // Settings listener
        const unsubSettings = db.collection('settings').doc('config').onSnapshot(doc => {
            if (doc.exists) {
                setSettings(prev => ({ ...prev, ...doc.data() }));
            }
        });
        unsubscribes.push(unsubSettings);

        return () => unsubscribes.forEach(unsub => unsub());
    }, []);

    // --- Functions ---
    const addToast = (message: string, type: 'success' | 'error') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };
    const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

    const showConfirmation = (message: string, onConfirm: () => void, options: ConfirmationOptions = {}) => {
        onConfirmRef.current = onConfirm;
        setConfirmation({ isOpen: true, message, ...options });
    };
    const handleConfirm = () => {
        onConfirmRef.current?.();
        setConfirmation({ isOpen: false, message: '' });
    };
    const handleCancel = () => setConfirmation({ isOpen: false, message: '' });

    const login = async (email: string, pass: string) => {
        try {
            await auth.signInWithEmailAndPassword(email, pass);
        } catch (error) {
            addToast(getFirebaseErrorMessage(error), 'error');
            throw error;
        }
    };
    const logout = () => auth.signOut();

    const register = async (userData: Omit<User, 'id'>, pass: string) => {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(userData.email, pass);
            if (userCredential.user) {
                await db.collection('users').doc(userCredential.user.uid).set(userData);
            }
        } catch (error) {
            addToast(getFirebaseErrorMessage(error), 'error');
            throw error;
        }
    };
    
    // Generic function to add a document to a collection
    const addDocument = async (collection: string, data: object, successMsg: string) => {
        try {
            await db.collection(collection).add(data);
            addToast(successMsg, 'success');
        } catch (error) {
            addToast(getFirebaseErrorMessage(error), 'error');
            throw error;
        }
    };

    // Generic function to update a document in a collection
    const updateDocument = async (collection: string, docId: string, data: object, successMsg: string) => {
        try {
            await db.collection(collection).doc(docId).update(data);
            addToast(successMsg, 'success');
        } catch (error) {
            addToast(getFirebaseErrorMessage(error), 'error');
            throw error;
        }
    };

    // Generic function to delete a document from a collection
    const deleteDocument = async (collection: string, docId: string, successMsg: string) => {
        try {
            await db.collection(collection).doc(docId).delete();
            addToast(successMsg, 'success');
        } catch (error) {
            addToast(getFirebaseErrorMessage(error), 'error');
            throw error;
        }
    };
    
    // Bookings
    const addBooking = (booking: Omit<Booking, 'id'>) => addDocument('bookings', booking, '¡Reserva creada exitosamente!');
    const updateBooking = (booking: Booking) => updateDocument('bookings', booking.id, booking, 'Reserva actualizada.');
    const deleteBooking = (bookingId: string) => deleteDocument('bookings', bookingId, 'Reserva cancelada.');

    // Users
    const updateUser = (user: User) => updateDocument('users', user.id, user, 'Usuario actualizado.');
    const deleteUser = async (userId: string) => {
        try {
            await db.collection('users').doc(userId).delete();
            // Delete associated bookings
            const userBookings = await db.collection('bookings').where('userId', '==', userId).get();
            const batch = db.batch();
            userBookings.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            addToast('Usuario y sus reservas eliminados.', 'success');
        } catch (error) {
            addToast(getFirebaseErrorMessage(error), 'error');
            throw error;
        }
    };

    // Sectors
    const addSector = (name: string) => addDocument('sectors', { name }, 'Sector agregado.');
    const updateSector = (sector: Sector) => updateDocument('sectors', sector.id, sector, 'Sector actualizado.');
    const deleteSector = (id: string) => deleteDocument('sectors', id, 'Sector eliminado.');
    
    // Roles
    const addRole = (name: string) => addDocument('roles', { name }, 'Rol agregado.');
    const updateRole = (role: Role) => updateDocument('roles', role.id, role, 'Rol actualizado.');
    const deleteRole = (id: string) => deleteDocument('roles', id, 'Rol eliminado.');

    // Salas
    const addSala = (name: string, address: string) => addDocument('salas', { name, address }, 'Sala agregada.');
    const updateSala = (sala: Sala) => updateDocument('salas', sala.id, sala, 'Sala actualizada.');
    const deleteSala = async (id: string) => {
         try {
            await db.collection('salas').doc(id).delete();
            // Delete associated bookings
            const salaBookings = await db.collection('bookings').where('roomId', '==', id).get();
            const batch = db.batch();
            salaBookings.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            addToast('Sala y sus reservas eliminadas.', 'success');
        } catch (error) {
            addToast(getFirebaseErrorMessage(error), 'error');
            throw error;
        }
    };

    // FIX: Renamed function to avoid conflict with the `setSettings` state setter from `useState`.
    const updateAppSettings = async (newSettings: Partial<AppSettings>) => {
        try {
            await db.collection('settings').doc('config').set(newSettings, { merge: true });
            addToast('Configuración guardada.', 'success');
        } catch (error) {
            addToast(getFirebaseErrorMessage(error), 'error');
            throw error;
        }
    };
    
    // QR Modal
    const openQrModal = () => setIsQrModalOpen(true);
    const closeQrModal = () => setIsQrModalOpen(false);


    const value: AppContextType = {
        currentUser,
        users,
        sectors,
        roles,
        salas,
        bookings,
        logoUrl: settings.logoUrl,
        backgroundImageUrl: settings.backgroundImageUrl,
        homeBackgroundImageUrl: settings.homeBackgroundImageUrl,
        siteImageUrl: settings.siteImageUrl,
        adminSecretCode: settings.adminSecretCode,
        lastBookingDuration: settings.lastBookingDuration || 1,
        toasts,
        confirmation,
        isLoading,
        isPwaInstallable,
        isStandalone,
        pwaInstalledOnce,
        triggerPwaInstall,
        login,
        logout,
        register,
        addBooking,
        deleteBooking,
        updateBooking,
        updateUser,
        deleteUser,
        addSector,
        updateSector,
        deleteSector,
        addRole,
        updateRole,
        deleteRole,
        addSala,
        updateSala,
        deleteSala,
        setSettings: updateAppSettings,
        addToast,
        removeToast,
        showConfirmation,
        handleConfirm,
        handleCancel,
        isUpdateAvailable,
        applyUpdate,
        isQrModalOpen,
        openQrModal,
        closeQrModal
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};