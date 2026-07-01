const { db } = require('../config/firebase');

// Auxiliar para validar la base de datos
const verificarBaseDeDatos = (res) => {
  if (!db) {
    res.status(500).json({ error: 'La base de datos de Firebase no está inicializada.' });
    return false;
  }
  return true;
};

/**
 * @desc Obtiene los items del carrito del usuario autenticado
 * @route GET /api/carrito
 * @access Private
 */
exports.obtenerCarrito = async (req, res) => {
  if (!verificarBaseDeDatos(res)) return;

  try {
    const uid = req.user.id;
    const snapshot = await db.collection('carritos').doc(uid).collection('items').get();

    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });

    res.json(items);
  } catch (error) {
    console.error('Error al obtener el carrito:', error);
    res.status(500).json({ error: 'Error al obtener los artículos del carrito.' });
  }
};

/**
 * @desc Agrega o actualiza un artículo en el carrito del usuario
 * @route POST /api/carrito
 * @access Private
 */
exports.agregarAlCarrito = async (req, res) => {
  if (!verificarBaseDeDatos(res)) return;

  try {
    const uid = req.user.id;
    const { productoId, cantidad, nombre, precio, imagen } = req.body;

    if (!productoId || typeof cantidad === 'undefined' || cantidad <= 0) {
      return res.status(400).json({ error: 'Faltan datos del producto o cantidad inválida.' });
    }

    const itemRef = db.collection('carritos').doc(uid).collection('items').doc(String(productoId));

    const itemData = {
      productoId: String(productoId),
      cantidad: parseInt(cantidad, 10),
      nombre: nombre || '',
      precio: precio || '',
      imagen: imagen || '',
      actualizadoEn: new Date().toISOString()
    };

    await itemRef.set(itemData);
    res.json({ mensaje: 'Artículo agregado al carrito con éxito.', item: itemData });

  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    res.status(500).json({ error: 'Error al agregar el artículo al carrito.' });
  }
};

/**
 * @desc Elimina un artículo específico del carrito
 * @route DELETE /api/carrito/:productoId
 * @access Private
 */
exports.eliminarDelCarrito = async (req, res) => {
  if (!verificarBaseDeDatos(res)) return;

  try {
    const uid = req.user.id;
    const { productoId } = req.params;

    const itemRef = db.collection('carritos').doc(uid).collection('items').doc(String(productoId));
    const doc = await itemRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'El artículo no existe en el carrito.' });
    }

    await itemRef.delete();
    res.json({ mensaje: 'Artículo eliminado del carrito con éxito.', productoId });

  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
    res.status(500).json({ error: 'Error al eliminar el artículo del carrito.' });
  }
};

/**
 * @desc Vacía completamente el carrito del usuario
 * @route DELETE /api/carrito
 * @access Private
 */
exports.vaciarCarrito = async (req, res) => {
  if (!verificarBaseDeDatos(res)) return;

  try {
    const uid = req.user.id;
    const itemsRef = db.collection('carritos').doc(uid).collection('items');
    const snapshot = await itemsRef.get();

    if (snapshot.empty) {
      return res.json({ mensaje: 'El carrito ya está vacío.' });
    }

    const batch = db.batch();
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    res.json({ mensaje: 'Carrito vaciado con éxito.' });

  } catch (error) {
    console.error('Error al vaciar el carrito:', error);
    res.status(500).json({ error: 'Error al vaciar el carrito.' });
  }
};
