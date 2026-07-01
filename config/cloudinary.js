const cloudinary = require('cloudinary').v2;

const isConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log("☁️ Cloudinary configurado correctamente.");
} else {
  console.warn("⚠️ Advertencia: No se encontraron credenciales de Cloudinary en las variables de entorno.");
}

/**
 * Sube una imagen en memoria (Buffer) a Cloudinary.
 * @param {Buffer} fileBuffer - Buffer del archivo.
 * @param {string} folderName - Carpeta destino en Cloudinary.
 * @returns {Promise<Object>} Resultado de la carga (incluye secure_url, public_id, etc.).
 */
const subirImagen = (fileBuffer, folderName = 'productos') => {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      return reject(new Error('Cloudinary no está configurado. Por favor, agregue las credenciales en .env'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );
    
    uploadStream.end(fileBuffer);
  });
};

/**
 * Elimina una imagen de Cloudinary mediante su public_id.
 * @param {string} publicId - ID público del asset en Cloudinary.
 * @returns {Promise<Object>} Resultado de la eliminación.
 */
const eliminarImagen = (publicId) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      return reject(new Error('Cloudinary no está configurado. Por favor, agregue las credenciales en .env'));
    }

    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = { cloudinary, subirImagen, eliminarImagen };
