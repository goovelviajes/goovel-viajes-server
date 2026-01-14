export const verifyTimePassed = (departureTime: Date) => {
    const date = new Date(departureTime);
    const now = new Date();

    return date < now
} 