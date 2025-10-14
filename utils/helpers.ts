export const formatUserText = (text: string): string => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};

export const formatDateForInput = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
};

export const getWeekStartDate = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  const day = newDate.getDay();
  const diff = newDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  return new Date(newDate.setDate(diff));
};

/**
 * Translates Firebase error codes into user-friendly Spanish messages.
 * @param error - The error object, typically from a Firebase catch block.
 * @returns A user-friendly error message string.
 */
export const getFirebaseErrorMessage = (error: any): string => {
  let message = 'Ocurrió un error inesperado. Por favor, revisa tu conexión a internet e inténtalo de nuevo.';

  if (error && error.code) {
    switch (error.code) {
      // AUTH ERRORS
      case 'auth/invalid-email':
        message = 'El formato del email no es válido.';
        break;
      case 'auth/user-disabled':
        message = 'Este usuario ha sido deshabilitado.';
        break;
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        message = 'Email o contraseña incorrectos.';
        break;
      case 'auth/email-already-in-use':
        message = 'El email ya está registrado por otro usuario.';
        break;
      case 'auth/weak-password':
        message = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
        break;
      case 'auth/network-request-failed':
        message = 'Error de red. No se pudo completar la solicitud. Verifica tu conexión.';
        break;
      
      // FIRESTORE ERRORS
      case 'unavailable':
        message = 'No se pudo conectar a la base de datos. La aplicación podría mostrar datos desactualizados.';
        break;
      case 'permission-denied':
        message = 'No tienes permiso para realizar esta acción.';
        break;
      case 'not-found':
         message = 'El recurso solicitado no fue encontrado.';
         break;
      default:
        console.error('Unhandled Firebase Error:', String(error));
        // Keep the default message for unhandled codes
    }
  } else if (error instanceof Error) {
    // Handle generic JS errors
    return error.message;
  }

  return message;
};