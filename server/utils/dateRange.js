/**
 * Generates an array of Date objects for each night in the range [startDate, endDate)
 * @param {Date|String} startDate 
 * @param {Date|String} endDate 
 * @returns {Date[]}
 */
export const getDatesInRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Set to midnight to avoid time-of-day edge cases
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const dates = [];
    let current = new Date(start);

    while (current < end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
};
