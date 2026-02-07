export const sendEmail = async (to, subject, body) => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 100));
    console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
    console.log(`[BODY]: ${body}`);
    return true;
};

export const sendSMS = async (phone, message) => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 100));
    console.log(`[MOCK SMS] To: ${phone} | Message: ${message}`);
    return true;
};
