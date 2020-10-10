import path from 'path';
import http from 'http';
import https from 'https';
import fs from 'fs';
import url from 'url';

import Data from './lib/data'
import { ONE_MINUTE } from './common/constans.mjs';
import { isString } from './helpers/utils.mjs';
import { CRUD_METHODS } from './common/constans.mjs';
import { isArray } from 'util';
import { isNumber } from './helpers/utils.mjs';
import { sendTwilioSms } from './helpers/twilioSmsSender.mjs';

export const workers = {};

workers.loop = () => setInterval(workers.gatherAllChecks, 5 * 1000)

workers.gatherAllChecks = () => {
    Data.list('checks', (err, checks) => {
        if (!err && checks) {
            checks.forEach(checkName => {
                Data.read('checks', checkName, (err, checkData) => {
                    if (!err && checkData) {
                        workers.validateCheckData(checkData);
                    } else console.log(err)
                })
            });
        } else console.log(err)
    })
};

workers.validateCheckData = (checkData) => {
    checkData.id = isString(checkData.id, { length: 20 });
    checkData.userPhone = isString(checkData.userPhone, { length: 10 } );
    checkData.protocol = isString(checkData.protocol, { posibleValues: ['http', 'https'] });
    checkData.url = isString(checkData.url);
    checkData.method = isString(checkData.method, { posibleValues: CRUD_METHODS});
    checkData.successCode = isArray(checkData.successCode); 
    checkData.timeoutSeconds = isNumber(checkData.timeoutSeconds)
    
    checkData.state = isString(checkData.state, { posibleValues: ['up', 'down'] }) ? checkData.state : 'down'; 
    checkData.lastChecked = isString(checkData.lastChecked)

    if (
        checkData.id, 
        checkData.userPhone,
        checkData.protocol,
        checkData.url,
        checkData.method,
        checkData.successCode,
        checkData.timeoutSeconds
    ) {
        workers.performCheck(checkData)
    } else console.log('Invalid property format')

};

// Perform http req
workers.performCheck = (checkData) => {
    // Initial outcome state
    const checkOutcome = {
        error: false,
        responseCode: false
    };
    let isOutcomeSend = false;

    //use 'url.parse' to get hostName and path with queries and params
    const parsedUrl = url.parse(`${checkData.protocol}://${checkData.url}`, true)
    const hostName = checkData.hostName;
    //use 'path', not 'pathName', because queries and params are not avalable in the pathName
    const path = parsedUrl.path;

    const requestDetails = {
        protocol: checkData.protocol + ':',
        path,
        hostName,
        method: checkData.method.toUpperCase(),
        timeout: checkData.timeoutSeconds * 1000 
    }

    const _protocolToUse = checkData.protocol === 'http' ? http : https;
    const _sendOutcome = () => {
        if (!isOutcomeSend) {
            workers.processCheckOutcome(checkData, checkOutcome);
            isOutcomeSend = true;
        }
    }

    const req = _protocolToUse.request(requestDetails, res => {
        checkOutcome.responseCode = res.statusCode;
        _sendOutcome();
    })

    req.on('error', err => {
        checkOutcome.error = err;
        _sendOutcome();
    });

    req.on('timeout', err => {
        checkOutcome.error = 'timeout';
        _sendOutcome();
    })
    req.end();
}

// process outcome and checkData and send alert to the user
workers.processCheckOutcome = (checkData, checkOutcome) => {
    //state is 'up' if no response error and statusCode is one of user allow  
    const state = !checkOutcome.error && checkData.statusCode.includes(checkOutcome.responseCode) ? 'up' : 'down';

    checkData.state = state;
    checkData.lastChecked = Date.now();

    Data.update('checks', checkData.id, checkData, err => {
        if (!err) {
            //we have to alert user if state changed
            //lastChecked allow to understand is check perform initialy
            if (checkData.lastChecked && state !== checkData.state) workers.alertUserToStatusChange(checkData)
        } else console.log('Couldnt update check')
    })
};

workers.alertUserToStatusChange = (checkData) => {
    const msg = `Alert: your check to ${checkData.method.toUpperCase()} ${checkData.protocol}://${checkData.url} is currently ${checkData.state}.`;
    sendTwilioSms(checkData.userPhone, msg, err => err ? console.log(err) : console.log('User successfully alerted'));
}

workers.init = () => {
    workers.gatherAllChecks() 
    workers.loop()
}