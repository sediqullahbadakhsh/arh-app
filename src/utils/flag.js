// src/utils/flag.js
export const codeToFlag = (code = '') =>
    code
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
