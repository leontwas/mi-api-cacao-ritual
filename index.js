// server.js
const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Utilidad para leer archivo JSON
const leerProductos = (callback) => {
  const ruta = path.join(__dirname, 'data', 'productosMock.json');
  fs.readFile(ruta, 'utf8', (err, data) => {
    if (err) return callback(err, null);
    try {
      const productos = JSON.parse(data);
      callback(null, productos);
    } catch (parseErr) {
      callback(parseErr, null);
    }
  });
};

// GET: Todos los productos
app.get('/api/productos', (req, res) => {
  leerProductos((err, productos) => {
    if (err) return res.status(500).json({ error: 'Error al leer los productos' });
    res.json(productos);
  });
});

// GET: Producto por ID
app.get('/api/productos/:id', (req, res) => {
  const id = req.params.id;

  leerProductos((err, productos) => {
    if (err) return res.status(500).json({ error: 'Error al leer los productos' });

    const producto = productos.find((p) => String(p.id) === String(id));

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(producto);
  });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ API corriendo en http://localhost:${PORT}`);
});
