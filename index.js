const express = require('express');
const app = express();
const mySql = require('mysql');


const db = mySql.createConnection({
  user: 'root',
  host: 'localhost',
  password: 'password',
  database: 'mydb',
});


app.listen(3001, () => {
  console.log('Server is runing on port 3001')
});

app.get('/comunas', (req, res) => {
  db.query("SELECT * FROM comuna", (err, result) => {
    err ? console.log(err) : console.log(result);
  })
});