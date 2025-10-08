import { createContext, useState, useEffect, useCallback, FC, ReactNode } from 'react';
import { User, Sector, Role, Booking, AppSettings, ToastMessage, AppContextType, ConfirmationState, Sala, ConfirmationOptions } from '../types';
import { INITIAL_ROLES, INITIAL_SECTORS, DEFAULT_LOGO_URL, DEFAULT_BACKGROUND_URL, INITIAL_ADMIN_SECRET_CODE, DEFAULT_HOME_BACKGROUND_URL, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, INITIAL_SALAS, DEFAULT_SITE_IMAGE_URL } from '../constants';
import { formatDate } from '../utils/helpers';
import { auth, db } from '../utils/firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, onSnapshot, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, writeBatch, query, where, getDocs } from 'firebase/firestore';


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

    // --- Firebase Auth Listener ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in, fetch their profile from Firestore
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    setCurrentUser({ id: userDocSnap.id, ...userDocSnap.data() } as User);
                } else {
                    // Profile doesn't exist, maybe sign them out or handle error
                    console.error("User profile not found in Firestore!");
                    setCurrentUser(null);
                }
            } else {
                // User is signed out
                setCurrentUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // --- Firestore Real-time Listeners ---
    useEffect(() => {
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
        
        const unsubscribers = [
            onSnapshot(collection(db, 'users'), (snapshot) => setUsers(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as User)))),
            onSnapshot(collection(db, 'sectors'), (snapshot) => setSectors(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Sector)))),
            onSnapshot(collection(db, 'roles'), (snapshot) => setRoles(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Role)))),
            onSnapshot(collection(db, 'salas'), (snapshot) => setSalas(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Sala)))),
            onSnapshot(collection(db, 'bookings'), (snapshot) => setBookings(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Booking)))),
            onSnapshot(doc(db, 'settings', 'appConfig'), (doc) => {
                if (doc.exists()) {
                    setSettingsState(s => ({ ...s, ...doc.data() as Partial<AppSettings> }));
                } else {
                    // Optional: Create initial settings document if it doesn't exist
                    const initialSettings = {
                        adminSecretCode: INITIAL_ADMIN_SECRET_CODE,
                        lastBookingDuration: 1,
                    };
                    setDoc(doc.ref, initialSettings);
                    setSettingsState(s => ({ ...s, ...initialSettings }));
                }
            }),
        ];

        // --- Data Seeding (First time run check) ---
        const seedInitialData = async () => {
            const rolesCollection = collection(db, 'roles');
            const rolesSnapshot = await getDocs(rolesCollection);
            if (rolesSnapshot.empty) {
                console.log("No roles found, seeding initial data...");
                const batch = writeBatch(db);
                INITIAL_ROLES.forEach(role => {
                    const docRef = doc(rolesCollection, role.id);
                    batch.set(docRef, { name: role.name });
                });
                INITIAL_SECTORS.forEach(sector => {
                    const docRef = doc(collection(db, 'sectors'), sector.id);
                    batch.set(docRef, { name: sector.name });
                });
                INITIAL_SALAS.forEach(sala => {
                    const docRef = doc(collection(db, 'salas'), sala.id);
                    batch.set(docRef, { name: sala.name, address: sala.address });
                });
                await batch.commit();
                console.log("Initial data seeded successfully.");
            }
        };

        seedInitialData();

        return () => unsubscribers.forEach(unsub => unsub());
    }, []);
    
    // --- PWA Installation Logic ---
    useEffect(() => {
        const handleInstallReady = () => {
            console.log('`pwa-install-ready` event received by context.');
            setDeferredPrompt(window.deferredInstallPrompt);
        };

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
            // No need to save this to DB, it's a client-side preference
        }
        window.deferredInstallPrompt = null;
        setDeferredPrompt(null);
    };

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
            
            const isEmailJsConfigured = EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY;
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
            if (usersToNotify.length === 0) return 'No hay usuarios para notificar.';

            let successCount = 0;
            for (const targetUser of usersToNotify) {
                try {
                    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                        ...templateParams,
                        to_email: targetUser.email,
                    }, EMAILJS_PUBLIC_KEY);
                    successCount++;
                } catch (error: any) {
                    console.error(`Failed to send email to ${targetUser.email}:`, error);
                }
            }
            return `Notificaciones enviadas a ${successCount} de ${usersToNotify.length} usuarios.`;
        } catch (error) {
            console.error("Error catastrófico en sendBookingNotificationEmail:", error);
            return `pero ocurrió un error grave al intentar enviar notificaciones.`;
        }
    }, [users]);

    // --- Auth and CRUD Operations ---
    
    const login = async (email: string, pass: string): Promise<boolean> => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
            return true;
        } catch (error) {
            console.error("Login failed:", error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const register = async (userData: Omit<User, 'id'>, pass: string): Promise<boolean> => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, pass);
            const { user } = userCredential;
            // Now create the user profile document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                ...userData,
                email: userData.email.toLowerCase(), // Ensure email is stored in lowercase
            });
            return true;
        } catch (error: any) {
            console.error("Registration failed:", error);
            // Firebase returns specific error codes we can check
            if (error.code === 'auth/email-already-in-use') {
                addToast('El email ya está registrado.', 'error');
            }
            return false;
        }
    };

    const addBooking = async (bookingData: Omit<Booking, 'id'>): Promise<string> => {
        const docRef = await addDoc(collection(db, 'bookings'), bookingData);
        const newBooking: Booking = { ...bookingData, id: docRef.id };
        const emailStatus = await sendBookingNotificationEmail('creada', newBooking);
        return emailStatus;
    };

    const deleteBooking = async (bookingId: string) => {
        const bookingToDelete = bookings.find(b => b.id === bookingId);
        if (bookingToDelete) {
            await deleteDoc(doc(db, 'bookings', bookingId));
            const emailStatus = await sendBookingNotificationEmail('eliminada', bookingToDelete);
            addToast(`Reserva eliminada. ${emailStatus}`, 'success');
        } else {
            throw new Error("Reserva no encontrada.");
        }
    };

    const updateBooking = async (updatedBooking: Booking) => {
        const { id, ...bookingData } = updatedBooking;
        await updateDoc(doc(db, 'bookings', id), bookingData);
        const emailStatus = await sendBookingNotificationEmail('modificada', updatedBooking);
        addToast(`Reserva modificada. ${emailStatus}`, 'success');
    };

    const updateUser = async (updatedUser: User) => {
        const { id, ...userData } = updatedUser;
        await updateDoc(doc(db, 'users', id), userData);
        addToast('Usuario actualizado.', 'success');
    };

    const deleteUser = async (userId: string) => {
        // This is more complex now. We can't delete a Firebase Auth user from the client-side easily.
        // The standard practice is to use a Firebase Function (backend) to handle this.
        // For this frontend-only app, we will delete their Firestore data and associated bookings.
        // The user will still exist in Firebase Auth but won't be able to log in meaningfully.
        const batch = writeBatch(db);
        batch.delete(doc(db, 'users', userId));

        // Find and delete user's bookings
        const bookingsQuery = query(collection(db, 'bookings'), where('userId', '==', userId));
        const userBookings = await getDocs(bookingsQuery);
        userBookings.forEach(bookingDoc => {
            batch.delete(bookingDoc.ref);
        });
        
        await batch.commit();
        addToast('Usuario y sus reservas eliminados de la base de datos.', 'success');
    };

    const addSector = async (sectorName: string) => {
        await addDoc(collection(db, 'sectors'), { name: sectorName });
        addToast('Sector añadido.', 'success');
    };

    const updateSector = async (updatedSector: Sector) => {
        const { id, ...sectorData } = updatedSector;
        await updateDoc(doc(db, 'sectors', id), sectorData);
        addToast('Sector actualizado.', 'success');
    };

    const deleteSector = async (sectorId: string) => {
        await deleteDoc(doc(db, 'sectors', sectorId));
        addToast('Sector eliminado.', 'success');
    };

    const addRole = async (roleName: string) => {
        await addDoc(collection(db, 'roles'), { name: roleName });
        addToast('Rol añadido.', 'success');
    };

    const updateRole = async (updatedRole: Role) => {
        const { id, ...roleData } = updatedRole;
        await updateDoc(doc(db, 'roles', id), roleData);
        addToast('Rol actualizado.', 'success');
    };

    const deleteRole = async (roleId: string) => {
        await deleteDoc(doc(db, 'roles', roleId));
        addToast('Rol eliminado.', 'success');
    };

    const addSala = async (salaName: string, address: string) => {
        await addDoc(collection(db, 'salas'), { name: salaName, address });
        addToast('Sala añadida.', 'success');
    };

    const updateSala = async (updatedSala: Sala) => {
        const { id, ...salaData } = updatedSala;
        await updateDoc(doc(db, 'salas', id), salaData);
        addToast('Sala actualizada.', 'success');
    };

    const deleteSala = async (salaId: string) => {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'salas', salaId));
        const bookingsQuery = query(collection(db, 'bookings'), where('roomId', '==', salaId));
        const roomBookings = await getDocs(bookingsQuery);
        roomBookings.forEach(bookingDoc => {
            batch.delete(bookingDoc.ref);
        });
        await batch.commit();
        addToast('Sala y sus reservas han sido eliminadas.', 'success');
    };

    const setSettings = async (newSettings: Partial<AppSettings>) => {
        const settingsRef = doc(db, 'settings', 'appConfig');
        await updateDoc(settingsRef, newSettings);
        // URLs are now fixed constants, so no need to prevent user changes here.
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
