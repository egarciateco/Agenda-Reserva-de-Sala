import { createContext, useState, useEffect, useCallback, FC, ReactNode, useRef } from 'react';
// FIX: Removed Firebase v9 modular imports for auth as they were causing errors. The app is likely using Firebase v8.
// import {
//     createUserWithEmailAndPassword,
//     onAuthStateChanged,
//     signInWithEmailAndPassword,
//     signOut,
// } from 'firebase/auth';
// FIX: Removed Firebase v9 modular imports for firestore as they were causing errors. The app is likely using Firebase v8.
// import {
//     collection,
//     doc,
//     getDoc,
//     onSnapshot,
//     setDoc,
//     addDoc,
//     updateDoc,
//     deleteDoc,
//     writeBatch,
//     query,
//     where,
//     getDocs,
// } from 'firebase/firestore';
import { User, Sector, Role, Booking, AppSettings, ToastMessage, AppContextType, ConfirmationState, Sala, ConfirmationOptions } from '../types';
import { INITIAL_ROLES, INITIAL_SECTORS, DEFAULT_LOGO_URL, DEFAULT_BACKGROUND_URL, INITIAL_ADMIN_SECRET_CODE, DEFAULT_HOME_BACKGROUND_URL, INITIAL_SALAS, DEFAULT_SITE_IMAGE_URL } from '../constants';
import { getFirebaseErrorMessage } from '../utils/helpers';
import { auth, db } from '../utils/firebase';

declare global {
    interface Window {
        emailjs: any;
        deferredInstallPrompt: any;
    }
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

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
    });
    
    const onConfirmRef = useRef<(() => void) | null>(null);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorkerRegistration | null>(null);
    const isRegistering = useRef(false);

    // --- PWA Installation State ---
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isPwaInstallable = !!deferredInstallPrompt && !isStandalone;
    const [pwaInstalledOnce, setPwaInstalledOnce] = useState(() => {
        try {
            return localStorage.getItem('pwaInstalled') === 'true';
        } catch {
            return false;
        }
    });

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        if (type === 'success') {
            playNotificationSound();
        }
    }, []);

    // --- PWA Install Logic ---
    useEffect(() => {
        const handler = (e: CustomEvent) => {
            // The event detail contains the original `beforeinstallprompt` event.
            setDeferredInstallPrompt(e.detail);
        };
        // Listen for the custom event dispatched from the global handler in index.tsx
        window.addEventListener('pwa-install-ready', handler as EventListener);
        // Cleanup the listener when the component unmounts.
        return () => window.removeEventListener('pwa-install-ready', handler as EventListener);
    }, []); // Empty dependency array ensures this runs only once.

    const triggerPwaInstall = () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                    addToast('¡Aplicación instalada con éxito!', 'success');
                    localStorage.setItem('pwaInstalled', 'true');
                    setPwaInstalledOnce(true);
                }
                setDeferredInstallPrompt(null);
            });
        }
    };
    
    // --- PWA Update Logic ---
    useEffect(() => {
        const handleUpdate = (event: Event) => {
            const registration = (event as CustomEvent).detail;
            setIsUpdateAvailable(true);
            setWaitingWorker(registration);
        };
        window.addEventListener('sw-update', handleUpdate);
        return () => window.removeEventListener('sw-update', handleUpdate);
    }, []);

    const applyUpdate = () => {
        if (waitingWorker && waitingWorker.waiting) {
            waitingWorker.waiting.postMessage({ type: 'SKIP_WAITING' });
            setTimeout(() => window.location.reload(), 1000);
        }
    };
    
    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showConfirmation = (message: string, onConfirm: () => void, options: ConfirmationOptions = {}) => {
        onConfirmRef.current = onConfirm;
        setConfirmation({ isOpen: true, message, ...options });
    };

    const handleConfirm = () => {
        onConfirmRef.current?.();
        handleCancel();
    };

    const handleCancel = () => {
        setConfirmation({ isOpen: false, message: '' });
        onConfirmRef.current = null;
    };

    const handleFirestoreError = (err: any, context: string) => {
        console.error(`Firestore Error (${context}):`, String(err));
        addToast(getFirebaseErrorMessage(err), 'error');
    };
    
    const handleAuthError = (err: any, context: string) => {
        console.error(`Auth Error (${context}):`, String(err));
        addToast(getFirebaseErrorMessage(err), 'error');
        throw err;
    };

    useEffect(() => {
        const pollForUserDocument = async (uid: string, retries = 5, delay = 500): Promise<User | null> => {
            for (let i = 0; i < retries; i++) {
                const userDoc = await db.collection('users').doc(uid).get();
                if (userDoc.exists) {
                    return { id: userDoc.id, ...userDoc.data() } as User;
                }
                await new Promise(resolve => setTimeout(resolve, delay));
            }
            return null;
        };
    
        const unsubscribe = auth.onAuthStateChanged(async (userAuth) => {
            setIsLoading(true); // Start loading on any auth state change
            if (userAuth) {
                const userDoc = await db.collection('users').doc(userAuth.uid).get();
    
                if (userDoc.exists) {
                    setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
                    isRegistering.current = false; // A doc exists, so registration is complete.
                } else if (isRegistering.current) {
                    // If we are in a registration flow, poll for the document.
                    console.log("Registration in progress, polling for user document...");
                    const userFromPoll = await pollForUserDocument(userAuth.uid);
                    if (userFromPoll) {
                        setCurrentUser(userFromPoll);
                    } else {
                        console.error("Failed to find user document after registration. Logging out.");
                        await auth.signOut();
                    }
                    isRegistering.current = false; // Reset flag after polling attempt.
                } else {
                    // User is authenticated, but no document exists, and not a registration flow.
                    console.warn("User document not found for an existing user session. Logging out.");
                    await auth.signOut();
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    // --- Data Subscriptions ---
    useEffect(() => {
        const unsub = (collectionName: string, setter: Function, initialData?: any[]) => {
            // FIX: Use Firebase v8 namespaced API to create a collection query.
            const q = db.collection(collectionName);
            // FIX: Use Firebase v8 namespaced API to listen for snapshot changes.
            return q.onSnapshot(async (snapshot) => {
                if (snapshot.empty && initialData) {
                    // FIX: Use Firebase v8 namespaced API for write batch.
                    const batch = db.batch();
                    initialData.forEach(item => {
                        // FIX: Use Firebase v8 namespaced API to get a document reference.
                        const docRef = db.collection(collectionName).doc(item.id);
                        batch.set(docRef, item);
                    });
                    await batch.commit();
                } else {
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setter(data);
                }
            }, err => handleFirestoreError(err, `fetch ${collectionName}`));
        };

        const unsubs = [
            unsub('users', setUsers),
            unsub('sectors', setSectors, INITIAL_SECTORS),
            unsub('roles', setRoles, INITIAL_ROLES),
            unsub('salas', setSalas, INITIAL_SALAS),
            unsub('bookings', setBookings),
        ];

        // FIX: Use Firebase v8 namespaced API to listen for document snapshot changes.
        const settingsUnsub = db.collection('config').doc('settings').onSnapshot(doc => {
            if (doc.exists) {
                setSettingsState(prev => ({ ...prev, ...doc.data() }));
            }
        }, err => handleFirestoreError(err, 'fetch settings'));
        unsubs.push(settingsUnsub);
        
        return () => unsubs.forEach(u => u());
    }, []);

    // --- Auth Functions ---
    const login = async (email: string, pass: string) => {
        try {
            // FIX: Use Firebase v8 namespaced API for signing in.
            await auth.signInWithEmailAndPassword(email, pass);
        } catch (err) {
            handleAuthError(err, 'login');
        }
    };
    // FIX: Use Firebase v8 namespaced API for signing out.
    const logout = () => auth.signOut();
    const register = async (user: Omit<User, 'id'>, pass: string) => {
        isRegistering.current = true; // Signal that a registration process has started.
        try {
            const { user: userAuth } = await auth.createUserWithEmailAndPassword(user.email, pass);
            if (userAuth) {
                // Create a clean user object to ensure no unexpected properties are sent.
                const userDocumentData = {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    sector: user.sector,
                    role: user.role,
                };
                // Create the user document in Firestore.
                await db.collection('users').doc(userAuth.uid).set(userDocumentData);
    
                // After successful registration and document creation, sign the user out
                // as per the requirement to return to the login screen instead of auto-logging in.
                await auth.signOut();
            }
        } catch (err) {
            // Let handleAuthError show the toast and re-throw
            handleAuthError(err, 'register');
        } finally {
            // Ensure the registration flag is reset whether it succeeds or fails.
            isRegistering.current = false;
        }
    };

    // --- Generic Firestore Functions ---
    const crud = <T extends {id: string}>(collectionName: string) => ({
        add: async (data: Omit<T, 'id'>) => {
            try {
                // FIX: Use Firebase v8 namespaced API for adding a document.
                await db.collection(collectionName).add(data);
            } catch (err) {
                handleFirestoreError(err, `add ${collectionName}`);
            }
        },
        update: async (item: T) => {
            try {
                // FIX: Use Firebase v8 namespaced API for updating a document.
                await db.collection(collectionName).doc(item.id).update(item as {[x: string]: any});
            } catch(err) {
                handleFirestoreError(err, `update ${collectionName}`);
            }
        },
        delete: async (id: string) => {
            try {
                // FIX: Use Firebase v8 namespaced API for deleting a document.
                await db.collection(collectionName).doc(id).delete();
            } catch(err) {
                handleFirestoreError(err, `delete ${collectionName}`);
            }
        },
    });

    const bookingsCrud = crud<Booking>('bookings');
    const usersCrud = crud<User>('users');
    const sectorsCrud = crud<Sector>('sectors');
    const rolesCrud = crud<Role>('roles');
    const salasCrud = crud<Sala>('salas');

    // --- App-specific Functions ---
    const addBooking = async (booking: Omit<Booking, 'id'>) => {
        await bookingsCrud.add(booking);
        addToast('¡Reserva creada exitosamente!', 'success');
    };
    const updateBooking = (booking: Booking) => bookingsCrud.update(booking).then(() => addToast('Reserva actualizada.', 'success'));
    const deleteBooking = (bookingId: string) => bookingsCrud.delete(bookingId).then(() => addToast('Reserva eliminada.', 'success'));

    const updateUser = (user: User) => usersCrud.update(user).then(() => addToast('Usuario actualizado.', 'success'));
    const deleteUser = async (userId: string) => {
        try {
            // FIX: Use Firebase v8 namespaced API for write batch.
            const batch = db.batch();
            // FIX: Use Firebase v8 namespaced API for querying documents.
            const bookingsQuery = db.collection('bookings').where('userId', '==', userId);
            // FIX: Use Firebase v8 namespaced API for getting query snapshot.
            const userBookingsSnapshot = await bookingsQuery.get();
            userBookingsSnapshot.forEach(doc => batch.delete(doc.ref));
            
            // FIX: Use Firebase v8 namespaced API to get a document reference.
            const userRef = db.collection('users').doc(userId);
            batch.delete(userRef);
            
            await batch.commit();
            addToast('Usuario y sus reservas eliminados.', 'success');
        } catch (err) {
            handleFirestoreError(err, 'delete user cascade');
        }
    };

    const addSector = (name: string) => sectorsCrud.add({ name } as any).then(() => addToast('Sector agregado.', 'success'));
    const updateSector = (sector: Sector) => sectorsCrud.update(sector).then(() => addToast('Sector actualizado.', 'success'));
    const deleteSector = (sectorId: string) => sectorsCrud.delete(sectorId).then(() => addToast('Sector eliminado.', 'success'));

    const addRole = (name: string) => rolesCrud.add({ name } as any).then(() => addToast('Rol agregado.', 'success'));
    const updateRole = (role: Role) => rolesCrud.update(role).then(() => addToast('Rol actualizado.', 'success'));
    const deleteRole = (roleId: string) => rolesCrud.delete(roleId).then(() => addToast('Rol eliminado.', 'success'));
    
    const addSala = (name: string, address: string) => salasCrud.add({ name, address } as any).then(() => addToast('Sala agregada.', 'success'));
    const updateSala = (sala: Sala) => salasCrud.update(sala).then(() => addToast('Sala actualizada.', 'success'));
    const deleteSala = async (salaId: string) => {
        try {
            // FIX: Use Firebase v8 namespaced API for write batch.
            const batch = db.batch();
            // FIX: Use Firebase v8 namespaced API for querying documents.
            const bookingsQuery = db.collection('bookings').where('roomId', '==', salaId);
            // FIX: Use Firebase v8 namespaced API for getting query snapshot.
            const salaBookingsSnapshot = await bookingsQuery.get();
            salaBookingsSnapshot.forEach(doc => batch.delete(doc.ref));
            // FIX: Use Firebase v8 namespaced API to get a document reference.
            const salaRef = db.collection('salas').doc(salaId);
            batch.delete(salaRef);
            await batch.commit();
            addToast('Sala y sus reservas eliminadas.', 'success');
        } catch (err) {
            handleFirestoreError(err, 'delete sala cascade');
        }
    };
    
    const setSettings = async (newSettings: Partial<AppSettings>) => {
        try {
            // FIX: Use Firebase v8 namespaced API for setting a document with merge options.
            await db.collection('config').doc('settings').set(newSettings, { merge: true });
            addToast('Configuración guardada.', 'success');
        } catch (err) {
            handleFirestoreError(err, 'set settings');
        }
    };

    const contextValue: AppContextType = {
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
        setSettings,
        addToast,
        removeToast,
        showConfirmation,
        handleConfirm,
        handleCancel,
        isUpdateAvailable,
        applyUpdate,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};