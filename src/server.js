//////////////////////////////////////////////////////////////////////////////////////
//Created by: Edgar F soarez A. fsoarez@hotmail.com
//Description: Software to control NV200 Spectral by Innovative Technologies.
//Protocol Used: Smiley Secured Protocol
//Date: Nov 2018
/////////////////////////////////////////////////////////////////////////////////////
const tebs = require('./it/devices/tebs');
const va = require('./it/devices/validator');
const it = require('./it/devices/tambox');
const sh = require('./it/devices/smart_hopper');
const tambox = require('./it/devices/tambox');
const ssp = require('./it/ssp');
const sp = require('./it/serial_port');
const enc = require('./it/encryption');
const glo = require('./it/globals');
const tbm = require('./it/tbm_sync/synchronize');
const moment=require("moment");


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

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var exec = require('child_process').exec;
var my_socket;
const fetch = require('node-fetch');
/////////////////////////////////////////////////////////////////////////////////////
fs = require('fs')

app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use('/chart', express.static('/home/pi/tambox2/node_modules/chart.js/dist/'));
app.use('/socket', express.static('/home/pi/tambox2/node_modules/socket.io-client/dist/'));
app.use('/jquery', express.static('/home/pi/tambox2/node_modules/jquery/dist/'));
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
function logea(texto, variable) {
  if (typeof(variable) != 'undefined') {
    if (view_log) {
      console.log(texto + variable);
      //log(texto + variable);
    };
  } else {
    if (view_log) {
      console.log(texto);
      //log(texto + variable);
    };
  }
}
module.exports.logea = logea;
////////////////////////////////////////////////////////////////////
// Create shutdown function
function shutdown(callback){
    exec('shutdown -r now', function(error, stdout, stderr){ callback(stdout); });
}

//////////////////////////////////////////////////////////////////////
var http = require('http').Server(app);
//var io = require('socket.io', {rememberTransport: false,transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling']})(http);
//var io = require('socket.io', {rememberTransport: false,transports: ['Flash Socket', 'AJAX long-polling']})(http);
var io = require('socket.io')(http);

exports.io = io; //this is to be used by other files on the project and be able to send emit by socket io.
//////////////////////////////////////////////////////////////////////


var to_tbm = require("socket.io-client")('http://192.168.1.2:3000');
// var to_tbm = require("socket.io-client")('https://tbm-cloud.herokuapp.com');
exports.to_tbm = to_tbm;
to_tbm.on("connect",async function() {
  to_tbm.on('disconnect', function() {
    console.log("Tambox_manager is offline...");
    io.emit('show_not_connected');
    tbm_status = false;
  });
  to_tbm.on('machine', function(data) {
    //io.to('lobby').emit('message', data);
    console.log("ticking...");
  });
  to_tbm.on('is_tbm_alive', function(data) {
    //io.to('lobby').emit('message', data);
    console.log("ticking...");
  });
  to_tbm.on('refresh_navigators', function(data) {
    //io.to('lobby').emit('message', data);
    console.log("refreshing navigators from TBM...");
  });

  console.log(chalk.green("Connected to Tambox Manager"));
  const current_registered_status= await pool.query("SELECT is_registered FROM machine");
  if (current_registered_status[0].is_registered==1) {
    console.log(chalk.yellow("Machine already registered"));
  }else {
    console.log(current_registered_status[0].is_registered);
    is_regis=current_registered_status[0].is_registered;
            if (is_regis==0) {
              console.log("esta maquina no esta registrada y ya hay conexion con el servidor, se autoregistrará");
              var regis=await is_this_machine_registered();
              console.log(chalk.green("Register to tbm status:"+regis));
                var nombre_maquina =await pool.query("SELECT machine_name FROM machine");
                 glo.my_resgistered_machine_name=nombre_maquina[0].machine_name;
              io.emit("iniciando");
            }
  }

  io.emit('show_connected_to_TBM');
  tbm_status = true;
  await tambox_manager_ping();
});
/////////////////////////////////////////////////////////
io.on('connection', async function(socket) {
  my_socket=socket;
  console.log("usuario conectado");
  socket.on('disconnect', function() {});
  socket.on('sincronizando', function(msg) {
    to_tbm.emit('system_running_indicator', "tambox1.0x");
    console.log(msg);
  });
  socket.on('is_tbm_alive', function(data) {
    console.log(data);
  });
  socket.on('reset', async function(msg) {
    console.log(msg);
    //  io.emit('reset', "reseting system");
    it.zerox = false;
    ecount = "00000000";
    //await  ssp.transmite_encriptado_y_procesa(validator_address,reset)
    shutdown(function(output){
        console.log(output);
    });
  });
  socket.on('reset_counters', async function(msg) {
    console.log(msg);
    //  io.emit('reset', "reseting system");
    it.zerox = false;
    ecount = "00000000";
    await ssp.transmite_encriptado_y_procesa(validator_address,reset_counters)
  });
  /////////////////////////////////////////////////////////////
  socket.on('enable_validator',async function(msg) {
   await ssp.ensureIsSet();
  return  new Promise(async function(resolve, reject) {
     try {
       console.log(chalk.green("disparo de enable_validator"));
       var data=await ssp.envia_encriptado(validator_address,enable);
       if (data=="01F0") {
       //  console.log(chalk.green(data));
         console.log(chalk.cyan("ENABLE VALIDATOR"));

        return resolve();
       }else {
         reject("el validador no se habilito");
       }

     } catch (e) {
       return reject(chalk.red("error en socket:")+e);
     } finally {
     io.emit('validator_enabled', "validator_enabled");
     }
         });
  });
  socket.on('habilita_validador',async function(msg) {
    await ssp.ensureIsSet();
    return new Promise(async function(resolve, reject) {
    try {
      var data=await ssp.envia_encriptado(validator_address,enable);
      if (data=="01F0") {
      //  console.log(chalk.green(data));
        console.log(chalk.cyan("ENABLE VALIDATOR"));
      //  io.emit('validator_enabled', "validator_enabled");
        io.emit('paso2', "paso2");
        return resolve();
      }else {
        reject("el validador no se habilito");
      }

    } catch (e) {
      return reject(chalk.red("error en socket:")+e);
    } finally {

    }
        });
  });
  socket.on('disable_validator',async function(msg) {
     await ssp.ensureIsSet();
     await ssp.envia_encriptado(validator_address,desable);
     console.log(chalk.cyan("DISABLE VALIDATOR"));
  });
  /////////////////////////////////////////////////////////////
  socket.on('lock_cashbox', async function(msg) {
    io.emit('lock_cashbox', "lock_cashbox");
    console.log(chalk.cyan("LOCKING CASHBOX"));
    await  ssp.transmite_encriptado_y_procesa(validator_address,cashbox_lock_enable)
  });
  socket.on('unlock_cashbox', async function(msg) {
    console.log(chalk.cyan("UNLOCKING CASHBOX"));
    io.emit('unlock_cashbox', "unlock_cashbox");
     await  ssp.transmite_encriptado_y_procesa(validator_address,cashbox_unlock_enable)
  });
  /////////////////////////////////////////////////////////////
  socket.on('finish', async function(msg) {
    await  ssp.ensureIsSet();
    return new Promise(async function(resolve, reject) {
      try {
        console.log(chalk.cyan("Finalizando remesa"));
        var t124=await  ssp.transmite_encriptado_y_procesa(validator_address,desable);
        if (t124.length>0) {
          io.emit('finishy', "finishy");
          return resolve();
        }

      } catch (e) {
        return reject(e);
      } finally {
      //  return;
      }
    });
  });
  socket.on('refresh_window', function(msg) {
    console.log(msg);
  });
  socket.on('consultar_remesa', async function(msg) {
    const remesax = await pool.query("SELECT * FROM remesas WHERE status='terminado' ");
    io.emit('consultar_remesa', remesax);
    console.log("consultar_remesa___________________________________________________ ");
  });
  socket.on('consultar_monto_remesa', async function(msg) {
    const monto_remesa = await pool.query("SELECT * FROM remesas WHERE status='terminado' AND no_remesa=? ", [msg]);
    console.log(monto_remesa[0].monto);
    const creditos = await pool.query("SELECT * FROM creditos WHERE status='processed' and no_remesa=?", [msg]);
    io.emit('consultar_monto_remesa', monto_remesa[0].monto, creditos);
    console.log("consultar_monto_remesa_______________________________________________");
  });
  socket.on('consultar_lista_tienda_id', async function(msg) {
    //consulta lista de tienda_id para el dropdown del filtro en la pagina niveles
    const tienda_id = await pool.query("SELECT DISTINCT tienda_id FROM remesas WHERE status='terminado' ");
    io.emit('consultar_lista_tienda_id', tienda_id);

  });
  socket.on('consultar_total_tienda_id', async function(msg) {
    const total_tienda_id = await pool.query("SELECT SUM(monto) AS totalxtienda_id FROM remesas WHERE tienda_id=? AND status='terminado'", [msg]);
    console.log(total_tienda_id[0].totalxtienda_id);
    io.emit('consultar_total_tienda_id', total_tienda_id[0].totalxtienda_id);
  });

  socket.on('nuevo_billete_recivido', function(msg) {
    var tt = msg.monto;
    var ttt = msg.country_code;
    console.log("monto:" + tt);
    console.log("country code:" + ttt);
  });
  socket.on('vbnet', function(msg) {
    console.log(chalk.green("from visual basic"));
  });
  socket.on('update_requested', function(msg) {
    console.log(chalk.green(msg));
    io.emit('update_requested', "display message from update_requested");
  });
  socket.on('no_cabezal', function(msg) {
    console.log(chalk.green(msg));
    io.emit('no_cabezal', "display message from update_requested");
  });
  /////////////////////////////////////////////////////////////
  socket.on('envio_serial', async function(msg) {
    await ssp.ensureIsSet();
    console.log(chalk.green(msg +" para:"+device) );
    var esto=await sp.transmision_insegura(validator_address,poll);
    esto=await ssp.handlepoll(esto);
    console.log(chalk.green(esto));
    console.log("--------------------------");
  });
  socket.on('envio_serial_seguro', async function(msg) {
      console.log(chalk.green(msg +" para:"+device) );
      esto();
      console.log("--------------------------");
    });
  async function esto(){
    //setTimeout(async function () {
      var current_tebs2x=await ssp.envia_encriptado(validator_address,get_tebs_barcode);
      //    data= await enc.handleEcommand(data);
      //   data= await va.handleGetTebsBarcode(data);
      //  console.log(current_tebs2x);
          var current_tebs2=await sp.transmision_insegura(receptor,get_tebs_barcode) //<-------- get_serial_number
        //  console.log(current_tebs2);
          current_tebs2=await va.handleGetTebsBarcode(current_tebs2);
          console.log(current_tebs2);
    //      esto();
    //}, 800);
    }
  socket.on('blocking_pooling', function(msg) {
  console.log(chalk.green(msg));
    ssp.ensureIsSet2();
      ready_for_pooling=!ready_for_pooling;
      console.log("SENDING IS:"+ready_for_sending+" And Pooling is:"+ready_for_pooling);
      io.emit('blocking_pooling', "pooling blocked");
  });
  socket.on('force_serial', function(msg) {
    console.log(chalk.green("FORCING SERIAL"));
    console.log(chalk.green("ready for sending is:" + ready_for_sending));
    console.log(chalk.green("ready for pooling is:" + ready_for_pooling));
    ssp.ensureIsSet2()
      ready_for_sending=!ready_for_sending;
      console.log("SENDING IS:"+ready_for_sending+" And Pooling is:"+ready_for_pooling);
      io.emit('blocking_sending', "blocking_sending");
  });
  /////////////////////////////////////////////////////////////
  socket.on('empty_hoppper', function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,empty_all)
      .then(data =>{
        logea(chalk.yellow(device+'<-:'), chalk.yellow(data));
        sp.enable_hopper_pooling();
    })
    io.emit('empty_hoppper', "empty_hoppper");
  });
  socket.on('reset_hoppper', function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
    //  ecount=0;
    sh.super_comando(smart_hopper_address,reset)
      .then(data =>{
        logea(chalk.yellow(device+'<-:'), chalk.yellow(data));
        sp.enable_hopper_pooling();
    })
    io.emit('reset_hoppper', "reset_hoppper");
  });
  socket.on('pay_10c',async function(msg) {
      console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay10c).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay10c', "pay10c");sp.enable_hopper_pooling();})

  });
  socket.on('pay_20c',async function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay20c).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_20c', "pay_20c");sp.enable_hopper_pooling();})
  });
  socket.on('pay_50c',async function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay50c).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_50c', "pay_50c");sp.enable_hopper_pooling();})
  });
  socket.on('pay_1s',async function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay1s).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_1s', "pay_1s");sp.enable_hopper_pooling();})
  });
  socket.on('pay_2s',async function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay2s).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_2s', "pay_2s");sp.enable_hopper_pooling();})
  });
  socket.on('pay_5s',async function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay5s).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_5s', "pay_5s");sp.enable_hopper_pooling();})
  });
  /////////////////////////////////////////////////////////////
  socket.on('registradora', function(msg) {
    // console.log(chalk.green(msg));
    //   sp.disable_hopper_pooling();
    //   sh.super_comando(smart_hopper_address,reset)
    //   .then(data =>{
    //     server.logea(chalk.yellow(device+'<-:'), chalk.yellow(data));
    //     sp.enable_hopper_pooling();
    // })
    io.emit('registradora', "registradora");
  });
  socket.on('niveles_hopper', function(msg) {
    // console.log(chalk.green(msg));
    //   sp.disable_hopper_pooling();
    //   sp.super_comando(smart_hopper_address,reset)
    //   .then(data =>{
    //     server.logea(chalk.yellow(device+'<-:'), chalk.yellow(data));
    //     sp.enable_hopper_pooling();
    // })
    io.emit('niveles_hopper', "niveles_hopper");
  });
  socket.on('actualizar_niveles',async function(msg) {
     console.log(chalk.green(msg));
     var levels= await  sh.transmite(smart_hopper_address,get_all_levels)
     io.emit('actualizar_niveles', levels);
    console.log("data final:"+levels);
  });
  socket.on('add_coins',async  function(msg) {
     console.log(chalk.green(msg));
     switch (msg) {
      case "add_0.1":
      console.log(chalk.green(msg));
      await  sh.mandate_al_hopper(set_coin_amount_10c)
      io.emit('actualiza_grafico', "actualiza_grafico");
      break;
      case "add_0.2":
      await  sh.mandate_al_hopper(set_coin_amount_20c)
      io.emit('actualiza_grafico', "actualiza_grafico");
      break;
      case "add_0.5":
      await  sh.mandate_al_hopper(set_coin_amount_50c)
      io.emit('actualiza_grafico', "actualiza_grafico");
      break;
      case "add_1":
      await  sh.mandate_al_hopper(set_coin_amount_1s)
      io.emit('actualiza_grafico', "actualiza_grafico");
      break;
      case "add_2":
      await  sh.mandate_al_hopper(set_coin_amount_2s)
      io.emit('actualiza_grafico', "actualiza_grafico");
      break;
      case "add_5":
      await  sh.mandate_al_hopper(set_coin_amount_5s)
      io.emit('actualiza_grafico', "actualiza_grafico");
      break;
      case "vaciar":
      var quefue=await  sh.mandate_al_hopper(empty_all)
      console.log("quefue"+quefue);
    //  setTimeout(function () {
          io.emit('actualiza_grafico', "actualiza_grafico");
    //  }, 30000);
      break;
       default:

     }
  });
  socket.on('pay_value', async function(msg) {
    payout_amount[2]=msg;
    console.log("pay_amount"+payout_amount);
    await  sh.mandate_al_hopper(payout_amount);
    //io.emit('pay_value',"pay_value");
  });
  /////////////////////////////////////////////////////////////
  socket.on('read_new_tebs', async function(msg) {
      var data_Tebs=await ssp.envia_encriptado(validator_address,get_tebs_barcode);
      console.log(data_Tebs);
    //io.emit('pay_value',"pay_value");
  });
  socket.on('interno', async function(msg) {
    //  var data_Tebs=await ssp.envia_encriptado(validator_address,get_tebs_barcode);
      console.log(msg);
    //io.emit('pay_value',"pay_value");
  });
  /////////////////////////////////////////////////////////
  socket.on('iniciar_nueva_remesa', async function(msg) {
    console.log(msg);
    await  validator_enabled_now();
    io.emit('iniciar_nueva_remesa_paso2', "iniciar_nueva_remesa_paso2");
    console.log("orden completada");
  });
  socket.on('terminar_remesa', async function(msg) {
    console.log(msg);
    await validator_disabled_now();
    console.log("orden completada");
  });
  socket.on('cancelar_remesa', async function(msg) {
    console.log(msg);
    await validator_disabled_now();
    console.log("orden completada");
  });
  /////////////////////////////////////////////////////////
  conectar_enlace_de(socket,'main','/system/buffer.html',"vardata");
  conectar_enlace_de(socket,'config','/system/configuracion.html',"vardata");

  var this_machine={
    machine_sn:numero_de_serie,
    Tebs_barcode:tebs_barcode,
    os_version:release_version,
    direccion_ip:machine_ip,
    puerto:machine_port,
    creado_por:machine_developer,
    soporte_tecnico:machine_support
  }
  conectar_enlace_de(socket,'info','/system/info/info.html',this_machine);
  ///////////////////////////////////////////////////////////////////////////
  var totales=await calcular_cuadre_diario();
  conectar_enlace_de(socket,'cuadre_diario','/system/cuadre_diario/cuadre_diario.html',totales);

  ////////////////////////////////////////////////////////////////////////////////////////////////

  var mis_cifras_generales=await calcular_cifras_generales();
  console.log(mis_cifras_generales);
  conectar_enlace_de(socket,'cifras_generales','/system/cifras_generales/cifras_generales.html',mis_cifras_generales);

  socket.on('smart_empty', async function(msg) {
    console.log(chalk.green('will smart_empty:' + msg));
    await  ssp.transmite_encriptado_y_procesa(validator_address,smart_empty);
    console.log("aqui salgo de smart empty");
  });
  socket.on('Cashbox_Unlock_Enable', function(msg) {
    io.emit('Cashbox_Unlock_Enable',"cashbox Unlocked");
  });
  conectar_enlace_de(socket,'remesa_hermes','/system/remesa_hermes/rm_1.html',"null");
  conectar_enlace_de(socket,'Smart_emptying','/system/remesa_hermes/rm_2.html',"null");
  conectar_enlace_de(socket,'Smart_emptied','/system/remesa_hermes/rm_3.html',"null");
  conectar_enlace_de(socket,'cashbox_unlocked','/system/remesa_hermes/rm_4.html',"null");
  conectar_enlace_de(socket,'Cashbox_Back_in_Service','/system/remesa_hermes/rm_5.html',"null",testing_callback);

  socket.on('get_machine_information', async function(msg) {
    console.log(msg);
    var this_machine2={
      machine_sn:numero_de_serie,
      Tebs_barcode:tebs_barcode,
      os_version:release_version,
      direccion_ip:machine_ip,
      puerto:machine_port,
      creado_por:machine_developer,
      soporte_tecnico:machine_support
    }
      io.emit('get_machine_information',this_machine);
    });

  // socket.on('trigger_socket', function(){
  //   console.log(chalk.yellow("trigger_socket fired"));
  //   ssp.emite_como_cliente();
  // });
  // // socket.on('fer',function(){
  // //   console.log(chalk.yellow("fer si funciono"));
  // // //  ssp.emite_como_cliente();
  // //   socket.emit('prueba','prueba');
  // // });
  // socket.on('connected',function(){
  //   console.log(chalk.yellow("fer si funciono2"));
  // //  ssp.emite_como_cliente();
  // });
  // socket.on('test',function(){
  //   console.log(chalk.yellow("test"));
  // //  ssp.emite_como_cliente();
  // });
});

function testing_callback(){
  console.log("inicia timer para volver a main");
  setTimeout(function () {
    ssp.socket.emit('main','main')
  }, 5000);
};

var timer2;
module.exports.timer2=timer2;
function is_os_running() {
  timer2 = setTimeout(() => {
    tbm_status = false;
    is_os_running();
  }, 5000);
}
/////////////////////////////////////////////////////////
http.listen(machine_port, async function() {
  //io.emit("iniciando","refrescando homepage");
//   setTimeout(function () {
//     console.log("forznado reinicio de pantallas");
//       io.emit("iniciando","iniciando sistema");
//   //  io.emit("refresh_window","refresh_window");
// }, 1500);

  console.log((chalk.yellow('Tambox 1.1 Starting...on port:'+machine_port)));
  on_startup = true; //mientras esta variable este en true, no permitira que el servidor reciba consultar desde las apis.
  logea("indica que esta en startup");
  ////////////////////////////////////////////////////////////

  ////////////////////////////////////////////////////////////
  // sp.verifica_coneccion_validador();
  // if (global.is_head_online==true){
  // }else{
  //   console.log("Cabezal no conectado.");
  // };
  ////////////////////////////////////////////////////////////
  await tambox.finalizar_pagos_en_proceso();
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
    console.log(chalk.green("starting validator"));
    var validator= await va.start_validator();
    //console.log("validator variable is:"+validator);
    if (validator=="OK") {
      console.log(chalk.green("Validator Online"));
      on_startup=false;
      io.emit("iniciando");
    }else {
      console.log(chalk.red("No Validator Found"));
      return reject("validator not found");
    }
  } catch (e) {
      console.log(chalk.cyan("01-Starting Validator->")+e);
  } finally {
      console.log("idle");
  }
  ////////////////////////////////////////////////////////////////
//  console.log("ultima linea");
});


/////////////////////////////////////////////////////////
async function is_this_machine_registered(){
  return new Promise(async function(resolve, reject) {
//consualta en TBM si existe este numero de maquina, sino existe lo crea como pendiente de registradora
try {
  //console.log(chalk.green("intentando hacer checkin en tbm"));
  var tbm_adress=tbm_adressx;
  var fix= "/api/register_machine";
  var machine_sn=global.numero_de_serie;
  var type=global.note_validator_type;
  const url= tbm_adress+fix+"/"+machine_sn+"/"+type
  var esti=await fetchWithTimeout(url,3000);
  return resolve(esti)
} catch (e) {
  return resolve(e);
} finally {

}
  });
}
module.exports.is_this_machine_registered=is_this_machine_registered;
//////////////////////////////////////////////////////////////////////
async function query_this_machine(){
  return new Promise(async function(resolve, reject) {
//consualta en TBM si existe este numero de maquina, sino existe lo crea como pendiente de registradora
try {
  //console.log(chalk.green("consultando maquina"));
  var tbm_adress=tbm_adressx;
  var fix= "/api/query_machine";
  var machine_sn=global.numero_de_serie;
  const url= tbm_adress+fix+"/"+machine_sn

  try {
    var esti=await fetchWithTimeout2(url,3000);
  //  console.log(esti);
    return resolve(esti)
  } catch (e) {
    return resolve("no check-in")
  } finally {

  }

} catch (e) {
  return reject(chalk.red("error aqui123")+e);
} finally {
  //return;
}
  });
}
module.exports.query_this_machine=query_this_machine;
//}

function consulta(url){

      const FETCH_TIMEOUT = 3000;
      let didTimeOut = false;

      return new Promise(function(resolve, reject) {
                                const timeout = setTimeout(function() {
                                    didTimeOut = true;
                                    reject(new Error('Request timed out'));
                                }, FETCH_TIMEOUT);
          console.log(url);
          fetch(url)
          .then(function(response) {
              // Clear the timeout as cleanup
              clearTimeout(timeout);
              if(!didTimeOut) {
                  console.log('fetch good! ', response);
                  resolve(response);
              }
          })
          .catch(function(err) {
              console.log('fetch failed! ', err);

              // Rejection already happened with setTimeout
              if(didTimeOut) return;
              // Reject with error
              reject(err);
          });
      })
      .then(function() {
          // Request success and no timeout
          //  return resolve(response);
          console.log('good promise, no timeout! ');
      })
      .catch(function(err) {
          // Error: response error, request timeout or runtime error
          console.log('promise error! ', err);
        //  return resolve("no check-in");
        return;
      });
      return;
}

function fetchWithTimeout( url, timeout ) {
    return new Promise( (resolve, reject) => {
        // Set timeout timer
        let timer = setTimeout(
            //() => reject( new Error('Request timed out') ),
            () => resolve('no check-in'),

            timeout
        );

        fetch( url ).then(
            response => resolve('OK'),
            err => reject( err )
        ).finally( () => clearTimeout(timer) );
    })
}

function fetchWithTimeout2( url, timeout ) {
    return new Promise( (resolve, reject) => {
        // Set timeout timer
        let timer = setTimeout(
            //() => reject( new Error('Request timed out') ),
            () => resolve('no check-in'),

            timeout
        );

        fetch( url ).then(
            response => resolve(response.json()),
            err => reject( err )
        ).finally( () => clearTimeout(timer) );
    })
}


async function calcular_cifras_generales() {
  var lod = 0;
  var totbills = 0;
  var totaccum = 0;
  var note_level1 = 0;
  var value_level1 = 0;
  var acum_level1 = 0;
  var note_level2 = 0;
  var value_level2 = 0;
  var acum_level2 = 0;
  var note_level3 = 0;
  var value_level3 = 0;
  var acum_level3 = 0;
  var note_level4 = 0;
  var value_level4 = 0;
  var acum_level4 = 0;
  var note_level5 = 0;
  var value_level5 = 0;
  var acum_level5 = 0;

  var data //=await ssp.transmite_encriptado_y_procesa(validator_address, get_all_levels)
  try {
    data=await sp.hacer_consulta_serial(validator_address, get_all_levels);
  } catch (e) {
    return (e)
  }

//console.log(data);
        var poll_responde = data.match(/.{1,2}/g);
        if (poll_responde[1] == "F0") {
          var i = 0;
          var ru = 0;
          var prevalue = 0;
          for (i; i < poll_responde[2]; i++) {
            if (i == 0) {
              ru = 3;
              prevalue = poll_responde[ru + 2];
              prevalue = prevalue + poll_responde[ru + 3];
              prevalue = prevalue + poll_responde[ru + 4];
              prevalue = prevalue + poll_responde[ru + 5];
              prevalue = enc.changeEndianness(prevalue);
              value_level1 = parseInt(prevalue, 16) / 100;
    //          console.log("value_level1 is:" + value_level1);
              note_level1 = parseInt(poll_responde[ru], 16);
    //          console.log("note_level1 is:" + note_level1);
              acum_level1 = note_level1 * value_level1;
    //          console.log("acum_level1 is:" + acum_level1);
            }
            if (i == 1) {
              ru = 12;
              prevalue = poll_responde[ru + 2];
              prevalue = prevalue + poll_responde[ru + 3];
              prevalue = prevalue + poll_responde[ru + 4];
              prevalue = prevalue + poll_responde[ru + 5];
              prevalue = enc.changeEndianness(prevalue);
              value_level2 = parseInt(prevalue, 16) / 100;
  //            console.log("value_level2 is:" + value_level2);
              note_level2 = parseInt(poll_responde[ru], 16);
  //            console.log("note_level2 is:" + note_level2);
              acum_level2 = note_level2 * value_level2;
  //            console.log("acum_level2 is:" + acum_level2);
            }
            if (i == 2) {
              ru = 21;
              prevalue = poll_responde[ru + 2];
              prevalue = prevalue + poll_responde[ru + 3];
              prevalue = prevalue + poll_responde[ru + 4];
              prevalue = prevalue + poll_responde[ru + 5];
              prevalue = enc.changeEndianness(prevalue);
              value_level3 = parseInt(prevalue, 16) / 100;
  //            console.log("value_level3 is:" + value_level3);
              note_level3 = parseInt(poll_responde[ru], 16);
  //            console.log("note_level3 is:" + note_level3);
              acum_level3 = note_level3 * value_level3;
  //            console.log("acum_level3 is:" + acum_level3);
            }
            if (i == 3) {
              ru = 30;
              prevalue = poll_responde[ru + 2];
              prevalue = prevalue + poll_responde[ru + 3];
              prevalue = prevalue + poll_responde[ru + 4];
              prevalue = prevalue + poll_responde[ru + 5];
              prevalue = enc.changeEndianness(prevalue);
              value_level4 = parseInt(prevalue, 16) / 100;
  //            console.log("value_level4 is:" + value_level4);
              note_level4 = parseInt(poll_responde[ru], 16);
  //            console.log("note_level4 is:" + note_level4);
              acum_level4 = note_level4 * value_level4;
  //            console.log("acum_level4 is:" + acum_level4);
            }
            if (i == 4) {
              ru = 39;
              prevalue = poll_responde[ru + 2];
              prevalue = prevalue + poll_responde[ru + 3];
              prevalue = prevalue + poll_responde[ru + 4];
              prevalue = prevalue + poll_responde[ru + 5];
              prevalue = enc.changeEndianness(prevalue);
              value_level5 = parseInt(prevalue, 16) / 100;
    //          console.log("value_level5 is:" + value_level5);
              note_level5 = parseInt(poll_responde[ru], 16);
    //          console.log("note_level5 is:" + note_level5);
              acum_level5 = note_level5 * value_level5;
    //          console.log("acum_level5 is:" + acum_level5);
            }
            lod = parseInt(poll_responde[ru], 16);
            totbills = totbills + lod;
          }
        }
        console.log("total billetes en reciclador:" + totbills);
        totaccum = acum_level1 + acum_level2 + acum_level3 + acum_level4 + acum_level5;
        console.log("total monto acumulado en reciclador:" + totaccum);
        console.log("/////////// ALL LEVELS ///////////////");
        const monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
        const monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
        var monto_en_bolsa = monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso;
        monto_en_bolsa = monto_en_bolsa - totaccum;
        var total_general = totaccum + monto_en_bolsa;
        var mis_montos= {
            totbills,
            totaccum,
            monto_en_bolsa,
            total_general,
            moneda:country_code
          };
        return mis_montos;
}
async function calcular_cuadre_diario() {
  const no_remesas = await pool.query("SELECT COUNT(no_remesa) AS noRemesa FROM remesas WHERE tipo='ingreso' and status='terminado' and status_hermes='en_tambox'");
  const monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");

  const no_egresos = await pool.query("SELECT COUNT(no_remesa) AS noEgreso FROM remesas WHERE tipo='egreso' and status='completado' and status_hermes='en_tambox'");
  const monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
  //en PROCESO
  const no_remesas_pend = await pool.query("SELECT COUNT(no_remesa) AS noRemesa FROM remesas WHERE (tipo='ingreso' and status='terminado' and rms_status='pendiente' and status_hermes='en_tambox')");
  const monto_total_remesas_pend = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE (tipo='ingreso'and status='terminado'and rms_status='pendiente' and status_hermes='en_tambox')");

  const no_egresos_pend = await pool.query("SELECT COUNT(no_remesa) AS noEgreso FROM remesas WHERE (tipo='egreso' and status='completado' and rms_status='pendiente' and status_hermes='en_tambox')");
  const monto_total_egresos_pend = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  (tipo='egreso' and status='completado' and rms_status='pendiente' and status_hermes='en_tambox')");
  ////////////////////////
  var totales = {
    no_remesas: no_remesas[0].noRemesa,
    monto_total_remesas: monto_total_remesas[0].totalremesax,
    no_egresos: no_egresos[0].noEgreso,
    monto_total_egresos: monto_total_egresos[0].totalEgreso,

    saldo: monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso,
    trans_global: no_remesas[0].noRemesa + no_egresos[0].noEgreso,

    no_remesas_pend: no_remesas_pend[0].noRemesa,
    monto_total_remesas_pend: monto_total_remesas_pend[0].totalremesax,
    no_egresos_pend: no_egresos_pend[0].noEgreso,
    monto_total_egresos_pend: monto_total_egresos_pend[0].totalEgreso,
    moneda:"PEN"

  };
  // var mi_cuadre_diario={
  //   no_remesas:10,
  //   monto_total_remesas:400,
  //   no_egresos:5,
  //   monto_total_egresos:200,
  //   trans_global:200,
  //   saldo:200,
  //   moneda:"PEN"
  // };
  return totales;
}
function conectar_enlace_de(xsocket,xid,xpath,vardata,cb) {
  xsocket.on(xid, async function(msg) {
  console.log(chalk.green(msg));
  fs.readFile(__dirname + xpath, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    var totaldata=[vardata,data]
    io.emit(xid,totaldata);
    if(cb !== undefined){
        cb();
    }

  });
});
}
async function validator_enabled_now() {
  //  var data_Tebs=await ssp.envia_encriptado(validator_address,get_tebs_barcode);

  //io.emit('volver',"msg");
  await ssp.ensureIsSet();
     return  new Promise(async function(resolve, reject) {
        try {
        //  console.log(chalk.green("disparo de enable_validator"));
          var data=await ssp.envia_encriptado(validator_address,enable);
          if (data=="01F0") {
            console.log(chalk.green("VALIDATOR ENABLED SUCCESFULLY"));
           return resolve("OK");
          }else {
            reject("el validador no se habilito");
          }
        } catch (e) {
          return reject(chalk.red("error en socket:")+e);
        }
        // finally {
        // io.emit('iniciar_nueva_remesa_paso2', "iniciar_nueva_remesa_paso2");
        // }
            });
}
async function validator_disabled_now() {
  //  var data_Tebs=await ssp.envia_encriptado(validator_address,get_tebs_barcode);
  //  console.log(msg);
  //io.emit('volver',"msg");
  await ssp.ensureIsSet();
     return  new Promise(async function(resolve, reject) {
        try {
          //console.log(chalk.green("disparo de enable_validator"));
          var data=await ssp.envia_encriptado(validator_address,desable);
          if (data=="01F0") {
            console.log(chalk.red("VALIDATOR DISABLED SUCCESFULLY"));
           return resolve("OK");
          }else {
            reject("el validador no se deshabilito");
          }
        } catch (e) {
          return reject(chalk.red("error en socket:")+e);
        }
        // finally {
        // //io.emit('iniciar_nueva_remesa_paso2', "iniciar_nueva_remesa_paso2");
        // }
            });
}
//esta funcion manda una pulso al servidor cada tanto para indicar que esta en linea.!
async function tambox_manager_ping() {
  return new Promise(function(resolve, reject) {
    try {
      if (tbm_status) {
        setTimeout(() => {
          //  console.log('connected to TBM');
          if (is_regis) {
          io.emit('show_connected_to_TBM'); //muestra que la maquina esta conectada a nube
          to_tbm.emit('online', numero_de_serie); //emite señal a nube indicando que estamos en funcionando
          }
          tambox_manager_ping();
          //  is_os_running();
        }, 15000);
      } else {
        console.log(chalk.red("Connection to TBM lost...."));
      }
    } catch (e) {
      return reject(e);
    } finally {
    //  return;
    }
  });


}
/////////////////////////////////////////////////////////
