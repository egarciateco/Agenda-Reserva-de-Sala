// FIX: Changed to a default import for Firebase compat which correctly exposes types like `firebase.User`.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

// BeforeInstallPromptEvent is not a standard event type, so we define it here.
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  sector: string;
  role: string;
}

export interface Booking {
  id:string;
  userId: string;
  roomId: string;
  date: string; // YYYY-MM-DD
  startTime: number; // 8, 9, 10...
  duration: number; // in hours
  createdAt: any; // Firestore Timestamp
}

export interface Sala {
  id: string;
  name: string;
  address: string;
}

export interface Sector {
  id: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface Settings {
    adminSecretCode: string;
    logoUrl: string;
    backgroundImageUrl: string;
    homeBackgroundImageUrl: string;
    siteImageUrl: string;
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface ConfirmationState {
    isOpen: boolean;
    message: string;
    onConfirm: () => void | Promise<void>;
}

export interface AppContextType {
  user: User | null;
  // FIX: The correct user type from the compat library is `firebase.User`.
  firebaseUser: firebase.User | null;
  loading: boolean;
  
  // Auth
  login: (email: string, pass: string) => Promise<void>;
  register: (userData: Omit<User, 'id' | 'email'>, pass: string) => Promise<void>;
  logout: () => void;
  
  // Data
  bookings: Booking[];
  users: User[];
  salas: Sala[];
  sectors: Sector[];
  roles: Role[];
  
  // Settings
  logoUrl: string;
  backgroundImageUrl: string;
  homeBackgroundImageUrl: string;
  siteImageUrl: string;
  adminSecretCode: string;
  setSettings: (newSettings: Partial<Pick<Settings, 'adminSecretCode'>>) => Promise<void>;

  // CRUD Operations
  addBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<void>;
  updateBooking: (booking: Booking) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  
  addSala: (name: string, address: string) => Promise<void>;
  updateSala: (sala: Sala) => Promise<void>;
  deleteSala: (id: string) => Promise<void>;
  
  addSector: (name: string) => Promise<void>;
  updateSector: (sector: Sector) => Promise<void>;
  deleteSector: (id: string) => Promise<void>;

  addRole: (name: string) => Promise<void>;
  updateRole: (role: Role) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;

  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // UI
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  showConfirmation: (message: string, onConfirm: () => void | Promise<void>) => void;
  confirmationState: ConfirmationState;
  closeConfirmation: () => void;


  // PWA
  isPwaInstallable: boolean;
  pwaInstallPrompt: BeforeInstallPromptEvent | null;
  triggerPwaInstall: () => void;
  pwaInstalledOnce: boolean;
  isManualInstallModalOpen: boolean;
  openManualInstallModal: () => void;
  closeManualInstallModal: () => void;

  // QR Modal
  isQrModalOpen: boolean;
  openQrModal: () => void;
  closeQrModal: () => void;
}
