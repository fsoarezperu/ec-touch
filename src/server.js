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


async function get_my_phisical_current_ip(){
  return new Promise(async function(resolve, reject) {
    var detected_ip="0.0.0.0"
    'use strict';
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    const results = Object.create(null); // Or just '{}', an empty object
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    //return results;
    //return results["en0"][0];
    resolve(results["wlan0"][0]);
  });
};
async function get_my_current_public_ip(){
  const publicIp = require('public-ip');
  return new Promise(async function(resolve, reject) {
  //	console.log(await publicIp.v4());
    //=> '46.5.21.123'
  //	console.log(await publicIp.v6());
    //=> 'fe80::200:f8ff:fe21:67cf'
    var p_ip=await publicIp.v4();
    resolve(p_ip);
  });

};
async function obtener_datos_de_conexion(){
  return new Promise(async function(resolve, reject) {
    try {
      var mi_ip=await get_my_phisical_current_ip();
      global.machine_ip=mi_ip;
      var mi_public_ip=await get_my_current_public_ip();
      global.public_machine_ip=mi_public_ip;
      //console.dir("detecting public ip assigned is:"+mi_public_ip);
      console.log(chalk.yellow("/////////////////////////////////////////////////////////////////"));
      console.log((chalk.yellow('http://'+machine_ip+":"+machine_port+ " en conexion local")));
      console.log((chalk.yellow('http://'+public_machine_ip+":"+machine_port+ " en conexion remota")));
    //  reject("aqui te paro");
      resolve();
    } catch (e) {
      reject("no se pudo obtener el ip fisico.")
    }

  });

  //console.dir("detecting ip assigned is:"+mi_ip);

}

function habilita_sockets(){
  console.log("habilitando_conexion_de_sockets_locales");
  return new Promise(function(resolve, reject) {
    setTimeout(function () {
      const io2 = require('./it/socket')(io);
      //reject("no se pudieron habilitar!");
        console.log("habilitados");
        resolve();
    }, 5000);
  });


}
async function arranca_tambox_os(){
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
       io.emit("iniciando","iniciando");
       os.tambox_manager_ping();
  //   }else {
  //     console.log(chalk.red("No Validator Found"));
  //     return reject("validator not found");
  //   }
   } catch (e) {
       console.log(chalk.cyan("01-Starting Validator->")+e);
   } finally {
       console.log(chalk.green("idle"));
   }
}
// /////////////////////////////////////////////////////////
httpx.listen(machine_port, async function(io2) {
  on_startup = true; //mientras esta variable este en true, no permitira que el servidor reciba consultar desde las apis.
  os.logea("indica que esta en startup");
  ////////////////////////////////////////////////////////////
  //console.dir(mi_ip);
  ////////////////////////////////////////////////////////////
  // sp.verifica_coneccion_validador();
  // if (global.is_head_online==true){
  // }else{
  //   console.log("Cabezal no conectado.");
  // };
  ////////////////////////////////////////////////////////////
  try {
    await obtener_datos_de_conexion();
    await habilita_sockets();
  } catch (e) {
    console.log("error al obtener ip:"+e);
  }



  // await arranca_tambox_os();
  console.log("idle");
  ////////////////////////////////////////////////////////////////

});
/////////////////////////////////////////////////////////
module.exports.io=io;
