require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { db } = require('../config/firebase');
const { subirImagen } = require('../config/cloudinary');

const MOCK_PATH = path.join(__dirname, '../data/productosMock.json');

const parsePrecio = (precioStr) => {
  if (typeof precioStr === 'number') return precioStr;
  if (!precioStr) return 0;
  
  // Limpia el formato de precio de string (ej. "$3.200" -> 3200)
  let limpio = precioStr.replace('$', '').trim();
  limpio = limpio.replace(/\./g, ''); // Remover puntos como separador de miles
  const parseado = parseFloat(limpio);
  return isNaN(parseado) ? 0 : parseado;
};

const migrar = async () => {
  if (!db) {
    console.error('❌ Firestore no está inicializado. Asegúrate de configurar las variables de entorno en el archivo .env');
    process.exit(1);
  }

  console.log('🔄 Iniciando migración de productos a Firestore y Cloudinary...');

  try {
    if (!fs.existsSync(MOCK_PATH)) {
      console.error(`❌ No se encontró el archivo mock en: ${MOCK_PATH}`);
      process.exit(1);
    }

    const productosJson = JSON.parse(fs.readFileSync(MOCK_PATH, 'utf8'));
    console.log(`📦 Encontrados ${productosJson.length} productos para migrar.`);

    for (const producto of productosJson) {
      console.log(`\nProcessing: "${producto.nombre}" (ID original: ${producto.id})`);

      let imagenUrl = producto.imagen;
      let imagenPublicId = null;

      // Verificar si la imagen es local y debe subirse a Cloudinary
      if (producto.imagen && producto.imagen.startsWith('/public/images/')) {
        // Resolver ruta local de la imagen
        const rutaImagenLocal = path.join(__dirname, '..', producto.imagen.replace(/^\//, ''));

        if (fs.existsSync(rutaImagenLocal)) {
          console.log(`   📸 Subiendo imagen local a Cloudinary: ${producto.imagen}`);
          const buffer = fs.readFileSync(rutaImagenLocal);
          
          try {
            const uploadResult = await subirImagen(buffer);
            imagenUrl = uploadResult.secure_url;
            imagenPublicId = uploadResult.public_id;
            console.log(`   ✅ Subida exitosa! URL: ${imagenUrl}`);
          } catch (uploadErr) {
            console.error(`   ❌ Error al subir imagen a Cloudinary para el producto ${producto.id}:`, uploadErr.message);
            console.log(`   ⚠️ Se usará la ruta local original como fallback.`);
          }
        } else {
          console.warn(`   ⚠️ Advertencia: No se encontró la imagen en la ruta local: ${rutaImagenLocal}`);
        }
      }

      // Preparar el documento del producto para Firestore
      const precioNumerico = parsePrecio(producto.precio);
      const productoFirestore = {
        nombre: producto.nombre,
        descripcion: producto.descripcion || '',
        precio: precioNumerico,
        imagen: imagenUrl,
        imagen_public_id: imagenPublicId
      };

      // Guardar en Firestore usando el ID del mock como ID del documento
      const docId = String(producto.id);
      await db.collection('productos').doc(docId).set(productoFirestore);
      console.log(`   🔥 Guardado en Firestore con ID: ${docId}`);
    }

    console.log('\n🎉 ¡Migración completada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error durante la migración:', error);
    process.exit(1);
  }
};

migrar();
