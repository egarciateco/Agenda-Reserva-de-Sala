
/**
 * Formats a string by capitalizing the first letter of each word and converting the rest to lowercase.
 * Handles empty or nullish strings gracefully.
 * e.g., "joHn DOE" -> "John Doe"
 */
export const formatUserText = (text: string | null | undefined): string => {
    if (!text) return 'N/A'; // Return a default value for empty/nullish input
    return text
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Formats a Date object into a 'YYYY-MM-DD' string suitable for an <input type="date">.
 * Handles potential timezone issues by using getFullYear/Month/Date.
 * @param date The Date object to format.
 * @returns A string in 'YYYY-MM-DD' format.
 */
export const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    // getMonth() is 0-indexed, so add 1. Pad with '0' if needed.
    const month = String(date.getMonth() + 1).padStart(2, '0');
    // getDate() is 1-indexed. Pad with '0' if needed.
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
