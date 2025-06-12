
/*
const express = require("express");
const { exec } = require("child_process");
const mysql = require("mysql2");
const app = express();
const port = 3000;

app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "TESE",
  database: "papelera_ciclico_prueba_1"
});

db.connect((err) => {
  if (err) {
    console.error("Error conectando a MySQL:", err.code, err.message);
    return;
  }
  console.log("Conectado a MySQL!");
});

app.get("/", (req, res) => {
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
      font-family: 'Bebas Neue', sans-serif;
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

app.get("/inicio", (req, res) => {
  res.sendFile(__dirname + "/inicio.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/inicio_sesion.html");
});

app.post("/login", (req, res) => {
  console.log("Datos recibidos:", req.body);
  const { email, password, rol } = req.body || {};

  if (!email || !password || !rol) {
    return res.status(400).send("Faltan correo, contraseña o rol");
  }

  const query = "SELECT nombre, rol FROM usuarios WHERE email = ? AND password_hash = ?";
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error("Error en la consulta:", err.message);
      return res.status(500).send("Error en el servidor");
    }

    console.log("Resultado de la consulta:", results);
    if (results.length > 0) {
      const userRol = results[0].rol;
      const userName = results[0].nombre;
      console.log("Rol de usuario:", userRol, "Rol esperado:", rol);
      if (userRol === rol) {
        switch (userRol) {
          case "admin":
            res.sendFile(__dirname + "/administrador.html", { userName });
            break;
          case "logistico":
            res.sendFile(__dirname + "/logistica.html", { userName });
            break;
          case "contador":
            res.sendFile(__dirname + "/contaduria.html", { userName });
            break;
          case "soporte":
            res.sendFile(__dirname + "/soporte.html", { userName });
            break;
          case "cajero":
            res.sendFile(__dirname + "/cajero.html", { userName });
            break;
          default:
            res.send("Rol no reconocido");
        }
      } else {
        res.send("El rol no coincide con el usuario. Usuario: " + userRol + ", Esperado: " + rol);
      }
    } else {
      res.send("Correo o contraseña incorrectos");
    }
  });
});

app.post("/cambiar-contrasena", (req, res) => {
  const { email, newPassword, rol } = req.body;

  if (!email || !newPassword || !rol) {
    return res.status(400).send("Faltan correo, nueva contraseña o rol");
  }

  const query = "UPDATE usuarios SET password_hash = ? WHERE email = ?";
  db.query(query, [newPassword, email], (err, results) => {
    if (err) {
      console.error("Error al actualizar la contraseña:", err.message);
      return res.status(500).send("Error en el servidor");
    }

    if (results.affectedRows > 0) {
      res.redirect(`/login?rol=${rol}`);
    } else {
      res.status(404).send("Usuario no encontrado");
    }
  });
});

app.get("/administrador.html", (req, res) => {
  res.sendFile(__dirname + "/administrador.html");
});
app.get("/logistica.html", (req, res) => {
  res.sendFile(__dirname + "/logistica.html");
});
app.get("/contaduria.html", (req, res) => {
  res.sendFile(__dirname + "/contaduria.html");
});
app.get("/soporte.html", (req, res) => {
  res.sendFile(__dirname + "/soporte.html");
});
app.get("/cajero.html", (req, res) => {
  res.sendFile(__dirname + "/cajero.html");
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  exec(`start http://localhost:${port}`, (err) => {
    if (err) {
      console.error("Error al abrir el navegador:", err);
    }
  });
});*/

require('dotenv').config();
const express = require("express");
const { exec } = require("child_process");
const mysql = require("mysql2");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

db.connect((err) => {
  if (err) {
    console.error("Error conectando a MySQL:", err.code, err.message);
    return;
  }
  console.log("Conectado a MySQL!");
});

app.get("/", (req, res) => {
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
          font-family: 'Bebas Neue', sans-serif;
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

app.get("/inicio", (req, res) => {
  res.sendFile(__dirname + "/inicio.html");
});

app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/inicio_sesion.html");
});

app.post("/login", (req, res) => {
  console.log("Datos recibidos:", req.body);
  const { email, password, rol } = req.body || {};

  if (!email || !password || !rol) {
    return res.status(400).send("Faltan correo, contraseña o rol");
  }

  const query = "SELECT nombre, rol FROM usuarios WHERE email = ? AND password_hash = ?";
  db.query(query, [email, password], (err, results) => {
    if (err) {
      console.error("Error en la consulta:", err.message);
      return res.status(500).send("Error en el servidor");
    }

    console.log("Resultado de la consulta:", results);
    if (results.length > 0) {
      const userRol = results[0].rol;
      const userName = results[0].nombre;
      console.log("Rol de usuario:", userRol, "Rol esperado:", rol);
      if (userRol === rol) {
        switch (userRol) {
          case "admin":
            res.sendFile(__dirname + "/administrador.html", { userName });
            break;
          case "logistico":
            res.sendFile(__dirname + "/logistica.html", { userName });
            break;
          case "contador":
            res.sendFile(__dirname + "/contaduria.html", { userName });
            break;
          case "soporte":
            res.sendFile(__dirname + "/soporte.html", { userName });
            break;
          case "cajero":
            res.sendFile(__dirname + "/cajero.html", { userName });
            break;
          default:
            res.send("Rol no reconocido");
        }
      } else {
        res.send("El rol no coincide con el usuario. Usuario: " + userRol + ", Esperado: " + rol);
      }
    } else {
      res.send("Correo o contraseña incorrectos");
    }
  });
});

app.post("/cambiar-contrasena", (req, res) => {
  const { email, newPassword, rol } = req.body;

  if (!email || !newPassword || !rol) {
    return res.status(400).send("Faltan correo, nueva contraseña o rol");
  }

  const query = "UPDATE usuarios SET password_hash = ? WHERE email = ?";
  db.query(query, [newPassword, email], (err, results) => {
    if (err) {
      console.error("Error al actualizar la contraseña:", err.message);
      return res.status(500).send("Error en el servidor");
    }

    if (results.affectedRows > 0) {
      res.redirect(`/login?rol=${rol}`);
    } else {
      res.status(404).send("Usuario no encontrado");
    }
  });
});

app.get("/administrador.html", (req, res) => {
  res.sendFile(__dirname + "/administrador.html");
});
app.get("/logistica.html", (req, res) => {
  res.sendFile(__dirname + "/logistica.html");
});
app.get("/contaduria.html", (req, res) => {
  res.sendFile(__dirname + "/contaduria.html");
});
app.get("/soporte.html", (req, res) => {
  res.sendFile(__dirname + "/soporte.html");
});
app.get("/cajero.html", (req, res) => {
  res.sendFile(__dirname + "/cajero.html");
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  // Comenta o elimina esta parte para la nube
  // exec(`start http://localhost:${port}`, (err) => {
  //   if (err) {
  //     console.error("Error al abrir el navegador:", err);
  //   }
  // });
});