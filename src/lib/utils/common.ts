/**
 * Common utility functions that can be reused across the application
 */

/**
 * Deep equality comparison for nested objects
 * Useful for comparing form data, settings, etc.
 */
export function deepEqual<T>(a: T, b: T): boolean {
    if (a === b) return true;

    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
        return false;
    }

    const keysA = Object.keys(a) as (keyof T)[];
    const keysB = Object.keys(b) as (keyof T)[];

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key)) return false;

        const valA = a[key];
        const valB = b[key];

        if (typeof valA === 'object' && typeof valB === 'object') {
            if (!deepEqual(valA, valB)) return false;
        } else if (valA !== valB) {
            return false;
        }
    }

    return true;
}
