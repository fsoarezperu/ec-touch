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
const tebs_events = require('./it/devices/ssp/tebs_events');

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

let probando=  new Promise(async function(resolve, reject) {
  console.log("iniciando las consultas previas ");
    try {
      console.log(chalk.cyan("/////////////////////////////////////////////////"));
      await os.habilita_sockets();
      ///////////////////////////////////////////////////////////////////
      ///////////////////////////////////////////////////////////////////
      ///////////////////////////////////////////////////////////////////
      console.log(chalk.magenta("/////////////////////////////////////////////////"));
      await os.comprobar_serialcom();
      ///////////////////////////////////////////////////////////////////
      console.log(chalk.cyan("/////////////////////////////////////////////////"));
      await os.obtener_datos_de_conexion();
      ///////////////////////////////////////////////////////////////////
      ///////////////////////////////////////////////////////////////////
      var os_step1=await os.arranca_tambox_os();
      console.log("os_step1:"+os_step1);
      console.log("TBM status is:"+tbm_status);
      console.log("device is:"+note_validator_type);
      if (note_validator_type=='NV200 Spectral') {
        console.log(chalk.cyan("Spectral fue detectado aqui"));
      }else {
        console.log(chalk.yellow("Note validator type is:"+note_validator_type));
      }
      console.log("comprobando maquina inicial aqui abajo:");
      var maquina_inicial=await os.comprueba_maquina_inicial();
      os.logea(chalk.green("comprobando maquina inicial"));
      os.logea(chalk.green("maquina_inicial es:"+ JSON.stringify(maquina_inicial)));
      os.logea(chalk.green("***************************************"));
      ///////////////////////////////////////////////////////////////////
      ///////////////////////////////////////////////////////////////////
      ///////////////////////////////////////////////////////////////////

       console.log(chalk.magenta("/////////////////////////////////////////////////"));
       ///////////////////////////////////////////////////////////////////
       ///////////////////////////////////////////////////////////////////
       ///////////////////////////////////////////////////////////////////
       ///////////////////////////////////////////////////////////////////
         resolve();
     } catch (e) {
       console.log(e);
     }
  })

probando.then(() =>{
setTimeout(function () {
//////////////////////////////////////////////////////////////////////
httpx.listen(machine_port, async function(io2) {
  on_startup = true; //mientras esta variable este en true, no permitira que el servidor reciba consultar desde las apis.
  os.logea("indica que esta en startup");
  // console.log("ramdom:");
  // var randy=Math.floor((Math.random() * 10000) + 1);
  // console.log(randy);

  //child proces
  // const { exec } = require('child_process');
  //
  // setTimeout(function () {
  //   var yourscript = exec('sh hi.sh',
  //           (error, stdout, stderr) => {
  //               console.log(stdout);
  //               console.log(stderr);
  //               if (error !== null) {
  //                   console.log(`exec error: ${error}`);
  //               }
  //           });
  // }, 10000);

///////////////////////////////////////////////////
//  console.log("Rectangulo es:"+mis_classes.Rectangulo(456));
  try {
   //  if (tbm_status) {
   //    await synch_tbm.are_synched();
   //  };
   //
   // var data=await os.consulta_all_levels();
   // console.log(chalk.green("all levels es:"+JSON.stringify(data[0].cantidad_de_billetes_en_reciclador)));
   //
   console.log(chalk.green("El sistema arranco sin problemas, iniciando Poll loop"));
   console.log(chalk.green("idle"));
   on_startup = false; 
   await os.idle_poll_loop();
   //
   // await si_es_espectral_ejecuta_esto(bingo("super bingo genio"));
   setTimeout(function () {
     io.emit("tambox_has_started","tambox OS inicio satisfactoriamente");
   }, 1000);

   os.logea_a_client_side("Activando servidor web");

  } catch (e) {
    console.log(chalk.magenta.inverse("error General de OS:"+e));
  }finally{

  }

// console.log("nuevo pool loop cypher");
// var esto1=await tebs_events.handle_evento([0x7F,0xF0]);
// console.log(esto1);
// console.log(tebs_events.lista_de_eventos.slave_reset);
// var esto=mis_classes.Rectangulo(4);
// console.log(esto);

});

}, 10000);

});

function si_es_espectral_ejecuta_esto(funcion_a_ajecutar){
  return new Promise(function(resolve, reject) {

    if (global.note_validator_type=="NV200 Spectral") {
      try {
        funcion_a_ajecutar
        return   resolve()
      } catch (e) {
        console.log(e);
      } finally {

      }

    }else {
      console.log("esta maquina no es spectral");
      return resolve();
    }

  });

};

function bingo(msg){
  console.log("bingo esto fue ejectuado luego de ser detectado como spectral machine:"+msg);
}
/////////////////////////////////////////////////////////
module.exports.io=io;
