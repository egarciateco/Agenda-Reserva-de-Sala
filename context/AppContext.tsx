import { createContext, useState, useEffect, useCallback, FC, ReactNode, useRef } from 'react';
import { User, Sector, Role, Booking, AppSettings, ToastMessage, AppContextType, ConfirmationState, Sala, ConfirmationOptions } from '../types';
import { INITIAL_ROLES, INITIAL_SECTORS, DEFAULT_LOGO_URL, DEFAULT_BACKGROUND_URL, INITIAL_ADMIN_SECRET_CODE, DEFAULT_HOME_BACKGROUND_URL, INITIAL_SALAS, DEFAULT_SITE_IMAGE_URL, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, DEFAULT_SHAREABLE_URL } from '../constants';
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

    // --- QR Modal State ---
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const openQrModal = () => setIsQrModalOpen(true);
    const closeQrModal = () => setIsQrModalOpen(false);

    // --- PWA Installation State ---
    const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const [isManifestReady, setIsManifestReady] = useState(false);
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

    // --- PWA Install Logic (Robust Version) ---
    useEffect(() => {
        const handler = () => {
            setDeferredInstallPrompt((window as any).deferredInstallPrompt);
        };

        // Check if the prompt was already captured when the component mounts
        if ((window as any).deferredInstallPrompt) {
            handler();
        }

        // Listen for the custom event fired from index.tsx for when the prompt becomes available
        window.addEventListener('pwa-install-ready', handler);

        return () => {
            window.removeEventListener('pwa-install-ready', handler);
        };
    }, []);


    const triggerPwaInstall = () => {
        if (deferredInstallPrompt) {
            deferredInstallPrompt.prompt();
            deferredInstallPrompt.userChoice.then((choiceResult: { outcome: string }) => {
                if (choiceResult.outcome === 'accepted') {
                    addToast('¡Aplicación instalada con éxito!', 'success');
                    try {
                        localStorage.setItem('pwaInstalled', 'true');
                    } catch (e) {
                        console.error("Could not save PWA installed status to localStorage", e);
                    }
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

     // --- Dynamic Manifest Injection ---
    useEffect(() => {
        if (isLoading || !settings.siteImageUrl) {
            return;
        }

        // --- Manifest ---
        const manifest = {
            short_name: "Reserva Telecom",
            name: "Reserva de Sala de TELECOM",
            description: "La presente aplicación funciona como agenda de reservas para uso de salas de reuniones dentro de las bases de Telecom.",
            icons: [
                { src: settings.siteImageUrl, type: "image/png", sizes: "192x192", purpose: "any maskable" },
                { src: settings.siteImageUrl, type: "image/png", sizes: "512x512", purpose: "any maskable" }
            ],
            start_url: ".",
            display: "standalone",
            theme_color: "#2563eb",
            background_color: "#111827"
        };
        
        const getMimeType = (url: string) => {
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.endsWith('.png')) return 'image/png';
            if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) return 'image/jpeg';
            if (lowerUrl.endsWith('.webp')) return 'image/webp';
            return 'image/png';
        };

        manifest.icons.forEach(icon => { icon.type = getMimeType(settings.siteImageUrl); });

        const manifestString = JSON.stringify(manifest);
        const manifestBlob = new Blob([manifestString], { type: 'application/json' });
        const manifestUrl = URL.createObjectURL(manifestBlob);

        const oldLink = document.querySelector('link[rel="manifest"]');
        if (oldLink) { oldLink.remove(); }
        
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = manifestUrl;
        document.head.appendChild(link);
        
        setIsManifestReady(true);
        
        // Social meta tags are now handled statically in index.html for crawler reliability.

        return () => {
          setIsManifestReady(false);
          if (link.parentElement) { document.head.removeChild(link); }
          URL.revokeObjectURL(manifestUrl);
        };
    }, [settings.siteImageUrl, isLoading]);

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
        setConfirmation({
            isOpen: true,
            message,
            ...options,
        });
    };

    const handleCancel = () => {
        setConfirmation({ isOpen: false, message: '' });
        onConfirmRef.current = null;
    };

    const handleConfirm = () => {
        if (onConfirmRef.current) {
            onConfirmRef.current();
        }
        handleCancel();
    };

    // --- Firebase Auth State Change Listener (Simplified & Robust) ---
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (authUser: any) => {
            if (authUser) {
                const userDoc = await db.collection('users').doc(authUser.uid).get();
                if (userDoc.exists) {
                    const userData = { id: userDoc.id, ...userDoc.data() } as User;
                    setCurrentUser(userData);
                } else {
                    // This logic handles orphaned accounts from failed registrations.
                    // If the account is brand new but has no doc, sign out to allow re-registration.
                    const creationTime = new Date(authUser.metadata.creationTime).getTime();
                    const lastSignInTime = new Date(authUser.metadata.lastSignInTime).getTime();
                    const isNewUser = Math.abs(creationTime - lastSignInTime) < 2000; // 2-second tolerance

                    if (isNewUser) {
                        // This is a new registration in progress, do nothing and let the registration flow handle it.
                    } else {
                        // This is an older, inconsistent account. Sign them out.
                        auth.signOut();
                        setCurrentUser(null);
                    }
                }
            } else {
                setCurrentUser(null);
            }

            if (isLoading) {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [isLoading]);


    // --- Firestore Listeners for Real-time Data ---
    useEffect(() => {
        const unsubUsers = db.collection('users').onSnapshot(snapshot => setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User))), (err) => { console.error(err); addToast('Error al cargar usuarios.', 'error'); });
        const unsubSectors = db.collection('sectors').onSnapshot(snapshot => setSectors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sector))), (err) => { console.error(err); addToast('Error al cargar sectores.', 'error'); });
        const unsubRoles = db.collection('roles').onSnapshot(snapshot => setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role))), (err) => { console.error(err); addToast('Error al cargar roles.', 'error'); });
        const unsubSalas = db.collection('salas').onSnapshot(snapshot => setSalas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sala))), (err) => { console.error(err); addToast('Error al cargar salas.', 'error'); });
        const unsubBookings = db.collection('bookings').onSnapshot(snapshot => setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking))), (err) => { console.error(err); addToast('Error al cargar reservas.', 'error'); });
        const unsubSettings = db.collection('settings').doc('appConfig').onSnapshot(doc => { if (doc.exists) setSettingsState(prev => ({ ...prev, ...doc.data() })); }, (err) => { console.error(err); addToast('Error al cargar la configuración.', 'error'); });

        return () => { unsubUsers(); unsubSectors(); unsubRoles(); unsubSalas(); unsubBookings(); unsubSettings(); };
    }, [addToast]);

    // --- Auth Functions ---
    const login = async (email: string, pass: string) => {
        try {
            await auth.signInWithEmailAndPassword(email, pass);
        } catch (error) {
            const message = getFirebaseErrorMessage(error);
            addToast(message, 'error');
            throw error;
        }
    };
    
    const logout = async () => {
        try {
            await auth.signOut();
            setCurrentUser(null);
        } catch (error) {
             const message = getFirebaseErrorMessage(error);
             addToast(message, 'error');
        }
    };

    const register = async (user: Omit<User, 'id'>, pass: string) => {
        let createdAuthUser = null;
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(user.email, pass);
            createdAuthUser = userCredential.user;
            if (!createdAuthUser) throw new Error("User creation failed in authentication.");

            const userDocumentData = {
                firstName: user.firstName, lastName: user.lastName, email: user.email.toLowerCase(), phone: user.phone, sector: user.sector, role: user.role,
            };
            
            await db.collection('users').doc(createdAuthUser.uid).set(userDocumentData);
            // After successful registration, the user remains logged in.
            // The onAuthStateChanged listener will set the currentUser, triggering
            // an automatic redirect to the agenda.
        } catch (error) {
            // Self-healing: if the user was created in Auth but Firestore failed,
            // delete the auth user to allow them to try again.
            if (createdAuthUser) {
                try { await createdAuthUser.delete(); } catch (deleteError) { console.error("CRITICAL: Failed to clean up orphaned user.", deleteError); }
            }
            const message = getFirebaseErrorMessage(error);
            addToast(message, 'error');
            throw error;
        }
    };

    // --- CRUD Functions ---
    const addBooking = async (booking: Omit<Booking, 'id'>) => {
        try { 
            await db.collection('bookings').add(booking); 
            addToast('Reserva creada con éxito.', 'success'); 
            
            // --- Send Email Notifications to All Users ---
            if (currentUser && window.emailjs) {
                const sala = salas.find(s => s.id === booking.roomId);
                const bookingDateFormatted = new Date(booking.date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

                const emailPromises = users.map(user => {
                    const templateParams = {
                        to_name: `${user.firstName} ${user.lastName}`,
                        to_email: user.email,
                        booking_user_name: `${currentUser.firstName} ${currentUser.lastName}`,
                        booking_date: bookingDateFormatted,
                        booking_time: `${booking.startTime}:00 hs`,
                        booking_duration: `${booking.duration} hora(s)`,
                        booking_room_name: sala ? sala.name : 'Sala desconocida'
                    };

                    return window.emailjs.send(
                        EMAILJS_SERVICE_ID,
                        EMAILJS_TEMPLATE_ID,
                        templateParams,
                        EMAILJS_PUBLIC_KEY
                    ).catch((err: any) => {
                        // Log errors without stopping the process
                        console.error(`Failed to send email to ${user.email}:`, String(err));
                    });
                });
                
                // Wait for all emails to be sent (or fail)
                await Promise.all(emailPromises);
                addToast('Notificaciones de reserva enviadas.', 'success');
            }

        } catch (error) { 
            addToast(getFirebaseErrorMessage(error), 'error'); 
            throw error; 
        }
    };
    const deleteBooking = async (bookingId: string) => {
        try { await db.collection('bookings').doc(bookingId).delete(); addToast('Reserva cancelada con éxito.', 'success'); } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const updateBooking = async (booking: Booking) => {
        try { const { id, ...data } = booking; await db.collection('bookings').doc(id).update(data); addToast('Reserva actualizada.', 'success'); } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const updateUser = async (user: User) => {
        try { const { id, ...data } = user; await db.collection('users').doc(id).update(data); addToast('Usuario actualizado.', 'success'); } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const deleteUser = async (userId: string) => {
        try {
            const batch = db.batch();
            batch.delete(db.collection('users').doc(userId));
            const bookingsSnapshot = await db.collection('bookings').where('userId', '==', userId).get();
            bookingsSnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            addToast('Usuario y sus reservas eliminados.', 'success');
        } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const addSector = async (name: string) => {
        try { await db.collection('sectors').add({ name }); addToast('Sector agregado.', 'success'); } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const updateSector = async (sector: Sector) => {
        try { await db.collection('sectors').doc(sector.id).update({ name: sector.name }); addToast('Sector actualizado.', 'success'); } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const deleteSector = async (id: string) => {
        try { await db.collection('sectors').doc(id).delete(); addToast('Sector eliminado.', 'success'); } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const addRole = async (name: string) => {
        try { await db.collection('roles').add({ name }); addToast('Rol agregado.', 'success'); } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const updateRole = async (role: Role) => {
        try { await db.collection('roles').doc(role.id).update({ name: role.name }); addToast('Rol actualizado.', 'success'); } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const deleteRole = async (id: string) => {
        try { await db.collection('roles').doc(id).delete(); addToast('Rol eliminado.', 'success'); } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const addSala = async (name: string, address: string) => {
        try { await db.collection('salas').add({ name, address }); addToast('Sala agregada.', 'success'); } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const updateSala = async (sala: Sala) => {
        try { const { id, ...data } = sala; await db.collection('salas').doc(id).update(data); addToast('Sala actualizada.', 'success'); } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const deleteSala = async (salaId: string) => {
        try {
            const batch = db.batch();
            batch.delete(db.collection('salas').doc(salaId));
            const bookingsSnapshot = await db.collection('bookings').where('roomId', '==', salaId).get();
            bookingsSnapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            addToast('Sala y sus reservas eliminadas.', 'success');
        } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };
    const setSettings = async (newSettings: Partial<AppSettings>) => {
        try { await db.collection('settings').doc('appConfig').set(newSettings, { merge: true }); addToast('Configuración guardada.', 'success'); } catch (error) { addToast(getFirebaseErrorMessage(error), 'error'); throw error; }
    };

    const value = {
        currentUser, users, sectors, roles, salas, bookings, toasts, confirmation, isLoading, isPwaInstallable, isStandalone, pwaInstalledOnce, isUpdateAvailable, isQrModalOpen, openQrModal, closeQrModal,
        logoUrl: settings.logoUrl, backgroundImageUrl: settings.backgroundImageUrl, homeBackgroundImageUrl: settings.homeBackgroundImageUrl, siteImageUrl: settings.siteImageUrl, adminSecretCode: settings.adminSecretCode, lastBookingDuration: settings.lastBookingDuration || 1,
        triggerPwaInstall, login, logout, register, addBooking, deleteBooking, updateBooking, updateUser, deleteUser, addSector, updateSector, deleteSector, addRole, updateRole, deleteRole, addSala, updateSala, deleteSala, setSettings, addToast, removeToast, showConfirmation, handleConfirm, handleCancel, applyUpdate,
    };
    
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};