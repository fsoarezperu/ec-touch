const socketjs=require('./../it/socket')
const express = require('express');
const router = express.Router();
const pool = require('../database');
const server = require("../server.js");
const tambox = require("../it/devices/tambox.js");
const ssp = require("../it/ssp");
const os = require("../it/os");
const moment=require("moment");
const chalk = require('chalk');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const to_tbm_synch = require('./../it/tbm_sync/synchronize');
// var io = require('socket.io-client');
// var socket2 = io.connect('http://localhost:3000');
// socket2.on('connect', function () {
//   // socket connected
// });

const glo = require('./../it/globals');
function getAsDate(day, time) {
  var hours = Number(time.match(/^(\d+)/)[1]);
  var minutes = Number(time.match(/:(\d+)/)[1]);
  var xAMPM = time.match(/\s(.*)$/)[1];
  if (xAMPM == "pm" && hours < 12) hours = hours + 12;
  if (xAMPM == "am" && hours == 12) hours = hours - 12;
  var sHours = hours.toString();
  var sMinutes = minutes.toString();
  if (hours < 10) sHours = "0" + sHours;
  if (minutes < 10) sMinutes = "0" + sMinutes;
  time = sHours + ":" + sMinutes + ":00";
  var d = new Date(day);
  var n = d.toISOString().substring(0, 10);
  var newDate = new Date(n + "T" + time);
  return newDate;
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//new_manual_remesa= Math.floor((Math.random() * 10000) + 1);
//console.log(chalk.yellow("Nueva remesa manual iniciada"));
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/nueva_remesa/:tienda_id/:no_caja/:codigo_empleado/:no_remesa/:fechax1/:horax1', async (req, res) => {
  var {no_remesa,tienda_id,no_caja,codigo_empleado,no_remesa,fechax1,horax1} = req.params;
  console.log(chalk.yellow("iniciando NUEVA REMESA desde restfull api con numero:" + no_remesa));
  new_manual_remesa=no_remesa;
   var current_lock_value=await pool.query("SELECT is_locked FROM machine WHERE tienda_id=?", [tienda_id]);
   if(current_lock_value.length>0){
   console.log(current_lock_value[0].is_locked);
   is_locked=current_lock_value[0].is_locked;

  if(is_locked==false){
  if (on_startup == false) {
      if (tienda_id && no_caja && codigo_empleado && no_remesa) {
        const number_remesa = await pool.query("SELECT COUNT(no_remesa) AS noRemesa FROM remesas WHERE tipo='ingreso' and no_remesa=?", [no_remesa]);
        if (number_remesa[0].noRemesa > 0) {
        //Consulta si remesa ya existe con ese numero
        console.log('Remesa ya existente, no se puede usar este codigo de remesa nuevamente.'+no_remesa);
        res.json('Remesa ya existente, no se puede usar este codigo de remesa nuevamente.'+no_remesa);
        return;
      }else{
        global.manual_remesa=false;
        //  aqui creo la nueva remesa en la base de datos.
          os.crear_nueva_remesa(no_remesa,tienda_id,no_caja,codigo_empleado,tambox.fecha_actual(),tambox.hora_actual());
          await  os.validator_enabled_now();
          socketjs.nuevo_enlace('iniciar_nueva_remesa','../system/remesa/remesa_1.html');
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
            no_billetes: 0 //,
            // ts:tsx
          }
          res.json(nueva_res);
          return;
      }
      }else {
        res.json('Datos incompletos, revise documentacion');
        return;
      }
  } else {
    console.log(chalk.yellow("pero esta maquina necesita adopcion"));
    res.send('Estoy en Startup');
    return;
  }
}else {
  console.log(chalk.red("pero esta maquina esta bloqueada"));
  res.send('Machine locked');
  return;
}

}else {
  console.log(chalk.red("pero esa tienda no existe"));
  res.send('no existe esa tienda');
  return;
}
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/consultar_remesa/:no_remesa', async (req, res) => {
  // await ssp.ensureIsSet();
  console.log("Recibiendo consulta por restfull apis.");
  return new Promise(async function(resolve, reject) {
    try {
      if (on_startup === false) {
        //const {no_remesa}=req.params;
        const {
          no_remesa
        } = req.params;
        if (no_remesa) {
          const remesa = await pool.query("SELECT * FROM remesas WHERE tipo='ingreso' and no_remesa=?", [no_remesa]);
          res.json(remesa)
          return resolve();
        } else {
          res.json('Datos incompletos');
          return resolve();
        }
      } else {
        res.send('Estoy en Startup');
        return resolve();
      }
    } catch (e) {
      return reject(e);
    }
  });

});
router.get('/terminar_remesa/:no_remesa', async (req, res) => {
  console.log("si se esta llamando la api de terminar remesa");
  return new Promise(async function(resolve, reject) {
    if (on_startup === false) {
      const {no_remesa} = req.params;
      if (no_remesa) {
        try {
            await os.finalizar_nueva_remesa(no_remesa);
            var remesax = await pool.query('SELECT * FROM remesas WHERE no_remesa=?', [no_remesa]);
            res.json(remesax);
            return resolve();
        } catch (e) {
          return reject(chalk.cyan("ERROR 002- No se pudo sincronizar transaccion") + e);
        }
      } else {
        res.json('Datos incompletos');
        return reject('Datos incompletos');
      }
    } else {
      res.send('Estoy en Startup');
      return reject('Estoy en Startup');
    }
  });
});
router.get('/anular_remesa/:no_remesa', async (req, res) => {
  return new Promise(async function(resolve, reject) {
    try {
      await ssp.ensureIsSet()
      if (on_startup == false) {
        const {
          no_remesa
        } = req.params;
        if (no_remesa) {
          const {
            no_remesa
          } = req.params;
          const remesa = await pool.query("UPDATE remesas SET rms_status='anulada', status='anulada' WHERE tipo='ingreso' and no_remesa=?", [no_remesa]);
          const remesax = await pool.query('SELECT * FROM remesas WHERE no_remesa=?', [no_remesa]);
          socket.io.emit('refresh_window', "refresh_window");
          res.json(remesax);
          return resolve();
        } else {
          res.json('Datos incompletos');
          return reject();
        }
      } else {
        res.send('Estoy en Startup');
        return reject();
      }
    } catch (e) {
      return reject(e);
    }
  });
});
router.get('/is_startup', async (req, res) => {
  await ssp.ensureIsSet()
  ready_for_pooling = false;
  if (on_startup == false) {
    res.send('YA ESTOY LIBRE');
  } else {
    res.send('Estoy en Startup');
  }
  ready_for_pooling = true;
});
router.get('/test', async (req, res) => {
  socket.emit('interno', "mensaje por interno");
  res.send("fecha:" + tambox.fecha_actual() + " hora:" + tambox.hora_actual());
});
function actualizar_remesa_enTBM(remesax) {
  return new Promise(function(resolve, reject) {
    try {
      var tbm_adress = tbm_adressx;
      var fix = "/sync_remesa";
      var tienda_id = remesax[0].tienda_id;
      var no_caja = remesax[0].no_caja;
      var codigo_empleado = remesax[0].codigo_empleado;
      var no_remesax = remesax[0].no_remesa;
      var fecha = remesax[0].fecha;
      var hora = remesax[0].hora;
      var monto = remesax[0].monto;
      var moneda = remesax[0].moneda;
      var status = remesax[0].status;
      var rms_status = remesax[0].rms_status;
      var tipo = remesax[0].tipo;
      var status_hermes = remesax[0].status_hermes;
      var tebs_barcode1 = remesax[0].tebs_barcode;
      var machine_sn = remesax[0].machine_sn;
      var no_billetes1 = remesax[0].no_billetes;

      const url = tbm_adress + fix + "/" + tienda_id + "/" + no_caja + "/" + codigo_empleado + "/" + no_remesax + "/" + fecha + "/" + hora + "/" + monto + "/" + moneda + "/" + status + "/" + rms_status + "/" + tipo + "/" + status_hermes + "/" + tebs_barcode1 + "/" + machine_sn + "/" + no_billetes1
      console.log("url:" + url);
      /////////////////
      const Http = new XMLHttpRequest();
      //  const url= 'http://192.168.1.2:3000/sync_remesa/22222/001/0002/9999/15000/PEN/14444330/234765/ingreso/2019-05-09/17:22:10'
      Http.open("GET", url);
      Http.send();
      return resolve();
    } catch (e) {
      return reject(e);
    } finally {
      //  return;
    }
  });
};

// router.get('/nueva_remesa_old/:tienda_id/:no_caja/:codigo_empleado/:no_remesa/:fechax1/:horax1', async (req, res) => {
//   console.log(chalk.green("iniciando nueva remesa"));
//   var {no_remesa} = req.params;
//   console.log(chalk.yellow("iniciando NUEVA REMESA:" + no_remesa));
//   // si NO esta en startup:
//   if (on_startup == false) {
//     const number_remesa = await pool.query("SELECT COUNT(no_remesa) AS noRemesa FROM remesas WHERE tipo='ingreso' and no_remesa=?", [no_remesa]);
//     //console.log(number_remesa[0].noRemesa);
//     if (number_remesa[0].noRemesa > 0) {
//       res.json('Remesa ya existente, no se puede usar este codigo de remesa nuevamente.');
//     } else {
//       const {tienda_id,no_caja,codigo_empleado,no_remesa,fechax1,horax1} = req.params;
//       console.log(fechax1);
//       console.log(horax1);
//         var this_ts=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
//       //var tsx=await getAsDate(fechax1,horax1);
//       //console.log(tsx);
//       //console.log("ARREGLANDO TIMESTAMP CREATION:"+tsx);
//       if (tienda_id && no_caja && codigo_empleado && no_remesa) {
//         const nueva_res = {
//           tienda_id,
//           no_caja,
//           codigo_empleado,
//           no_remesa,
//           fecha: fechax1,
//           hora: horax1,
//           moneda: country_code,
//           tebs_barcode: tebs_barcode,
//           machine_sn: numero_de_serie,
//           tipo: 'ingreso',
//           no_billetes: 0, //,
//           ts_inicio:this_ts
//           // ts:tsx
//         }
//         await pool.query('INSERT INTO remesas set ?', [nueva_res]);
//         console.log("aqui ya inserte la remesa y estoy apunto en enviar comenzar_remesa" +JSON.stringify(nueva_res));
//         //io.io.emit('comenzar_remesa2',"INICIAR REMESA");
//         // io.io.emit('shoot', "INICIAR REMESA");
//         socket.emit('habilita_validador', "INICIAR REMESA");
//
//         console.log(chalk.green("finalizando nueva remesa"));
//         res.json(nueva_res);
//         return;
//         //return resolve();
//       } else {
//         res.json('Datos incompletos, revise documentacion');
//         return;
//         // return reject("datos incompletos en nueva remesa");
//       }
//     } // find de else
//   } else {
//     res.send('Estoy en Startup');
//     return;
//   }
// });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// router.get('/terminar_remesa_old/:no_remesa', async (req, res) => {
//   return new Promise(async function(resolve, reject) {
//     if (on_startup === false) {
//       const {no_remesa} = req.params;
//       if (no_remesa) {
//         var remesax, remesa;
//         new_manual_remesa=no_remesa;
//         try {
//         //  const {no_remesa} = req.params;
//           remesa = await pool.query("UPDATE remesas SET rms_status='finalizada' WHERE tipo='ingreso' and no_remesa=?", [no_remesa]);
//           remesax = await pool.query('SELECT * FROM remesas WHERE no_remesa=?', [no_remesa]);
//           io.to_tbm.emit('una_remesa_mas', "transaccion satisfactoria remesa");
//           //////////////////////////////////////////////////////////////////////////////
//           //////////////////////////////////////////////////////////////////////////////
//           //////////////////////////////////////////////////////////////////////////////
//           await actualizar_remesa_enTBM(remesax);
//           //////////////////////////////////////////////////////////////////////////////
//           //////////////////////////////////////////////////////////////////////////////
//           //////////////////////////////////////////////////////////////////////////////
//           ////////////////////////////actualizando la remesa hermes para que refleje el nuevo monto de remesa ingresado
//           //const no_billetes= await pool.query("SELECT SUM(no_billetes) AS total_billetes FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
//           const monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
//           const monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
//           // await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado'");
//           const no_billetes_total_remesas = await pool.query("SELECT SUM(no_billetes) AS total_no_billetes_remesas FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
//           const no_billetes_total_egresos = await pool.query("SELECT SUM(no_billetes) AS total_no_billetes_egresos FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
//           var no_billetes_en_remesa_hermes = no_billetes_total_remesas[0].total_no_billetes_remesas - no_billetes_total_egresos[0].total_no_billetes_egresos;
//           const monto_remesa_hermes = monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso;
//
//           console.log("actualizando el monto de remesa hermes:" + monto_remesa_hermes + " y numero de billetes es:" + no_billetes_en_remesa_hermes);
//           await pool.query("UPDATE remesa_hermes SET monto=?, no_billetes=? WHERE status='iniciada'", [monto_remesa_hermes, no_billetes_en_remesa_hermes]);
//
//           var nueva_res_hermes = await pool.query("SELECT * FROM remesa_hermes WHERE status='iniciada'");
//
//
//           console.log("voy a actualizar rh con estos datos:" + nueva_res_hermes);
//           await ssp.sincroniza_remesa_hermes2(nueva_res_hermes);
//           res.json(remesax);
//           return resolve();
//
//
//         } catch (e) {
//           return reject(chalk.cyan("ERROR 002- No se pudo sincronizar transaccion") + e);
//         } finally {
//           //  return;
//         }
//       } else {
//         res.json('Datos incompletos');
//         return reject('Datos incompletos');
//       }
//     } else {
//       res.send('Estoy en Startup');
//       return reject('Estoy en Startup');
//     }
//   });
// });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
module.exports = router;
