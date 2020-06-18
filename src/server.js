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
/////////////////////////////////////////////////////////////////////////////////////
app.use(morgan('dev'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(express.static(__dirname + '/public'));
app.use('/chart', express.static('/home/pi/tambox2/node_modules/chart.js/dist/'));
app.use('/socket', express.static('/home/pi/tambox2/node_modules/socket.io-client/dist/'));
app.use('/jquery', express.static('/home/pi/tambox2/node_modules/jquery/dist/'));
app.use('/css', express.static(__dirname + '/public/css/'));
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
to_tbm.on("connect", function() {
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
  console.log("Connected to Tambox Manager");
  io.emit('show_connected');
  tbm_status = true;
  tambox_manager_ping();
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
  socket.on('reset', function(msg) {
    console.log(msg);
    //  io.emit('reset', "reseting system");
    it.zerox = false;
    ecount = "00000000";
    ready_for_pooling = false;
    it.ensureIsSet()
      .then(async function() {
        it.envio_redundante(reset)
          .then(data => {
            logea(chalk.yellow('<-:'), chalk.yellow(data));
            poll_loop();
            logea("/////////////////////////////////");
          })
      })
  });
  socket.on('reset_counters', function(msg) {
    console.log(msg);
    //  io.emit('reset', "reseting system");
    it.zerox = false;
    ecount = "00000000";
    ready_for_pooling = false;
    it.ensureIsSet()
      .then(async function() {
        it.envio_redundante(reset_counters)
          .then(data => {
            logea(chalk.yellow('<-:'), chalk.yellow(data));
            //poll_loop();
            logea("/////////////////////////////////");
          })
      })
  });
  socket.on('enable_validator', function(msg) {
    console.log(chalk.cyan("ENABLE VALIDATOR"));
    //      ready_for_sending=false;
    ready_for_pooling = false;
    it.ensureIsSet().then(async function() {
      it.envio_redundante(enable)
        .then(data => {
          logea(chalk.yellow('<-:'), chalk.yellow(data));
          it.enable_sending();
          logea("/////////////////////////////////");
        })
    })
  });
  socket.on('disable_validator', function(msg) {
    console.log(chalk.cyan("DISABLE VALIDATOR"));
    io.emit('disable_validator', "Disabling Validator");
    //  ready_for_sending=false;
    ready_for_pooling = false;
    it.ensureIsSet().then(async function() {
      it.envio_redundante(desable)
        .then(data => {
          logea(chalk.yellow('<-:'), chalk.yellow(data));
          it.enable_sending();
          logea("/////////////////////////////////"); /////////////////////////////");
        })
    })
  });
  socket.on('lock_cashbox', function(msg) {
    io.emit('lock_cashbox', "locking cashbox");
    console.log(chalk.cyan("LOCKING CASHBOX"));
    var value = it.prepare_Encryption(cashbox_lock_enable);
    //  ready_for_sending=false;
    //  ready_for_pooling=false;
    it.ensureIsSet().then(async function() {
      it.envio_redundante(value)
        .then(data => {
          logea(chalk.yellow('<-:'), chalk.yellow(data));
          it.handleEcommand();
          //    it.enable_sending();
          logea("/////////////////////////////////"); /////////////////////////////");
        })
    });
  });
  socket.on('unlock_cashbox', function(msg) {
    console.log(chalk.cyan("UNLOCKING CASHBOX"));
    io.emit('unlock_cashbox', "unlocking cashbox");
    var value = it.prepare_Encryption(cashbox_unlock_enable);
    //ready_for_sending=false;
    //  ready_for_pooling=false;
    it.ensureIsSet().then(async function() {
      it.envio_redundante(value)
        .then(data => {
          logea(chalk.yellow('<-:'), chalk.yellow(data));
          it.handleEcommand();
          //    it.enable_sending();
          logea("/////////////////////////////////"); /////////////////////////////");
        })
      //it.ecommand("67");
    });
  });
  /////////////////////////////////////////////////////////////
  socket.on('finish', async function(msg) {
    console.log(chalk.cyan("socket finish"));
    //  ready_for_sending=false;
    ready_for_pooling = false;
    it.ensureIsSet().then(async function() {
      it.envio_redundante(desable)
        .then(data => {
          logea(chalk.yellow('<-:'), chalk.yellow(data));
          it.enable_sending();
          logea("/////////////////////////////////");
        })
    })
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
  socket.on('smart_empty', function(msg) {
    console.log(chalk.green('will smart_empty:' + msg));
    var value = it.prepare_Encryption(smart_empty);
    // ready_for_sending=false;
    // ready_for_pooling=false;
    it.ensureIsSet().then(async function() {
      it.envio_redundante(value)
        .then(data => {
          logea(chalk.yellow('<-:'), chalk.yellow(data));
          it.enable_sending();
          logea("/////////////////////////////////");
        })
    })
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
    ready_for_sending = true;
    ready_for_pooling = true;

    it.ensureIsSet().then(async function() {
      it.envio_redundante(poll)
        .then(data => {
          logea(chalk.yellow('<-:'), chalk.yellow(data));
        //  it.enable_sending();
          logea("/////////////////////////////////");
        })
    })
  });
  socket.on('empty_hoppper', function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,empty_all)
      .then(data =>{
        server.logea(chalk.yellow(device+'<-:'), chalk.yellow(data));
        sp.enable_hopper_pooling();
    })
    io.emit('empty_hoppper', "empty_hoppper");
  });
  socket.on('reset_hoppper', function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
    sh.super_comando(smart_hopper_address,reset)
      .then(data =>{
        server.logea(chalk.yellow(device+'<-:'), chalk.yellow(data));
        sp.enable_hopper_pooling();
    })
    io.emit('reset_hoppper', "reset_hoppper");
  });
  socket.on('pay_10c', function(msg) {
      console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay10c).then(data =>{return enc.promise_handleEcommand();}).then(data =>{return ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay10c', "pay10c");sp.enable_hopper_pooling();})

  });
  socket.on('pay_20c', function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay20c).then(data =>{return enc.promise_handleEcommand();}).then(data =>{return ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_20c', "pay_20c");sp.enable_hopper_pooling();})
  });
  socket.on('pay_50c', function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay50c).then(data =>{return enc.promise_handleEcommand();}).then(data =>{return ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_50c', "pay_50c");sp.enable_hopper_pooling();})
  });
  socket.on('pay_1s', function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay1s).then(data =>{return enc.promise_handleEcommand();}).then(data =>{return ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_1s', "pay_1s");sp.enable_hopper_pooling();})
  });
  socket.on('pay_2s', function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay2s).then(data =>{return enc.promise_handleEcommand();}).then(data =>{return ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_2s', "pay_2s");sp.enable_hopper_pooling();})
  });
  socket.on('pay_5s', function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay5s).then(data =>{return enc.promise_handleEcommand();}).then(data =>{return ssp.handlepoll(data);})
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

function tambox_manager_ping() {
  if (tbm_status) {
    setTimeout(() => {
      //  console.log('connected to TBM');
      io.emit('show_connected');
      to_tbm.emit('online', numero_de_serie);
      tambox_manager_ping();
      //  is_os_running();
    }, 15000);
  } else {
    console.log("Connection to TBM lost....");
  }
}
var timer2;
module.exports.timer2=timer2;
function is_os_running() {
  timer2 = setTimeout(() => {
    tbm_status = false;
    is_os_running();
  }, 5000);
}
/////////////////////////////////////////////////////////
http.listen(3000, async function() {
  console.log((chalk.yellow('Tambox 1.1 Starting...')));
  on_startup = true; //mientras esta variable este en true, no permitira que el servidor reciba consultar desde las apis.
  logea("indica que esta en startup");
  // ////////////////////////////////////////////////////
  // it.finalizar_pagos_en_proceso();
  // start_tebs_validator();
  ////////////////////////////////////////////////////////////
  //it.verifica_coneccion_validador();
  // if (global.is_head_online==true){
  // }else{
  //   console.log("Cabezal no conectado.");
  // };

  // try {
  //   thisThrows();
  // } catch (e) {
  //   console.log(e);
  // } finally {
  //   console.log("manejando el error");
  // }
  ////////////////////////////////////////////////////////////
  // Inicializando el Smart Hopper
  try {
    var hopper=await sh.start_smart_hopper();
    if (hopper=="OK") {
      console.log(chalk.green("Hopper Online"));
    }else {
      console.log(chalk.red("No Hopper Found"));
    }
  } catch (e) {
    console.log(e);
  } finally {
    console.log("aqui se supone que tengo que manejar el error.");
  }
  // var validator= await va.start_validator();
  // if (validator=="OK") {
  //   console.log(chalk.green("Validator Online"));
  // }else {
  //   console.log(chalk.red("No Validator Found"));
  // }
  console.log("idle");

});

// async function thisThrows(){
//   // return new Promise(function(resolve, reject) {
//   //   reject();
//   // });
//   throw new Error ("Error desde esta funcion")
// }

/////////////////////////////////////////////////////////
var counter = 0;
function envio_ciclico(orden) {
  it.envio_redundante(orden)
    ///////////////////////////////////////////////////////
    .then(recivido => {
      counter = counter + 1;
      console.log(chalk.yellow("<-:" + recivido));
      console.log(chalk.green(":" + counter));
      setTimeout(() => {
        envio_ciclico(orden);
      }, 10);

    })
    .catch(err => {
      console.log(chalk.bold.red(err));
    })
  //
};
/////////////////////////////////////////////////////////
