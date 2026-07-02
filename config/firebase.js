const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno aquí para garantizar que estén disponibles
// incluso si este módulo se importa antes de que server.js llame a dotenv.config()
dotenv.config({ path: path.join(__dirname, '../.env') });

let db;

try {
  const serviceAccountPath = path.join(__dirname, '../firebase-credentials.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Inicialización mediante variables de entorno individuales (recomendado para Vercel)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        })
      });
    } else {
      console.warn("⚠️ Advertencia: No se encontraron credenciales completas de Firebase en las variables de entorno.");
    }
  }

  if (admin.apps.length > 0) {
    db = admin.firestore();
    console.log("🔥 Firebase Admin/Firestore inicializado correctamente.");
  }
} catch (error) {
  console.error("❌ Error al inicializar Firebase Admin:", error);
}

module.exports = { db, admin };
