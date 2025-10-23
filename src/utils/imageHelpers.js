import * as FileSystem from 'expo-file-system';

/**
 * Save files to the server or local storage
 * @param {Array} files - Array of file objects from image picker
 * @param {string} uploadPath - Server upload path
 * @returns {Promise<Array>} - Array of saved file names
 */
export const saveFiles = async (files, uploadPath) => {
  try {
    const savedFiles = [];
    
    for (const file of files) {
      if (file.uri) {
        // For React Native, we'll return the file object directly
        // In a real app, you would upload to your server here
        const fileName = generateFileName(file.uri);
        savedFiles.push({
          fileName: fileName,
          filePath: file.uri,
          fileSize: file.fileSize,
          type: file.type || 'image/jpeg'
        });
      }
    }
    
    return savedFiles;
  } catch (error) {
    console.error('Error saving files:', error);
    throw error;
  }
};

/**
 * Generate a unique file name
 * @param {string} fileUri - Original file URI
 * @returns {string} - Generated file name
 */
const generateFileName = (fileUri) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = getFileExtension(fileUri);
  return `file_${timestamp}_${randomString}.${fileExtension}`;
};

/**
 * Get file extension from URI
 * @param {string} uri - File URI
 * @returns {string} - File extension
 */
const getFileExtension = (uri) => {
  const filename = uri.split('/').pop();
  return filename.split('.').pop() || 'jpg';
};

/**
 * Convert image to base64
 * @param {string} uri - Image URI
 * @returns {Promise<string>} - Base64 string
 */
export const imageToBase64 = async (uri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Get file size in MB
 * @param {number} sizeInBytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const getFileSize = (sizeInBytes) => {
  if (!sizeInBytes) return '0 MB';
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return `${sizeInMB.toFixed(2)} MB`;
};

/**
 * Validate file size
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} - Whether file size is valid
 */
export const validateFileSize = (fileSize, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
};

/**
 * Validate file type
 * @param {string} mimeType - File MIME type
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {boolean} - Whether file type is valid
 */
export const validateFileType = (mimeType, allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']) => {
  return allowedTypes.includes(mimeType);
};