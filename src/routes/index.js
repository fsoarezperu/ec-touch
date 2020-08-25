const express = require('express');
const router = express.Router();
const pool = require('../database');
const io = require("../server.js");
const tambox = require("../it/devices/tambox.js");
const va = require("../it/devices/validator");

const chalk = require('chalk');
const glo = require('./../it/globals');
const ssp = require('./../it/ssp');
const enc = require('./../it/encryption');
const rem = require('./../api/remesas');

var no_remesa_actual;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
///////////////////////////////////////////////////////////////////////////////
router.get('/', async (req, res) => {
  const remesa_en_proceso = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso'");
  if (remesa_en_proceso.length > 0) {
    console.log("remesa_en_proceso:" + remesa_en_proceso[0]);
    res.render('iniciar_remesa', {
      remesa: remesa_en_proceso[0]
    });
  } else {
    //const remesa = await pool.query("SELECT * FROM remesas WHERE status='iniciada' AND tipo='ingreso'");
    var manipulada=await pool.query("SELECT * FROM remesas WHERE status='iniciada' AND tipo='ingreso'");
    manipulada=JSON.stringify(manipulada);
  //  console.log("REMESAx:" +manipulada.length );
    if (manipulada.length > 2) {
      console.log("REMESAy:" +manipulada );
      res.render('index', {
        remesa: manipulada[0]
      });
    } else {
      const retiro = await pool.query("SELECT * FROM remesas WHERE status='iniciada' AND tipo='egreso'");
      if (retiro.length > 0) {
        console.log("RETIRO" + retiro[0]);
        res.render('index', {
          retiro: retiro[0]
        });
      } else {
        console.log(chalk.red("loading website"));
        console.log(glo.my_resgistered_machine_name);
        res.render('index',{my_resgistered_machine_name:glo.my_resgistered_machine_name});
      }

    }
  }

})
///////////////////////////////////////////////////////////////////////////////
router.get('/no_cabezal', (req, res) => {
  res.render('no_cabezal');
})
///////////////////////////////////////////////////////////////////////////////
function actualizar_remesa_enTBM(remesax){
  return new Promise(function(resolve, reject) {
try {
  var tbm_adress=tbm_adressx;
  var fix= "/sync_remesa";
  var tienda_id=remesax[0].tienda_id;
  var no_caja=remesax[0].no_caja;
  var codigo_empleado=remesax[0].codigo_empleado;
  var no_remesax=remesax[0].no_remesa;
  var fecha=remesax[0].fecha;
  var hora=remesax[0].hora;
  var monto=remesax[0].monto;
  var moneda=remesax[0].moneda;
  var status=remesax[0].status;
  var rms_status=remesax[0].rms_status;
  var tipo=remesax[0].tipo;
  var status_hermes=remesax[0].status_hermes;
  var tebs_barcode1=remesax[0].tebs_barcode;
  var machine_sn=remesax[0].machine_sn;
  var no_billetes1=remesax[0].no_billetes;

  const url= tbm_adress+fix+"/"+tienda_id+"/"+no_caja+"/"+codigo_empleado+"/"+no_remesax+"/"+fecha+"/"+hora+"/"+monto+"/"+moneda+"/"+status+"/"+rms_status+"/"+tipo+"/"+status_hermes+"/"+tebs_barcode1+"/"+machine_sn+"/"+no_billetes1
  console.log("url:"+url);
  /////////////////
  const Http= new XMLHttpRequest();
//  const url= 'http://192.168.1.2:3000/sync_remesa/22222/001/0002/9999/15000/PEN/14444330/234765/ingreso/2019-05-09/17:22:10'
  Http.open("GET",url);
  Http.send();
  return resolve();
} catch (e) {
  return reject(e);
} finally {
  //return;
}
  });
};

module.exports.actualizar_remesa_enTBM=actualizar_remesa_enTBM;
///////////////////////////////////////////////////////////////////////////////
/////////////////////////// REMESAS ///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
router.get('/iniciar_remesa', (req, res) => {
  res.render('remesas/iniciar_remesa');
})
///////////////////////////////////////////////////////////////////////////////
router.get('/finish/:qty_bill', async (req, res) => {
  //la linea de abajo debe solo de aplicar para las REMESAS (ingresos)
  //console.log(chalk.cyan("SOMETHING IS TRIGGERING FINISH WHAT IS IT?"));
  new Promise(async function(resolve, reject) {
    var remesay;
    var id_remesa;
    try {
         console.log("Detectando remesa a finalizar");
         remesay = await pool.query("SELECT * FROM remesas WHERE tipo='ingreso' and status='iniciada' OR  tipo='ingreso' and status='en_proceso'");
        if (remesay === undefined || remesay.length == 0) {
            console.log("no remesa en status iniciada");
            res.render('index');
            return reject("no remesa en status iniciada")
        } else {
          id_remesa = remesay[0].no_remesa;
          console.log(chalk.cyan("el valor a utilizar como id_remesa:" + id_remesa));
          const calculando_monto = await pool.query("SELECT SUM(monto) AS monto_acumulado_creditos_en_proceso FROM creditos WHERE no_remesa=? AND status='processing'", [id_remesa]);
          var monto_total_remesa_en_proceso = calculando_monto[0].monto_acumulado_creditos_en_proceso;
          // if(monto_total_remesa_en_proceso===NULL){
          //   monto_total_remesa_en_proceso=0;
          // }
          const no_billetes_credito = await pool.query("SELECT COUNT(id) AS cantidad_billetes FROM creditos WHERE no_remesa=? AND status='processing'", [id_remesa]);
          var no_billetes_en_remesa=no_billetes_credito[0].cantidad_billetes;
          console.log("se encontraron billetes:"+no_billetes_en_remesa);
        //  console.log(chalk.cyan("se va a guardar con el monto:" + monto_total_remesa_en_proceso));
          //actualizar la tabla remesas, incluyendo el monto calculado total y cambiar estatus a "terminado"
          await pool.query("UPDATE remesas SET monto=?,no_billetes=?,status='terminado' WHERE no_remesa=?", [monto_total_remesa_en_proceso,no_billetes_en_remesa, id_remesa]);
          //actualizar todas las filas de creditos donde tengan el numero cambiando "processing" por "procesed"
          await pool.query("UPDATE creditos SET status='processed' WHERE no_remesa=?", [id_remesa]);
          ////////////////////////////actualizando la remesa hermes para que refleje el nuevo monto de remesa ingresado
          const no_billetes_totales= await pool.query("SELECT SUM(no_billetes) AS total_billetes FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
          const monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
          const monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
          const monto_remesa_hermes=monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso;
          console.log("actualizando el monto de remesa hermes:"+monto_remesa_hermes + "y numero de billetes es:"+no_billetes_totales[0].total_billetes);
          await pool.query("UPDATE remesa_hermes SET monto=?, no_billetes=? WHERE status='iniciada'",[monto_remesa_hermes,no_billetes_totales[0].total_billetes]);
          /////////////////////////////////////////////////////////////////////////////////////////
          /////////////////////////////////////////////////////////////////////////////////////////
          /////////////////////////////////////////////////////////////////////////////////////////
          await actualizar_remesa_enTBM(remesay);
        //   console.log("Sincronizando remesa");
        //   var tbm_adress=tbm_adressx;
        //   var fix= "/sync_remesa";
        //   var tienda_id=remesay[0].tienda_id;
        //   var no_caja=remesay[0].no_caja;
        //   var codigo_empleado=remesay[0].codigo_empleado;
        //   var no_remesax=remesay[0].no_remesa;
        //   var fecha=remesay[0].fecha;
        //   var hora=remesay[0].hora;
        //   var monto=remesay[0].monto;
        //   var moneda=remesay[0].moneda;
        //   var status=remesay[0].status;
        //   var rms_status=remesay[0].rms_status;
        //   var tipo=remesay[0].tipo;
        //   var status_hermes=remesay[0].status_hermes;
        //   var tebs_barcode=remesay[0].tebs_barcode;
        //   var machine_sn=remesay[0].machine_sn;
        //   var no_billetes=remesay[0].no_billetes;
        //   const url= tbm_adress+fix+"/"+tienda_id+"/"+no_caja+"/"+codigo_empleado+"/"+no_remesax+"/"+fecha+"/"+hora+"/"+monto+"/"+moneda+"/"+status+"/"+rms_status+"/"+tipo+"/"+status_hermes+"/"+tebs_barcode+"/"+machine_sn+"/"+no_billetes
        //   console.log("url:"+url);
        //   /////////////////
        //   const Http= new XMLHttpRequest();
        // //  const url= 'http://192.168.1.12:4000/sync_remesa/22222/001/0002/9999/15000/PEN/14444330/234765/ingreso/2019-05-09/17:22:10'
        //   Http.open("GET",url);
        //   Http.send();
          /////////////////////////////////////////////////////////////////////////////////////////
          /////////////////////////////////////////////////////////////////////////////////////////
          /////////////////////////////////////////////////////////////////////////////////////////
          console.log("Aqui debo de sincronizar la remesa hermes tambien.");
          /////////////////////////////////////////////////////////////////////////////////////////
          /////////////////////////////////////////////////////////////////////////////////////////
          /////////////////////////////////////////////////////////////////////////////////////////
          console.log("obteniendo numeros finales");
          //aqui consulta la cantidad de billetes guardados en la base de datos en esa remesa
          var {qty_bill}=req.params;
          console.log("voy a consultar para popular finish con el id:" + id_remesa);
          const remesax = await pool.query("SELECT * FROM remesas WHERE status='terminado' and no_remesa=?", [id_remesa]);
          var calculos={
            remesa: remesax[0],
            qty:no_billetes_en_remesa,
            qty2:qty_bill,
            moneda:country_code
          }
          console.log("por imprimir calculos...");
          return resolve(res.render('remesas/remesa_completada', {calculos}));
          //res.render('remesas/remesa_completada');
       }

     }
     catch (e) {
         return reject(e);
        }
     finally {
          //return;
             }
  });

});
///////////////////////////////////////////////////////////////////////////////
router.get('/cancelling', (req, res) => {
  res.redirect('/');
})
///////////////////////////////////////////////////////////////////////////////
//////////////////////////// RETIRO ///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
router.get('/retiro_en_proceso', (req, res) => {
  res.render('retiros/retiro_en_proceso');
})
///////////////////////////////////////////////////////////////////////////////
////////////////////////// CONFIGURACION //////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
router.get('/configuracion', (req, res) => {
  res.render('configuracion/configuracion');
})
///////////////////////////////////////////////////////////////////////////////
//////////////////////////////REMESA HERMES///////////////////////////////////7
///////////////////////////////////////////////////////////////////////////////
router.get('/remesa_hermes', async (req, res) => {
  res.render('configuracion/remesa_hermes/remesa_hermes');
})
///////////////////////////////////////////////////////////////////////////////
router.get('/vaciando', (req, res) => {
  res.render('configuracion/remesa_hermes/vaciando');
})
///////////////////////////////////////////////////////////////////////////////
router.get('/smart_empty', async (req, res) => {
  const monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
  const monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
  // await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado'");
  const monto_remesa_hermes=monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso;
      // const remesa_hermes = {
      //   monto: monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso,
      //   moneda:country_code,
      //   tebs_barcode: tebs_barcode,
      //   machine_sn: numero_de_serie
      // }
      // await pool.query('INSERT INTO remesa_hermes set ?', [remesa_hermes]);
      console.log(chalk.yellow("actualizando monto de RH:")+chalk.red(monto_remesa_hermes));
  await pool.query("UPDATE remesa_hermes SET monto=?, fecha_fin=?, hora_fin=? WHERE status='iniciada'",[monto_remesa_hermes,tambox.fecha_actual(),tambox.hora_actual()]);
  //await pool.query("UPDATE remesas SET status_hermes='entregada' WHERE status_hermes='en_tambox'");
      const bolsa = {
        monto: monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso,
        tebs_barcode: current_tebs_barcode,
        machine_sn: numero_de_serie,
        fecha_inicial:  tambox.fecha_actual(),
        fecha_final: tambox.fecha_actual(),
        dias_acumulados: '7'
      }
    //finaliza la remesa de la bolsa que se fue!
    await pool.query("UPDATE remesa_hermes SET status='finalizada' WHERE status='iniciada'");
  res.render('configuracion/remesa_hermes/smart_empty', {bolsa});
})
///////////////////////////////////////////////////////////////////////////////
router.get('/cashbox_unlocked', async (req, res) => {
  res.render('configuracion/remesa_hermes/cashbox_unlocked');
})
///////////////////////////////////////////////////////////////////////////////
router.get('/fin_remesa_hermes', async (req, res) => {
 // GET THE NEW tebs_barcode
try {
  tebs_barcodex="";
  console.log("GETTING NEW TEBSBARCODE");
  //var data=ssp.transmite_encriptado_y_procesa(global.receptor,get_tebs_barcode)

  var data=await ssp.transmite_encriptado_y_procesa(validator_address,get_tebs_barcode);
  if (data.length>0) {
    await va.handleGetTebsBarcode(data);
    console.log('new tebsbarcode read:'+tebs_barcodex);
  }else {
    console.log("Error en la lectura del tebsbarcode.");
  }
  const new_remesa_hermes = {
    monto:0,
    moneda:country_code,
    fecha:tambox.fecha_actual(),
    hora:tambox.hora_actual(),
    tebs_barcode: tebs_barcodex,
    machine_sn: numero_de_serie,
    no_billetes:0
  }
  await pool.query('INSERT INTO remesa_hermes set ?', [new_remesa_hermes]);
  ///////////////////////////////
 const remesax= await pool.query ("SELECT * FROM remesa_hermes WHERE status='iniciada'");
 await pool.query("UPDATE remesas SET status_hermes='entregada' WHERE status_hermes='en_tambox'");
 var tbm_adress=tbm_adressx;
 var fix= "/sync_remesa_hermes";
 var monto=remesax[0].monto;
 var tienda_id=remesax[0].tienda_id;
 var moneda=remesax[0].moneda;
 var status=remesax[0].status;
 var tebs_barcodexx=remesax[0].tebs_barcode;
 var machine_sn=remesax[0].machine_sn;
 var fecha=tambox.fecha_actual();
 var hora=tambox.hora_actual();
 const url= tbm_adress+fix+"/"+tienda_id+"/"+monto+"/"+moneda+"/"+status+"/"+tebs_barcodexx+"/"+machine_sn+"/"+fecha+"/"+hora;
 console.log("url:"+url);
 ///////////////////
 const Http= new XMLHttpRequest();
 Http.open("GET",url);
 Http.send();
} catch (e) {
  console.log(e);
} finally {

}
//////////////////////////////
///////////////////////////////////
res.render('configuracion/remesa_hermes/fin_remesa_hermes');
});
///////////////////////////////////////////////////////////////////////////////
//////////////////////////CAUDRE DIARIO ///////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
router.get('/cuadre_diario', async (req, res) => {
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
    moneda:country_code

  }
  res.render('configuracion/cuadre_diario/cuadre_diario', {
    totales
  });

})
///////////////////////////////////////////////////////////////////////////////
router.get('/soporte', async (req, res) => {

  const no_remesas_pend = await pool.query("SELECT COUNT(no_remesa) AS noRemesa FROM remesas WHERE (tipo='ingreso' and status='terminado' and rms_status='pendiente' and status_hermes='en_tambox')");
  const monto_total_remesas_pend = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE (tipo='ingreso'and status='terminado'and rms_status='pendiente' and status_hermes='en_tambox')");

  const no_egresos_pend = await pool.query("SELECT COUNT(no_remesa) AS noEgreso FROM remesas WHERE (tipo='egreso' and status='completado' and rms_status='pendiente' and status_hermes='en_tambox')");
  const monto_total_egresos_pend = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  (tipo='egreso' and status='completado' and rms_status='pendiente' and status_hermes='en_tambox')");

  var totales = {
    no_remesas_pend: no_remesas_pend[0].noRemesa,
    monto_total_remesas_pend: monto_total_remesas_pend[0].totalremesax,
    no_egresos_pend: no_egresos_pend[0].noEgreso,
    monto_total_egresos_pend: monto_total_egresos_pend[0].totalEgreso,
  }
  res.render('configuracion/cuadre_diario/soporte', {
    totales
  });
})
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////INFO ///////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
router.get('/info', (req, res) => {
  const tebs=tebs_barcode;
  const release=release_version;
  const given_ip=machine_ip;
  const given_port=machine_port;
  const developer=machine_developer;
  const support= machine_support;
  const machine_sn=numero_de_serie;
res.render('configuracion/informacion_general/info',{tebs,release,given_ip,given_port,developer,support,machine_sn});
})
///////////////////////////////////////////////////////////////////////////////
////////////////////////////// CIFRAS GENERALES ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////
router.get('/montos',async (req, res) => {

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

  var data=await ssp.transmite_encriptado_y_procesa(global.receptor, get_all_levels)
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
        res.render('configuracion/cifras_generales/montos', {
          totbills,
          totaccum,
          monto_en_bolsa,
          total_general,
          moneda:country_code
        });
})
///////////////////////////////////////////////////////////////////////////////
router.get('/test', async (req, res) => {
//  console.log("probando");
 //res.send ("ok1");
  res.render('test');
})
///////////////////////////////////////////////////////////////////////////////
router.get('/deposito', async (req, res) => {
  console.log("deposito");
  res.render('depositox');
})
///////////////////////////////////////////////////////////////////////////////
router.get('/cerrar_remesa_hermes', async (req, res) => {
  console.log("cerrar_remesa_hermes");
  await pool.query("UPDATE remesa_hermes SET status='terminada' WHERE status='iniciada'");
  await pool.query("UPDATE remesas SET status_hermes='entregada' WHERE status_hermes='en_tambox'");
  console.log("Disparando provisiona remesa");
  io.provisiona_remesa2()
  res.redirect('/');
})
///////////////////////////////////////////////////////////////////////////////

router.get('/monedero', async (req, res) => {
//  console.log("probando");
 //res.send ("ok1");
  res.render('hopper/monedero');
})
///////////////////////////////////////////////////////////////////////////////
router.get('/registradora', async (req, res) => {
//  console.log("probando");
 //res.send ("ok1");
  res.render('registradora');
})
///////////////////////////////////////////////////////////////////////////////
router.get('/niveles_hopper', async (req, res) => {
//  console.log("probando");
 //res.send ("ok1");
  res.render('hopper/niveles_hopper');
})
///////////////////////////////////////////////////////////////////////////////
module.exports = router;
