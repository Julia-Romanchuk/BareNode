import fs from 'fs';

import fileHelper from '../helpers/fileHelpers.mjs';
import { parseJsonToObject } from '../helpers/utils.mjs';

const data = {};

data.create = (folder, file, data, cb) => {
    fs.writeFile(fileHelper.getFilePath(file, folder), JSON.stringify(data), (err) => {
        err ? cb('Unable to create file.') : cb(false);
    })
}

data.read = (folder, file, cb) => {
    fs.readFile(fileHelper.getFilePath(file, folder), 'utf8', (err, data) => {
        err ? cb('Unable to read file.') : cb(false, parseJsonToObject(data));
    })
}

data.update = (folder, file, data, cb) => {
    const destination = fileHelper.getFilePath(file, folder)
    fs.truncate(destination, (err) => {
        if (!err) {
            fs.writeFile(destination, JSON.stringify(data), (err) => {
                err ? cb('Unable to update file.') : cb(false);
            })
        } else cb('Unable to truncate file')
    })
}

data.delete = (folder, file, cb) => {
    fs.unlink(fileHelper.getFilePath(file, folder), (err) => {
        err ? cb('Could not delete file, it may not exist yet') : cb(false);
    })
}

data.list = (folder, cb) => {
    fs.readdir(fileHelper.baseStorageFolder + folder + '/', (err, data) => {
        if (!err && data && data.length > 0) {
            const fileNames = [];
            data.forEach(fileName => {
                fileNames.push(fileName.replace('.json', ''));
            })
            cb(false, fileNames)
        } else cb(err, data)
    })
}

export default data