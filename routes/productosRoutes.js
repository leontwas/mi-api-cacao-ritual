// routes/productosRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  obtenerProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
} = require('../controllers/productosControllers');

const { verificarToken, soloAdmin } = require('../middlewares/auth.js');

// Configuración de multer en memoria (compatible con Vercel)
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', obtenerProductos);
router.get('/:id', obtenerProductoPorId);

// Rutas protegidas solo para administradores
router.post('/', verificarToken, soloAdmin, upload.single('imagen'), crearProducto);
router.put('/:id', verificarToken, soloAdmin, upload.single('imagen'), actualizarProducto);
router.delete('/:id', verificarToken, soloAdmin, eliminarProducto);

module.exports = router;
