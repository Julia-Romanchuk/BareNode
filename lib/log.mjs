import fs from 'fs';
import zlib, { gzip } from 'zlib';
import { baseFolder } from '../helpers/fileHelpers.mjs';
import { getFilePath } from '../helpers/fileHelpers.mjs';
import { isArray } from '../helpers/utils.mjs';

const baseLodsFolder = baseFolder('.logs');
const getLogFilePath = (fileId, fileExtension = '.log') => getFilePath(fileId, '.logs', { fileExtension }) 

const lib = {};

lib.append = (file, data, cb) => {
    // aplly 'a' switch to open file for appending and create if it not exist
    fs.open(getLogFilePath(file), 'a', (err, desc) => {
        if (!err && desc) {
            fs.appendFile(desc, data + '\n', err => {
                if (!err) {
                    fs.close(desc, cb)
                } else cb('Could not append')
            });
        } else cb('Could not open file for appending');
    })
};

lib.list = (isCompressedIncluded , cb) => {
    fs.readdir(baseLodsFolder, (err, filesList) => {
        if (!err && isArray(filesList)) {
            const logNamesList = [];

            filesList.forEach(file => {
                if (file.includes('.log')) logNamesList.push(file.replace('.log', ''));
                if (file.includes('.gz.b64') && isCompressedIncluded) logNamesList.push(file.replace('.gz.b64', ''));
            });

            cb(false, filesList)
        } else cb(err)
    })
};

lib.compress = (fileIdToCompress, compresedFileId, cb) => {
    fs.read(getLogFilePath(fileIdToCompress), 'utf8', (err, inputString) => {
        if (!err && inputString) {
            // compress data from the log 
            zlib.gzip(inputString, (err, buffer) => {
                if (!err, buffer) {
                    fs.open(getLogFilePath(compresedFileId, '.gz.b64'), 'ws', (err, desc) => {
                        if (!err && desc) {
                            fs.write(desc, buffer.toString('base64'), err => {
                                !err ? fs.close(desc, err => err ? cb(err) : cb(false)) : cb(err)
                            })
                        } cb(err)
                    })
                } else cb(err)
            })
        } else cb(err);
    })
};

// decompress into a string varialble
lib.decompress = (fileId, cb) => {
    fs.readFile(getLogFilePath(fileId, '.gz.b64'), 'utf8', (err, str) => {
        if (!err && str) {
            //decompress str => buffer (do decopressing) => str
            const inputBuffer = Buffer.from(str, 'base64');
            
            gzip.unzip(inputBuffer, (err, outputBuffer) => {
                if (!err && outputBuffer) {
                    const dataStr = outputBuffer.toString();
                    cb(false);
                } else cb(err);
            })
        } else cb(err);
    })
}

lib.truncate = (fileId, cb) => fs.truncate(getLogFilePath(fileId), 0, err => err ? cb(err) : cb(false));


export default lib;