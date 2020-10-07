import path from 'path'

const fileHelpers = {};

fileHelpers.baseStorageFolder = path.join( '~/../.data/');

fileHelpers.getFilePath = (fileName, subfolder, fileExtension = '.json', baseFolder = fileHelpers.baseStorageFolder ) => {
    return baseFolder + subfolder + '/' + fileName + fileExtension;
}

export default fileHelpers