import { createContext, useState, useEffect, FC, ReactNode } from 'react';
import { toast } from 'react-hot-toast';
import { auth, db } from '../utils/firebase';
import { getFirebaseErrorMessage } from '../utils/helpers';
import { 
    AppContextType, User, Booking, Sala, Sector, Role, Settings, 
    BeforeInstallPromptEvent, ConfirmationState 
} from '../types';
import { 
    DEFAULT_LOGO_URL, DEFAULT_BACKGROUND_URL, DEFAULT_HOME_BACKGROUND_URL, DEFAULT_SITE_IMAGE_URL,
    INITIAL_ADMIN_SECRET_CODE, INITIAL_SALAS, INITIAL_SECTORS, INITIAL_ROLES
} from '../constants';
// FIX: Changed to a default import for Firebase compat which correctly exposes types like `firebase.User`.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: FC<{ children: ReactNode }> = ({ children }) => {
    // State
    // FIX: The correct user type from the compat library is `firebase.User`.
    const [firebaseUser, setFirebaseUser] = useState<firebase.User | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    // Data collections
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [salas, setSalas] = useState<Sala[]>(INITIAL_SALAS);
    const [sectors, setSectors] = useState<Sector[]>(INITIAL_SECTORS);
    const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
    const [settings, setSettings] = useState<Settings>({
        adminSecretCode: INITIAL_ADMIN_SECRET_CODE,
        logoUrl: DEFAULT_LOGO_URL,
        backgroundImageUrl: DEFAULT_BACKGROUND_URL,
        homeBackgroundImageUrl: DEFAULT_HOME_BACKGROUND_URL,
        siteImageUrl: DEFAULT_SITE_IMAGE_URL
    });

    // UI State
    const [confirmationState, setConfirmationState] = useState<ConfirmationState>({ isOpen: false, message: '', onConfirm: () => {} });
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isManualInstallModalOpen, setIsManualInstallModalOpen] = useState(false);
    
    // PWA State
    const [pwaInstallPrompt, setPwaInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [pwaInstalledOnce, setPwaInstalledOnce] = useState(localStorage.getItem('pwaInstalled') === 'true');


    const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        switch (type) {
            case 'success': toast.success(message); break;
            case 'error': toast.error(message); break;
            default: toast(message); break;
        }
    };

    // --- Auth ---
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (fbUser) => {
            setFirebaseUser(fbUser);
            if (fbUser) {
                const userDoc = await db.collection('users').doc(fbUser.uid).get();
                if (userDoc.exists) {
                    setUser({ id: userDoc.id, ...userDoc.data() } as User);
                } else {
                    setUser(null); // User exists in auth but not firestore, log them out
                    auth.signOut();
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const login = async (email: string, pass: string) => {
        try {
            await auth.signInWithEmailAndPassword(email, pass);
            addToast('¡Bienvenido de nuevo!', 'success');
        } catch (error) {
            addToast(getFirebaseErrorMessage(error), 'error');
            throw error;
        }
    };

    const register = async (userData: Omit<User, 'id'>, pass: string) => {
        try {
            const { user: newFirebaseUser } = await auth.createUserWithEmailAndPassword(userData.email, pass);
            if (!newFirebaseUser) throw new Error('Failed to create user.');
            
            const newUser: Omit<User, 'id'> = {
                ...userData,
                email: userData.email.toLowerCase(),
            };

            await db.collection('users').doc(newFirebaseUser.uid).set(newUser);
            // The onAuthStateChanged listener will handle setting the user state.
        } catch (error) {
            addToast(getFirebaseErrorMessage(error), 'error');
            throw error;
        }
    };
    
    const logout = () => {
        auth.signOut();
    };

    // --- Firestore Listeners ---
    useEffect(() => {
        const collections = ['salas', 'sectors', 'roles', 'bookings', 'users', 'settings'];
        const setters:any = {
            salas: (data: Sala[]) => setSalas(data.length > 0 ? data : INITIAL_SALAS),
            sectors: (data: Sector[]) => setSectors(data.length > 0 ? data : INITIAL_SECTORS),
            roles: (data: Role[]) => setRoles(data.length > 0 ? data : INITIAL_ROLES),
            bookings: setBookings,
            users: setUsers,
            settings: (data: Settings[]) => {
                if (data.length > 0 && data[0]) {
                    setSettings(prev => ({ ...prev, ...data[0] }));
                }
            }
        };

        const unsubscribers = collections.map(col => 
            db.collection(col).onSnapshot(
                snapshot => {
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setters[col](data);
                },
                error => {
                    console.error(`Error fetching ${col}: `, error);
                    addToast(`Error al cargar ${col}. Podrías ver datos desactualizados.`, 'error');
                }
            )
        );
        return () => unsubscribers.forEach(unsub => unsub());
    }, []);

    // --- Generic CRUD Factory ---
    const createCrudFunctions = <T extends { id: string }>(collectionName: string) => ({
        add: async (data: Omit<T, 'id'>) => db.collection(collectionName).add(data),
        update: async (item: T) => db.collection(collectionName).doc(item.id).update(item),
        delete: async (id: string) => db.collection(collectionName).doc(id).delete(),
    });

    const salaCRUD = createCrudFunctions<Sala>('salas');
    const sectorCRUD = createCrudFunctions<Sector>('sectors');
    const roleCRUD = createCrudFunctions<Role>('roles');
    const userCRUD = createCrudFunctions<User>('users');
    const bookingCRUD = createCrudFunctions<Booking>('bookings');


    // --- PWA Installation Logic ---
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setPwaInstallPrompt(e as BeforeInstallPromptEvent);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, []);

    const triggerPwaInstall = () => {
        if (!pwaInstallPrompt) return;
        pwaInstallPrompt.prompt();
        pwaInstallPrompt.userChoice.then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
                addToast('¡Aplicación instalada con éxito!', 'success');
                localStorage.setItem('pwaInstalled', 'true');
                setPwaInstalledOnce(true);
            }
            setPwaInstallPrompt(null);
        });
    };
    
    // --- Context Value ---
    const value: AppContextType = {
        // State
        user, firebaseUser, loading,
        bookings, users, salas, sectors, roles,
        // Settings
        logoUrl: settings.logoUrl,
        backgroundImageUrl: settings.backgroundImageUrl,
        homeBackgroundImageUrl: settings.homeBackgroundImageUrl,
        siteImageUrl: settings.siteImageUrl,
        adminSecretCode: settings.adminSecretCode,
        setSettings: async (newSettings) => {
             try {
                // There's only one settings doc.
                const settingsRef = db.collection('settings').doc('appConfig');
                await settingsRef.set(newSettings, { merge: true });
                addToast('Configuración guardada.', 'success');
            } catch (error) {
                addToast(getFirebaseErrorMessage(error), 'error');
                throw error;
            }
        },
        // Auth
        login, register, logout,
        // CRUD
        addBooking: async (booking) => { await bookingCRUD.add({ ...booking, createdAt: new Date() } as any); },
        updateBooking: bookingCRUD.update,
        deleteBooking: bookingCRUD.delete,
        
        addSala: async (name, address) => { await salaCRUD.add({ name, address } as any); },
        updateSala: salaCRUD.update,
        deleteSala: async (id) => {
            // Also delete bookings for this sala
            const batch = db.batch();
            const bookingsSnapshot = await db.collection('bookings').where('roomId', '==', id).get();
            bookingsSnapshot.forEach(doc => batch.delete(doc.ref));
            batch.delete(db.collection('salas').doc(id));
            await batch.commit();
        },

        addSector: async (name) => { await sectorCRUD.add({ name } as any); },
        updateSector: sectorCRUD.update,
        deleteSector: sectorCRUD.delete,

        addRole: async (name) => { await roleCRUD.add({ name } as any); },
        updateRole: roleCRUD.update,
        deleteRole: roleCRUD.delete,

        updateUser: userCRUD.update,
        deleteUser: userCRUD.delete, // Note: This doesn't delete from Firebase Auth. That requires admin SDK.

        // UI
        addToast,
        showConfirmation: (message, onConfirm) => setConfirmationState({ isOpen: true, message, onConfirm }),
        confirmationState,
        closeConfirmation: () => setConfirmationState({ isOpen: false, message: '', onConfirm: () => {} }),

        // PWA
        isPwaInstallable: !!pwaInstallPrompt,
        pwaInstallPrompt,
        triggerPwaInstall,
        pwaInstalledOnce,
        isManualInstallModalOpen,
        openManualInstallModal: () => setIsManualInstallModalOpen(true),
        closeManualInstallModal: () => setIsManualInstallModalOpen(false),
        
        // QR Modal
        isQrModalOpen,
        openQrModal: () => setIsQrModalOpen(true),
        closeQrModal: () => setIsQrModalOpen(false),
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
};