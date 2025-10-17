import { createContext, useState, useEffect, ReactNode, FC, useCallback } from 'react';
import toast from 'react-hot-toast';
import { auth, db, FirebaseUser } from '../utils/firebase';
import { 
    AppContextType, User, Booking, Sala, Sector, Role, Settings,
    BeforeInstallPromptEvent, ConfirmationState 
} from '../types';
import {
    INITIAL_SALAS, INITIAL_ROLES, INITIAL_SECTORS, INITIAL_ADMIN_SECRET_CODE,
    DEFAULT_LOGO_URL, DEFAULT_BACKGROUND_URL, DEFAULT_HOME_BACKGROUND_URL, DEFAULT_SITE_IMAGE_URL
} from '../constants';

export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: FC<AppProviderProps> = ({ children }) => {
    // --- State Declarations ---
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    // Data collections
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [salas, setSalas] = useState<Sala[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    
    // Settings
    const [settings, setSettings] = useState<Settings>({
        adminSecretCode: INITIAL_ADMIN_SECRET_CODE,
        logoUrl: DEFAULT_LOGO_URL,
        backgroundImageUrl: DEFAULT_BACKGROUND_URL,
        homeBackgroundImageUrl: DEFAULT_HOME_BACKGROUND_URL,
        siteImageUrl: DEFAULT_SITE_IMAGE_URL
    });

    // UI State
    const [confirmationState, setConfirmationState] = useState<ConfirmationState>({ isOpen: false, message: '', onConfirm: () => {} });

    // PWA State
    const [pwaInstallPrompt, setPwaInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [pwaInstalledOnce, setPwaInstalledOnce] = useState(false);
    const [isManualInstallModalOpen, setIsManualInstallModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);

    // --- Utility Functions ---
    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        switch (type) {
            case 'success':
                toast.success(message);
                break;
            case 'error':
                toast.error(message);
                break;
            case 'info':
            default:
                toast(message);
                break;
        }
    };

    // --- Firebase Auth ---
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(fbUser => {
            setFirebaseUser(fbUser);
            if (!fbUser) {
                setUser(null);
                setLoading(false);
            }
            // User data will be fetched by another effect that depends on fbUser.
        });
        return () => unsubscribe();
    }, []);

    // --- Firestore Data Fetching ---
    useEffect(() => {
        if (!firebaseUser) {
            // No user logged in, clear user-specific data
            setUser(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        // Fetch current user's data
        const userDocSub = db.collection('users').doc(firebaseUser.uid).onSnapshot(doc => {
            if (doc.exists) {
                setUser({ id: doc.id, ...doc.data() } as User);
            } else {
                // This can happen if the user's Firestore doc was deleted but they are still authenticated
                setUser(null); 
                auth.signOut(); // Log them out to resolve state inconsistency
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user document:", error);
            addToast("Error al cargar los datos del usuario.", "error");
            setLoading(false);
        });

        return () => userDocSub();
    }, [firebaseUser]);

    // General data subscriptions (not dependent on a specific user)
    useEffect(() => {
        const unsubscribers = [
            db.collection('bookings').orderBy('createdAt', 'desc').onSnapshot(snapshot => 
                setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)))
            ),
            db.collection('users').onSnapshot(snapshot => 
                setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)))
            ),
            db.collection('salas').onSnapshot(snapshot => 
                setSalas(snapshot.docs.length > 0 ? snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sala)) : INITIAL_SALAS)
            ),
             db.collection('sectors').onSnapshot(snapshot => 
                setSectors(snapshot.docs.length > 0 ? snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sector)) : INITIAL_SECTORS)
            ),
             db.collection('roles').onSnapshot(snapshot => 
                setRoles(snapshot.docs.length > 0 ? snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role)) : INITIAL_ROLES)
            ),
            db.collection('settings').doc('app-config').onSnapshot(doc => {
                if (doc.exists) {
                    setSettings(prev => ({ ...prev, ...(doc.data() as Partial<Settings>) }));
                }
            })
        ];
        return () => unsubscribers.forEach(unsub => unsub());
    }, []);

     // --- PWA Installation Logic ---
    useEffect(() => {
        const beforeInstallPromptHandler = (e: Event) => {
            e.preventDefault();
            setPwaInstallPrompt(e as BeforeInstallPromptEvent);
        };

        window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

        const appInstalledHandler = () => {
             localStorage.setItem('pwaInstalledOnce', 'true');
             setPwaInstalledOnce(true);
             setPwaInstallPrompt(null);
        };
        window.addEventListener('appinstalled', appInstalledHandler);

        if (localStorage.getItem('pwaInstalledOnce') === 'true') {
            setPwaInstalledOnce(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
            window.removeEventListener('appinstalled', appInstalledHandler);
        };
    }, []);

    // --- Auth Functions ---
    const login = async (email: string, pass: string) => {
        try {
            await auth.signInWithEmailAndPassword(email, pass);
            addToast('¡Inicio de sesión exitoso!', 'success');
        } catch (error: any) {
            const message = error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' 
                ? 'Email o contraseña incorrectos.' 
                : 'Error al iniciar sesión.';
            addToast(message, 'error');
            throw error;
        }
    };
    
    const register = async (userData: Omit<User, 'id'>, pass: string) => {
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(userData.email, pass);
            const newUser = userCredential.user;
            if (!newUser) throw new Error("No se pudo crear el usuario.");
            
            await db.collection('users').doc(newUser.uid).set(userData);
            // The onAuthStateChanged listener will handle setting the user state
        } catch (error: any) {
            const message = error.code === 'auth/email-already-in-use' 
                ? 'El email ya está registrado.' 
                : 'Error al crear la cuenta.';
            addToast(message, 'error');
            throw error;
        }
    };

    const logout = () => {
        auth.signOut();
    };

    // --- CRUD Functions ---
    // A generic factory for simple add/update/delete could be used, but explicit is clearer.
    const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt'>) => {
        try {
            await db.collection('bookings').add({
                ...booking,
                createdAt: new Date()
            });
            addToast('Reserva creada con éxito.', 'success');
        } catch (error) {
            addToast('Error al crear la reserva.', 'error');
            throw error;
        }
    };

    const updateBooking = async (booking: Booking) => {
        const { id, ...data } = booking;
        try {
            await db.collection('bookings').doc(id).update(data);
            addToast('Reserva actualizada.', 'success');
        } catch (error) {
            addToast('Error al actualizar la reserva.', 'error');
            throw error;
        }
    };
    
    const deleteBooking = async (id: string) => {
        try {
            await db.collection('bookings').doc(id).delete();
            addToast('Reserva eliminada.', 'success');
        } catch (error) {
            addToast('Error al eliminar la reserva.', 'error');
            throw error;
        }
    };

    const addSala = async (name: string, address: string) => {
        try {
            await db.collection('salas').add({ name, address });
            addToast('Sala agregada.', 'success');
        } catch (error) {
            addToast('Error al agregar la sala.', 'error');
            throw error;
        }
    };

    const updateSala = async (sala: Sala) => {
        const { id, ...data } = sala;
        try {
            await db.collection('salas').doc(id).update(data);
            addToast('Sala actualizada.', 'success');
        } catch (error) {
            addToast('Error al actualizar la sala.', 'error');
            throw error;
        }
    };
    
    const deleteSala = async (id: string) => {
        try {
            await db.collection('salas').doc(id).delete();
            // Also delete associated bookings
            const bookingsSnapshot = await db.collection('bookings').where('roomId', '==', id).get();
            const batch = db.batch();
            bookingsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            addToast('Sala y sus reservas eliminadas.', 'success');
        } catch (error) {
            addToast('Error al eliminar la sala.', 'error');
            throw error;
        }
    };

    // Sectors, Roles... similar pattern
    const addSector = async (name: string) => { await db.collection('sectors').add({ name }); };
    const updateSector = async (sector: Sector) => { await db.collection('sectors').doc(sector.id).update({ name: sector.name }); };
    const deleteSector = async (id: string) => { await db.collection('sectors').doc(id).delete(); };

    const addRole = async (name: string) => { await db.collection('roles').add({ name }); };
    const updateRole = async (role: Role) => { await db.collection('roles').doc(role.id).update({ name: role.name }); };
    const deleteRole = async (id: string) => { await db.collection('roles').doc(id).delete(); };
    
    const updateUser = async (updatedUser: User) => {
        const { id, ...data } = updatedUser;
        try {
            await db.collection('users').doc(id).update(data);
            addToast('Usuario actualizado.', 'success');
        } catch (error) {
             addToast('Error al actualizar usuario.', 'error');
            throw error;
        }
    };
    
    const deleteUser = async (id: string) => {
        try {
            await db.collection('users').doc(id).delete();
            addToast('Usuario eliminado de la base de datos.', 'success');
        } catch (error) {
            addToast('Error al eliminar usuario.', 'error');
            throw error;
        }
    };

    const updateAppSettings = async (newSettings: Partial<Pick<Settings, 'adminSecretCode'>>) => {
        try {
            await db.collection('settings').doc('app-config').set(newSettings, { merge: true });
            addToast('Configuración guardada.', 'success');
        } catch (error) {
            addToast('Error al guardar la configuración.', 'error');
            throw error;
        }
    };


    // --- UI Functions ---
    const showConfirmation = (message: string, onConfirm: () => void | Promise<void>) => {
        setConfirmationState({ isOpen: true, message, onConfirm });
    };

    const closeConfirmation = () => {
        setConfirmationState({ isOpen: false, message: '', onConfirm: () => {} });
    };

    const triggerPwaInstall = useCallback(() => {
        if (pwaInstallPrompt) {
            pwaInstallPrompt.prompt();
            // The browser will handle the rest. We listen for the 'appinstalled' event.
        } else {
            // If no prompt is available, show manual instructions
            setIsManualInstallModalOpen(true);
        }
    }, [pwaInstallPrompt]);
    

    // --- Context Value ---
    const value: AppContextType = {
        user, firebaseUser, loading,
        login, register, logout,
        bookings, users, salas, sectors, roles,
        logoUrl: settings.logoUrl,
        backgroundImageUrl: settings.backgroundImageUrl,
        homeBackgroundImageUrl: settings.homeBackgroundImageUrl,
        siteImageUrl: settings.siteImageUrl,
        adminSecretCode: settings.adminSecretCode,
        setSettings: updateAppSettings,
        addBooking, updateBooking, deleteBooking,
        addSala, updateSala, deleteSala,
        addSector, updateSector, deleteSector,
        addRole, updateRole, deleteRole,
        updateUser, deleteUser,
        addToast,
        showConfirmation, confirmationState, closeConfirmation,
        isPwaInstallable: !!pwaInstallPrompt,
        pwaInstallPrompt,
        triggerPwaInstall,
        pwaInstalledOnce,
        isManualInstallModalOpen,
        openManualInstallModal: () => setIsManualInstallModalOpen(true),
        closeManualInstallModal: () => setIsManualInstallModalOpen(false),
        isQrModalOpen,
        openQrModal: () => setIsQrModalOpen(true),
        closeQrModal: () => setIsQrModalOpen(false)
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};