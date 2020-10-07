import fs from 'fs';

import fileHelper from '../helpers/fileHelpers.mjs';
import { parseJsonToObject } from '../helpers/utils.mjs';

const data = {};

data.create = (folder, file, data, cb) => {
    fs.writeFile(fileHelper.getFilePath(file, folder), JSON.stringify(data), (err) => {
        !err ? cb(false) : cb('Unable to create file.')
    })
}

data.read = (folder, file, cb) => {
    fs.readFile(fileHelper.getFilePath(file, folder), 'utf8', (err, data) => {
        !err ? cb(false, parseJsonToObject(data)) : cb('Unable to read file.')
    })
}

data.update = (folder, file, data, cb) => {
    const destination = fileHelper.getFilePath(file, folder)
    fs.truncate(destination, (err) => {
        if (!err) {
            fs.writeFile(destination, JSON.stringify(data), (err) => {
                !err ? cb(false) : cb('Unable to update file.')
            })
        } else cb('Unable to truncate file')
    })
}

data.delete = (folder, file, cb) => {
    fs.unlink(fileHelper.getFilePath(file, folder), (err) => {
        !err ? cb(false) : cb('Could not delete file, it may not exist yet')
    })
}

export default data