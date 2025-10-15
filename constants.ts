// --- Configuración de EmailJS ---
// Las credenciales se cargan desde las Variables de Entorno de Netlify durante el despliegue.
// Esto es más seguro y flexible que tenerlas directamente en el código.

export const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID || '';
export const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || '';
export const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || '';


// --- Initial Data ---
export const INITIAL_ADMIN_SECRET_CODE = 'TECO2025';

export const INITIAL_SALAS = [
    { id: '1', name: 'Sala D. French', address: 'Domingo French Nº 548 - Paraná - Entre Ríos' },
    { id: '2', name: 'Sala de Capacitación', address: 'Domingo French Nº 548 - Paraná - E. Ríos' },
    { id: '3', name: 'Sala Directorio', address: 'Av. Corrientes 246 - CABA' },
];

export const INITIAL_ROLES = [
    { id: '1', name: 'Empleado' },
    { id: '2', name: 'Supervisor' },
    { id: '3', name: 'Coordinador' },
    { id: '4', name: 'Jefe' },
    { id: '5', name: 'Gerente' },
    { id: '6', name: 'Administrador' },
];

export const INITIAL_SECTORS = [
    { id: '1', name: 'Operación Costa del Paraná' },
    { id: '2', name: 'Depósito' },
    { id: '3', name: 'Higiene & Seguridad' },
    { id: '4', name: 'Eventos French I' },
    { id: '5', name: 'Eventos French II' },
    { id: '6', name: 'Red French I' },
    { id: '7', name: 'Red French II' },
    { id: '8', name: 'Servicios Especiales' },
    { id: '9', name: 'Red French' },
    { id: '10', name: 'Eventos Garay' },
    { id: '11', name: 'Facilities & Servicios' },
    { id: '12', name: 'Capital Humano' },
    { id: '13', name: 'Comercial & Marketing' },
];

export const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
export const TIME_SLOTS = Array.from({ length: 10 }, (_, i) => 8 + i); // 8:00 to 17:00

export const DEFAULT_LOGO_URL = 'https://i.postimg.cc/bvr9syk6/Personal-logonuevo-1.png'; 
export const DEFAULT_BACKGROUND_URL = 'https://i.postimg.cc/3NMv9VMS/oficina-moderna-paredes-verdes-pisos-madera-asientos-comodos-191095-99743.avif';
export const DEFAULT_HOME_BACKGROUND_URL = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG9ötby1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';
export const DEFAULT_SITE_IMAGE_URL = 'https://i.postimg.cc/Hss2rxB2/IMAGEN-SITE.png';
// FIX: Replace the non-crawlable developer URL with a clean, public-facing URL.
// This is essential for social media platforms (like WhatsApp) to generate a rich link preview.
export const DEFAULT_SHAREABLE_URL = 'https://aistudio.google.com/apps/drive/11d6Ipe9A0KvKkiOhLVz-7Spg1UbocG-I';