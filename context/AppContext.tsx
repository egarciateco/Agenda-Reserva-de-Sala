

import { createContext, useState, useEffect, FC, ReactNode, useCallback } from 'react';
import toast from 'react-hot-toast';
import { auth, db } from '../utils/firebase';
import type { FirebaseUser } from '../utils/firebase';
import { 
    AppContextType, User, Booking, Sala, Sector, Role, Settings, 
    ConfirmationState, BeforeInstallPromptEvent 
} from '../types';
import { 
    DEFAULT_LOGO_URL, DEFAULT_BACKGROUND_URL, DEFAULT_HOME_BACKGROUND_URL, 
    DEFAULT_SITE_IMAGE_URL, INITIAL_ADMIN_SECRET_CODE, INITIAL_SALAS, 
    INITIAL_ROLES, INITIAL_SECTORS 
} from '../constants';
import { playSuccessSound } from '../utils/helpers';

// FIX: Create the context with a default undefined value, which is checked in the useAppContext hook.
export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: FC<AppProviderProps> = ({ children }) => {
    // State
    const [user, setUser] = useState<User | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [salas, setSalas] = useState<Sala[]>([]);
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    
    // Settings
    const [settings, setSettingsState] = useState<Settings>({
        logoUrl: DEFAULT_LOGO_URL,
        backgroundImageUrl: DEFAULT_BACKGROUND_URL,
        homeBackgroundImageUrl: DEFAULT_HOME_BACKGROUND_URL,
        siteImageUrl: DEFAULT_SITE_IMAGE_URL,
        adminSecretCode: INITIAL_ADMIN_SECRET_CODE
    });

    // UI State
    const [confirmationState, setConfirmationState] = useState<ConfirmationState>({ isOpen: false, message: '', onConfirm: () => {} });
    
    // PWA State
    const [pwaInstallPrompt, setPwaInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isPwaInstallable, setIsPwaInstallable] = useState(false);
    const [pwaInstalledOnce, setPwaInstalledOnce] = useState(localStorage.getItem('pwaInstalled') === 'true');
    const [isManualInstallModalOpen, setIsManualInstallModalOpen] = useState(false);
    
    // QR Modal State
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    
    // Toast helper
    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        switch(type) {
            case 'success':
                toast.success(message);
                playSuccessSound();
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

    // --- PWA Installation Logic ---
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setPwaInstallPrompt(e as BeforeInstallPromptEvent);
            setIsPwaInstallable(true);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const triggerPwaInstall = () => {
        if (pwaInstallPrompt) {
            pwaInstallPrompt.prompt();
            pwaInstallPrompt.userChoice.then(choiceResult => {
                if (choiceResult.outcome === 'accepted') {
                    addToast('¡Aplicación instalada con éxito!', 'success');
                    localStorage.setItem('pwaInstalled', 'true');
                    setPwaInstalledOnce(true);
                }
                setIsPwaInstallable(false);
                setPwaInstallPrompt(null);
            });
        }
    };

    // --- Auth Logic ---
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
                const userDoc = await db.collection('users').doc(fbUser.uid).get();
                if (userDoc.exists) {
                    setUser({ id: userDoc.id, ...userDoc.data() } as User);
                } else {
                    // User exists in auth but not in firestore, log them out
                    await auth.signOut();
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // --- Data Fetching ---
    useEffect(() => {
        if (!user) {
            setBookings([]);
            setUsers([]);
            return;
        };

        const unsubscribers = [
            db.collection('bookings').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
                const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
                setBookings(bookingsData);
            }),
            db.collection('users').onSnapshot(snapshot => {
                const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
                setUsers(usersData);
            }),
            db.collection('salas').onSnapshot(snapshot => {
                if (snapshot.empty) {
                    // Seed initial data
                    const batch = db.batch();
                    INITIAL_SALAS.forEach(sala => {
                        const docRef = db.collection('salas').doc(sala.id);
                        batch.set(docRef, { name: sala.name, address: sala.address });
                    });
                    batch.commit().then(() => setSalas(INITIAL_SALAS));
                } else {
                    const salasData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sala));
                    setSalas(salasData);
                }
            }),
            db.collection('sectors').onSnapshot(snapshot => {
                 if (snapshot.empty) {
                    const batch = db.batch();
                    INITIAL_SECTORS.forEach(sector => {
                        const docRef = db.collection('sectors').doc(sector.id);
                        batch.set(docRef, { name: sector.name });
                    });
                    batch.commit().then(() => setSectors(INITIAL_SECTORS));
                } else {
                    const sectorsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sector));
                    setSectors(sectorsData);
                }
            }),
            db.collection('roles').onSnapshot(snapshot => {
                 if (snapshot.empty) {
                    const batch = db.batch();
                    INITIAL_ROLES.forEach(role => {
                        const docRef = db.collection('roles').doc(role.id);
                        batch.set(docRef, { name: role.name });
                    });
                    batch.commit().then(() => setRoles(INITIAL_ROLES));
                } else {
                    const rolesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
                    setRoles(rolesData);
                }
            }),
            db.collection('settings').doc('main').onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data() as Partial<Settings>;
                    setSettingsState(prev => ({ ...prev, ...data }));
                } else {
                    // Seed initial settings
                    db.collection('settings').doc('main').set({ adminSecretCode: INITIAL_ADMIN_SECRET_CODE });
                }
            })
        ];

        return () => unsubscribers.forEach(unsub => unsub());
    }, [user]);

    // --- Context Methods ---
    
    // Auth
    const login = async (email: string, pass: string) => {
        try {
            await auth.signInWithEmailAndPassword(email, pass);
            addToast('Sesión iniciada correctamente', 'success');
        } catch (error: any) {
            addToast(error.message || 'Error al iniciar sesión.', 'error');
            throw error;
        }
    };
    // FIX: The `userData` parameter type was changed from Omit<User, 'id' | 'email'> to Omit<User, 'id'>.
    // This makes the `email` property available for creating the auth user and for storing in Firestore, resolving both type errors.
    const register = async (userData: Omit<User, 'id'>, pass: string) => {
        try {
            const { user: fbUser } = await auth.createUserWithEmailAndPassword(userData.email, pass);
            if (!fbUser) throw new Error('No se pudo crear el usuario.');
            
            const newUser: Omit<User, 'id'> = {
                ...userData,
            };
            await db.collection('users').doc(fbUser.uid).set(newUser);
            addToast('Usuario registrado con éxito', 'success');
        } catch (error: any) {
            addToast(error.message || 'Error al registrarse.', 'error');
            throw error;
        }
    };
    const logout = () => auth.signOut();

    // Settings
    const setSettings = async (newSettings: Partial<Settings>) => {
        try {
            await db.collection('settings').doc('main').set(newSettings, { merge: true });
            addToast('Configuración guardada.', 'success');
        } catch (error: any) {
            addToast('Error al guardar la configuración.', 'error');
            throw error;
        }
    };

    // CRUD
    const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt'>) => {
        try {
             // Check for overlapping bookings
            const existingBookingQuery = await db.collection('bookings')
                .where('roomId', '==', booking.roomId)
                .where('date', '==', booking.date)
                .where('startTime', '==', booking.startTime)
                .get();

            if (!existingBookingQuery.empty) {
                addToast('Este horario ya ha sido reservado. Por favor, actualiza la agenda.', 'error');
                throw new Error('Slot already booked');
            }

            await db.collection('bookings').add({ ...booking, createdAt: new Date() });
            addToast('Reserva creada con éxito.', 'success');
        } catch (error) {
            // Re-throw the error so the calling component can handle it (e.g., close modal)
            throw error;
        }
    };
    const updateBooking = async (booking: Booking) => {
        try {
            const { id, ...data } = booking;
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

    const addSala = (name: string, address: string) => db.collection('salas').add({ name, address }).then(() => addToast('Sala agregada', 'success')).catch(() => addToast('Error', 'error'));
    const updateSala = (sala: Sala) => db.collection('salas').doc(sala.id).update(sala).then(() => addToast('Sala actualizada', 'success')).catch(() => addToast('Error', 'error'));
    const deleteSala = async (id: string) => {
        try {
            await db.collection('salas').doc(id).delete();
            // Also delete bookings associated with this sala
            const bookingsSnapshot = await db.collection('bookings').where('roomId', '==', id).get();
            const batch = db.batch();
            bookingsSnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            addToast('Sala y sus reservas eliminadas.', 'success');
        } catch (error) {
            addToast('Error al eliminar la sala.', 'error');
            throw error;
        }
    };

    const addSector = (name: string) => db.collection('sectors').add({ name }).then(() => addToast('Sector agregado', 'success')).catch(() => addToast('Error', 'error'));
    const updateSector = (sector: Sector) => db.collection('sectors').doc(sector.id).update(sector).then(() => addToast('Sector actualizado', 'success')).catch(() => addToast('Error', 'error'));
    const deleteSector = (id: string) => db.collection('sectors').doc(id).delete().then(() => addToast('Sector eliminado', 'success')).catch(() => addToast('Error', 'error'));

    const addRole = (name: string) => db.collection('roles').add({ name }).then(() => addToast('Rol agregado', 'success')).catch(() => addToast('Error', 'error'));
    const updateRole = (role: Role) => db.collection('roles').doc(role.id).update(role).then(() => addToast('Rol actualizado', 'success')).catch(() => addToast('Error', 'error'));
    const deleteRole = (id: string) => db.collection('roles').doc(id).delete().then(() => addToast('Rol eliminado', 'success')).catch(() => addToast('Error', 'error'));
    
    const updateUser = (userToUpdate: User) => db.collection('users').doc(userToUpdate.id).update(userToUpdate).then(() => addToast('Usuario actualizado', 'success')).catch(() => addToast('Error', 'error'));
    const deleteUser = async (id: string) => {
        try {
            await db.collection('users').doc(id).delete();
            const bookingsSnapshot = await db.collection('bookings').where('userId', '==', id).get();
            const batch = db.batch();
            bookingsSnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            addToast('Usuario y sus reservas eliminados.', 'success');
        } catch (error) {
            addToast('Error al eliminar el usuario.', 'error');
            throw error;
        }
    };

    // UI
    const showConfirmation = (message: string, onConfirm: () => void | Promise<void>) => setConfirmationState({ isOpen: true, message, onConfirm });
    const closeConfirmation = () => setConfirmationState({ isOpen: false, message: '', onConfirm: () => {} });

    const openManualInstallModal = () => setIsManualInstallModalOpen(true);
    const closeManualInstallModal = () => setIsManualInstallModalOpen(false);

    const openQrModal = () => setIsQrModalOpen(true);
    const closeQrModal = () => setIsQrModalOpen(false);

    const contextValue: AppContextType = {
        user,
        firebaseUser,
        loading,
        login,
        register,
        logout,
        bookings,
        users,
        salas,
        sectors,
        roles,
        logoUrl: settings.logoUrl,
        backgroundImageUrl: settings.backgroundImageUrl,
        homeBackgroundImageUrl: settings.homeBackgroundImageUrl,
        siteImageUrl: settings.siteImageUrl,
        adminSecretCode: settings.adminSecretCode,
        setSettings,
        addBooking,
        updateBooking,
        deleteBooking,
        addSala,
        updateSala,
        deleteSala,
        addSector,
        updateSector,
        deleteSector,
        addRole,
        updateRole,
        deleteRole,
        updateUser,
        deleteUser,
        addToast,
        showConfirmation,
        confirmationState,
        closeConfirmation,
        isPwaInstallable,
        pwaInstallPrompt,
        triggerPwaInstall,
        pwaInstalledOnce,
        isManualInstallModalOpen,
        openManualInstallModal,
        closeManualInstallModal,
        isQrModalOpen,
        openQrModal,
        closeQrModal,
    };

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};