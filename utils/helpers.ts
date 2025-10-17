
/**
 * Capitaliza la primera letra de una cadena y convierte el resto a minúsculas.
 * @param text La cadena a formatear.
 * @returns La cadena formateada o una cadena vacía si la entrada es nula/indefinida.
 */
export const formatUserText = (text: string | null | undefined): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Formatea un objeto Date a una cadena 'YYYY-MM-DD' para su uso en un input[type="date"].
 * Maneja correctamente las zonas horarias para evitar errores de un día.
 * @param date El objeto Date a formatear.
 * @returns La fecha formateada como 'YYYY-MM-DD'.
 */
export const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    // getMonth() es 0-indexed, por lo que sumamos 1.
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    // getDate() es 1-indexed.
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};
