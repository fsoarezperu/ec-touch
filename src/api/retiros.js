const express= require('express');
const router = express.Router();
const pool= require ('../database');
const io = require("../server.js");
const tambox = require("../it/devices/tambox.js");
const chalk=require('chalk');
const ssp = require("../it/ssp");
const sh = require('./../it/devices/smart_hopper');
const enc = require('./../it/encryption');
const glo = require('./../it/globals');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
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
///////////////////////////////////////////////////////////////
router.get('/nuevo_retiro/:tienda_id/:no_caja/:codigo_empleado/:no_remesa/:monto/:fecha/:hora', async (req,res)=>{
  new Promise(async function(resolve, reject) {
    try {
      await ssp.ensureIsSet()
      if(on_startup===false){
        var machine_serial_number=numero_de_serie;
        var {no_remesa}=req.params;
         const number_remesa= await pool.query("SELECT COUNT(no_remesa) AS noRemesa FROM remesas WHERE no_remesa=?",[no_remesa]);
         if(number_remesa[0].noRemesa>0){
             res.json('Remesa ya existente, no se puede usar este codigo de remesa nuevamente.');
             return reject();
         }else{
        const {tienda_id,no_caja,codigo_empleado,no_remesa,monto,fecha,hora}=req.params;
        if(monto>200){
          console.log("el limite maximo es de 200 soles por transaccion");
          res.json('retiro_limite');
          return reject();
        }
      if(tienda_id&&no_caja&&codigo_empleado&&no_remesa&&monto){
        const nuevo_egreso={tienda_id,no_caja,codigo_empleado,no_remesa,monto,moneda:country_code,tebs_barcode:tebs_barcode,machine_sn:numero_de_serie,tipo:'egreso',fecha,hora,status:'recibido',no_billetes:0}
        await pool.query('INSERT INTO remesas set ?', [nuevo_egreso]);
      //  io.io.emit('aviso_de_pago',nuevo_egreso.no_remesa);
        io.io.emit('refresh_window',nuevo_egreso.no_remesa);
        res.json(nuevo_egreso);
        return resolve();
       }else {
         res.json('Datos incompletos para retiro');
         return reject();
        }
        }
      }else{
        res.send('Estoy en Startup');
        return  reject();
      }
    } catch (e) {
      return reject(e);
    } finally {

    }
  });
      //  ready_for_pooling=false;
});
////////////////////////////////////////////////////////////////////////////////////
router.get('/consultar_retiro/:no_remesa',async (req,res)=>{
  var retiro,posible_monto;
   new Promise(async function(resolve, reject) {
      const {no_remesa}=req.params;
      console.log("consultando retiro:"+no_remesa);
      try {
        await ssp.ensureIsSet()
        if(on_startup==false){
          retiro= await pool.query ("SELECT * FROM remesas WHERE no_remesa=? AND tipo='egreso'",[no_remesa]);
          console.log("retiro:"+retiro[0].monto);
            posible_monto=retiro[0].monto;
          if( retiro.length !== 0){ //si hay un retiro con ese numero de esa remesa verifica que el monto no sobrepase el limite.
                  console.log("//////////////////////////////////");
                  console.log(chalk.cyan("se puede pagar?: S/."+posible_monto));
                  if(posible_monto>200){
                    console.log("el limite maximo es de 200 soles por transaccion");
                    res.json('retiro_limite');
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

                   try {
                      var data= await ssp.transmite_encriptado_y_procesa(global.receptor,arry)
                   } catch (e) {
                     return reject(e)
                   }
                    //console.log("AQUI VOLI:"+data);

                      console.log(chalk.yellow("<-:"+data));
                      var solucion=handlepayoutvalue(data);
                      server.logea("solucion is:"+solucion);
                    if(solucion=="ok"){
                        await pool.query ("UPDATE remesas SET status='procede' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
                      }
                      if(solucion=="no_monto_exacto"){
                        console.log("No_monto_exacto");
                         await pool.query ("UPDATE remesas SET status='no_monto_exacto' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
                         res.json('No_monto_exacto');
                         return reject("No_monto_exacto");
                      }
                      if(solucion=="saldo_insuficiente"){
                        console.log("Saldo_insuficiente");
                         await pool.query ("UPDATE remesas SET status='saldo_insuficiente' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
                         res.json('Saldo_insuficiente');
                         return reject("Saldo_insuficientex");
                      }
                      if(solucion=="ocupado"){
                        console.log("Ocupado");
                         await pool.query ("UPDATE remesas SET status='ocupado' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
                         res.json('Ocupado');
                         return reject("Ocupado");
                      }
                      if(solucion=="desabilitado"){
                          console.log("Deshabilitado");
                         await pool.query ("UPDATE remesas SET status='desabilitado' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
                         res.json('Deshabilitado');
                         return reject("Deshabilitado");
                      }

                    console.log("/////////////////////////////////");
                    const retiro= await pool.query ('SELECT * FROM remesas WHERE no_remesa=? AND tipo="egreso"',[no_remesa]);
                   if(retiro){
                     res.json(retiro);
                     return resolve()
                   }else {
                     return reject("no se encontro este retiro");
                   }

          }else{
            res.json('Pago Inexistente'); //funcionA.
            return reject('Pago Inexistente');
          }
        }else{
          res.send('Estoy en Startup');
          return reject('Pago Inexistente');
        }
      } catch (e) {
        console.log(e);
      } finally {
        return
      }
    });

});
////////////////////////////////////////////////////////////////////////////////////
router.get('/ejecutar_retiro/:no_remesa',async(req,res)=>{
  new Promise(async function(resolve, reject) {
    try {
      await ssp.ensureIsSet()
      if(on_startup==false){
        const {no_remesa}=req.params;
        const valid_payment= await pool.query("SELECT * FROM remesas WHERE no_remesa=? and tipo='egreso' and status='completado'" ,[no_remesa]);
        if(valid_payment.length>0){
          res.json(valid_payment);
          return resolve();
        }else{

        //////////////////////////////////
        //consulta monto del retiro con codigo tal y estatus aprobado
        // const monto= await pool.query("SELECT * FROM remesas WHERE no_remesa=? and (tipo='egreso' and status<>'completado' and rms_status='pendiente')" ,[no_remesa]);
        const retiro= await pool.query ("SELECT * FROM remesas WHERE status='en_proceso' AND no_remesa=?",[no_remesa]);

        if(retiro.length>0){
      const retirox= await pool.query ('SELECT * FROM remesas WHERE no_remesa=?',[no_remesa]);
      io.io.emit('retiro_en_proceso'," pago en proceso");
      res.json(retirox);
      return resolve();
          }else{
    //consultar el pago que esta como "procede" y ejecutar pago.
    const monto= await pool.query("SELECT * FROM remesas WHERE no_remesa=? and (tipo='egreso' and status='procede' and rms_status='pendiente')" ,[no_remesa]);
    if(monto.length>0){
    console.log("/////////////PAY OUT SENT////////////////////");
    console.log(chalk.green("Monto a pagar:"+monto[0].monto));
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
    //console.log(arry);
    //var value=tambox.prepare_Encryption(arry);
    await ssp.ensureIsSet()
    var data =await ssp.transmite_encriptado_y_procesa(global.receptor,arry);
    const retiro= await pool.query ("UPDATE remesas SET status='en_proceso' WHERE no_remesa=?",[no_remesa]);
    const retirox= await pool.query ('SELECT * FROM remesas WHERE no_remesa=?',[no_remesa]);
    io.io.emit('retiro_en_proceso'," pago en proceso");
    res.json(retirox);
    return resolve();
    //////////////////////////////////
    }else{
      res.json("no se encontro un record valido");
      console.log("no se encontro un record valido");
      return reject("no se encontro un record valido")
    }

    }
    //////////////////////////////////
     }
    //////////////////////////////////
      }else{
        res.send('Estoy en Startup');
      }
    } catch (e) {
      return reject(e);
    } finally {

    }
  });



});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/terminar_retiro/:no_remesa',async(req,res)=>{
  new Promise(async function(resolve, reject) {
    try {
      await ssp.ensureIsSet()
      if(on_startup==false){
        const {no_remesa}=req.params;
          if(no_remesa){
                const {no_remesa}=req.params;
                const remesa= await pool.query ("UPDATE remesas SET rms_status='finalizada' WHERE tipo='egreso' and no_remesa=?",[no_remesa]);
                const remesax= await pool.query ('SELECT * FROM remesas WHERE no_remesa=?',[no_remesa]);
                  io.to_tbm.emit('un_pago_mas',"transaccion satisfactoria retiro");
                  /////////////////////////////////////////////////////////////////////
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
                  var tebs_barcode=remesax[0].tebs_barcode;
                  var machine_sn=remesax[0].machine_sn;
                  var no_billetes=remesax[0].no_billetes;

                  const url= tbm_adress+fix+"/"+tienda_id+"/"+no_caja+"/"+codigo_empleado+"/"+no_remesax+"/"+fecha+"/"+hora+"/"+monto+"/"+moneda+"/"+status+"/"+rms_status+"/"+tipo+"/"+status_hermes+"/"+tebs_barcode+"/"+machine_sn+"/"+no_billetes
                  console.log("url:"+url);
                  /////////////////
                  const Http= new XMLHttpRequest();
                //  const url= 'http://192.168.1.12:4000/sync_remesa/22222/001/0002/9999/15000/PEN/14444330/234765/ingreso/2019-05-09/17:22:10'
                  Http.open("GET",url);
                  Http.send();
                  ////////////////////////////
                  const monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
                  const monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");

                  const no_billetes_total_remesas = await pool.query("SELECT SUM(no_billetes) AS total_no_billetes_remesas FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
                  const no_billetes_total_egresos = await pool.query("SELECT SUM(monto) AS total_no_billetes_egresos FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
                  var no_billetes_en_remesa_hermes=no_billetes_total_remesas[0].total_no_billetes_remesas - no_billetes_total_egresos[0].total_no_billetes_egresos;
                  // await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado'");
                  const monto_remesa_hermes=monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso;
                  console.log("actualizando el monto de remesa hermes:"+monto_remesa_hermes);
                  await pool.query("UPDATE remesa_hermes SET monto=?, no_billetes=? WHERE status='iniciada'",[monto_remesa_hermes,no_billetes_en_remesa_hermes]);
                  /////////////////////////////////////////////////////////////////////
                res.json(remesax);
                return resolve();
          }else {
            res.json('Datos incompletos');
          }
        //  res.send('finalizando remesa');
      }else{
        res.send('Estoy en Startup');
      }
    } catch (e) {
      return reject(e);
    } finally {

    }
  });
});
////////////////////////////////////////////////////
////////////////////////////////////////////////////
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
        return "ok";
      }
        if(poll_responde[1] == "F5"){
        console.log(chalk.green("Command can not be processed"));
        //return ("Command can not be processed");

        if(poll_responde[2] == "01"){
          console.log(chalk.green("Not enough value in device"));
          return "saldo_insuficiente";
        }
        if(poll_responde[2] == "02"){
          console.log(chalk.green("Cannot pay exact amount"));
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
    // } catch (e) {
    //   reject(e);
    // } finally {
    //   return;
    // }
  //});

}

module.exports= router;
