const { db } = require('../config/firebase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mi_secreto_dev';

/**
 * @desc Registra un nuevo usuario
 * @route POST /api/auth/registro
 * @access Public
 */
exports.registro = async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Base de datos no inicializada' });
  }

  try {
    const { nombre, email, password } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Por favor, completa todos los campos (nombre, email, password)' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    // Verificar si el usuario ya existe
    const usuariosRef = db.collection('usuarios');
    const snapshot = await usuariosRef.where('email', '==', email.toLowerCase()).get();

    if (!snapshot.empty) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Si es el primer usuario, lo creamos como admin (para pruebas fáciles) o definimos un email específico para admin.
    // Vamos a hacer que si el email es 'admin@cacaoritual.com' o similar sea admin, de lo contrario cliente.
    const rol = email.toLowerCase() === 'admin@cacaoritual.com' ? 'admin' : 'cliente';

    const nuevoUsuario = {
      nombre,
      email: email.toLowerCase(),
      password: hashedPassword,
      rol,
      creadoEn: new Date().toISOString()
    };

    const docRef = await usuariosRef.add(nuevoUsuario);

    // Generar JWT
    const token = jwt.sign(
      { id: docRef.id, email: nuevoUsuario.email, rol: nuevoUsuario.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      usuario: {
        id: docRef.id,
        nombre: nuevoUsuario.nombre,
        email: nuevoUsuario.email,
        rol: nuevoUsuario.rol
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error en el servidor al registrar el usuario' });
  }
};

/**
 * @desc Iniciar sesión de usuario
 * @route POST /api/auth/login
 * @access Public
 */
exports.login = async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Base de datos no inicializada' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Por favor, introduce email y contraseña' });
    }

    // Buscar usuario en Firestore
    const usuariosRef = db.collection('usuarios');
    const snapshot = await usuariosRef.where('email', '==', email.toLowerCase()).get();

    if (snapshot.empty) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    let usuarioDoc;
    let usuarioId;
    snapshot.forEach(doc => {
      usuarioDoc = doc.data();
      usuarioId = doc.id;
    });

    // Validar contraseña
    const esPasswordValido = await bcrypt.compare(password, usuarioDoc.password);
    if (!esPasswordValido) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Generar JWT
    const token = jwt.sign(
      { id: usuarioId, email: usuarioDoc.email, rol: usuarioDoc.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      usuario: {
        id: usuarioId,
        nombre: usuarioDoc.nombre,
        email: usuarioDoc.email,
        rol: usuarioDoc.rol
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor al iniciar sesión' });
  }
};

/**
 * @desc Obtiene el perfil del usuario logueado
 * @route GET /api/auth/perfil
 * @access Private
 */
exports.obtenerPerfil = async (req, res) => {
  if (!db) {
    return res.status(500).json({ error: 'Base de datos no inicializada' });
  }

  try {
    // req.user es asignado por el middleware verificarToken
    const usuarioId = req.user.id;
    const doc = await db.collection('usuarios').doc(usuarioId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const datosUsuario = doc.data();
    res.json({
      id: doc.id,
      nombre: datosUsuario.nombre,
      email: datosUsuario.email,
      rol: datosUsuario.rol
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error en el servidor al obtener el perfil' });
  }
};
