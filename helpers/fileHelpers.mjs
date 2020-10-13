import path from 'path'

export const baseFolder = (folderName) => path.join( `~/../${folderName}/`);

export const getFilePath = (fileName, subfolder, {fileExtension = '.json'} = {}) => {
    return baseFolder + `${subfolder}/` + fileName + fileExtension;
}