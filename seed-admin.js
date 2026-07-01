const dotenv = require('dotenv');
// Cargar variables de entorno antes de importar cualquier config
dotenv.config();

const { db } = require('./config/firebase');
const bcrypt = require('bcryptjs');

async function seed() {
  if (!db) {
    console.error("❌ Base de datos no inicializada. Verifica tus credenciales.");
    process.exit(1);
  }

  const email = 'admin@cacaoritual.com';
  const password = 'admin';
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const snapshot = await db.collection('usuarios').where('email', '==', email).get();
    if (!snapshot.empty) {
      console.log("推广 El usuario administrador ya existe.");
      process.exit(0);
    }

    await db.collection('usuarios').add({
      nombre: 'Administrador',
      email: email,
      password: hashedPassword,
      rol: 'admin',
      creadoEn: new Date().toISOString()
    });

    console.log("✅ Usuario administrador creado exitosamente.");
    console.log("📧 Email: admin@cacaoritual.com");
    console.log("🔑 Password: admin");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al crear el usuario administrador:", error);
    process.exit(1);
  }
}

seed();
