const ssp = require('./ssp');
const sp = require('./serial_port');
const server = require('./../server');
const fs = require('fs') //para escribir archivo.
const pool = require('./../database');
const globals = require('./globals');
const enc = require('./encryption');
const to_tbm = require('./tbm_sync/tbm_synch_socket');
const to_tbm_synch = require('./tbm_sync/synchronize'); //nuevo

const val = require("./devices/validator");
const chalk = require('chalk');
const tambox = require("./devices/tambox"); // nuevo
var fetchTimeout = require('fetch-timeout');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const socketjs=require('./../it/socket');

const moment=require("moment");
async function coneccion_con_tbm(){
  return new Promise(async function(resolve, reject) {
    try {
        // var machine_queried=await consulta_this_machine_en_tbm();}
      //  console.log("flag0568");
        var machine_queried=await tock_tock_tbm();
      //  console.log("en coneccion con tbm machine queried es123587:"+machine_queried);
      //  console.log(tbm_status);
      if (typeof tbm_status === 'boolean' && tbm_status === false) {
        //  console.log(" tbm is OFFLINE");
            //  tbm_status=false;
            //  return resolve(chalk.magenta("Offline"));
              return resolve(chalk.red("Offline"));

      }else {
          console.log(" tbm aparently online");
              var machine_queried=await consulta_this_machine_en_tbm();
              //console.log("en coneccion con tbm machine queried es:"+machine_queried);
              console.log("Info en TBM sobre esta maquina:");
              console.log(JSON.parse(JSON.stringify(machine_queried)));
              //actualiza los datos de esta maquina y sobre escribe los datos locales.
              tbm_status=true;
            //   return resolve(chalk.green.inverse("Online"));
          //     return resolve("Online");

              //
            return resolve(machine_queried);
      }

    } catch (e) {
      return reject("no existe coneccion con servidor remoto 7685");
    }
  });
}
module.exports.coneccion_con_tbm=coneccion_con_tbm;
///////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////
async function tock_tock_tbm() {
  return new Promise(async function(resolve, reject) {
    //consualta en TBM si existe este numero de maquina, sino existe lo crea como pendiente de registradora
    try {
    //  console.log(chalk.green("consultando tock tock"));
      var tbm_adress=tbm_adressx;
      var fix= "/status";
      const url= tbm_adress+fix
      try {
        //console.log("first use of fetch with timeout");
        var machine_queried=await fetchWithTimeout2(url,5000);
      //  console.log("machine_queried es:"+machine_queried);
        if (machine_queried==undefined) {
          machine_queried="Offline"
          return resolve(machine_queried);
        }else {
          return resolve(machine_queried);
        }

      } catch (e) {
        console.log("RESOLVED NO CHECK IN 2345");
        tbm_status=FALSE;
        return resolve("no check-in")
      }
      setTimeout(function() {
        console.log("RESOLVED OK");
        return resolve("OK")
      }, 3000)

    } catch (e) {
      return reject(chalk.red("error aqui123") + e);
    }
  });
}
module.exports.tock_tock_tbm = tock_tock_tbm;
//////////////////////////////////////////////

async function comprueba_rh_inicial(){
  var rh_leida=await consulta_remesa_hermes_actual();
  if (rh_leida.length>0) {
    return "OK";
  }else {
    // console.log(rh_leida);
    console.log("NO existe actualmente una remesa hermes con esta bolsa en status iniciada.");
    rh_leida=await ssp.verificar_existencia_de_bolsa();
    return rh_leida;
  }
}
module.exports.comprueba_rh_inicial=comprueba_rh_inicial;
///////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

async function arranca_tambox_os() {
  return new Promise(async function(resolve, reject) {
    try {
      var this_ts=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
      console.log(this_ts);
      let step1=await tambox.finalizar_pagos_en_proceso();
      console.log(chalk.green("Operaciones Inconclusas fueron finalizadas:"+step1));
      console.log(chalk.green("Iniciando Validador"));
      var validator = await inicializar_validador();
      console.log(chalk.green("Validador inicio:" + validator));
      console.log(chalk.green("***************************************"));


      ///////////////////////////////////////////////////////////////////
      var maquina_inicial=await comprueba_maquina_inicial();
      console.log(chalk.green("comprobando maquina inicial"));
      console.log(chalk.green("maquina_inicial es:"+ JSON.stringify(maquina_inicial)));
      console.log(chalk.green("***************************************"));
      ///////////////////////////////////////////////////////////////////
      var rh_inicial=await comprueba_rh_inicial()
    //  console.log("RH_incial es:"+rh_inicial);
    //  console.log(chalk.green("comprobando remesa hermes inicial"));
    //  console.log(chalk.green("maquina_inicial es:"+JSON.stringify( rh_inicial)));
      console.log(chalk.green("***************************************"));
      ///////////////////////////////////////////////////////////////////


      console.log(chalk.green("Comprobando conexion con TBM"));
      var status=await coneccion_con_tbm();
    //  console.log("status es:"+JSON.stringify(status));
      console.log("status es:"+ status);
      console.log(chalk.green("***************************************"));
        return resolve (validator);// esto frena la ejecucion
      //lee los valores locales de la maquina ,
      // var informacion_maquina_local = {
      //   numero_de_serie: global.numero_de_serie,
      //   tipo: global.note_validator_type,
      //   public_machine_ip: global.public_machine_ip
      // }
      var informacion_maquina_local=await consulta_this_machine();
      console.log(chalk.yellow("la informacion local de la maquina es:"));
      console.log(JSON.parse(JSON.stringify(informacion_maquina_local)));
      //actualiza los valores remotos de la maquina



      console.log(status);
      var second='Offline';
            //  var result = status.localeCompare(second)
            //  console.log(result);
       if (status.valueOf()== second.valueOf()) {
        var x1=status.tienda_id;
        var x2=status.machine_sn;
        var x3=status.name;
        var is_locked11=status.is_locked;
        ///////////////////////////////////
        globals.is_locked=status.is_locked;
        ///////////////////////////////////
        console.log("x1 (tienda_id) es:"+x1);
        console.log("x2 (machine_sn) es:"+x2);
        console.log("x3 (name) es:"+x3);

        await pool.query("UPDATE machine SET tienda_id=?, machine_name=?, is_locked=? WHERE machine_sn=?", [x1,x3,is_locked11,x2]);
          console.log("luego del check in se actualizo el valor de tienda id a:"+status.tienda_id);
          console.log("y el valor de is_locked:"+status.is_locked);
       }else {
         console.log("tbm status is online.6758");
       }
          //vuelve a ejecutar coneccion con
          //  return resolve (status);
          // OJO AQUI CREO QUE LO DE ABAJO NO SE ESTA CORRIENDO POR EL RETURN DE ARRIBA
          //  if (tbm_status== TRUE) {
          await tbm_paso1();
          //    }else {
          //    console.log(chalk.red("TBM still offline at this point!"));
          //    }
          // var regis=await is_this_machine_registered();
          // console.log("resgistered is:"+regis);
          // console.log("***************************************");
      ///////////////////////////////////////////////////////////////////
      var step7=await enable_payout2(validator_address);
      if (step7=="OK") {console.log(chalk.green("payout enabled in here"));}
      //to_tbm_synch.are_synched();
       on_startup=false;
       server.io.emit("iniciando","iniciando");
       tambox_manager_ping();
      return resolve (validator);
    } catch (e) {
      return reject(chalk.cyan("01-Starting Validator->") + e);
    }
  });

}
module.exports.arranca_tambox_os = arranca_tambox_os;
///////////////////////////////////////////////////////////////////////////
async function inicializar_validador() {
  return new Promise(async function(resolve, reject) {
    try {
      await ssp.sync_and_stablish_presence_of(validator_address);
      await ssp.negociate_encryption(validator_address);
      var validatorpoll_var = await validatorpoll2(validator_address);

      if (validatorpoll_var == "no existe bolsa detectada") {
            // console.log("Aqui compruebo que no hay bolsa");
            await bolsa_retrial();
            // console.log("aqui retornando de bolsa retrial:");
            await new_lock_cashbox();

            //aqui contonuo el arranque cuando no huno bolsa inicialmante.
            await ssp.set_protocol_version(validator_address,validator_protocol_version);
            await ssp.setup_request_command2(validator_address);
            if(note_validator_type == "TEBS+Payout"){
              console.log("********************************");
            await ssp.verificar_existencia_de_bolsa(receptor);
              console.log("********************************");
             }
            await set_channel_inhivits2(validator_address);
            await set_validator_routing2(validator_address);

            return resolve("Validador iniciado");
      } else {
        //
      //  console.log("continuo arranque normal");
            await ssp.set_protocol_version(validator_address,validator_protocol_version);
            await ssp.setup_request_command2(validator_address);
            if(note_validator_type == "TEBS+Payout"){
              console.log("********************************");
            await ssp.verificar_existencia_de_bolsa(receptor);
              console.log("********************************");
             }
            await set_channel_inhivits2(validator_address);
            await set_validator_routing2(validator_address);
            // console.log("aqui compruebo que si hay bolsa, y continuo el arranque normal");
            return resolve("OK");
      }

    } catch (e) {
      return reject("no se pudo iniciar el validador->:" + e);
    }

  });

}
module.exports.inicializar_validador = inicializar_validador;
////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
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
const path = require('path');
/////////////////////////////////////////////////////////
// Create shutdown function
function shutdown(callback) {
  exec('shutdown -r now', function(error, stdout, stderr) {
    callback(stdout);
  });
}
/////////////////////////////////////////////////////////
function testing_callback() {
  console.log("inicia timer para volver a main");
  setTimeout(function() {
    server.socket.emit('main', 'main')
  }, 5000);
};
module.exports.testing_callback = testing_callback;
/////////////////////////////////////////////////////////
var timer2;
module.exports.timer2 = timer2;
/////////////////////////////////////////////////////////
// function is_os_running() {
//   timer2 = setTimeout(() => {
//     tbm_status = false;
//     is_os_running();
//   }, 5000);
// }
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
async function tbm_paso1() {
    //verificar registro de maquina.
         await comprueba_maquina_inicial();
         await to_tbm.iniciar_handshake_con_tbm();
          var regis=await is_this_machine_registered();
         console.log("resgistered is:"+regis);
          if (regis[0]=="machine_found_on_tbm") {
           console.log("encontraron una maquina en TBM con este codigo, asi que actualizare mi base de datos en funcion a esa nueva data");
         //console.log(regis[1].tienda_id);
         //  remesa =
         var x1=regis[1].tienda_id;
         var x2=regis[1].machine_sn;
         var x3=regis[1].machine_name;

         console.log("x1 tienda-id es:"+x1);
         console.log("x2 machine_sn es:"+x2);
         console.log("x3 machine_name es:"+x3);

         await pool.query("UPDATE machine SET tienda_id=?, machine_name=? WHERE machine_sn=?", [x1,x3,x2]);
           console.log("luego del check in se actualizo el valor de tienda id a:"+regis[1].tienda_id);
           //   var my_resgistered_machine=await os.consulta_this_machine_en_tbm();
           //   //my_resgistered_machine=my_resgistered_machine[1];
           //   os.logea(chalk.green("query:"+my_resgistered_machine));
           //   console.log("Machine registered name:"+chalk.yellow(my_resgistered_machine.name));
           //   await pool.query ("UPDATE machine SET is_registered=1, machine_name=?",[my_resgistered_machine.name]);
           //   glo.my_resgistered_machine_name=my_resgistered_machine.name;

           //   var step7=await enable_payout(validator_address);
           //    if (step7=="OK") {
           //    //  await carga_monedas_al_hopper(validator_address);
           //    console.log(chalk.green("payout enabled"));
           //     // on_startup=false;
           //     var step8=await validator_poll_loop(validator_address);
           //     os.logea(glo.is_regis);
           //     return resolve("OK");
           //    }
         }
          if(regis=="OK"){

     console.log(chalk.green("Registro de maquina nueva realizado:"+regis));
     //   //var my_resgistered_machine=JSON.parse(await server.consulta_this_machine_en_tbm());
     //   var my_resgistered_machine=await os.consulta_this_machine_en_tbm();
     //   //my_resgistered_machine=my_resgistered_machine[1];
     //   console.log("Machine registered name:"+chalk.yellow(my_resgistered_machine.name));
     //   await pool.query ("UPDATE machine SET is_registered=1, machine_name=?",[my_resgistered_machine.name]);
     //   glo.my_resgistered_machine_name=my_resgistered_machine.name;
     //   var step7=await enable_payout(validator_address);

          }else {
          //SI REGIS IS NOT OK (OSEA NO ESTA REGISTRADA)
          global.is_regis=false;
          await pool.query("UPDATE machine SET machine_sn=?,machine_ip=?,machine_port=?,public_machine_ip=?", [global.numero_de_serie, global.machine_ip, global.machine_port, global.public_machine_ip]);
          var machine_name_query= await pool.query("SELECT machine_name FROM machine");
          machine_name_query=machine_name_query[0].machine_name
          global.my_resgistered_machine_name=machine_name_query;
          console.log(chalk.green("no se pudo sincronizar en Tambox Cloud,Esta maquina ya esta registrada con nombre:")+chalk.yellow(global.my_resgistered_machine_name));
          }
 } //fin de funcion.
//////////////////////////////////////////////////////////////////////
async function is_this_machine_registered() {
  return new Promise(async function(resolve, reject) {
    //consualta en TBM si existe este numero de maquina, sino existe lo crea como pendiente de registradora
    try {
      logea(chalk.green("intentando hacer checkin en tbm usando sockets.io"));
      var informacion_maquina_local = {
        numero_de_serie: global.numero_de_serie,
        tipo: global.note_validator_type,
        public_machine_ip: global.public_machine_ip
      }

      console.log(chalk.yellow("la informacion local de la maquina es:" + JSON.stringify(informacion_maquina_local)));
      await consulta_this_machine_en_tbm();

      // to_tbm.socket_to_tbm.emit('registration', informacion_maquina_local);
      //
      //     to_tbm.socket_to_tbm.on('registration', (msg) => {
      //           console.log("se ah recivido un mensaje desde el servidor TBM:" + JSON.stringify(msg));
      //         //  console.log(msg[1].tienda_id);
      //           if (msg[0] == "machine_found_on_tbm") {
      //             return resolve(JSON.stringify(msg[1]));
      //           }
      //           return resolve("OK");
      //     });
          return resolve("ok");
        setTimeout(function() {
          return resolve("no_tbm_conection_found")
        }, 3000)

    } catch (e) {
      return resolve(e);
    }
  });
}
module.exports.is_this_machine_registered = is_this_machine_registered;
//////////////////////////////////////////////////////////////////////
async function consulta_this_machine_en_tbm() {
  return new Promise(async function(resolve, reject) {
    //consualta en TBM si existe este numero de maquina, sino existe lo crea como pendiente de registradora
    try {
      //console.log(chalk.green("consultando maquina"));
      var tbm_adress=tbm_adressx;
      var fix= "/api/query_machine";
      var machine_sn = global.numero_de_serie;
      const url= tbm_adress+fix+"/"+machine_sn+"/"+public_machine_ip+"/"+machine_port
      try {
                console.log("second use of fetch with timeout");
        var machine_queried=await fetchWithTimeout2(url,5000);
      //  console.log("machine_queried es:"+machine_queried);
        if (machine_queried==undefined) {
          machine_queried="Offline"
          return resolve(machine_queried);
        }else {
          return resolve(machine_queried);
        }

      } catch (e) {
        console.log("RESOLVED NO CHECK IN");
        return resolve("no check-in")
      }
      setTimeout(function() {
        console.log("RESOLVED OK");
        return resolve("OK")
      }, 3000)

    } catch (e) {
      return reject(chalk.red("error aqui123") + e);
    }
  });
}
module.exports.consulta_this_machine_en_tbm = consulta_this_machine_en_tbm;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// function consulta(url) {
//
//   const FETCH_TIMEOUT = 3000;
//   let didTimeOut = false;
//
//   return new Promise(function(resolve, reject) {
//       const timeout = setTimeout(function() {
//         didTimeOut = true;
//         reject(new Error('Request timed out'));
//       }, FETCH_TIMEOUT);
//       console.log(url);
//       fetch(url)
//         .then(function(response) {
//           // Clear the timeout as cleanup
//           clearTimeout(timeout);
//           if (!didTimeOut) {
//             console.log('fetch good! ', response);
//             resolve(response);
//           }
//         })
//         .catch(function(err) {
//           console.log('fetch failed! ', err);
//
//           // Rejection already happened with setTimeout
//           if (didTimeOut) return;
//           // Reject with error
//           reject(err);
//         });
//     })
//     .then(function() {
//       // Request success and no timeout
//       //  return resolve(response);
//       console.log('good promise, no timeout! ');
//     })
//     .catch(function(err) {
//       // Error: response error, request timeout or runtime error
//       console.log('promise error! ', err);
//       //  return resolve("no check-in");
//       return;
//     });
//   return;
// }
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// function fetchWithTimeout(url, timeout) {
//   return new Promise((resolve, reject) => {
//     // Set timeout timer
//     let timer = setTimeout(
//       //() => reject( new Error('Request timed out') ),
//       () => resolve('no check-in'),
//
//       timeout
//     );
//
//     fetch(url).then(
//       response => resolve('OK'),
//       err => reject(err)
//     ).finally(() => clearTimeout(timer));
//   })
// }
/////////////////////////////////////////////////////////////////
async function fetchWithTimeout2(url, timeout) {
  var respuesta;
  //console.log("entering to fetchWithTimeout2");
  console.log(chalk.green("Consultando tambox manager:"+url));
await fetchTimeout(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  }, timeout, 'No hay conexion a tambox manager')
.then(async function(res) {
  if (res.status !== 200) {
    throw new Error('Status code not OK', res.status);
  } else {
    //console.log(await res.json());
   respuesta= await res.json();
  //  console.log("respuesta es:"+JSON.stringify(respuesta));
    return respuesta;
  }
})
.then(function(json) {
//  console.log("json returned from response");
  return json;
})
.catch(function(err) {
      console.log(chalk.red("Tambox manager no se encuentra disponible"));
          //  console.log("la variable tbm_status tiene el valor de:",tbm_status);
      // tbm_status=FALSE; //aqui indico que tambox manager no esta disponible

    // console.log("error de fetch00543", err);

});
return respuesta;
}
/////////////////////////////////////////////////////////////////
async function calcular_cifras_generales() {
  console.log("this is data from cifras generales:");
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
    await ssp.ensureIsSet();
    data = await ssp.envia_encriptado(validator_address, get_all_levels);

    //console.log(data);
  } catch (e) {
    return (e)
  }
  //console.log("this is data from cifras generales:"+data);
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
  console.log(chalk.red("total billetes en reciclador:" + totbills));


  totaccum = acum_level1 + acum_level2 + acum_level3 + acum_level4 + acum_level5;
  console.log("total monto acumulado en reciclador:" + totaccum);

  console.log("/////////// ALL LEVELS ///////////////");
  const monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
  const monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
  var monto_en_bolsa = monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso;
  monto_en_bolsa = monto_en_bolsa - totaccum;
  var total_general = totaccum + monto_en_bolsa;
  var mis_montos = {
    totbills,
    totaccum,
    monto_en_bolsa,
    total_general,
    moneda: country_code
  };
  return mis_montos;
}
module.exports.calcular_cifras_generales = calcular_cifras_generales;
////////////////////////////////////////////////////////////////////////////////////////////////
async function calcular_cuadre_diario() {
  var no_remesas = await pool.query("SELECT COUNT(no_remesa) AS noRemesa FROM remesas WHERE tipo='ingreso' and status='terminado' and status_hermes='en_tambox' and monto>'0'");
  var monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");

  var no_egresos = await pool.query("SELECT COUNT(no_remesa) AS noEgreso FROM remesas WHERE tipo='egreso' and status='completado' and status_hermes='en_tambox'");
  var monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
  //en PROCESO
  var no_remesas_pend = await pool.query("SELECT COUNT(no_remesa) AS noRemesa FROM remesas WHERE (tipo='ingreso' and status='terminado' and rms_status='pendiente' and status_hermes='en_tambox')");
  var monto_total_remesas_pend = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE (tipo='ingreso'and status='terminado'and rms_status='pendiente' and status_hermes='en_tambox')");

  var no_egresos_pend = await pool.query("SELECT COUNT(no_remesa) AS noEgreso FROM remesas WHERE (tipo='egreso' and status='completado' and rms_status='pendiente' and status_hermes='en_tambox')");
  var monto_total_egresos_pend = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  (tipo='egreso' and status='completado' and rms_status='pendiente' and status_hermes='en_tambox')");
  ////////////////////////


  //if_null_then_cero(no_remesas[0].noRemesa);
  //if_null_then_cero(monto_total_remesas[0].totalremesax);
  //if_null_then_cero(no_egresos[0].noEgreso);

  //if_null_then_cero(no_remesas_pend[0].noRemesa);
  //if_null_then_cero(no_egresos_pend[0].noEgreso);

  //var a1=if_null_then_cero(monto_total_egresos[0].totalEgreso);
  //console.log("a1="+a1);

  var totales = {
    no_remesas: no_remesas[0].noRemesa,
    monto_total_remesas: monto_total_remesas[0].totalremesax,
    no_egresos: no_egresos[0].noEgreso,
    monto_total_egresos: monto_total_egresos[0].totalEgreso,
    //monto_total_egresos:a1,

    saldo: monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso,
    trans_global: no_remesas[0].noRemesa + no_egresos[0].noEgreso,

    no_remesas_pend: no_remesas_pend[0].noRemesa,
    monto_total_remesas_pend: monto_total_remesas_pend[0].totalremesax,
    no_egresos_pend: no_egresos_pend[0].noEgreso,
    monto_total_egresos_pend: monto_total_egresos_pend[0].totalEgreso,
    moneda: "PEN"

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
module.exports.calcular_cuadre_diario = calcular_cuadre_diario;
/////////////////////////////////////////////////////////////////
function conectar_enlace_de(xsocket, xid, xpath, vardatayyy, cb) {
  xsocket.on(xid, async function(msg) {
    console.log(chalk.green("se recivio socket:" + msg));
    console.log("cargando file en ruta:" + path.join(__dirname, xpath));
    //  fs.readFile(__dirname + xpath, 'utf8', function (err,data) {
    fs.readFile(path.join(__dirname, xpath), 'utf8', function(err, data) {

      if (err) {
        return console.log(err);
      }
      var totaldata = [vardatayyy, data];
      //  console.log("DATA IS:");
      //  console.log(data);
      //  console.log(chalk.green("se emite socket:"+xid+ "variable:"+totaldata));

      xsocket.emit(xid, totaldata);
      if (cb !== undefined) {
        cb();
      }

    });
  });
}
module.exports.conectar_enlace_de = conectar_enlace_de;
/////////////////////////////////////////////////////////////////
async function validator_enabled_now() {
  //  var data_Tebs=await ssp.envia_encriptado(validator_address,get_tebs_barcode);

  //io.emit('volver',"msg");
  await ssp.ensureIsSet();
  return new Promise(async function(resolve, reject) {
    try {
      //  console.log(chalk.green("disparo de enable_validator"));
      var data = await ssp.envia_encriptado(validator_address, enable);
      if (data == "01F0") {
        console.log(chalk.green("VALIDATOR ENABLED SUCCESFULLY"));
        return resolve("OK");
      } else {
        reject("el validador no se habilito");
      }
    } catch (e) {
      return reject(chalk.red("error en socket:") + e);
    }
    // finally {
    // io.emit('iniciar_nueva_remesa_paso2', "iniciar_nueva_remesa_paso2");
    // }
  });
}
module.exports.validator_enabled_now = validator_enabled_now;
/////////////////////////////////////////////////////////////////
async function validator_disabled_now() {
  //  var data_Tebs=await ssp.envia_encriptado(validator_address,get_tebs_barcode);
  //  console.log(msg);
  //io.emit('volver',"msg");
  await ssp.ensureIsSet();
  return new Promise(async function(resolve, reject) {
    try {
      //console.log(chalk.green("disparo de enable_validator"));
      var data = await ssp.envia_encriptado(validator_address, desable);
      if (data == "01F0") {
        console.log(chalk.red("VALIDATOR DISABLED SUCCESFULLY"));
        return resolve("OK");
      } else {
        reject("el validador no se deshabilito");
      }
    } catch (e) {
      return reject(chalk.red("error en socket:") + e);
    }
    // finally {
    // //io.emit('iniciar_nueva_remesa_paso2', "iniciar_nueva_remesa_paso2");
    // }
  });
}
module.exports.validator_disabled_now = validator_disabled_now;
//esta funcion manda una pulso al servidor cada tanto para indicar que esta en linea.!
async function tambox_manager_ping() {
  return new Promise(function(resolve, reject) {
    try {
      if (tbm_status) { // comprueba que tbm_status sea TRUE indicando que si hay coneccion con servidor cloud
        setTimeout(() => {//la maquina indicara cada 20 segundos que esta activa
          console.log(chalk.green('connected to TBM'));
          //  console.log(is_regis);
          //if (global.is_regis) {
            //  console.log(chalk.cyan("emitting in here"));
            server.io.emit('show_connected_to_TBM'); //muestra que la maquina esta conectada a nube
            to_tbm.socket_to_tbm.emit('online', numero_de_serie); //emite señal a nube indicando que estamos en funcionando
        //  }
          tambox_manager_ping();
          return resolve();
        }, 20000);
      } else {
        console.log(chalk.red("Connection to TBM lost...."));
      }
    } catch (e) {
      return reject("error de ping"+e);
    }
  });

}
module.exports.tambox_manager_ping = tambox_manager_ping;
/////////////////////////////////////////////////////////
async function new_unlock_cashbox() {

  //io.emit('volver',"msg");
  await ssp.ensureIsSet();
  return new Promise(async function(resolve, reject) {
    try {
      //  console.log(chalk.green("disparo de enable_validator"));
      var data = await ssp.envia_encriptado(validator_address, cashbox_unlock_enable);
      if (data == "01F0") {
        console.log(chalk.green("CASHBOX UNLOCKED SUCCESFULLY"));
        return resolve("OK");
      } else {
        reject("el cashbox no pudo desbloquearse");
      }
    } catch (e) {
      return reject(chalk.red("error en socket:") + e);
    }
    // finally {
    // io.emit('iniciar_nueva_remesa_paso2', "iniciar_nueva_remesa_paso2");
    // }
  });
}
module.exports.new_unlock_cashbox = new_unlock_cashbox;
/////////////////////////////////////////////////////////////////
async function new_read_new_tebs() {

  //io.emit('volver',"msg");
  await ssp.ensureIsSet();
  return new Promise(async function(resolve, reject) {
    try {
      //  console.log(chalk.green("disparo de enable_validator"));
      var data = await ssp.envia_encriptado(validator_address, get_tebs_barcode);
      data = await val.handleGetTebsBarcode(data)
      //  if (data=="01F0") {
      console.log(chalk.green("new tebs read"));
      return resolve(data);
      //}else {
      //  reject("el cashbox no pudo desbloquearse");
      //  }
    } catch (e) {
      return reject(chalk.red("error en socket:") + e);
    }
    // finally {
    // io.emit('iniciar_nueva_remesa_paso2', "iniciar_nueva_remesa_paso2");
    // }
  });
}
module.exports.new_read_new_tebs = new_read_new_tebs;
/////////////////////////////////////////////////////////////////
async function new_lock_cashbox() {

  //io.emit('volver',"msg");
  await ssp.ensureIsSet();
  return new Promise(async function(resolve, reject) {
    try {
      //  console.log(chalk.green("disparo de enable_validator"));
      var data = await ssp.envia_encriptado(validator_address, cashbox_lock_enable);
      if (data == "01F0") {
        console.log(chalk.green("CASHBOX LOCKED SUCCESFULLY"));
        return resolve("OK");
      } else {
        reject("el cashbox no pudo bloquearse");
      }
    } catch (e) {
      return reject(chalk.red("error en socket:") + e);
    }
    // finally {
    // io.emit('iniciar_nueva_remesa_paso2', "iniciar_nueva_remesa_paso2");
    // }
  });
}
module.exports.new_lock_cashbox = new_lock_cashbox;
//no_remesa,tienda_id,no_caja,codigo_empleado,no_remesa,fechax1,horax1
async function crear_nueva_remesa(no_remesa, tienda_id, no_caja, codigo_empleado, fechax1, horax1) {

  if (on_startup == false) {
    // dando por terminada, cualquier operacion que este como iniciada inadecuadamente.
    await pool.query("UPDATE remesas SET status='terminado' WHERE status='iniciada'");
    console.log("aqui estoy creando una nueva remesa en la base de datos");
    console.log(chalk.yellow("iniciando NUEVA REMESA:" + no_remesa));
    ///////////////////////////////////////////////
    const number_remesa = await pool.query("SELECT COUNT(no_remesa) AS noRemesa FROM remesas WHERE tipo='ingreso' and no_remesa=?", [no_remesa]);
    if (number_remesa[0].noRemesa > 0) {
      console.log('Remesa ya existente, no se puede usar este codigo de remesa nuevamente.');
    } else {
      console.log(fechax1);
      console.log(horax1);
      var this_ts=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
      console.log("probando aqui de agregar ts_incio al momento de crear nueva remesa manual:"+this_ts);
      if (tienda_id && no_caja && codigo_empleado && no_remesa) {
        const nueva_res = {
          tienda_id,
          no_caja,
          codigo_empleado,
          no_remesa,
          fecha: fechax1,
          hora: horax1,
          moneda: country_code,
          tebs_barcode: tebs_barcode,
          machine_sn: numero_de_serie,
          tipo: 'ingreso',
          no_billetes: 0, //,
          ts_inicio:this_ts
        }
        await pool.query('INSERT INTO remesas set ?', [nueva_res]);
        console.log("aqui ya inserte la remesa y estoy apunto en enviar comenzar_remesa" + JSON.stringify(nueva_res));
        //return;
        await  validator_enabled_now();
        socketjs.nuevo_enlace('iniciar_nueva_remesa','../system/remesa/remesa_1.html');
      } else {
        console.log('Datos incompletos, revise documentacion');
        //  return;
      }
    }
  } else {
    console.log('Estoy en Startup');
    //return;
  }
}
module.exports.crear_nueva_remesa = crear_nueva_remesa;
/////////////////////////////////////////////////////////////////
async function terminar_nueva_remesa(no_remesa) {
  console.log("aqui estoy terminando una nueva remesa en la base de datos con numero:"+no_remesa);
  //return new Promise(async function(resolve, reject) {
  console.log("al momento de terminar nueva remesa se detecta un current_tebs_barcode:" + current_tebs_barcode);
  if (on_startup === false) {
    if (no_remesa) {
      try {

        if (global.manual_remesa==false) {
          await pool.query("UPDATE remesas SET status='terminado' WHERE tipo='ingreso' and no_remesa=?", no_remesa);
        }else {
          await pool.query("UPDATE remesas SET status='terminado', rms_status='finalizada' WHERE tipo='ingreso' and no_remesa=?", no_remesa);
          global.manual_remesa==false
        }

        await pool.query("UPDATE creditos SET status='processed' WHERE no_remesa=?", [no_remesa]);

        //  remesax = await pool.query('SELECT * FROM remesas WHERE no_remesa=?', [no_remesa]);
        //  io.to_tbm.emit('una_remesa_mas', "transaccion satisfactoria remesa");
        //////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
      //    await actualizar_remesa_enTBM2(remesax);
    //    await  to_tbm_synch.synch_required();
        //////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
        ////////////////////////////actualizando la remesa hermes para que refleje el nuevo monto de remesa ingresado
        //const no_billetes= await pool.query("SELECT SUM(no_billetes) AS total_billetes FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
        const monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox' and tebs_barcode=?", [current_tebs_barcode]);
        const monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'and tebs_barcode=?", [current_tebs_barcode]);
        // await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado'");
        const no_billetes_total_remesas = await pool.query("SELECT SUM(no_billetes) AS total_no_billetes_remesas FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'and tebs_barcode=?", [current_tebs_barcode]);
        const no_billetes_total_egresos = await pool.query("SELECT SUM(no_billetes) AS total_no_billetes_egresos FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'and tebs_barcode=?", [current_tebs_barcode]);
        var no_billetes_en_remesa_hermes = no_billetes_total_remesas[0].total_no_billetes_remesas - no_billetes_total_egresos[0].total_no_billetes_egresos;
        const monto_remesa_hermes = monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso;
        console.log("actualizando el monto de remesa hermes:" + monto_remesa_hermes + " y numero de billetes es:" + no_billetes_en_remesa_hermes);
        await pool.query("UPDATE remesa_hermes SET monto=?, no_billetes=? WHERE status='iniciada' and tebs_barcode=?", [monto_remesa_hermes, no_billetes_en_remesa_hermes, current_tebs_barcode]);
        var nueva_res_hermes = await pool.query("SELECT * FROM remesa_hermes WHERE status='iniciada' and tebs_barcode=?", [current_tebs_barcode]);
        console.log(chalk.yellow("voy a actualizar rh con estos datos:" +JSON.stringify(nueva_res_hermes)));

        var got_tienda_id=nueva_res_hermes[0].tienda_id;
        console.log("got tienda id is"+JSON.stringify(got_tienda_id));
        await pool.query("UPDATE machine SET monto_actual=? WHERE tienda_id=?", [monto_remesa_hermes,got_tienda_id]);
        //////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
      //  await ssp.sincroniza_remesa_hermes2(nueva_res_hermes);

        //    try {
        console.log(chalk.cyan("here tbm_status_is:",tbm_status));
        if (tbm_status==true) {
            await  to_tbm_synch.synch_required();
        }

        //    } catch (e) {
        //      console.log("no se puso sincronizar en este momento");
        //    }

        //////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
        //  res.json(remesax);
        //  return resolve();

        //////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
        //   var tbm_adress=tbm_adressx;
        //   var fix= "/sync_remesa_hermes2";
        //   var monto=remesax[0].monto;
        //   var moneda=remesax[0].moneda;
        //   var status=remesax[0].status;
        //   var tebs_barcode=remesax[0].tebs_barcode;
        //   var no_billetes=remesax[0].no_billetes;
        //   const url= tbm_adress+fix+"/"+monto+"/"+moneda+"/"+status+"/"+tebs_barcode+"/"+no_billetes
        //   console.log("url:"+url);
        //   /////////////////
        //   const Http= new XMLHttpRequest();
        // //  const url= 'http://192.168.1.2:3000/sync_remesa/22222/001/0002/9999/15000/PEN/14444330/234765/ingreso/2019-05-09/17:22:10'
        //   Http.open("GET",url);
        //   Http.send();
        //////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////////////////////////
      } catch (e) {
        console.log(chalk.cyan("ERROR 002- No se pudo sincronizar transaccion") + e);
      } finally {
        //  return;
      }
    } else {
      //  res.json('Datos incompletos');
      console.log('Datos incompletos')
      //  return reject('Datos incompletos');
    }
  } else {
    //res.send('Estoy en Startup');
    console.log('Estoy en Startup')
    //  return reject('Estoy en Startup');
  }
  //});
}
module.exports.terminar_nueva_remesa = terminar_nueva_remesa;
///////////////////////////////////////////////////////////////////
async function finalizar_nueva_remesa(no_remesa) {
  console.log("aqui estoy finalizando desde RMS la remesa numero:"+no_remesa);
  //return new Promise(async function(resolve, reject) {
  console.log("al momento de terminar nueva remesa hermes se detecta un current_tebs_barcode:" + current_tebs_barcode);
  if (on_startup === false) {
    if (no_remesa) {
      try {
        await pool.query("UPDATE remesas SET rms_status='finalizada'WHERE tipo='ingreso' and no_remesa=?", no_remesa);
      } catch (e) {
        console.log(chalk.cyan("ERROR 002- No se pudo sincronizar transaccion") + e);
      } finally {
        //  return;
      }
    } else {
      //  res.json('Datos incompletos');
      console.log('Datos incompletos')
      //  return reject('Datos incompletos');
    }
  } else {
    //res.send('Estoy en Startup');
    console.log('Estoy en Startup')
    //  return reject('Estoy en Startup');
  }
  //});
}
module.exports.finalizar_nueva_remesa = finalizar_nueva_remesa;
/////////////////////////////////////////////////////////////////
async function begin_remesa_hermes() {

  //io.emit('volver',"msg");
  await ssp.ensureIsSet();
  return new Promise(async function(resolve, reject) {
    try {
      //  console.log(chalk.green("disparo de enable_validator"));
      var data = await ssp.envia_encriptado(validator_address, smart_empty);
      if (data == "01F0") {
        console.log(chalk.green("SMART EMPTY STARTED"));
        return resolve("OK");
      } else {
        reject("SMart Empty no pudo ejecutarse");
      }
    } catch (e) {
      return reject(chalk.red("error en socket:") + e);
    }

  });
}
module.exports.begin_remesa_hermes = begin_remesa_hermes;
/////////////////////////////////////////////////////////////////
async function consulta_remesa_hermes_actual() {
  const remesa_hermes_entambox = await pool.query("SELECT * FROM remesa_hermes WHERE status='iniciada' and tebs_barcode=?", [current_tebs_barcode]);
  console.log("consulta_remesa_hermes_actual en status iniciada:");
  console.log(JSON.parse(JSON.stringify(remesa_hermes_entambox)));
  return remesa_hermes_entambox;
}
module.exports.consulta_remesa_hermes_actual = consulta_remesa_hermes_actual;
/////////////////////////////////////////////////////////////////

async function crear_nuevo_pay_20(monto,no_remesa, tienda_id, no_caja, codigo_empleado, fechax1, horax1) {

  if (on_startup == false) {
    // dando por terminada, cualquier operacion que este como iniciada inadecuadamente.
    await pool.query("UPDATE remesas SET status='error' WHERE status='recibido'");
    console.log("aqui estoy creando una nuevo pago en la base de datos");
    console.log(chalk.yellow("iniciando NUEVO PAGO:" + no_remesa));
    ///////////////////////////////////////////////
    const number_egreso = await pool.query("SELECT COUNT(no_remesa) AS noPagos FROM remesas WHERE tipo='egreso' and no_remesa=?", [no_remesa]);
    if (number_egreso[0].noPagos > 0) {
      console.log('Remesa ya existente, no se puede usar este codigo de remesa nuevamente.');
    } else {

      // console.log(fechax1);
      // console.log(horax1);
       var this_ts=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
       console.log("probando aqui de agregar ts_incio al momento de crear nueva remesa manual:"+this_ts);
       if (monto && tienda_id && no_caja && codigo_empleado && no_remesa) {

         var nueva_res = {
           monto,
           tienda_id,
           no_caja,
           codigo_empleado,
           no_remesa,
           fecha: fechax1,
           hora: horax1,
           moneda: country_code,
           tebs_barcode: tebs_barcode,
           machine_sn: numero_de_serie,
           tipo: 'egreso',
           status:'recibido',
          // no_billetes: 0, //,
           ts_inicio:this_ts
         }
         await pool.query('INSERT INTO remesas set ?', [nueva_res]);
         console.log("aqui ya inserte la remesa y estoy apunto en enviar comenzar_remesa:");
         console.log(JSON.parse( JSON.stringify(nueva_res)));
         try {
                    await validar_pago(nueva_res.no_remesa);
         } catch (e) {
              console.log(chalk.cyan("aqui indico que el pago no se pudo realizar por un motivo y lo indique y continue."));
         }

         //await ejecutar_pago(nueva_res.no_remesa);

          console.log("todo va bien hasta aqui.");
      //   //return;
      //   await  validator_enabled_now();
      //   socketjs.nuevo_enlace('iniciar_nueva_remesa','../system/remesa/remesa_1.html');
       } else {
         console.log('Datos incompletos, revise documentacion');
         //  return;
       }
    }
  } else {
    console.log('Estoy en Startup');
    //return;
  }
}
module.exports.crear_nuevo_pay_20 = crear_nuevo_pay_20;
/////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
var ConvertBase = function(num) {
  return {
    from: function(baseFrom) {
      return {
        to: function(baseTo) {
          return parseInt(num, baseFrom).toString(baseTo);
        }
      };
    }
  };
};
ConvertBase.dec2hex = function(num) {
  return ConvertBase(num).from(10).to(16);
};

function handlepayoutvalue(data){
//return  new Promise(function(resolve, reject) {
//    try {
var poll_responde=data.match(/.{1,2}/g);
//  console.log("data en poll_responde es:"+poll_responde);
var data_length_on_pool=parseInt(poll_responde[0]);
data_length_on_pool=data_length_on_pool+1;
poll_responde=poll_responde.slice(0,data_length_on_pool);
//console.log("data en poll_responde es:"+data_length_on_pool);
//console.log(poll_responde);

      if(poll_responde[1] == "F0"){
        console.log(chalk.green("PAGO PROCEDE"));
        server.io.emit("realizando_pago","realizando_pago");
        return "ok";
      }
        if(poll_responde[1] == "F5"){
        console.log(chalk.green("Command can not be processed"));
        //return ("Command can not be processed");

        if(poll_responde[2] == "01"){
          console.log(chalk.green("Not enough value in device3"));
          server.io.emit("anuncio_saldo_insuficiente","anuncio_saldo_insuficiente");
          return "saldo_insuficiente";
        }
        if(poll_responde[2] == "02"){
          console.log(chalk.green("Cannot pay exact amount"));
          server.io.emit("monto_exacto","monto_exacto");
          return "no_monto_exacto";
        }
        if(poll_responde[2] == "03"){
          console.log(chalk.green("Device Busy"));
          return "ocupado";
        }
        if(poll_responde[2] == "04"){
          console.log(chalk.green("Device Disabled"));
          return  "desabilitado";
        }
    }
}
///////////////////////////////////////////////////////////////

async function validar_pago(no_remesa){
  var retiro,posible_monto;
   return new Promise(async function(resolve, reject) {
    //  const {no_remesa}=req.params;
      console.log("consultando retiro:"+no_remesa);
      try {
        // ssp.ensureIsSet2()
        if(on_startup==false){
          retiro= await pool.query ("SELECT * FROM remesas WHERE no_remesa=? AND tipo='egreso'",[no_remesa]);

          if (retiro.length==0) {
            console.log("pero ese pago no existe");
          //  res.json("ese pago no existe");
            return resolve("ese pago no existe");
          }else {
            console.log("retiro:"+retiro[0].monto);
          }
            posible_monto=retiro[0].monto;
          if( retiro.length !== 0){ //si hay un retiro con ese numero de esa remesa verifica que el monto no sobrepase el limite.
                  console.log("//////////////////////////////////");
                  console.log(chalk.cyan("se puede pagar?: S/."+posible_monto));
                  if(posible_monto>500){
                    console.log("el limite maximo es de 500 soles por transaccion");
                    //res.json('retiro_limite');
                    return reject("retiro limite");
                  }//si el monto es mayor al limite termina la ejecucion
                  //convertir el monto a hex invertido
                  posible_monto= posible_monto*100;
                  //console.log(posible_monto);
                  posible_monto=ConvertBase.dec2hex(posible_monto).toUpperCase();
                  //console.log(posible_monto);
                  posible_monto=enc.pady(posible_monto,8);
                  //console.log(posible_monto);
                  posible_monto=enc.changeEndianness(posible_monto);
                  //console.log(posible_monto);
                  //console.log("posible_monto HEX reversed:"+posible_monto);
                  //formar la orden de consulta con el valor del monto actual.
                  prep0="0933";
                  prep2="50454E19";
                  var string= prep0.concat(posible_monto);
                  string= string.concat(prep2);
                  //console.log("STRING FINAL:"+string);
                   const arry=[];
                   const thelength=string.length/2;
                  // console.log("the length:"+thelength);
                   for (var i=0;i<thelength;i++){
                     var thisy=string.substr(i*2,2);
                    arry.push(thisy);
                   }

                   // try {
                   console.log("justo antes del problema: validator_asddress is:"+global.validator_address);
                      //var data= await sspo.transmite_encriptado_y_procesa2(validator_address,arry);
                      var data= await transmite_encriptado_y_procesa2(global.validator_address,arry);

                   // } catch (e) {
                   //   return reject(e)
                   // }
                    console.log("AQUI VOLI:"+data);

                      console.log(chalk.yellow("<-:"+data));
                      var solucion=handlepayoutvalue(data);
                      console.log("solucion is:"+solucion);
                    if(solucion=="ok"){
                        await pool.query ("UPDATE remesas SET status='procede' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
                      }
                      if(solucion=="no_monto_exacto"){
                        console.log("No_monto_exacto");
                         await pool.query ("UPDATE remesas SET status='no_monto_exacto' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
                        // res.json('No_monto_exacto');
                         return reject("No_monto_exacto");
                      }
                      if(solucion=="saldo_insuficiente"){
                        console.log("Saldo_insuficiente");
                         await pool.query ("UPDATE remesas SET status='saldo_insuficiente' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
                         //res.json('Saldo_insuficiente');
                         return reject("Saldo_insuficientex");
                      }
                      if(solucion=="ocupado"){
                        console.log("Ocupado");
                         await pool.query ("UPDATE remesas SET status='ocupado' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
                         //res.json('Ocupado');
                         return reject("Ocupado");
                      }
                      if(solucion=="desabilitado"){
                          console.log("Deshabilitado");
                         await pool.query ("UPDATE remesas SET status='desabilitado' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
                        // res.json('Deshabilitado');
                         return reject("Deshabilitado");
                      }

                    console.log("/////////////////////////////////");
                    const retiro= await pool.query ('SELECT * FROM remesas WHERE no_remesa=? AND tipo="egreso"',[no_remesa]);
                   if(retiro){
                    // res.json(retiro);
                    await ejecutar_pago(no_remesa);
                    console.log("solo falta a este punto ejecutar el retiro para luego finalizarlo.");
                     return resolve()
                   }else {
                     return reject("no se encontro este retiro");
                   }

          }else{
            //res.json('Pago Inexistente'); //funcionA.
            return reject('Pago Inexistente');
          }
        }else{
          //res.send('Estoy en Startup');
          return reject('Pago Inexistente');
        }
      } catch (e) {
        console.log("error en consultar retiro:->"+e);
      }
    });

}
module.exports.validar_pago = validar_pago;

async function ejecutar_pago(no_remesa){
  new Promise(async function(resolve, reject) {
    try {
      // ssp.ensureIsSet2()
      if(on_startup==false){
        //Aqui verifico que el pago no existe en la base de datos y con status completado., si lo detecta, lo imprime en pagina
      //  const {no_remesa}=req.params;
        const valid_payment= await pool.query("SELECT * FROM remesas WHERE no_remesa=? and tipo='egreso' and status='completado'" ,[no_remesa]);
        if(valid_payment.length>0){
        //  res.json(valid_payment);
        console.log("valid payment");
          return resolve();
        }else{

        //////////////////////////////////
        //consulta monto del retiro con codigo tal y estatus aprobado
        // const monto= await pool.query("SELECT * FROM remesas WHERE no_remesa=? and (tipo='egreso' and status<>'completado' and rms_status='pendiente')" ,[no_remesa]);
        const retiro= await pool.query ("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='egreso' and no_remesa=?",[no_remesa]);

        if(retiro.length>0){
      const retirox= await pool.query ('SELECT * FROM remesas WHERE no_remesa=?',[no_remesa]);
    //  socketjs.io.emit('retiro_en_proceso'," pago en proceso");
    //  res.json(retirox);
    console.log("retiro en proceso");
      return resolve();
          }else{
            //consultar el pago que esta como "procede" y ejecutar pago.
            const monto= await pool.query("SELECT * FROM remesas WHERE no_remesa=? and (tipo='egreso' and status='procede' and rms_status='pendiente')" ,[no_remesa]);
            if(monto.length>0){
            console.log("/////////////PAY OUT SENT////////////////////");
            console.log(chalk.green("Monto a pagar:"+monto[0].monto));
            ///////////////////////////////////////////////////////////////
            console.log("////////////LECTURA INICIAL DE RECICLADOR////////////////////");
            var no_billetes_antes=await concilia_numeros();
            global.en_reciclador_antes_de_retiro=no_billetes_antes[0].total_notes;
            console.log("estoy guardando en_reciclador_antes_de_retiro xxy:"+global.en_reciclador_antes_de_retiro);
            //////////////////////////////////
            var prep1= monto[0].monto;
            prep1= prep1*100;
            prep1=ConvertBase.dec2hex(prep1).toUpperCase();
            prep1=enc.pady(prep1,4);
            prep1=enc.changeEndianness(prep1);
            //console.log("prep1 reversed:"+prep1);
            prep0="0933";
            prep2="000050454E58";
            var string= prep0.concat(prep1);
            string= string.concat(prep2);
            //console.log("STRING FINAL:"+string);
            const arry=[];
            const thelength=string.length/2;
            for (var i=0;i<thelength;i++){var thisy=string.substr(i*2,2);arry.push(thisy);}
            console.log(arry);
            //var value=tambox.prepare_Encryption(arry);
          //  ssp.ensureIsSet2()
            var data =await transmite_encriptado_y_procesa2(global.receptor,arry);
            const retiro= await pool.query ("UPDATE remesas SET status='en_proceso' WHERE no_remesa=?",[no_remesa]);
            const retirox= await pool.query ('SELECT * FROM remesas WHERE no_remesa=?',[no_remesa]);

            var mi_objeto={ nombre:"pago"};
            socketjs.nuevo_enlace('retiro_en_proceso','../system/retiros/retiro_en_proceso.html',mi_objeto);
          //  server.io.emit('retiro_en_proceso'," pago en proceso");
        //    res.json(retirox);
            return resolve();
            //////////////////////////////////
            }else{
          //    res.json("no se encontro un record valido");
              console.log("no se encontro un record valido");
              return reject("no se encontro un record valido")
            }

    }
    //////////////////////////////////
     }
    //////////////////////////////////
      }else{
      //  res.send('Estoy en Startup');
      console.log('estoy en start_up');
      }
    } catch (e) {
      return reject(e);
    }
  });
}
module.exports.ejecutar_pago = ejecutar_pago;

async function consulta_historial() {
  var historial = await pool.query("SELECT * FROM remesa_hermes ORDER BY id DESC");
  console.log(chalk.cyan("consultando historial de remesas hermes locales:"));//+JSON.parse(JSON.stringify(historial)));
//  console.log(JSON.stringify(historial));
console.log(JSON.parse(JSON.stringify(historial)));
//  console.log("antes"+JSON.stringify(historial));
  var historial2=[];

 moment.locale("es");
   for (let rh of historial){
      var formatear_ts_inicio=rh["ts_inicio"];
     rh["ts_inicio"]=moment(formatear_ts_inicio).format('LLL');
     var formatear_ts_fin=rh["ts_fin"];
    rh["ts_fin"]=moment(formatear_ts_fin).format('LLL');
     //console.log(rh);
     historial2.push(rh);
   }
  // console.log("despues"+JSON.stringify(historial2));

  //console.log(JSON.stringify(remesa_hermes_entambox));
  return historial2;
}
module.exports.consulta_historial = consulta_historial;
/////////////////////////////////////////////////////////////////
async function consulta_remesas_de_ese_tebsbarcode() {
  console.log("consultando remesas para el tebsbarcode:"+current_tebs_barcode);
  const remesas_de_tebs = await pool.query("SELECT * FROM remesas WHERE tebs_barcode=? and monto>'0' and status_hermes='en_tambox' ORDER BY id DESC", [current_tebs_barcode]);
  //console.log(JSON.stringify(remesa_hermes_entambox));
  var remesas_de_tebs2=[];

 moment.locale("es");
   for (let rh of remesas_de_tebs){
      var formatear_ts_inicio=rh["ts_inicio"];
     rh["ts_inicio"]=moment(formatear_ts_inicio).format('LLL');
     //console.log(rh);
     remesas_de_tebs2.push(rh);
   }

  return remesas_de_tebs2;
}
module.exports.consulta_remesas_de_ese_tebsbarcode = consulta_remesas_de_ese_tebsbarcode;
/////////////////////////////////////////////////////////////////
async function idle_poll_loop(receptor) {
//  console.log("entrando a idel poll loop");
  try {
            await ssp.ensureIsReadyForPolling();
            if (ready_for_pooling == true) {
  //            console.log("resdy for pooling es true");
              ready_for_pooling = false;
              return new Promise(async function(resolve, reject) {
                try {
                  var step1 = await sp.hacer_consulta_serial(receptor, global.poll);
                //  console.log("step1:"+step1);
                      if (step1.length > 0) {
                              await ssp.handlepoll(step1);
                              setTimeout(async function() {
                                logea("//////////////////////////////");
                                logea(chalk.green("VALIDATOR POLLING"));
                                await idle_poll_loop(validator_address);
                              //  console.log("idle poll loop");
                              }, 500);
                        ready_for_pooling = true;
                        return resolve("OK");
                      } else {
                        return resolve("OK");
                      }
                } catch (e) {
                //  sp.abrir_puerto_serial();
                  // return inicializar_validador();
                //  return arranca_tambox_os();
                   return reject("error en idle poll loop:"+e);
                }
                //var step1= await ssp.envia_encriptado(receptor,global.poll);
              });

            } else {
    //          console.log("ready for polling NOT READY");
            }
  } catch (e) {
    return reject("Iddle poll loop error:")
  }

} ;
module.exports.idle_poll_loop = idle_poll_loop;
/////////////////////////////////////////////////////////////////
async function get_my_phisical_current_ip() {
  return new Promise(async function(resolve, reject) {
    var detected_ip = "0.0.0.0"
    'use strict';
    const {
      networkInterfaces
    } = require('os');
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
async function get_my_current_public_ip() {
  const publicIp = require('public-ip');
  return new Promise(async function(resolve, reject) {
    //	console.log(await publicIp.v4());
    //=> '46.5.21.123'
    //	console.log(await publicIp.v6());
    //=> 'fe80::200:f8ff:fe21:67cf'
    var p_ip = await publicIp.v4();
    resolve(p_ip);
  });

};
async function obtener_datos_de_conexion() {
  return new Promise(async function(resolve, reject) {
    try {
      var mi_ip = await get_my_phisical_current_ip();
      global.machine_ip = mi_ip;
      var mi_public_ip = await get_my_current_public_ip();
      global.public_machine_ip = mi_public_ip;
      //console.dir("detecting public ip assigned is:"+mi_public_ip);
      console.log(chalk.yellow("/////////////////////////////////////////////////////////////////"));
      console.log((chalk.yellow('http://' + machine_ip + ":" + machine_port + " en conexion local")));
      console.log((chalk.yellow('http://' + public_machine_ip + ":" + machine_port + " en conexion remota")));
      //  reject("aqui te paro");
      resolve();
    } catch (e) {
      reject("no se pudo obtener el ip fisico.")
    }

  });

  //console.dir("detecting ip assigned is:"+mi_ip);

}
module.exports.obtener_datos_de_conexion = obtener_datos_de_conexion;
/////////////////////////////////////////////////////////////////
async function comprobar_serialcom() {
  return new Promise(async function(resolve, reject) {
    try {
      const SerialPort = require('serialport')
      var myPorts=[];
      SerialPort.list().then(ports=>{
    //  console.log(ports);
      myPorts=ports;
      //console.log("mis puertos son:"+myPorts[1].comName);
      var my_tambox_connection="6001"; //product id del puerto serial de la maquina. estes numero es especifico.

      myPorts.forEach((myports, i) => {
        if(myPorts[i].productId == my_tambox_connection){
          console.log(chalk.green("Validator hardware detected"));
          resolve();
          //reject("no se pudo detectar ningun puerto com");
        }else {
        //  console.log("THERE IS A PROBLEM WITH THE TAMBOX MACHINE");
        }
      //  reject("no serial port found");
      });
      reject("no puerto serial encontrado")


      }, err=>console.log(err))

    } catch (e) {
      reject("no se pudo odetectar ningun puerto com")
    }

  });
  //console.dir("detecting ip assigned is:"+mi_ip);
}
module.exports.comprobar_serialcom = comprobar_serialcom;
/////////////////////////////////////////////////////////////////

function habilita_sockets() {
  //console.log("habilitando_conexion_de_sockets_locales");
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      const io2 = require('./socket')(server.io);
      //reject("no se pudieron habilitar!");
      //console.log("habilitados");
      resolve();
    }, 1000);
  });


}
module.exports.habilita_sockets = habilita_sockets;
/////////////////////////////////////////////////////////////////
async function validatorpoll2(receptor) {
  // console.log("entrando a validator pool2");
    return new Promise(async function(resolve, reject) {
        try {
          var step1 = await ssp.envia_encriptado(receptor, global.poll);
        //    console.log("step1:"+step1);
          var data = await ssp.handlepoll(step1);
        //      console.log("data:"+data);
              if (global.existe_bolsa == false) {
                return resolve("no existe bolsa detectada");
              }else {
                return resolve(data);
              }
        } catch (e) {
          return reject("on validator poll2 error ->:" + e);
        }
  });
};
module.exports.validatorpoll2 = validatorpoll2;
////////////////////////////////////////////////////
const sleep = m => new Promise(r => setTimeout(r, m));
module.exports.sleep=sleep;
async function bolsa_retrial(){
  return new Promise(async function(resolve, reject) {

try {
for (var i = 0; i < 100; i++) {
   if (global.existe_bolsa != true) {
     console.log("esperando bolsa:"+i);
     if(i==99){
       i=0;
     }
     await validatorpoll2(validator_address);
     await new Promise(resolve => setTimeout(resolve, 1000));
      }else {
        //console.log("saliendo de loop");
        return resolve("yo lo resolvi");
      }
 }
 // console.log("el loop termino y no sali");
   return reject("no se pudo detectar una bolsa")
} catch (e) {

  return reject("no se pudo hacer el bolsa retrial:->"+e);
}
  });
}
///////////////////////////////////////////////////////////
async function carga_informacion_para_main(){
  return new Promise(async function(resolve, reject) {
    try {
      var this_machine_info=await consulta_this_machine();
    //   console.log("vardata de main es:"+JSON.stringify(this_machine_info));
      var historial=await consulta_historial();
      var remesas_from_this_tebsbarcode=await consulta_remesas_de_ese_tebsbarcode();
     // console.log("vardata de hisotiral es:"+JSON.stringify(historial));
      var mi_objeto={this_machine_info,historial,remesas_from_this_tebsbarcode};
    } catch (e) {
      return reject("No pude leer la informacion para main");
    } finally {
      return resolve(mi_objeto);
    }
  });
}
module.exports.carga_informacion_para_main=carga_informacion_para_main;
///////////////////////////////////////////////////////////
async function set_channel_inhivits2(receptor) {
  // console.log(chalk.yellow("CHANNELS INHIVITs"));
  return new Promise(async function(resolve, reject) {
    try {
      await ssp.envia_encriptado(receptor,set_inhivits);
      return resolve("OK");
    } catch (e) {
      return reject("no funciono set_channel_inhivits");
    }

  });
};
///////////////////////////////////////////////////////////
function set_validator_routing2(receptor) {
  // console.log(chalk.yellow("ROUTING bills"));
  return new Promise(async function(resolve, reject) {
    try {
      await ssp.envia_encriptado(receptor,send_10_soles_a_cashbag);
      await ssp.envia_encriptado(receptor,send_20_soles_a_payout);
      await ssp.envia_encriptado(receptor,send_50_soles_a_payout);
      await ssp.envia_encriptado(receptor,send_100_soles_a_payout);
      await ssp.envia_encriptado(receptor,send_200_soles_a_cashbag);
      return resolve("OK")
    } catch (e) {
      return reject("error en set_validator_routing2")
    }
  });
};
//////////////////////////////////////////////////////////
function enable_payout2(receptor) {
 return new Promise( async function(resolve, reject) {
   try {
     // console.log("Enable payout2");
     await ssp.envia_encriptado(receptor,global.poll);
     await ssp.envia_encriptado(receptor,global.enable_payout);
     await ssp.envia_encriptado(receptor,global.poll);
     await ssp.envia_encriptado(receptor,global.poll);
     return resolve("OK");
   } catch (e) {
     return reject("no se pudo hacer enable_payout2")
   }
 });
}

function pruebita(){
  return new Promise(function(resolve, reject) {
    return resolve("OK");
  });
}
module.exports.pruebita=pruebita;
////////////////////////////////////////////////////////////////////
async function transmite_encriptado_y_procesa2(receptorx,polly){
  // await ssp.ensureIsSet()
  var new_polly=polly;
  var new_receptorx=receptorx;
//  console.log("aqui polly es:"+polly);
//  console.log("aqui new receptor es:"+new_receptorx);
return new Promise(async function(resolve, reject) {
  try {
      if (bypass== false) {
  //      console.log("aqui polly es:"+polly);
  //      console.log("aqui new receptor es:"+new_receptorx);
        var toSendw =await enc.prepare_Encryption(new_polly);
        //console.log("aqui toSend:"+toSendw);
          //var data=await sp.transmision_insegura(new_receptorx,toSendw);
          var data=await sp.transmision_insegura(global.validator_address,toSendw);

        //  console.log("aqui toSend_response:"+data);
              data=await enc.promise_handleEcommand(data);
              //console.log(chalk.yellow("from here "+device+'<-:'), chalk.yellow(data));
              data= await ssp.handlepoll(data);

              if (data.length>0) {
                  return resolve(data);
              }

      }else {
            return reject("bypassed");
      }

  } catch (e) {
    return reject("error en transmite encriptado y procesa"+e);
  }

});

}
module.exports.transmite_encriptado_y_procesa2=transmite_encriptado_y_procesa2;
/////////////////////////////////////////////////////////////////
// function actualizar_remesa_enTBM2(remesax) {
//   return new Promise(function(resolve, reject) {
//     try {
//       var tbm_adress = tbm_adressx;
//       var fix = "/sync_remesa";
//       var tienda_id = remesax[0].tienda_id;
//       var no_caja = remesax[0].no_caja;
//       var codigo_empleado = remesax[0].codigo_empleado;
//       var no_remesax = remesax[0].no_remesa;
//       var fecha = remesax[0].fecha;
//       var hora = remesax[0].hora;
//       var monto = remesax[0].monto;
//       var moneda = remesax[0].moneda;
//       var status = remesax[0].status;
//       var rms_status = remesax[0].rms_status;
//       var tipo = remesax[0].tipo;
//       var status_hermes = remesax[0].status_hermes;
//       var tebs_barcode1 = remesax[0].tebs_barcode;
//       var machine_sn = remesax[0].machine_sn;
//       var no_billetes1 = remesax[0].no_billetes;
//
//       const url = tbm_adress + fix + "/" + tienda_id + "/" + no_caja + "/" + codigo_empleado + "/" + no_remesax + "/" + fecha + "/" + hora + "/" + monto + "/" + moneda + "/" + status + "/" + rms_status + "/" + tipo + "/" + status_hermes + "/" + tebs_barcode1 + "/" + machine_sn + "/" + no_billetes1
//       console.log("url:" + url);
//       /////////////////
//       const Http = new XMLHttpRequest();
//       //  const url= 'http://192.168.1.2:3000/sync_remesa/22222/001/0002/9999/15000/PEN/14444330/234765/ingreso/2019-05-09/17:22:10'
//       Http.open("GET", url);
//       Http.send();
//       return resolve();
//     } catch (e) {
//       return reject(e);
//     } finally {
//       //  return;
//     }
//   });
// };
/////////////////////////////////////////////////////////////////
function sincroniza_remesa_hermes2(res){
console.log("iniciando actualizacion de remesa hermes:");
 return new Promise(async function(resolve, reject) {
  try {
    var tbm_adress=tbm_adressx;
    var fix= "/sync_remesa_hermes2";
    var tienda_idy=res[0].tienda_id;
    var monto=res[0].monto;
    var moneda=res[0].moneda;
    var status=res[0].status;
    var tebs_barcode4=res[0].tebs_barcode;
    var no_billetes=res[0].no_billetes;
    var machine_snx=res[0].machine_sn;
    var fechay=res[0].fecha;
    var horay=res[0].hora;
    var no_billetesy=res[0].no_billetes;
    var fechafin=res[0].fecha_fin;
    var horafin=res[0].hora_fin;

    // var rms_status=remesax[0].rms_status;
    // var tipo=remesax[0].tipo;
    // var status_hermes=remesax[0].status_hermes;
    const urly= tbm_adress+fix+"/"+tienda_idy+"/"+monto+"/"+moneda+"/"+status+"/"+tebs_barcode4+"/"+machine_snx+"/"+fechay+"/"+horay+"/"+no_billetesy+"/"+fechafin+"/"+horafin
    console.log("url:"+urly);
    /////////////////
    const Http= new XMLHttpRequest();
  //  const url= 'http://192.168.1.2:3000/sync_remesa/22222/001/0002/9999/15000/PEN/14444330/234765/ingreso/2019-05-09/17:22:10'
    Http.open("GET",urly);
    Http.send();
    return resolve();
  } catch (e) {
    return reject(e);
  } finally {
    //return;
  }
});
}
module.exports.sincroniza_remesa_hermes2=sincroniza_remesa_hermes2;
/////////////////////////////////////////////////////////////////
async function consulta_all_levels(){
return new Promise(async function(resolve, reject) {
  try {
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

    var data=await transmite_encriptado_y_procesa2(global.receptor, get_all_levels)
    //console.log("aqui leyendo data en transmite_encriptado_y_procesa2:"+data);
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
          //      console.log("value_level1 is:" + value_level1);
                note_level1 = parseInt(poll_responde[ru], 16);
          //      console.log("note_level1 is:" + note_level1);
                acum_level1 = note_level1 * value_level1;
          //      console.log("acum_level1 is:" + acum_level1);
              }
              if (i == 1) {
                ru = 12;
                prevalue = poll_responde[ru + 2];
                prevalue = prevalue + poll_responde[ru + 3];
                prevalue = prevalue + poll_responde[ru + 4];
                prevalue = prevalue + poll_responde[ru + 5];
                prevalue = enc.changeEndianness(prevalue);
                value_level2 = parseInt(prevalue, 16) / 100;
          //      console.log("value_level2 is:" + value_level2);
                note_level2 = parseInt(poll_responde[ru], 16);
          //      console.log("note_level2 is:" + note_level2);
                acum_level2 = note_level2 * value_level2;
          //      console.log("acum_level2 is:" + acum_level2);
              }
              if (i == 2) {
                ru = 21;
                prevalue = poll_responde[ru + 2];
                prevalue = prevalue + poll_responde[ru + 3];
                prevalue = prevalue + poll_responde[ru + 4];
                prevalue = prevalue + poll_responde[ru + 5];
                prevalue = enc.changeEndianness(prevalue);
                value_level3 = parseInt(prevalue, 16) / 100;
          //      console.log("value_level3 is:" + value_level3);
                note_level3 = parseInt(poll_responde[ru], 16);
          //      console.log("note_level3 is:" + note_level3);
                acum_level3 = note_level3 * value_level3;
          //      console.log("acum_level3 is:" + acum_level3);
              }
              if (i == 3) {
                ru = 30;
                prevalue = poll_responde[ru + 2];
                prevalue = prevalue + poll_responde[ru + 3];
                prevalue = prevalue + poll_responde[ru + 4];
                prevalue = prevalue + poll_responde[ru + 5];
                prevalue = enc.changeEndianness(prevalue);
                value_level4 = parseInt(prevalue, 16) / 100;
          //      console.log("value_level4 is:" + value_level4);
                note_level4 = parseInt(poll_responde[ru], 16);
          //      console.log("note_level4 is:" + note_level4);
                acum_level4 = note_level4 * value_level4;
          //      console.log("acum_level4 is:" + acum_level4);
              }
              if (i == 4) {
                ru = 39;
                prevalue = poll_responde[ru + 2];
                prevalue = prevalue + poll_responde[ru + 3];
                prevalue = prevalue + poll_responde[ru + 4];
                prevalue = prevalue + poll_responde[ru + 5];
                prevalue = enc.changeEndianness(prevalue);
                value_level5 = parseInt(prevalue, 16) / 100;
            //    console.log("value_level5 is:" + value_level5);
                note_level5 = parseInt(poll_responde[ru], 16);
              //  console.log("note_level5 is:" + note_level5);
                acum_level5 = note_level5 * value_level5;
            //    console.log("acum_level5 is:" + acum_level5);
              }
              lod = parseInt(poll_responde[ru], 16);
              totbills = totbills + lod;
            }
          }

          totaccum = acum_level1 + acum_level2 + acum_level3 + acum_level4 + acum_level5;
          console.log(chalk.cyan("en el Reciclador hay:" + totbills +" Billetes x monto acumulado de:"+totaccum +" Soles"));
          // console.log("total monto acumulado en reciclador:" + totaccum);

          await pool.query("UPDATE machine SET monto_en_reciclador=?,no_billetes_reci=?,billetes_de_10=?,billetes_de_20=?,billetes_de_50=?,billetes_de_100=?,billetes_de_200=?", [totaccum,totbills,note_level1,note_level2,note_level3,note_level4,note_level5]);

          console.log("/////////// ALL LEVELS ///////////////");
          var cantidad_de_billetes_en_reciclador={
            de10:note_level1,
            de20:note_level2,
            de50:note_level3,
            de100:note_level4,
            de200:note_level5,
          }
          var total_notes=note_level1+note_level2+note_level3+note_level4+note_level5;
          return resolve([{cantidad_de_billetes_en_reciclador,total_notes},totaccum]) ;
  } catch (e) {
    return reject (e)
  }
});

}
module.exports.consulta_all_levels=consulta_all_levels;
/////////////////////////////////////////////////////////////////
async function concilia_numeros(){
var data124=await consulta_all_levels();
   console.log("all levels es:"+data124);
   return data124;
}
module.exports.concilia_numeros=concilia_numeros;
/////////////////////////////////////////////////////////////////
async function comprueba_maquina_inicial(){
return new Promise(async function(resolve, reject) {
  try {
    //cuenta cuantas maquinas existen en la base de datos.
    var this_machine222=await consulta_this_machine();

    if (this_machine222.length>0) {
    //  console.log("MACHINE FOUND");
    //  console.log("this macine 222="+JSON.stringify(this_machine222));
    //  console.log("this machine222 length:"+this_machine222.length);
      return resolve(this_machine222);
    }else {
      console.log("NEW MACHINE CREATED");
      const nueva_machine_inicial = {
        tienda_id:9999,
        machine_sn: global.numero_de_serie,
        tipo: global.note_validator_type,
        public_machine_ip: global.public_machine_ip,
        machine_ip:global.machine_ip
      }
      await pool.query('INSERT INTO machine set ?', [nueva_machine_inicial]);
      return resolve("OK");
    }
  } catch (e) {
    return reject("no se pudo comprobar maquina inicial:"+e)
  }

});
};
module.exports.comprueba_maquina_inicial=comprueba_maquina_inicial;
/////////////////////////////////////////////////////////////////
async function consulta_this_machine() {
  const this_machine2121 = await pool.query("SELECT * FROM machine");
  //console.log(JSON.stringify(remesa_hermes_entambox));
  return this_machine2121;
}
module.exports.consulta_this_machine = consulta_this_machine;
/////////////////////////////////////////////////////////////////
