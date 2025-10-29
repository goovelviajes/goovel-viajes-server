export function normalizeDate(date: Date): Date {
    const normalized = new Date(date); // para no mutar el original
    normalized.setSeconds(0, 0);
    return normalized;
}