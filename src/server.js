//////////////////////////////////////////////////////////////////////////////////////
//Created by: Edgar F soarez A. fsoarez@hotmail.com
//Description: Software to control NV200 Spectral by Innovative Technologies.
//Protocol Used: Smiley Secured Protocol
//Date: Nov 2018
/////////////////////////////////////////////////////////////////////////////////////
const it = require('./tambox');
const glo = require('./globals');
const tbm = require('./tbm_sync/synchronize');
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
app.use(session({
  secret: "echomeautomation",
  resave: false,
  saveUninitialized: false,
  store: new mysql_store(database)

}));
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', '.hbs');
/////////////////////////////////////////////////////////////////////
function logea(texto,variable){
if(typeof(variable) !='undefined'){if(view_log){console.log(texto+variable);};}else{if(view_log){console.log(texto);}; }}
module.exports.logea=logea;
//////////////////////////////////////////////////////////////////////
var http = require('http').Server(app);
//var io = require('socket.io', {rememberTransport: false,transports: ['WebSocket', 'Flash Socket', 'AJAX long-polling']})(http);
var io = require('socket.io', {rememberTransport: false,transports: ['Flash Socket', 'AJAX long-polling']})(http);

exports.io = io; //this is to be used by other files on the project and be able to send emit by socket io.
//////////////////////////////////////////////////////////////////////
//var to_tbm = require("socket.io-client")('http://tambox.ddns.net:4000');
var to_tbm = require("socket.io-client")('https://tbm-cloud.herokuapp.com');

exports.to_tbm=to_tbm;
to_tbm.on("connect", function() {
  to_tbm.on('disconnect', function() {console.log("Tambox_manager is offline...");     io.emit('show_not_connected'); tbm_status=false;});
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
  tbm_status=true;
  tambox_manager_ping();
});
/////////////////////////////////////////////////////////
io.on('connection', function(socket) {
  socket.on('disconnect', function() {});
  socket.on('sincronizando', function(msg) {
  to_tbm.emit('system_running_indicator',"tambox1.0x");
  console.log(msg);
  });
  // socket.on('reset', function(data) {
  //   console.log(data);
  //   it.envio_redundante(reset)
  //     .then(data => {
  //       logea(chalk.yellow('<-:'),chalk.yellow(data));
  //       poll_loop();
  //      logea("/////////////////////////////////");
  //     })
  // });
  socket.on('is_tbm_alive', function(data) {
    console.log(data);
  });
  socket.on('reset', function(msg) {
      console.log(msg);
  //  io.emit('reset', "reseting system");
    it.zerox=false;
    ecount="00000000";
    ready_for_pooling=false;
      it.ensureIsSet()
          .then(async function(){
            it.envio_redundante(reset)
              .then(data => {
                logea(chalk.yellow('<-:'),chalk.yellow(data));
                poll_loop();
               logea("/////////////////////////////////");
              })
          })
  });
  socket.on('reset_counters', function(msg) {
      console.log(msg);
  //  io.emit('reset', "reseting system");
    it.zerox=false;
    ecount="00000000";
    ready_for_pooling=false;
      it.ensureIsSet()
          .then(async function(){
            it.envio_redundante(reset_counters)
              .then(data => {
                logea(chalk.yellow('<-:'),chalk.yellow(data));
                //poll_loop();
               logea("/////////////////////////////////");
              })
          })
  });
  socket.on('enable_validator', function(msg) {
      console.log(chalk.cyan("ENABLE VALIDATOR"));
//      ready_for_sending=false;
      ready_for_pooling=false;
      it.ensureIsSet().then(async function(){
      it.envio_redundante(enable)
      .then(data => {
        logea(chalk.yellow('<-:'),chalk.yellow(data));
        it.enable_sending();
        logea("/////////////////////////////////");
      })
      })
  });
  socket.on('disable_validator', function(msg) {
    console.log(chalk.cyan("DISABLE VALIDATOR"));
    io.emit('disable_validator', "Disabling Validator");
  //  ready_for_sending=false;
    ready_for_pooling=false;
    it.ensureIsSet().then(async function(){
    it.envio_redundante(desable)
    .then(data => {
      logea(chalk.yellow('<-:'),chalk.yellow(data));
        it.enable_sending();
      logea("/////////////////////////////////");/////////////////////////////");
    })
    })
  });
  socket.on('lock_cashbox', function(msg) {
    io.emit('lock_cashbox', "locking cashbox");
    console.log(chalk.cyan("LOCKING CASHBOX"));
    var value=it.prepare_Encryption(cashbox_lock_enable);
  //  ready_for_sending=false;
  //  ready_for_pooling=false;
    it.ensureIsSet().then(async function(){
    it.envio_redundante(value)
    .then(data => {
      logea(chalk.yellow('<-:'),chalk.yellow(data));
      it.handleEcommand();
  //    it.enable_sending();
      logea("/////////////////////////////////");/////////////////////////////");
      })
    });
  });
  socket.on('unlock_cashbox', function(msg) {
    console.log(chalk.cyan("UNLOCKING CASHBOX"));
    io.emit('unlock_cashbox', "unlocking cashbox");
      var value=it.prepare_Encryption(cashbox_unlock_enable);
      //ready_for_sending=false;
    //  ready_for_pooling=false;
      it.ensureIsSet().then(async function(){
      it.envio_redundante(value)
      .then(data => {
        logea(chalk.yellow('<-:'),chalk.yellow(data));
        it.handleEcommand();
    //    it.enable_sending();
        logea("/////////////////////////////////");/////////////////////////////");
      })
    //it.ecommand("67");
    });
  });
/////////////////////////////////////////////////////////////
  socket.on('finish', async function(msg) {
    console.log(chalk.cyan("socket finish"));
  //  ready_for_sending=false;
    ready_for_pooling=false;
      it.ensureIsSet().then(async function(){
          it.envio_redundante(desable)
          .then(data => {
          logea(chalk.yellow('<-:'),chalk.yellow(data));
          it.enable_sending();
          logea("/////////////////////////////////");
          })
      })
   });
  socket.on('refresh_window', function(msg) {
      console.log(msg);
  });
  socket.on('consultar_remesa', async function(msg) {
    const remesax= await pool.query("SELECT * FROM remesas WHERE status='terminado' ");
    io.emit('consultar_remesa', remesax);
    console.log("consultar_remesa___________________________________________________ ");
  });
  socket.on('consultar_monto_remesa', async function(msg) {
    const monto_remesa = await pool.query("SELECT * FROM remesas WHERE status='terminado' AND no_remesa=? ", [msg]);
    console.log(monto_remesa[0].monto);
    const creditos = await pool.query("SELECT * FROM creditos WHERE status='processed' and no_remesa=?",[msg]);
    io.emit('consultar_monto_remesa', monto_remesa[0].monto,creditos);
    console.log("consultar_monto_remesa_______________________________________________");
  });
  socket.on('consultar_lista_tienda_id', async function(msg) {
    //consulta lista de tienda_id para el dropdown del filtro en la pagina niveles
    const tienda_id= await pool.query("SELECT DISTINCT tienda_id FROM remesas WHERE status='terminado' ");
    io.emit('consultar_lista_tienda_id', tienda_id);

  });
  socket.on('consultar_total_tienda_id', async function(msg) {
    const total_tienda_id = await pool.query("SELECT SUM(monto) AS totalxtienda_id FROM remesas WHERE tienda_id=? AND status='terminado'",[msg]);
    console.log(total_tienda_id[0].totalxtienda_id);
    io.emit('consultar_total_tienda_id', total_tienda_id[0].totalxtienda_id);
  });
  socket.on('smart_empty', function(msg) {
  console.log(chalk.green('will smart_empty:'+msg));
  var value=it.prepare_Encryption(smart_empty);
  // ready_for_sending=false;
  // ready_for_pooling=false;
  it.ensureIsSet().then(async function(){
  it.envio_redundante(value)
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    it.enable_sending();
    logea("/////////////////////////////////");
  })
  })
});
  socket.on('nuevo_billete_recivido',function(msg) {
var tt= msg.monto;
var ttt= msg.country_code;
console.log("monto:"+tt);
console.log("country code:"+ttt);
});
  socket.on('force_serial', function(msg) {
    console.log(chalk.green("FORCING SERIAL"));
    console.log(chalk.green("ready for sending is:"+ready_for_sending));
    console.log(chalk.green("ready for pooling is:"+ready_for_pooling));
    ready_for_sending=true;
    ready_for_pooling=true;

    it.ensureIsSet().then(async function(){
    it.envio_redundante(poll)
    .then(data => {
      logea(chalk.yellow('<-:'),chalk.yellow(data));
      it.enable_sending();
      logea("/////////////////////////////////");
    })
    })
});
  socket.on('vbnet', function(msg) {
    console.log(chalk.green("from visual basic"));
});
  socket.on('update_requested', function(msg) {
  console.log(chalk.green(msg));
  io.emit('update_requested',"display message from update_requested");
});
socket.on('no_cabezal', function(msg) {
console.log(chalk.green(msg));
io.emit('no_cabezal',"display message from update_requested");
});

});
/////////////////////////////////////////////////////////
function start_tebs_validator(){
  logea("/////////////////////////////////");
  console.log("Startup Initiated");
//cleaRING COUNT FOR ENCRIPTION;
  it.zerox=false;
  ecount="00000000";
  sync_and_stablish_presence_of_validator();
};
module.exports.start_tebs_validator=start_tebs_validator;
/////////////////////////////////////////////////////////
function sync_and_stablish_presence_of_validator() {
  logea("/////////////////////////////////");
  //console.log("//////////////////////////////////////////");
  console.log("sync_and_stablish_presence_of_validator");
  logea("/////////////////////////////////");
  console.log("SYNCH command sent");
  it.envio_redundante(synch)//<------------------------------ synch
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    it.handlesynch(data);
    logea("/////////////////////////////////");
    console.log("SYNCH command sent");
    return it.envio_redundante(synch)//<--------------------- synch
  })
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    it.handlesynch(data);
    logea("/////////////////////////////////");
    console.log("SYNCH command sent");
    return it.envio_redundante(synch)//<--------------------- synch
  })
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    it.handlesynch(data);
    logea("/////////////////////////////////");
    console.log("POLL command sent");
    return it.envio_redundante(poll)//<--------------------- poll
  })
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    return it.handlepoll2(data);
  })
  .then(data => {
    //logea(chalk.yellow('<-:'),chalk.yellow(data));
    negociate_encryption();
  })
  .catch(error => it.retrial(error))
};
/////////////////////////////////////////////////////////
function negociate_encryption(){
  encryptionStatus = false;
  logea("/////////////////////////////////");
  console.log("SYNCH command sent");
  it.envio_redundante(synch)//<---------------------------------- synch
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    it.handlesynch(data);
    it.getkeys();
    var setGenerator=it.set_generator_();
    logea("/////////////////////////////////");
    console.log("SET GENERATOR command sent");
    return it.envio_redundante(setGenerator)//<------------------ setGenerator
  })
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    it.handleSetgenerator(data);
    var setModulus=it.set_modulus();
   logea("/////////////////////////////////");
   console.log("SET MODULUS command sent");
   return it.envio_redundante(setModulus)//<--------------------- setModulus
  })
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    it.handleSetmodulus(data);
   var rKE=it.send_request_key_exchange();
   logea("/////////////////////////////////");
   console.log("Request Key Exchange command sent");
   return it.envio_redundante(rKE)//<--------------------------- REquest key exchange
    //
   //polly();
    //   setTimeout(()=>{
    //   console.log(chalk.red("//////////// ALL OVER AGAIN /////////////////////"));
    //   console.log(chalk.red("//////////// ALL OVER AGAIN /////////////////////"));
    //   console.log(chalk.red("//////////// ALL OVER AGAIN /////////////////////"));
    //   sync_and_stablish_presence_of_validator();
    // },500);
})
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
      return  it.handleRKE(data)
  })
   .then(data => {
     logea(chalk.green('KEY:'),chalk.green(data));
     console.log(chalk.green("KEY CALCULATED SUCCESFULLY"));
     logea("/////////////////////////////////");
     console.log("POLL command sent");
     return it.envio_redundante(poll)//<--------------------- poll
   })
   .then(data => {
     logea(chalk.yellow('<-:'),chalk.yellow(data));
     return it.handlepoll2(data);
   })
   .then(data => {
     //logea(chalk.yellow('<-:'),chalk.yellow(data));
     logea("/////////////////////////////////");
     set_protocol_version();
    // polly();
   })
  .catch(error => it.retrial(error))
};
/////////////////////////////////////////////////////////
function polly(){
    setTimeout(()=>{
    console.log(chalk.red("//////////// ALL OVER AGAIN /////////////////////"));
    console.log(chalk.red("//////////// ALL OVER AGAIN /////////////////////"));
    console.log(chalk.red("//////////// ALL OVER AGAIN /////////////////////"));
    start_tebs_validator();
  },20);
};
/////////////////////////////////////////////////////////
function set_protocol_version(){
  console.log("set_protocol_version");
  it.envio_redundante(host_protocol_version)//<--------------------- host_protocol_version
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    it.handleprotocolversion(data);
    logea("/////////////////////////////////");
    setup_request_command()
  })
//  .catch(error => it.retrial(error))

};
/////////////////////////////////////////////////////////
function setup_request_command(){
  console.log("setup_request sent");
  it.envio_redundante(setup_request)//<---- setup_request
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    it.handlesetuprequest(data);
    logea("/////////////////////////////////");
    console.log("get_serial_number sent");
    return it.envio_redundante(get_serial_number)//<-------- get_serial_number
  })
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    it.handleGetSerialNumber(data);
    return it.envio_redundante(poll)//<----------- poll
    logea("/////////////////////////////////");
  })
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    it.handlepoll(data);
    logea("/////////////////////////////////");
    if(note_validator_type=="TEBS+Payout"){
      set_routing();
    }
    if(note_validator_type=="NV200 Spectral"){
      set_channel_inhivits();
    }
    //safepool();
  })
//  .catch(error => it.retrial(error))

};
/////////////////////////////////////////////////////////
function safepool(){
  console.log("safepoll command sent");
  var toSend=it.prepare_Encryption(poll);//<--------------------- send_10_soles_a_cashbag
  //console.log("luego del proceso de encryptacion:"+toSend);
  it.envio_redundante(toSend)
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
  //  it.handlepoll(data);
      // console.log("data rec on server:"+data);
      it.handleEcommand(data);
    logea("/////////////////////////////////");/////////////////////////////");
    setTimeout(safepool,800); //auto renew the poll trigger;
    })
//    .catch(error => it.retrial(error))
//setTimeout(safepool,800); //auto renew the poll trigger;
};
/////////////////////////////////////////////////////////
function set_routing(){
  console.log("ROUTING NOTES");
  console.log("send_10_soles_a_cashbag");
  var toSend=it.prepare_Encryption(send_10_soles_a_cashbag);//<--------------------- send_10_soles_a_cashbag
  //console.log("luego del proceso de encryptacion:"+toSend);
  it.envio_redundante(toSend)
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    it.handleEcommand(data);
    logea("/////////////////////////////////");

     console.log("send_20_soles_a_payout");
     toSend=it.prepare_Encryption(send_20_soles_a_payout);//<--------------------- send_50_soles_a_payout
     return it.envio_redundante(toSend)
     // var toSend2="";
     // toSend2=it.prepare_Encryption(send_20_soles_a_payout);//<--------------------- send_20_soles_a_payout
     // console.log("luego del proceso de encryptacion:"+toSend2);
     // return it.envio_redundante(toSend2)
  })
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    //it.handleRoutingNotes(data);
    it.handleEcommand(data);
    logea("/////////////////////////////////");
    console.log("send_50_soles_a_payout");
    toSend=it.prepare_Encryption(send_50_soles_a_payout);//<--------------------- send_50_soles_a_payout
    return it.envio_redundante(toSend)
  })
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    //it.handleRoutingNotes(data);
    it.handleEcommand(data);
    logea("/////////////////////////////////");
    console.log("send_100_soles_a_payout");
    toSend=it.prepare_Encryption(send_100_soles_a_payout);//<--------------------- send_50_soles_a_payout
    return it.envio_redundante(toSend)

    // return it.mandaEncrypted(send_100_soles_a_cashbag)//<--------------------- send_100_soles_a_cashbag

    //console.log("/////////////////////////////////");
  })
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    // it.handleRoutingNotes(data);
    it.handleEcommand(data);

    logea("/////////////////////////////////");
    console.log("send_200_soles_a_cashbag");
    toSend=it.prepare_Encryption(send_200_soles_a_cashbag);//<--------------------- send_50_soles_a_payout
    return it.envio_redundante(toSend)
    // return it.mandaEncrypted(send_200_soles_a_cashbag)//<--------------------- send_200_soles_a_cashbag
    // console.log("/////////////////////////////////");
  })
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
//    it.handleRoutingNotes(data);
    it.handleEcommand(data);
     logea("/////////////////////////////////");
     enable_payoutx();
    // set_channel_inhivits();
  })
  .catch(error => it.retrial(error))
//  enable_payout();
};
/////////////////////////////////////////////////////////
function enable_payoutx(){
//var enable_payout= [0x02, 0x5C, 0x01];
//var desable_payout= [0x01, 0x5B];
console.log("/////////////////////////////////");
console.log("Enable PAYOUT");
// console.log("enable_payout:"+enable_payout);
  toSend=it.prepare_Encryption(enable_payout);//<--------------------- send_10_soles_a_cashbag
  // console.log("luego del proceso de encryptacion:"+toSend);
  it.envio_redundante(toSend)
  .then(data => {
    logea(chalk.yellow('<-:'),chalk.yellow(data));
    //it.handleRoutingNotes(data);

    it.handleEcommand(data);
    logea("/////////////////////////////////");
  //  set_routing();
    set_channel_inhivits();
  })
//  .catch(error => it.retrial(error))

};
/////////////////////////////////////////////////////////
function set_channel_inhivits(){
   console.log("set_inhivits sent");
   it.envio_redundante(set_inhivits)//<--------------------- set_inhivits
     .then(data => {
       logea(chalk.yellow('<-:'),chalk.yellow(data));
       it.handleSetInhivits(data);
       logea("/////////////////////////////////");
       return it.envio_redundante(get_tebs_barcode)//<--------------------- set_inhivits
      //  enable_validator()
     })
     .then(data => {
       logea(chalk.yellow('<-:'),chalk.yellow(data));
       it.handleGetTebsBarcode(data);
       logea("/////////////////////////////////");
       console.log(note_validator_type);
       // if(note_validator_type=="NV200 Spectral"){
       //
       //   //enable_validator();
       //   poll_loop();
       // }
      //   enable_payout();
      ///////////////////////////////////////////////////////
        on_startup=false;
        //console.log("indica que ya no esta en startup");
        console.log("Listo...");
        /////////////////////////////////////////////////////
        it.enable_sending();
        poll_loop(); //esto tiene que descomentarse para que sea utilizado por remesa nueva.
//        enable_validator() //bypass the enable until a new remesa has begun.
     })
  //   .catch(error => it.retrial(error))

 };
/////////////////////////////////////////////////////////
function enable_validator(){
    console.log("Enabling Validator");
    it.envio_redundante(enable)//<--------------------- enable
      .then(data => {
        logea(chalk.yellow('<-:'),chalk.yellow(data));
        it.handlepoll(data);
        console.log(chalk.green("validator is enabled"));
        logea("/////////////////////////////////");/////////////////////////////");
        poll_loop();
      })
  //    .catch(error => it.retrial(error))

};
/////////////////////////////////////////////////////////
function poll_loop(){
  it.ensureIsSet().then(async function(){
        io.emit('system_running_indicator');//indica el punto intermitente en interface para notar que el programa esta corriendo adecuadamente.
        //  io.emit('tog_validator');

            if(ready_for_sending){
            //  logea(chalk.green('ready for sending is:'),chalk.green(ready_for_sending));
                        if(ready_for_pooling){
                          // logea(chalk.cyan('ready for pooling is:'),chalk.green(ready_for_pooling));
                              console.log(chalk.magentaBright("POLL command sent"));
                              // logea(chalk.magentaBright('POLL command sent'));
                              clearTimeout(timer2);
                              return it.envio_redundante(poll)//<--------------------- poll
                              .then( data => {
                              logea(chalk.yellow('<-:'),chalk.yellow(data));
                              it.handlepoll(data);
                              logea("/////////////////////////////////");
                              setTimeout(poll_loop,300); //auto renew the poll trigger;
                              })
                              .catch(error => {console.log(error);console.log("error externo");})
                        }else{
                        console.log("poll disabled");
                      //  ready_for_pooling=true; // este lo calmbie al ultimo billete perdido
                        }// end of if
              }else{
                console.log("ready for sending is off");
              }
       global.polltimer=setTimeout(poll_loop,300); //auto renew the poll trigger;
  })//fin del promise
  .catch(error => console.log(error))
};
/////////////////////////////////////////////////////////
function poll_loop2(){
  // it.ensureIsSet().then(async function(){
  //       io.emit('ping');//indica el punto intermitente en interface para notar que el programa esta corriendo adecuadamente.
  //           if(ready_for_sending){
  //             logea(chalk.green('ready for sending is:'),chalk.green(ready_for_sending));
  //                       if(ready_for_pooling){
  //                          logea(chalk.green('ready for pooling is:'),chalk.green(ready_for_pooling));
  //                             console.log(chalk.magentaBright("POLL command sent"));
  //                             // logea(chalk.magentaBright('POLL command sent'));
  //                             return
                                  it.envio_redundante(poll)//<--------------------- poll
                                  .then( data => {
                                    logea(chalk.yellow('<-:'),chalk.yellow(data));
                                    it.handlepoll(data);
  //                             logea("/////////////////////////////////");
                                setTimeout(poll_loop2,200); //auto renew the poll trigger;
                               })
  //                             .catch(error => console.log(error))
  //                       }else{
  //                       //console.log("poll disabled");
  //                       ready_for_pooling=true;
  //                       }// end of if
  //             }else{
  //               console.log("ready for sending is off");
  //             }
  //      global.polltimer=setTimeout(poll_loop,800); //auto renew the poll trigger;
  // })//fin del promise
};
/////////////////////////////////////////////////////////
function tambox_manager_ping(){
  if(tbm_status){
    setTimeout(()=>{
    //  console.log('connected to TBM');
      io.emit('show_connected');
      to_tbm.emit('online',numero_de_serie);
      tambox_manager_ping();
    //  is_os_running();
    },5000);
  }else{
    console.log("Connection to TBM lost....");
  }
}

var timer2;
function is_os_running(){
timer2=setTimeout(()=>{
  tbm_status=false;
  is_os_running();
  },5000);
}
/////////////////////////////////////////////////////////
http.listen(3000, function() {
  console.log('Tambox 1.0 Running...');
   on_startup=true; //mientras esta variable este en true, no permitira que el servidor reciba consultar desde las apis.
   console.log("indica que esta en startup");
  // ////////////////////////////////////////////////////
   it.finalizar_pagos_en_proceso();

   //it.verifica_coneccion_validador();

  // if (global.is_head_online==true){
      start_tebs_validator();
  // }else{
  //   console.log("Cabezal no conectado.");
  // };

// tbm.are_synched();
//testing
  // ////////////////////////////////////////////////////
//envio_ciclico(poll);
});
/////////////////////////////////////////////////////////
var counter=0;
function envio_ciclico(orden) {
      it.envio_redundante(orden)
      ///////////////////////////////////////////////////////
      .then(recivido =>{
        counter=counter+1;
          console.log(chalk.yellow("<-:"+recivido));
          console.log(chalk.green(":"+counter));
          setTimeout(()=>{
          envio_ciclico(orden);
        },10);

      })
      .catch(err =>{
        console.log(chalk.bold.red(err));
      })
//
};
/////////////////////////////////////////////////////////
