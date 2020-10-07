import crypto from 'crypto'

export const hashString = (str) => isString(str) ? crypto.createHash('sha256').update(str).digest('hex') : false

export const parseJsonToObject = (str) => {
    try { return JSON.parse(str) }
    catch(e) { return {} }
};

export const createRandomString = function(strLength){
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for(let i = 1; i <= strLength; i++) {
        const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        str+=randomCharacter;
    }
    return str;
};

// types
export const isString = (str) => typeof str === 'string' && str.trim().length ? str : false;
export const isNumber = (num) => typeof num === 'number' ? num : false;
export const isArray = (arr) => typeof arr === 'object' && arr instanceof Array ? arr : false;
