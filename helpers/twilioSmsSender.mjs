import querystring from 'querystring';
import https from 'https'

import { isString } from "./utils.mjs";

const config = {
    fromPhone: '+15005550006',
    twilioSID: 'ACb32d411ad7fe886aac54c665d25e5c5d',
    twilioAuthToken: '9455e3eb3109edc12e3d8c92768f7a67'
}

export const sendTwilioSms = (toPhone, message, cb) => {
    const phone = isString(toPhone);
    const text = isString(message) && message.length < 3000 ? message : false;

    if (phone && text) {
        const requestPayload = querystring.stringify({
            'Form': config.fromPhone,
            'To': '+380' + phone,
            'Body': text
        })

        const reqDetails = {
            'protocol': 'https:',
            'hostname': 'api.twilio.com',
            'method': 'POST',
            'path': '2010-04-01/Accounts/' + config.twilioSID + ':' + '/Messeges.json',
            'auth': config.twilioSID + ':' + config.twilioAuthToken,
            'headers': {
                'Content-Type' : 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(requestPayload)
            }
        };

        const req = https.request(reqDetails, res => {
            res.statusCode == 200 || res.statusCode == 201 ? 
                cb(false) : cb(`Status code returned was ${res.statusCode}`)
        });
        
        req.on('error', err => cb(err));
        req.write(requestPayload);
        req.end();

    } else cb('Required data are invalid')
} 