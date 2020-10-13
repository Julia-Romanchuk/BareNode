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
export const isString = (str, { maxLength, posibleValues } = {}) => {
    try {
        if ( typeof str !== 'string' ) throw Error;
        if ( maxLength && str.trim().length > maxLength ) throw Error;
        if ( posibleValues && !posibleValues.includes(str) ) throw Error;
    } catch (err) { 
        return false
    }
    return str;
};

export const isNumber = (num) => typeof num === 'number' ? num : false;

export const isArray = (arr, { nonEmpty } = {}) => {
    try {
        if (typeof arr === 'object' && arr instanceof Array ) throw Error;
        if (nonEmpty && arr.length === 0) throw Error;
    } catch (err) { 
        return false 
    }

    return arr;
};
