//////////////////////////////////////////////////////////////////////////////////////
//Created by: Edgar F soarez A. fsoarez@hotmail.com
//Description: Software to control NV200 Spectral by Innovative Technologies.
//Protocol Used: Smiley Secured Protocol
//Date: Nov 2018
/////////////////////////////////////////////////////////////////////////////////////
const tambox = require('./it/devices/tambox');
//const moment=require("moment");
const pool = require('./database');
const chalk = require('chalk');
const mysql_store = require('express-mysql-session');
const session = require('express-session');
const exphbs = require('express-handlebars');
const path = require('path');
const morgan = require('morgan');
const {database} = require('./keys.js');
const express = require("express");
const app = express();
const router = express.Router();
const log = require('log-to-file');
var util = require('util')
const fs = require('fs') //para escribir archivo.
var httpx = require('http').Server(app);
const io = require('socket.io')(httpx, { cookie: false });
const sp= require('./it/serial_port')(io);
const ssp = require('./it/ssp')(io);
const va = require('./it/devices/validator');
//const tambox = require('./it/devices/tambox');
const os = require('./it/os');

// app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
//RUTAS//////////////////////////////
app.use('/chart', express.static('/home/pi/ec-touch/node_modules/chart.js/dist/'));
//app.use('/socket', express.static('/home/pi/tambox2/node_modules/socket.io-client/dist/'));
app.use('/jquery', express.static('/home/pi/ec-touch/node_modules/jquery/dist/'));
app.use('/css', express.static(__dirname + '/public/css/'));
app.use('/finish', express.static(__dirname + '/public/'));
app.use('/js', express.static(__dirname + '/public/javascripts/'));
app.use('/img', express.static(__dirname + '/public/images/'));
app.use('/', express.static(__dirname + '/'));
app.use(require(__dirname + '/routes'));
app.use('/api', require('./api/remesas'));
app.use('/api/retiro', require('./api/retiros'));
app.use(session({secret: "echomeautomation",resave: false,saveUninitialized: false,store: new mysql_store(database)}));
// Configurar cabeceras y cors
//app.use((req, res, next) => {
  //  res.header('Access-Control-Allow-Origin', '*');
  //  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  //  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
//     if (req.method === 'OPTIONS') {
//       res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
//       return res.status('200') .JSON({});
//     }
//     next();
// });

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({defaultLayout: 'main',extname: '.hbs'}));
app.set('view engine', '.hbs');
/////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
httpx.listen(machine_port, async function(io2) {
  on_startup = true; //mientras esta variable este en true, no permitira que el servidor reciba consultar desde las apis.
  os.logea("indica que esta en startup");
  try {
    // await sp.existira_conexion_serial();
    await os.obtener_datos_de_conexion();
    await os.habilita_sockets();
    await os.arranca_tambox_os();
    console.log(chalk.green("El sistema arranco sin problemas"));
//    await os.arrancando_tambox_nuevamente();
//  var data =await os.transmite_encriptado_y_procesa2(validator_address, get_all_levels);
   var data=await os.consulta_all_levels();

   console.log("all levels es:"+JSON.stringify(data[0].cantidad_de_billetes_en_reciclador));
  } catch (e) {
    console.log("error General de OS:"+e);
  }finally{
    await os.idle_poll_loop();
      console.log(chalk.green("idle"));
  }
});
/////////////////////////////////////////////////////////
module.exports.io=io;
