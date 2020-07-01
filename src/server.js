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
const moment=require("moment");
const ssp = require('./it/ssp');
const sp = require('./it/serial_port');
const enc = require('./it/encryption');
const glo = require('./it/globals');
const tbm = require('./it/tbm_sync/synchronize');
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
/////////////////////////////////////////////////////////////////////////////////////
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
app.use(require(__dirname + '/routes'));
app.use('/api', require('./api/remesas'));
app.use('/api/retiro', require('./api/retiros'));
app.use(session({secret: "echomeautomation",resave: false,saveUninitialized: false,store: new mysql_store(database)}));
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
//////////////////////////////////////////////////////////////////////
var http = require('http').Server(app);
//var io = require('socket.io', {rememberTransport: false,transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling']})(http);
var io = require('socket.io', {rememberTransport: false,transports: ['Flash Socket', 'AJAX long-polling']})(http);
exports.io = io; //this is to be used by other files on the project and be able to send emit by socket io.
//////////////////////////////////////////////////////////////////////
//var to_tbm = require("socket.io-client")('http://tambox.ddns.net:4000');
var to_tbm = require("socket.io-client")('https://tbm-cloud.herokuapp.com');
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
  io.emit('show_connected');
  tbm_status = true;
  await tambox_manager_ping();
});
/////////////////////////////////////////////////////////
io.on('connection', function(socket) {
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
    await  ssp.transmite_encriptado_y_procesa(validator_address,reset)
  });
  socket.on('reset_counters', async function(msg) {
    console.log(msg);
    //  io.emit('reset', "reseting system");
    it.zerox = false;
    ecount = "00000000";
    await ssp.transmite_encriptado_y_procesa(validator_address,reset_counters)
  });
  socket.on('enable_validator',async function(msg) {
    new Promise( async function(resolve, reject) {
      try {
        console.log(chalk.cyan("ENABLE VALIDATOR"));
        //await ssp.ensureIsSet();
        await ssp.transmite_encriptado_y_procesa(validator_address,enable)
        return resolve();
      } catch (e) {
        return reject(e);
      } finally {
        io.emit('enable_validator', "enable_validator");
      }
    });
  });
  socket.on('disable_validator',async function(msg) {
    new Promise(async function(resolve, reject) {
      try {
        console.log(chalk.cyan("DISABLE VALIDATOR"));
      //  await ssp.ensureIsSet();
        await  ssp.transmite_encriptado_y_procesa(validator_address,desable)
      } catch (e) {
        return reject(e);
      } finally {
        io.emit('disable_validator', "Disabling Validator");
      }
    });
  });
  socket.on('lock_cashbox', async function(msg) {
    io.emit('lock_cashbox', "locking cashbox");
    console.log(chalk.cyan("LOCKING CASHBOX"));
    var levels= await  ssp.transmite_encriptado_y_procesa(validator_address,cashbox_lock_enable)
  });
  socket.on('unlock_cashbox', async function(msg) {
    console.log(chalk.cyan("UNLOCKING CASHBOX"));
    io.emit('unlock_cashbox', "unlocking cashbox");
     var levels= await  ssp.transmite_encriptado_y_procesa(validator_address,cashbox_unlock_enable)
  });
  /////////////////////////////////////////////////////////////
  socket.on('finish', async function(msg) {
    new Promise(async function(resolve, reject) {
      try {
        console.log(chalk.cyan("socket finish"));
        //await ssp.ensureIsSet();
        await  ssp.transmite_encriptado_y_procesa(validator_address,desable)

      } catch (e) {
        return reject(e);
      } finally {
        io.emit('finish', "finish");
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
  socket.on('smart_empty', async function(msg) {
    console.log(chalk.green('will smart_empty:' + msg));
    await  ssp.transmite_encriptado_y_procesa(validator_address,smart_empty)
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
  socket.on('blocking_pooling', function(msg) {
  console.log(chalk.green(msg));
    ssp.ensureIsSet().then(async function() {
//      ready_for_sending=!ready_for_sending;
      ready_for_pooling=!ready_for_pooling;

      console.log("SENDING IS:"+ready_for_sending+" And Pooling is:"+ready_for_pooling);
      io.emit('blocking_pooling', "pooling blocked");
      //it.enable_sending();
    });
  });
  socket.on('force_serial', function(msg) {
    console.log(chalk.green("FORCING SERIAL"));
    console.log(chalk.green("ready for sending is:" + ready_for_sending));
    console.log(chalk.green("ready for pooling is:" + ready_for_pooling));
    // ready_for_sending = true;
    // ready_for_pooling = true;
    //
    // it.ensureIsSet().then(async function() {
    //   it.envio_redundante(poll)
    //     .then(data => {
    //       logea(chalk.yellow('<-:'), chalk.yellow(data));
    //     //  it.enable_sending();
    //       logea("/////////////////////////////////");
    //     })
    // })
  });
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
});
/////////////////////////////////////////////////////////
//esta funcion manda una pulso al servidor cada tanto para indicar que esta en linea.!
async function tambox_manager_ping() {
  return new Promise(function(resolve, reject) {
    try {
      if (tbm_status) {
        setTimeout(() => {
          //  console.log('connected to TBM');
          io.emit('show_connected'); //muestra que la maquina esta conectada a nube
          to_tbm.emit('online', numero_de_serie); //emite señal a nube indicando que estamos en funcionando
          tambox_manager_ping();
          //  is_os_running();
        }, 15000);
      } else {
        console.log(chalk.red("Connection to TBM lost...."));
      }
    } catch (e) {
      return reject(e);
    } finally {
      return;
    }
  });


}
/////////////////////////////////////////////////////////
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
  io.emit("iniciando","iniciando sistema");
  setTimeout(function () {
    console.log("ping");
      io.emit("iniciando","iniciando sistema");
  //  io.emit("refresh_window","refresh_window");
  }, 10000);

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
    console.log("starting validator");
    var validator= await va.start_validator();
    if (validator=="OK") {
      console.log(chalk.green("Validator Online"));
    }else {
      console.log(chalk.red("No Validator Found"));
    }
  } catch (e) {
  console.log("no se pudo completar:"+e);
  } finally {
      console.log("idle");
  }
  ////////////////////////////////////////////////////////////////
});
/////////////////////////////////////////////////////////
async function is_this_machine_registered(){
  return new Promise(function(resolve, reject) {
//consualta en TBM si existe este numero de maquina, sino existe lo crea como pendiente de registradora
try {
  console.log(chalk.green("Registrando maquina"));
  var tbm_adress=tbm_adressx;
  var fix= "/api/register_machine";
  var machine_sn=global.numero_de_serie;
  var type=global.note_validator_type;
  const url= tbm_adress+fix+"/"+machine_sn+"/"+type
  const xHttp= new XMLHttpRequest();
  xHttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        return resolve(this.responseText);
    }
     }
  xHttp.open("GET",url,true);
  xHttp.send();
} catch (e) {
  return reject(e);
} finally {
  return;
}
  });
}
module.exports.is_this_machine_registered=is_this_machine_registered;
//////////////////////////////////////////////////////////////////////
async function query_this_machine(){
  return new Promise(function(resolve, reject) {
//consualta en TBM si existe este numero de maquina, sino existe lo crea como pendiente de registradora
try {
  console.log(chalk.green("Registrando maquina"));
  var tbm_adress=tbm_adressx;
  var fix= "/api/query_machine";
  var machine_sn=global.numero_de_serie;
  const url= tbm_adress+fix+"/"+machine_sn
  const xHttp= new XMLHttpRequest();
  xHttp.responseType = 'json';
  xHttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      console.log(this.responseText);
      console.log(this.responseType);

        return resolve(this.responseText);
    }
     }
  xHttp.open("GET",url,true);
  xHttp.send();
} catch (e) {
  return reject(e);
} finally {
  return;
}
  });
}
module.exports.query_this_machine=query_this_machine;
//}
