const express = require('express');
const router = express.Router();
const {
  obtenerCarrito,
  agregarAlCarrito,
  eliminarDelCarrito,
  vaciarCarrito
} = require('../controllers/carritoControllers');

const { verificarToken } = require('../middlewares/auth');

router.get('/', verificarToken, obtenerCarrito);
router.post('/', verificarToken, agregarAlCarrito);
router.delete('/:productoId', verificarToken, eliminarDelCarrito);
router.delete('/', verificarToken, vaciarCarrito);

module.exports = router;
