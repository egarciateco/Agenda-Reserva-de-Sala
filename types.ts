export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  sector: string;
  role: string;
}

export interface Sector {
  id: string;
  name: string;
}

export interface Role {
  id: string;
  name: string;
}

export interface Sala {
  id: string;
  name: string;
  address?: string;
}

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  date: string; // YYYY-MM-DD format
  startTime: number; // 8, 9, 10, ...
  duration: number; // in hours
}

export interface AppSettings {
  logoUrl: string;
  backgroundImageUrl: string;
  homeBackgroundImageUrl: string;
  adminSecretCode: string;
  siteImageUrl: string;
  lastBookingDuration?: number;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export interface ConfirmationOptions {
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
}

// FIX: onConfirm and onCancel removed to prevent storing functions in state.
export interface ConfirmationState extends ConfirmationOptions {
  isOpen: boolean;
  message: string;
}

export interface AppContextType {
    currentUser: User | null;
    users: User[];
    sectors: Sector[];
    roles: Role[];
    salas: Sala[];
    bookings: Booking[];
    logoUrl: string;
    backgroundImageUrl: string;
    homeBackgroundImageUrl: string;
    siteImageUrl: string;
    adminSecretCode: string;
    lastBookingDuration: number;
    toasts: ToastMessage[];
    confirmation: ConfirmationState;
    isLoading: boolean;
    isPwaInstallable: boolean;
    isStandalone: boolean;
    pwaInstalledOnce: boolean;
    triggerPwaInstall: () => void;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
    register: (user: Omit<User, 'id'>, pass: string) => Promise<void>;
    addBooking: (booking: Omit<Booking, 'id'>) => Promise<void>;
    deleteBooking: (bookingId: string) => Promise<void>;
    updateBooking: (booking: Booking) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addSector: (sectorName: string) => Promise<void>;
    updateSector: (sector: Sector) => Promise<void>;
    deleteSector: (sectorId: string) => Promise<void>;
    addRole: (roleName: string) => Promise<void>;
    updateRole: (role: Role) => Promise<void>;
    deleteRole: (roleId: string) => Promise<void>;
    addSala: (salaName: string, address: string) => Promise<void>;
    updateSala: (sala: Sala) => Promise<void>;
    deleteSala: (salaId: string) => Promise<void>;
    setSettings: (settings: Partial<AppSettings>) => Promise<void>;
    addToast: (message: string, type: 'success' | 'error') => void;
    removeToast: (id: number) => void;
    showConfirmation: (message: string, onConfirm: () => void, options?: ConfirmationOptions) => void;
    handleConfirm: () => void;
    handleCancel: () => void;
    isUpdateAvailable: boolean;
    applyUpdate: () => void;
    isQrModalOpen: boolean;
    openQrModal: () => void;
    closeQrModal: () => void;
}