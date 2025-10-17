

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

/**
 * Reproduce un sonido de éxito corto y agradable utilizando la Web Audio API.
 * Esto evita la necesidad de cargar un archivo de audio.
 */
export const playSuccessSound = () => {
    try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (!audioContext) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // A4
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.error("No se pudo reproducir el sonido de confirmación.", e);
    }
};
