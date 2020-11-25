const express = require('express');
const app = express();
const mySql = require('promise-mysql');
const cors = require('cors');
const moment = require('moment');

app.use(express.json());
app.use(cors());

let db;
mySql.createConnection({
  user: 'root',
  host: 'localhost',
  password: 'password',
  database: 'mydb',
}).then((conn) => {
  db = conn;
});

app.listen(3001, () => {
  console.log('Server is runing on port 3001')
});

app.get('/regiones', (req, res) => {
  db.query("SELECT idREGION, nombre FROM region", (err, result) => {
    err ? console.log(err) : res.send(result);
  })
});

app.get('/comunas', (req, res) => {
  const idRegion = req.query.id;
  let queryComuna = 'SELECT * FROM comuna WHERE REGION_idREGION = ' + idRegion;
  db.query(queryComuna, (err, result) => {
    err ? console.log(err) : res.send(result);
  })
});

app.get('/lugares', (req, res) => {
  const idComuna = req.query.id;
  let queryLugar = 'SELECT * FROM lugar WHERE COMUNA_idCOMUNA = ' + idComuna;
  db.query(queryLugar, (err, result) => {
    err ? console.log(err) : res.send(result);
  })
})

app.get('/pertenece', (req, res) => {
  let idLugar = req.query.id;
  let queryPertenece = `SELECT * FROM actividad WHERE idACTIVIDAD in (SELECT ACTIVIDAD_idACTIVIDAD FROM pertenece WHERE LUGAR_idLUGAR = ${idLugar})`;
  db.query(queryPertenece, (err, result) => {
    err ? console.log(err) : res.send(result);
  })
});


// add transactions
app.post('/paquete', async (req, res) => {
  const dias = req.body.dias;
  const precio = req.body.precio;
  const idActividadesList = req.body.idsActividadList;
  let queryPaquete = `INSERT INTO paquete (dias, precio) VALUES (${dias}, ${precio})`;
  try {
    const result = await db.query(queryPaquete);
    const idPaquete = result.insertId;
    const arrayPromesa = idActividadesList.map((idActividad) => {
      let queryActividad = `INSERT INTO contiene (ACTIVIDAD_idACTIVIDAD, PAQUETE_idPAQUETE) VALUES (?, ?)`;
      return db.query(queryActividad, [idActividad, idPaquete]);
    })
    await Promise.all(arrayPromesa);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
})

app.post('/reserva', async (req, res) => {
  const cantidad = req.body.cantidad;
  const rut = 199019708;
  const idPaquete = 1;
  const fullDate = moment().format("DD/MM/YYYY");
  console.log(fullDate)
  let queryFecha = `INSERT INTO fecha (ddmmaa) VALUES (?)`;
  
  try {
    const resultInsertDate = await db.query(queryFecha, [fullDate]);
    console.log(resultInsertDate);
    const idDate = resultInsertDate.insertId;
    try {
      let queryORDENCOMPRA = `INSERT INTO ordenCompra (PERSONA_RUT, FECHA_idFECHA) VALUES (?, ?)`;
      const resultOrder = await db.query(queryORDENCOMPRA, [rut, idDate]);
      const idOrder = resultOrder.insertId;
      let queryReserva = 'INSERT INTO reserva (PAQUETE_idPAQUETE, ORDENCOMPRA_idORDENCOMPRA, cantidad) VALUES (?, ?, ?)' 
      return db.query(queryReserva, [idPaquete, idOrder, 2]);
      
    } catch (error){
      console.log(error)
    }
  }
  catch (error) {
    console.log(error)
  }
});

app.post('/userRegister', (req, res) => {
  const rut = req.body.rut;
  const name = req.body.name;
  const password = req.body.password;
  const edad = req.body.edad;
  const appat = req.body.appat;
  const apmat = req.body.apmat;
  queryRegister = 'INSERT INTO persona (RUT, nombre, edad, appat, apmat, password) VALUES (?,?,?,?,?,?)'
  db.query(queryRegister, [rut, name, edad, appat, apmat, password], (err, result) => {
    console.log(err)
  })
});

app.post('/login', (req, res) => {
  const { rut, password } = req.body;
  
  queryRegister = 'SELECT RUT, password FROM persona WHERE RUT = ? AND password = ?'
  db.query(queryRegister, [rut, password], (err, result) => {
    if (err) {
      res.send({ err })
    } else {
      if (result.length > 0) {
        const isAdmin = result[0].RUT === 199019708; 
        res.send({...result[0], isAdmin })
      } else {
        res.status(400).send({ message: "Wrong username/password combination!" });
      }
    }
  });
});

