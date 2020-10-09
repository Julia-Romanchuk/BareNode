import querystring from 'querystring';
import https from 'https'

import { isString } from "./utils.mjs";

const config = {
    fromPhone: '099',
    twilioSID: 'AC0edea30152d3b58d138a70f1a443a3a8',
    twilioAuthToken: 'e2710126e3dc22b1611d5847856fc397'
}

export const sendTwilioSms = (toPhone, message, cb) => {
    const phone = isString(toPhone);
    const text = isString(message) && message.length < 3000 ? message : false;
    console.log('lkjhgfghj')

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