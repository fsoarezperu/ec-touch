
const ssp=require('./ssp');
const server=require('./../server');
const fs = require('fs') //para escribir archivo.
const pool = require('./../database');
const chalk=require('chalk');
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
const path=require('path');
////////////////////////////////////////////////////////////////////
// Create shutdown function
function shutdown(callback){
    exec('shutdown -r now', function(error, stdout, stderr){ callback(stdout); });
}
function testing_callback(){
  console.log("inicia timer para volver a main");
  setTimeout(function () {
    ssp.socket.emit('main','main')
  }, 5000);
};
module.exports.testing_callback=testing_callback;
var timer2;
module.exports.timer2=timer2;
function is_os_running() {
  timer2 = setTimeout(() => {
    tbm_status = false;
    is_os_running();
  }, 5000);
}
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
        console.log(chalk.red("total billetes en reciclador:" + totbills));
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
module.exports.calcular_cifras_generales = calcular_cifras_generales;
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
module.exports.calcular_cuadre_diario = calcular_cuadre_diario;

function conectar_enlace_de(xsocket,xid,xpath,vardata,cb) {
  xsocket.on(xid, async function(msg) {
  console.log(chalk.green("se recivio socket:"+msg));
//  fs.readFile(__dirname + xpath, 'utf8', function (err,data) {
    fs.readFile(path.join(__dirname, xpath), 'utf8', function (err,data) {

    if (err) {
      return console.log(err);
    }
    var totaldata=[vardata,data];
    console.log(chalk.green("se emite socket:"+xid));
    xsocket.emit(xid,totaldata);
    if(cb !== undefined){
        cb();
    }

  });
});
}
module.exports.conectar_enlace_de = conectar_enlace_de;

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
module.exports.validator_enabled_now = validator_enabled_now;
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
module.exports.validator_disabled_now = validator_disabled_now;
//esta funcion manda una pulso al servidor cada tanto para indicar que esta en linea.!
async function tambox_manager_ping() {
  return new Promise(function(resolve, reject) {
    try {
      if (tbm_status) {
        setTimeout(() => {
            console.log(chalk.green('connected to TBM'));
          //  console.log(is_regis);
          if (glo.is_regis) {
          //  console.log("emitting");
          socket.io.emit('show_connected_to_TBM'); //muestra que la maquina esta conectada a nube
          to_tbm.emit('online', numero_de_serie); //emite señal a nube indicando que estamos en funcionando
          }
          tambox_manager_ping();
          //  is_os_running();
        }, 20000);
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
module.exports.tambox_manager_ping = tambox_manager_ping;
/////////////////////////////////////////////////////////
