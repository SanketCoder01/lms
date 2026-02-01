/**
 * Checks if a phone number string consists of exactly 10 digits.
 * @param {string} phone 
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
    // Regex for exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};

export const isValidPAN = (pan) => {
    // 5 letters, 4 digits, 1 letter
    const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return regex.test(pan);
};

export const isValidAadhaar = (aadhaar) => {
    // 12 digits
    const regex = /^\d{12}$/;
    return regex.test(aadhaar);
};

export const isValidCIN = (cin) => {
    // 1 Letter (L/U), 5 digits, 2 letters (state), 4 digits (year), 3 letters (owner), 6 digits
    // Simplified: Just stricter Structure
    // L12345MH2023PTC123456
    const regex = /^[L|U]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
    return regex.test(cin);
};
