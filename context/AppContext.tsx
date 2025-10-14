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