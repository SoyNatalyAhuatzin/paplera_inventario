require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Conexión a la base de datos
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

db.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err.code, err.message);
    return;
  }
  console.log('Conectado a MySQL!');

  // Crear tabla usuarios si no existe
  const createUsuariosTable = `
    CREATE TABLE IF NOT EXISTS usuarios (
      usuario_id INT AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      rol ENUM('admin', 'contador', 'cajero', 'logistica') NOT NULL,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.query(createUsuariosTable, (err) => {
    if (err) {
      console.error('Error al crear tabla usuarios:', err.message);
    } else {
      console.log('Tabla usuarios creada o ya existe.');
    }
  });

  // Crear tabla sesiones si no existe
  const createSesionesTable = `
    CREATE TABLE IF NOT EXISTS sesiones (
      usuario_id INT PRIMARY KEY,
      hora_inicio DATETIME NOT NULL,
      activo BOOLEAN DEFAULT TRUE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(usuario_id) ON DELETE CASCADE
    )
  `;
  db.query(createSesionesTable, (err) => {
    if (err) {
      console.error('Error al crear tabla sesiones:', err.message);
    } else {
      console.log('Tabla sesiones creada o ya existe.');
    }
  });

  // Crear tabla permisos si no existe
  const createPermisosTable = `
    CREATE TABLE IF NOT EXISTS permisos (
      rol ENUM('admin', 'contador', 'cajero', 'logistica') PRIMARY KEY,
      consultar_stock BOOLEAN NOT NULL DEFAULT FALSE,
      registrar_entrada BOOLEAN NOT NULL DEFAULT FALSE,
      registrar_salidas BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;
  db.query(createPermisosTable, (err) => {
    if (err) {
      console.error('Error al crear tabla permisos:', err.message);
    } else {
      console.log('Tabla permisos creada o ya existe.');
      // Insertar permisos iniciales si la tabla está vacía
      const insertInitialPermisos = `
        INSERT IGNORE INTO permisos (rol, consultar_stock, registrar_entrada, registrar_salidas) VALUES
        ('admin', TRUE, TRUE, TRUE),
        ('cajero', TRUE, FALSE, TRUE),
        ('contador', TRUE, FALSE, FALSE),
        ('logistica', TRUE, TRUE, TRUE)
      `;
      db.query(insertInitialPermisos, (err) => {
        if (err) {
          console.error('Error al insertar permisos iniciales:', err.message);
        } else {
          console.log('Permisos iniciales insertados o ya existen.');
        }
      });
    }
  });
});

// Servir archivos estáticos
app.use(express.static(__dirname));

// Página principal
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Control de Papelera</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background-color: #d7d2cb;
          border: 20px solid #7a8f7a;
          box-sizing: border-box;
        }
        .container {
          background-color: #ffffff;
          padding: 20px;
          border: 1px solid #ccc;
          text-align: center;
          width: 400px;
        }
        h1 {
          margin: 0 0 20px;
          font-family: 'Bebas+Neue', sans-serif;
          font-size: 48px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        button {
          background-color: #e05576;
          color: white;
          border: none;
          padding: 10px 20px;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          font-size: 16px;
          border-radius: 8px;
        }
        button:hover {
          background-color: #b33c5e;
          border-radius: 8px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Control de Papelera</h1>
        <button onclick="window.location.href='/inicio'">Entrar</button>
      </div>
    </body>
    </html>
  `);
});

// Rutas para páginas HTML
app.get('/inicio', (req, res) => {
  res.sendFile(__dirname + '/inicio.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/inicio_sesion.html');
});

// Autenticación
app.post('/login', (req, res) => {
  console.log('Datos recibidos en /login:', req.body);
  const { email, password, rol } = req.body || {};

  // Validar que se recibieron todos los campos
  if (!email || !password || !rol) {
    console.error('Faltan datos en la solicitud:', { email, password, rol });
    return res.status(400).json({ error: 'Faltan correo, contraseña o rol' });
  }

  // Validar rol válido
  const validRoles = ['admin', 'contador', 'cajero', 'logistica'];
  if (!validRoles.includes(rol)) {
    console.error('Rol inválido:', rol);
    return res.status(400).json({ error: 'Rol inválido' });
  }

  // Consultar usuario en la base de datos
  const query = 'SELECT usuario_id, nombre, rol, password_hash FROM usuarios WHERE email = ? AND password_hash = ?';
  db.query(query, [email.trim(), password.trim()], (err, results) => {
    if (err) {
      console.error('Error en la consulta de usuario:', err.message);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    console.log('Resultado de la consulta:', results);
    if (results.length > 0) {
      const user = results[0];
      const userRol = user.rol;
      const userName = user.nombre;
      const usuarioId = user.usuario_id;

      console.log('Rol de usuario:', userRol, 'Rol esperado:', rol);
      if (userRol === rol) {
        // Registrar sesión
        const insertSesion = `
          INSERT INTO sesiones (usuario_id, hora_inicio, activo)
          VALUES (?, NOW(), TRUE)
          ON DUPLICATE KEY UPDATE hora_inicio = NOW(), activo = TRUE
        `;
        db.query(insertSesion, [usuarioId], (err) => {
          if (err) {
            console.error('Error al registrar sesión:', err.message);
          } else {
            console.log(`Sesión registrada para usuario_id: ${usuarioId}`);
          }
        });

        // Redirección según el rol
        const rolePages = {
          admin: `/administrador.html?name=${encodeURIComponent(userName)}`,
          logistica: '/logistica.html',
          contador: '/contaduria.html',
          cajero: '/cajero.html',
        };

        if (rolePages[userRol]) {
          console.log(`Redirigiendo a ${userRol} a ${rolePages[userRol]}`);
          res.redirect(rolePages[userRol]);
        } else {
          console.error('Rol no reconocido:', userRol);
          res.status(400).json({ error: 'Rol no reconocido' });
        }
      } else {
        console.error(`El rol no coincide. Usuario: ${userRol}, Esperado: ${rol}`);
        res.status(403).json({ error: `El rol no coincide con el usuario. Usuario: ${userRol}, Esperado: ${rol}` });
      }
    } else {
      console.error('Correo o contraseña incorrectos para:', email);
      res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
  });
});

// Cambiar contraseña
app.post('/cambiar-contrasena', (req, res) => {
  const { email, newPassword, rol } = req.body;

  if (!email || !newPassword || !rol) {
    return res.status(400).json({ error: 'Faltan correo, nueva contraseña o rol' });
  }

  const query = 'UPDATE usuarios SET password_hash = ? WHERE email = ?';
  db.query(query, [newPassword.trim(), email.trim()], (err, results) => {
    if (err) {
      console.error('Error al actualizar la contraseña:', err.message);
      return res.status(500).json({ error: 'Error en el servidor' });
    }

    if (results.affectedRows > 0) {
      res.redirect(`/login?rol=${rol}`);
    } else {
      res.status(404).json({ error: 'Usuario no encontrado' });
    }
  });
});

// Endpoint para crear un nuevo usuario
app.post('/api/usuario', (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: 'Faltan nombre, correo, contraseña o rol' });
  }

  const validRoles = ['admin', 'contador', 'cajero', 'logistica'];
  if (!validRoles.includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  const query = `
    INSERT INTO usuarios (nombre, email, password_hash, rol, fecha_creacion)
    VALUES (?, ?, ?, ?, NOW())
  `;
  db.query(query, [nombre.trim(), email.trim(), password.trim(), rol], (err, results) => {
    if (err) {
      console.error('Error al crear usuario:', err.message);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'El correo ya está registrado' });
      }
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    console.log(`Usuario creado con ID: ${results.insertId}`);
    res.status(201).json({ message: 'Usuario creado correctamente', usuario_id: results.insertId });
  });
});

// Endpoint para obtener un usuario por ID
app.get('/api/usuario/:id', (req, res) => {
  const usuarioId = req.params.id;
  const query = `
    SELECT usuario_id, nombre, email, rol
    FROM usuarios
    WHERE usuario_id = ?
  `;
  db.query(query, [usuarioId], (err, results) => {
    if (err) {
      console.error('Error en la consulta de usuario:', err.message);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(results[0]);
  });
});

// Endpoint para actualizar un usuario
app.put('/api/usuario/:id', (req, res) => {
  const usuarioId = req.params.id;
  const { email, rol } = req.body;
  if (!email || !rol) {
    return res.status(400).json({ error: 'Faltan correo o rol' });
  }
  const validRoles = ['admin', 'contador', 'cajero', 'logistica'];
  if (!validRoles.includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }
  const query = `
    UPDATE usuarios
    SET email = ?, rol = ?
    WHERE usuario_id = ?
  `;
  db.query(query, [email.trim(), rol, usuarioId], (err, results) => {
    if (err) {
      console.error('Error al actualizar usuario:', err.message);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario actualizado correctamente' });
  });
});

// Endpoint para eliminar un usuario
app.delete('/api/usuario/:id', (req, res) => {
  const usuarioId = req.params.id;
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error al iniciar transacción:', err.message);
      return res.status(500).json({ error: 'Error en el servidor al iniciar transacción' });
    }

    // Verificar si el usuario existe
    const checkUser = 'SELECT usuario_id FROM usuarios WHERE usuario_id = ?';
    db.query(checkUser, [usuarioId], (err, results) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error al verificar usuario:', err.message);
          res.status(500).json({ error: 'Error al verificar usuario' });
        });
      }
      if (results.length === 0) {
        return db.rollback(() => {
          console.error('Usuario no encontrado:', usuarioId);
          res.status(404).json({ error: 'Usuario no encontrado' });
        });
      }

      // Eliminar sesiones asociadas
      const deleteSesiones = 'DELETE FROM sesiones WHERE usuario_id = ?';
      db.query(deleteSesiones, [usuarioId], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error al eliminar sesiones:', err.message);
            res.status(500).json({ error: `Error al eliminar sesiones asociadas: ${err.message}` });
          });
        }

        // Eliminar usuario
        const deleteUsuario = 'DELETE FROM usuarios WHERE usuario_id = ?';
        db.query(deleteUsuario, [usuarioId], (err, results) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error al eliminar usuario:', err.message);
              res.status(500).json({ error: `Error al eliminar usuario: ${err.message}` });
            });
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error('Error al confirmar transacción:', err.message);
                res.status(500).json({ error: 'Error al confirmar eliminación' });
              });
            }
            console.log(`Usuario ID ${usuarioId} eliminado correctamente`);
            res.json({ message: 'Usuario eliminado correctamente' });
          });
        });
      });
    });
  });
});

// Endpoint para obtener todos los permisos
app.get('/api/permisos', (req, res) => {
  const query = 'SELECT rol, consultar_stock, registrar_entrada, registrar_salidas FROM permisos';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error en la consulta de permisos:', err.message);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results);
  });
});

// Endpoint para actualizar permisos de un rol
app.put('/api/permisos/:rol', (req, res) => {
  const { rol } = req.params;
  const { consultar_stock, registrar_entrada, registrar_salidas } = req.body;
  
  if (typeof consultar_stock !== 'boolean' || typeof registrar_entrada !== 'boolean' || typeof registrar_salidas !== 'boolean') {
    return res.status(400).json({ error: 'Todos los permisos deben ser valores booleanos' });
  }

  const validRoles = ['admin', 'contador', 'cajero', 'logistica'];
  if (!validRoles.includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  const query = `
    UPDATE permisos
    SET consultar_stock = ?, registrar_entrada = ?, registrar_salidas = ?
    WHERE rol = ?
  `;
  db.query(query, [consultar_stock, registrar_entrada, registrar_salidas, rol], (err, results) => {
    if (err) {
      console.error('Error al actualizar permisos:', err.message);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }
    console.log(`Permisos actualizados para rol: ${rol}`);
    res.json({ message: 'Permisos actualizados correctamente' });
  });
});

// Endpoint para inventario
app.get('/api/inventario', (req, res) => {
  const query = `
    SELECT ubicacion, SUM(cantidad_disponible) as cantidad
    FROM vista_inventario_actual
    GROUP BY ubicacion
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error en la consulta de inventario:', err.message);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results);
  });
});

// Endpoint para stock de productos
app.get('/api/stock', (req, res) => {
  const query = `
    SELECT 
      p.nombre,
      i.cantidad_disponible AS cantidad,
      ip.url_imagen AS imagen
    FROM 
      productos p
    JOIN 
      inventario i ON p.producto_id = i.producto_id
    LEFT JOIN 
      imagenes_producto ip ON p.producto_id = ip.producto_id AND ip.es_principal = TRUE
    WHERE 
      i.cantidad_disponible > 0
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error en la consulta de stock:', err.message);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    console.log('Productos enviados:', results.length);
    res.json(results);
  });
});

// Endpoint para usuarios activos
app.get('/api/usuarios-activos', (req, res) => {
  const query = `
    SELECT u.nombre, u.rol, s.hora_inicio
    FROM usuarios u
    JOIN sesiones s ON u.usuario_id = s.usuario_id
    WHERE s.activo = TRUE
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error en la consulta de usuarios activos:', err.message);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    let users = results.map((user) => ({
      nombre: user.nombre,
      rol: user.rol,
      activo: 'Sí',
      hora_inicio: user.hora_inicio.toISOString().slice(0, 19).replace('T', ' '),
    }));
    if (users.length === 0) {
      users = [
        {
          nombre: 'Juan Pérez',
          rol: 'admin',
          activo: 'Sí',
          hora_inicio: '2025-06-12 09:00:00',
        },
        {
          nombre: 'María López',
          rol: 'logistica',
          activo: 'Sí',
          hora_inicio: '2025-06-12 09:15:00',
        },
      ];
    }
    res.json(users);
  });
});

// Endpoint para todos los usuarios
app.get('/api/usuarios', (req, res) => {
  const query = `
    SELECT 
      u.usuario_id,
      u.nombre, 
      u.email, 
      u.rol, 
      IF(s.activo IS NULL, 'No', 'Sí') AS activo, 
      u.fecha_creacion
    FROM 
      usuarios u
    LEFT JOIN 
      sesiones s ON u.usuario_id = s.usuario_id AND s.activo = TRUE
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error en la consulta de usuarios:', err.message);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    const users = results.map(user => ({
      usuario_id: user.usuario_id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      activo: user.activo,
      fecha_creacion: user.fecha_creacion.toISOString().slice(0, 19).replace('T', ' ')
    }));
    res.json(users);
  });
});

// Endpoint para búsqueda de usuarios
app.get('/search', (req, res) => {
  const query = req.query.query || '';
  if (query.length < 3) {
    return res.json([]);
  }
  const searchQuery = `
    SELECT nombre, email
    FROM usuarios
    WHERE nombre LIKE ? OR email LIKE ?
  `;
  db.query(searchQuery, [`%${query}%`, `%${query}%`], (err, results) => {
    if (err) {
      console.error('Error en la búsqueda:', err.message);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results);
  });
});

// Endpoint para obtener todos los clientes
app.get('/api/clientes', (req, res) => {
  const query = `
    SELECT cliente_id, nombre
    FROM clientes
    WHERE activo = TRUE
    ORDER BY nombre ASC
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error en la consulta de clientes:', err.message);
      return res.status(500).json({ error: 'Error en el servidor' });
    }
    res.json(results);
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});