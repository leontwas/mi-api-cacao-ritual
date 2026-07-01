const { db } = require('../config/firebase');
const { subirImagen, eliminarImagen } = require('../config/cloudinary');

// Verificación de inicialización de la base de datos
const verificarBaseDeDatos = (res) => {
  if (!db) {
    res.status(500).json({ error: 'La base de datos de Firebase no está inicializada. Configure las variables de entorno.' });
    return false;
  }
  return true;
};

/**
 * @desc Obtiene todos los productos o filtra por nombre.
 * @route GET /api/productos?nombre=:nombre
 * @access Public
 */
exports.obtenerProductos = async (req, res) => {
  if (!verificarBaseDeDatos(res)) return;

  try {
    const { nombre } = req.query;
    const snapshot = await db.collection('productos').get();
    
    let productos = [];
    snapshot.forEach(doc => {
      productos.push({ id: doc.id, ...doc.data() });
    });

    if (nombre) {
      const nombreLower = nombre.toLowerCase();
      productos = productos.filter(p => p.nombre && p.nombre.toLowerCase().includes(nombreLower));
      
      if (productos.length === 0) {
        return res.status(404).json({ error: `No se encontraron productos con el nombre '${nombre}'.` });
      }
    }

    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos de Firestore:', error);
    res.status(500).json({ error: 'Ocurrió un error al obtener los productos.' });
  }
};

/**
 * @desc Obtiene un producto por su ID.
 * @route GET /api/productos/:id
 * @access Public
 */
exports.obtenerProductoPorId = async (req, res) => {
  if (!verificarBaseDeDatos(res)) return;

  try {
    const { id } = req.params;
    const doc = await db.collection('productos').doc(String(id)).get();

    if (!doc.exists) {
      return res.status(404).json({ error: `Producto con ID '${id}' no encontrado.` });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Error al obtener producto por ID:', error);
    res.status(500).json({ error: 'Ocurrió un error al buscar el producto.' });
  }
};

/**
 * @desc Crea un nuevo producto con soporte para subir imágenes a Cloudinary.
 * @route POST /api/productos
 * @access Private (requiere token)
 */
exports.crearProducto = async (req, res) => {
  if (!verificarBaseDeDatos(res)) return;

  try {
    const { nombre, descripcion, precio } = req.body;
    let { id } = req.body;

    // --- Validación básica del nuevo producto ---
    if (!nombre || typeof precio === 'undefined' || parseFloat(precio) < 0) {
      return res.status(400).json({ error: 'Datos del producto incompletos o inválidos (requiere nombre y precio positivo).' });
    }

    // Verificar si el ID ya existe en Firestore
    if (id) {
      const docExistente = await db.collection('productos').doc(String(id)).get();
      if (docExistente.exists) {
        return res.status(400).json({ error: `El ID '${id}' ya existe.` });
      }
    } else {
      // Generar ID único usando timestamp
      id = String(Date.now());
    }

    let imagenUrl = req.body.imagen || '';
    let imagenPublicId = null;

    // Subir imagen a Cloudinary si se proporciona un archivo
    if (req.file) {
      try {
        const resultadoCloudinary = await subirImagen(req.file.buffer);
        imagenUrl = resultadoCloudinary.secure_url;
        imagenPublicId = resultadoCloudinary.public_id;
      } catch (err) {
        console.error('Error al subir imagen a Cloudinary:', err);
        return res.status(500).json({ error: 'Error al procesar la imagen del producto.' });
      }
    }

    const nuevoProducto = {
      nombre,
      descripcion: descripcion || '',
      precio: parseFloat(precio), // Guardar como número real
      imagen: imagenUrl,
      imagen_public_id: imagenPublicId
    };

    await db.collection('productos').doc(String(id)).set(nuevoProducto);

    res.status(201).json({ id, ...nuevoProducto });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Ocurrió un error interno al crear el producto.' });
  }
};

/**
 * @desc Actualiza un producto existente por su ID.
 * @route PUT /api/productos/:id
 * @access Private (requiere token)
 */
exports.actualizarProducto = async (req, res) => {
  if (!verificarBaseDeDatos(res)) return;

  try {
    const { id } = req.params;
    const docRef = db.collection('productos').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: `Producto con ID '${id}' no encontrado para actualizar.` });
    }

    const productoExistente = doc.data();
    const updates = req.body;
    
    // Objeto con las actualizaciones que enviaremos a Firestore
    const camposActualizar = {};

    // Validar y aplicar actualizaciones del body
    for (const key in updates) {
      if (key === 'id') continue; // No permitir cambiar el ID

      const value = updates[key];

      if (value !== '' && value !== null && value !== undefined) {
        if (key === 'precio') {
          const numericValue = parseFloat(value);
          if (!isNaN(numericValue) && numericValue > 0) {
            camposActualizar[key] = numericValue;
          } else {
            return res.status(400).json({ error: 'El precio debe ser un número positivo para modificar.' });
          }
        } else if (typeof value === 'string' && value.trim() === '') {
          continue;
        } else {
          camposActualizar[key] = value;
        }
      }
    }

    // Subir nueva imagen a Cloudinary si se proporciona y reemplazar la anterior
    if (req.file) {
      try {
        const resultadoCloudinary = await subirImagen(req.file.buffer);
        camposActualizar.imagen = resultadoCloudinary.secure_url;
        camposActualizar.imagen_public_id = resultadoCloudinary.public_id;

        // Eliminar la imagen vieja si existía en Cloudinary
        if (productoExistente.imagen_public_id) {
          await eliminarImagen(productoExistente.imagen_public_id).catch(err => {
            console.error('Error al eliminar imagen vieja de Cloudinary:', err);
          });
        }
      } catch (err) {
        console.error('Error al subir nueva imagen a Cloudinary:', err);
        return res.status(500).json({ error: 'Error al procesar la nueva imagen del producto.' });
      }
    }

    // Si no se proporcionaron campos para actualizar y tampoco hay nueva imagen
    if (Object.keys(camposActualizar).length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos válidos para actualizar.' });
    }

    await docRef.update(camposActualizar);

    res.json({ id, ...productoExistente, ...camposActualizar });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Ocurrió un error interno al actualizar el producto.' });
  }
};

/**
 * @desc Elimina un producto por su ID y limpia su imagen de Cloudinary.
 * @route DELETE /api/productos/:id
 * @access Private (requiere token)
 */
exports.eliminarProducto = async (req, res) => {
  if (!verificarBaseDeDatos(res)) return;

  try {
    const { id } = req.params;
    const docRef = db.collection('productos').doc(String(id));
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: `Producto con ID '${id}' no encontrado para eliminar.` });
    }

    const producto = doc.data();

    // Eliminar la imagen de Cloudinary si existía
    if (producto.imagen_public_id) {
      await eliminarImagen(producto.imagen_public_id).catch(err => {
        console.error('Error al eliminar imagen de Cloudinary:', err);
      });
    }

    // Eliminar el documento de Firestore
    await docRef.delete();

    res.json({ mensaje: `Producto con ID '${id}' eliminado correctamente de la base de datos.` });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Ocurrió un error al eliminar el producto.' });
  }
};
