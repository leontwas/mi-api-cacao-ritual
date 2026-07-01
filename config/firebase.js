const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let db;

try {
  const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

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
