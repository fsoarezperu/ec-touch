//////////////////////////////////////////////////////////////////////////////////////
//Created by: Edgar F soarez A. fsoarez@hotmail.com
//Description: Software to control NV200 Spectral by Innovative Technologies.
//Protocol Used: Smiley Secured Protocol
//Date: Nov 2018
/////////////////////////////////////////////////////////////////////////////////////
//const sp = require('./it/serial_port');
//const ssp = require('./it/ssp');

//const va = require('./it/devices/validator');
//const os = require('./it/os');

//const tbm_code = require('./it/tbm_sync/tbm_synch_socket');
//const tbm = require('./it/tbm_sync/synchronize');
const tambox = require('./it/devices/tambox');
//const tebs = require('./it/devices/tebs');
//const va = require('./it/devices/validator');
//const it = require('./it/devices/tambox');
//const sh = require('./it/devices/smart_hopper');
//const tambox = require('./it/devices/tambox');


//const enc = require('./it/encryption');
//const glo = require('./it/globals');

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
//var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
//var exec = require('child_process').exec;
//
//const fetch = require('node-fetch');
//var io=sockets.io;
/////////////////////////////////////////////////////////////////////////////////////
const fs = require('fs') //para escribir archivo.

var httpx = require('http').Server(app);

const io = require('socket.io')(httpx, { cookie: false });

const sp= require('./it/serial_port')(io);
const ssp = require('./it/ssp')(io);
const va = require('./it/devices/validator');
const os = require('./it/os');

app.use(morgan('dev'));
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
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    if (req.method === 'OPTIONS') {
      res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
      return res.status('200') .JSON({});
    }
    next();
});
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({defaultLayout: 'main',extname: '.hbs'}));
app.set('view engine', '.hbs');
/////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////


const io2 = require('./it/socket')(io);




// /////////////////////////////////////////////////////////
httpx.listen(machine_port, async function() {
  console.log(chalk.yellow("/////////////////////////////////////////////////////////////////"));
  console.log((chalk.yellow('Iniciando Tambox OS 1.1 en http://localhost:'+machine_port)));
  on_startup = true; //mientras esta variable este en true, no permitira que el servidor reciba consultar desde las apis.
  os.logea("indica que esta en startup");
  ////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////
  // sp.verifica_coneccion_validador();
  // if (global.is_head_online==true){
  // }else{
  //   console.log("Cabezal no conectado.");
  // };
  ////////////////////////////////////////////////////////////
  let step1=await tambox.finalizar_pagos_en_proceso();
  os.logea(chalk.green("Operaciones Inconclusas fueron finalizadas:"+step1));
  ////////////////////////////////////////////////////////////
  // Inicializando el Smart Hopper
  // try {
  //   var hopper=await sh.start_smart_hopper();
  //   if (hopper=="OK") {
  //     console.log(chalk.green("Hopper Online"));
  //   }else {
  //     console.log(chalk.red("No Hopper Found"));
  //   }
  // } catch (e) {
  //   console.log(e);
  // } finally {
  //   console.log("aqui se supone que tengo que manejar el error.");
  // }
  ////////////////////////////////////////////////////////////////
   try {
     os.logea(chalk.green("Iniciando Validador"));
     // var validator= await va.start_validator();
     // console.log(chalk.green("Validador inicio:"+validator));

     os.logea(chalk.green("Validador inicio:"+await va.start_validator()));



  //   if (validator=="OK") {
  //     console.log(chalk.green("Validator Online"));
       on_startup=false;

       os.new_lock_cashbox();
  //     socket.io.emit("iniciando");
  //   }else {
  //     console.log(chalk.red("No Validator Found"));
  //     return reject("validator not found");
  //   }
   } catch (e) {
       console.log(chalk.cyan("01-Starting Validator->")+e);
   } finally {
       console.log(chalk.green("idle"));
   }
  ////////////////////////////////////////////////////////////////
//  console.log("ultima linea");
});
/////////////////////////////////////////////////////////
module.exports.io=io;
