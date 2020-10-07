import { CRUD_METHODS } from '../common/constans.mjs';
import { hashString, isString, isNumber, isArray, createRandomString } from '../helpers/utils.mjs';
import  Data  from './data.mjs'

const handlers = {}

handlers.users = (data, cb) =>
    CRUD_METHODS.includes(data.method)
        ? handlers._users[data.method](data, cb)
        : cb(405, 'Method aren\'t supported on this route')

handlers.token = (data, cb) =>
    ['post', 'put', 'delete'].includes(data.method)
        ? handlers._token[data.method](data, cb)
        : cb(405, 'Method aren\'t supported on this route')

handlers.checks = (data, cb) =>
    CRUD_METHODS.includes(data.method)
        ? handlers._checks[data.method](data, cb)
        : cb(405, 'Method aren\'t supported on this route')
    
handlers._users = {};

handlers._users.post = (data, cb) => {
    const firstName = isString(data.payload.firstName);
    const lastName = isString(data.payload.lastName);
    const phone = isString(data.payload.phone);
    const password = isString(data.payload.password);

    if (firstName && lastName && password && phone) {
        Data.read('users', phone, (err) => {
            if (err) {
                const userObject = {
                    'firstName': firstName,
                    'lastName': lastName,
                    'phone': phone,
                    'hashedPassword': hashString(password)
                };
                Data.create('users', phone, userObject, (err) => {
                    !err ? cb(200) : cb(500, {"Error": err})
                })
            } else cb(500, {"Error": "User already exist"})
        })
    } else cb(500, {"Error": "Required fields are not provided"})
}

handlers._users.put = (data, cb) => {
    const firstName = isString(data.payload.firstName);
    const lastName = isString(data.payload.lastName);
    const phone = isString(data.payload.phone);
    const password = isString(data.payload.password);
    const id = isString(data.headers.token)

    if (phone && password || lastName || firstName) {
        handlers._token.verifyToken(phone, id, (isTokenValid) => {
            if(isTokenValid) {
                Data.read('users', phone, (err, user) => {
                    if (!err && user) {
                        if (firstName) user.firstName = firstName
                        if (lastName) user.lastName = lastName
                        if (password) user.hashedPassword = hashString(password)

                        Data.update('users', phone, user, (err) => !err ? cb() : cb(500, {"Error": err}))
                    } else cb(500, {"Error": "User not found"})
                })
            } else cb(403, {"Error": "Access forbidden"})
        })
    } else cb(400, {"Error": "Needed fields missed"})
}

handlers._users.get = (data, cb) => {
    const phone = isString(data.queries.phone);

    if (phone) {
        Data.read('users', phone, (err, user) => {
            if (!err && user) {
                delete user.hashedPassword
                cb(200, user)
            } else cb(404)
        })
    } else cb(400, {"Error": "Missing required fields"})
}

handlers._users.delete = (data, cb) => {
    const phone = isString(data.queries.phone);
    const id = isString(data.headers.token)

    if (phone) {
        handlers._token.verifyToken(phone, id, (isTokenValid) => {
            if (isTokenValid) {
                Data.read('users', phone, (err) => {
                    if (!err)
                        Data.delete('users', phone, (err) => !err ? cb(200) : cb({"Error": err}))
                    else cb(404, {"Error": err})
                })
            } else cb(403, {"Error": "Access forbidden"})
        })
    } else cb(400, {"Error": "Missing required fields"})
}

handlers._token = {}

handlers._token.post = (data, cb) => {
    const phone = isString(data.payload.phone);
    const password = isString(data.payload.password);

    if (phone && password) {
        Data.read('users', phone, (err, user) => {
            if (!err && user) {
                if(user.hashedPassword === hashString(password)) {
                    const id = createRandomString(20)
                    const tokenObj = {
                        phone,
                        id,
                        expires: Date.now() + 1000 * 60 * 60
                    }
                    Data.create('tokens', id, tokenObj,(err) => {
                        !err ? cb(200, tokenObj) : cb(500, {'Error' : 'Could not create the new token'})
                    })
                } else cb(400, {'Error': 'Incorrect phone or password'})
            } else cb(404, {'Error': err})
        })
    }
}

handlers._token.put = (data, cb) => {
    const id = isString(data.payload.id)
    const extend = !!data.payload.extend

    if (id && extend) {
        Data.read('tokens', id, (err, token) => {
            if(!err && token) {
                if (token.expires > Date.now()) {
                    token.expires = Date.now() + 1000 * 60 * 60
                    Data.update('tokens', token.id, token, (err) => {
                        !err ? cb(200, token) : cb(500, {'Error' : 'Could not update the token\'s expiration.'})
                    })
                } else cb(400, {'Error': 'Token already expired'})
            } else cb(400, {'Error': 'No token found'})
        })
    } else cb(400, {'Error': 'Missing required fields'})
}

handlers._token.delete = (data, cb) => {
    const id = isString(data.payload.id)

    if (id) {
        Data.read('tokens', id, (err) => {
            if (!err) {
                Data.delete('tokens', id, (err) => {
                    !err ? cb(200) : cb(500, {'Error': err})
                })
            } else cb(500, {'Error': 'Token doesn\'t exist'})
        })
    } else cb(400, {"Error": "Missing required fields"})
}

handlers._token.verifyToken = (phone, id, cb) => {
    if (isString(phone) && isString(id))
        Data.read('tokens', id, (err, data) => {
        cb((!err && !!data) ? data.phone === phone : false)
    })
}

handlers._checks = {};

handlers._checks.get = (data, cb) => {
    const id = isString(data.queries.id);
    
    if (id) {
        Data.read('checks', id, (err, checkData) => {
            if(!err && checkData) {
                // verify if requested check belongs to the same user that make request
                handlers._token.verifyToken(checkData.userPhone,data.headers.token, (isTokenValid) => {
                    if (isTokenValid) {
                        cb(200, checkData)
                    } else (401, {"error": "You are not authorized"})
                })
            } else cb(404, {"Error": "Check doesnt exist"})
        })
    } else cb(403, {"Error": "Reguired fields are not provided"})
};
handlers._checks.put = (data, cb) => {
    const id = isString(data.queries.id);
    
    if (id) {
        const protocol = ['http', 'https'].includes(data.payload.protocol) ? data.payload.protocol : false;
        const url = isString(data.payload.url);
        const method = CRUD_METHODS.includes(data.payload.method) ? data.payload.method : false;
        const successCode = data.payload.successCode instanceof Array ? data.payload.successCode : false;
        const timeoutSeconds = isNumber(data.payload.timeoutSeconds)
        
        if (protocol || url || method || successCode || timeoutSeconds) {
            Data.read('checks', id, (err, checkData) => {
                if(!err && checkData) {
                    // verify if requested check belongs to the same user that make request
                    handlers._token.verifyToken(checkData.userPhone,data.headers.token, (isTokenValid) => {
                        if (isTokenValid) {
                            if (protocol) checkData.protocol = protocol;
                            if (url) checkData.url = url;
                            if (method) checkData.method = method;
                            if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;
                            if (successCode) checkData.successCode = successCode;
                            
                            Data.update('checks', id, checkData, err => {
                                if (!err) {
                                    cb(200)
                                } else cb(500, {"Error": "Updating error"})
                            })

                        } else (401, {"error": "You are not authorized"})
                    })
                } else cb(404, {"Error": "Check doesnt exist"})
            })
        }
    } else cb(403, {"Error": "Reguired fields are not provided"})
};

// Required fields:  protocol, url, method, successCode, timeoutSeconds
handlers._checks.post = (data, cb) => {
    const protocol = ['http', 'https'].includes(data.payload.protocol) ? data.payload.protocol : false;
    const url = isString(data.payload.url);
    const method = CRUD_METHODS.includes(data.payload.method) ? data.payload.method : false;
    const successCode = data.payload.successCode instanceof Array ? data.payload.successCode : false;
    const timeoutSeconds = isNumber(data.payload.timeoutSeconds)

    if (protocol && url && method && successCode && timeoutSeconds) {
        Data.read('tokens', data.headers.token, (err, tokenData) => {
            if (!err && tokenData) {
                Data.read('users', tokenData.phone, (err, userData) => {
                    if (!err && userData) {
                        const userChecks = isArray(userData.checks) ? userData.checks : [];
                        if (userChecks.length < 5) {
                            const checkId = createRandomString(20);
                            const userPhone = userData.phone;
                            const checkObj = { id: checkId, userPhone, protocol, method, url, successCode, timeoutSeconds }
                            Data.create('checks', checkId, checkObj, err => {
                                if (!err) {
                                    userChecks.push(checkId);
                                    userData.checks = userChecks
                                    Data.update('users', userPhone, userData, err => {
                                        if (!err) {
                                            cb(200, checkObj)
                                        } else cb(500, {"Error": "Could not update user"})
                                    })
                                } else cb(500, {"Error": "Could not create a check"})
                            })
                        } else cb(400, {"Error": "User cannot check anymore"}) 
                    } else cb(403, {"Error": "No user found"})
                })
            } else cb(403, {"Error": "You are not authorized"})
        })
    } else cb(400, {"Error": "Missig required inputs"})
}
handlers._checks.delete = (data, cb) => {
    const id = isString(data.queries.id);
    
    if (id) {
        Data.read('checks', id, (err, checkData) => {
            if(!err && checkData) {
                // verify if requested check belongs to the same user that make request
                handlers._token.verifyToken(checkData.userPhone,data.headers.token, (isTokenValid) => {
                    if (isTokenValid) {
                        Data.delete('checks', id, err => {
                            !err ? cb(200) : cb(500, err)
                        })
                    } else (401, {"error": "You are not authorized"})
                })
            } else cb(404, {"Error": "Check doesnt exist"})
        })
    } else cb(403, {"Error": "Reguired fields are not provided"})
}

handlers.notFound = (data, cb) => cb(404, {"Error": "Page not found"})

export default handlers