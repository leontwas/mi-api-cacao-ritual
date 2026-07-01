const express = require('express');
const router = express.Router();
const { registro, login, obtenerPerfil } = require('../controllers/authControllers');
const { verificarToken } = require('../middlewares/auth');

router.post('/auth/registro', registro);
router.post('/auth/login', login);
router.get('/auth/perfil', verificarToken, obtenerPerfil);

module.exports = router;
