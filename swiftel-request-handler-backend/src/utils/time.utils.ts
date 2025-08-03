export const convertTimeToSeconds = (time: string): number => {
    const value = parseInt(time.slice(0, -1));
    const unit = time.slice(-1);

    switch (unit) {
        case 's': return value;
        case 'm': return value * 60;
        case 'h': return value * 60 * 60;
        case 'd': return value * 60 * 60 * 24;
        default: return value; // Assume seconds if no unit or unknown unit
    }
};