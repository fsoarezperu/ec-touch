//////////////////////////////////////////////////////////////////////////////////////
//Created by: Edgar F soarez A. fsoarez@hotmail.com
//Description: Software to control NV200 Spectral by Innovative Technologies.
//Protocol Used: Smiley Secured Protocol
//Date: Nov 2018
/////////////////////////////////////////////////////////////////////////////////////

const tambox = require('./it/devices/tambox');
// const sp2x= require('./it/serial_port');
const os = require('./it/os');
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

const mis_classes= require('./it/mis_classes')
const moment=require("moment");
const synch_tbm = require('./it/tbm_sync/synchronize');

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
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});
/////////////////////////////////////////////////////////////////////
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({defaultLayout: 'main',extname: '.hbs'}));
app.set('view engine', '.hbs');
/////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
httpx.listen(machine_port, async function(io2) {
  on_startup = true; //mientras esta variable este en true, no permitira que el servidor reciba consultar desde las apis.
  os.logea("indica que esta en startup");
///////////////////////////////////////////////////
//  console.log("Rectangulo es:"+mis_classes.Rectangulo(456));
  try {
    try {
          await os.obtener_datos_de_conexion();
    } catch (e) {
      console.log(e);
    }

    await os.habilita_sockets();
    await os.comprobar_serialcom();
    await os.arranca_tambox_os();
    if (tbm_status) {
      await synch_tbm.are_synched();
    };

   var data=await os.consulta_all_levels();
   console.log(chalk.green("all levels es:"+JSON.stringify(data[0].cantidad_de_billetes_en_reciclador)));

  } catch (e) {
    console.log(chalk.magenta.inverse("error General de OS:"+e));
  }finally{
    await os.idle_poll_loop();
    console.log(chalk.green("El sistema arranco sin problemas, iniciando Poll loop"));
    console.log(chalk.green("idle"));
    setTimeout(function () {
      io.emit("tambox_has_started");
    }, 1000);


    logea_a_client_side("hola guapo...");
  }
});

function logea_a_client_side(mensaje){
  //if (connected to scokets or send to console.) {

//  }
  io.emit("logeando_a_client_side",mensaje);
  console.log(mensaje);
}

/////////////////////////////////////////////////////////
module.exports.io=io;
