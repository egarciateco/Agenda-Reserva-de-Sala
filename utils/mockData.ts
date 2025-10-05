import { User, Booking } from '../types';
import { formatDateForInput, getWeekStartDate } from './helpers';

// FIX: Corrected the malformed user object. It was a syntax error where two users were merged into one.
// I have separated them into two distinct user objects.
export const mockUsers: User[] = [
    {
        id: '2',
        firstName: 'Esteban',
        lastName: 'Garcia',
        email: 'egarcia@teco.com.ar',
        phone: '(343)-4257585',
        sector: '',
        role: 'Administrador',
        passwordHash: 'hashed_TECO2025'
    },
     {
        id: '4',
        firstName: 'Esteban',
        lastName: 'Garcia',
        email: 'egarciateco@gmail.com',
        phone: '(444)-4444444',
        sector: 'Operación Costa del Paraná',
        role: 'Administrador',
        passwordHash: 'hashed_TECO2025'
    }
];

const today = new Date();
const weekStart = getWeekStartDate(today);

const getDayOfWeek = (startDate: Date, dayOffset: number) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + dayOffset);
    return formatDateForInput(date);
}

export const mockBookings: Booking[] = [
    { id: 'b1', userId: '2', roomId: '1', date: getDayOfWeek(weekStart, 0), startTime: 10, duration: 2 }, // Monday 10:00-12:00
    { id: 'b3', userId: '4', roomId: '1', date: getDayOfWeek(weekStart, 4), startTime: 9, duration: 3 },  // Friday 9:00-12:00
];