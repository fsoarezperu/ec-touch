const express= require('express');
const router = express.Router();
const pool= require ('../database');
const io = require("../server.js");
const tambox = require("../it/devices/tambox.js");
const chalk=require('chalk');
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
    ready_for_pooling=false;
    tambox.ensureIsSet().then(async function(){ //esto es el promise
      //  ready_for_pooling=false;
      if(on_startup==false){
      //  var tebsbarcode=tambox.mytebsbarcode;
        var machine_serial_number=tambox.machine_sn;

        var {no_remesa}=req.params;
         const number_remesa= await pool.query("SELECT COUNT(no_remesa) AS noRemesa FROM remesas WHERE no_remesa=?",[no_remesa]);
        // console.log(number_remesa[0].noRemesa);
         if(number_remesa[0].noRemesa>0){
             res.json('Remesa ya existente, no se puede usar este codigo de remesa nuevamente.');
         }else{
        const {tienda_id,no_caja,codigo_empleado,no_remesa,monto,fecha,hora}=req.params;
        if(monto>200){
          console.log("el limite maximo es de 200 soles por transaccion");
          res.json('retiro_limite');
          return;
        }
      if(tienda_id&&no_caja&&codigo_empleado&&no_remesa&&monto){
        const nuevo_egreso={tienda_id,no_caja,codigo_empleado,no_remesa,monto,moneda:country_code,tebs_barcode:tebs_barcode,machine_sn:numero_de_serie,tipo:'egreso',fecha,hora,status:'recibido'}
        await pool.query('INSERT INTO remesas set ?', [nuevo_egreso]);
      //  io.io.emit('aviso_de_pago',nuevo_egreso.no_remesa);
        io.io.emit('refresh_window',nuevo_egreso.no_remesa);

        res.json(nuevo_egreso);
       }else {
         res.json('Datos incompletos para retiro');
        }

        }
      }else{
        res.send('Estoy en Startup');
      }
      });//fin del promise

});
////////////////////////////////////////////////////////////////////////////////////
router.get('/consultar_retiro/:no_remesa',async (req,res)=>{
  ready_for_pooling=false;
tambox.ensureIsSet().then(async function(){ //esto es el promise

  //console.log(" ");
  if(ready_for_sending){
  //  console.log("se supone que esta diponible el canal");
  //  console.log("ready for sending is:"+ready_for_sending);
  //  ready_for_pooling=false;

  if(on_startup==false){
      const {no_remesa}=req.params;
    const retiro= await pool.query ("SELECT * FROM remesas WHERE no_remesa=? AND tipo='egreso'",[no_remesa]);
    //console.log(retiro[0].monto);
    if( retiro.length !== 0){ //si hay un retiro con ese numero de esa remesa verifica que el monto no sobrepase el limite.
      var posible_monto=retiro[0].monto;
      console.log("//////////////////////////////////");
      console.log(chalk.cyan("se puede pagar?:S/."+posible_monto));
      if(posible_monto>200){
        console.log("el limite maximo es de 200 soles por transaccion");
        res.json('retiro_limite');
        return;
      }//si el monto es mayor al limite termina la ejecucion

      //convertir el monto a hex invertido
      posible_monto= posible_monto*100;
      //console.log(posible_monto);
      posible_monto=ConvertBase.dec2hex(posible_monto).toUpperCase();
      //console.log(posible_monto);
      posible_monto=tambox.pady(posible_monto,8);
      //console.log(posible_monto);
      posible_monto=tambox.changeEndianness(posible_monto);
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
      //console.log(arry);
      var value=tambox.prepare_Encryption(arry);
      tambox.envio_redundante(value)
      .then(async data => {
        console.log(chalk.yellow("<-:"+data));
        //tambox.handlepayoutvalue(data);
        var solucion= tambox.handlepayoutvalue(data);
        //console.log("esto es:"+solucion);
        if(solucion=="ok"){
        //  console.log("el pedido es pagable");
            await pool.query ("UPDATE remesas SET status='procede' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
            //UPDATE remesas SET status='procede' WHERE no_remesa='96' AND status<>'completado'

        //    return;
          }
          if(solucion=="no_monto_exacto"){
            console.log("No_monto_exacto");
             await pool.query ("UPDATE remesas SET status='no_monto_exacto' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
          //   return;
          }
          if(solucion=="saldo_insuficiente"){
            console.log("Saldo_insuficiente");
             await pool.query ("UPDATE remesas SET status='saldo_insuficiente' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
          //   return;
          }
          if(solucion=="ocupado"){
            console.log("Ocupado");
             await pool.query ("UPDATE remesas SET status='ocupado' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
        //     return;
          }
          if(solucion=="desabilitado"){
              console.log("Deshabilitado");
             await pool.query ("UPDATE remesas SET status='desabilitado' WHERE no_remesa=? AND status<>'completado'",[no_remesa]);
          //   return;
          }
        console.log("/////////////////////////////////");
        const retiro= await pool.query ('SELECT * FROM remesas WHERE no_remesa=? AND tipo="egreso"',[no_remesa]);
      //  console.log("retiro es:"+retiro);
       if(retiro){
         res.json(retiro);
       }

       return;
        })
        .catch(error => console.log(error))


    }else{
      res.json('Pago Inexistente'); //funcionA.
    }
  }else{
    res.send('Estoy en Startup');
  }

  }else{
    res.send('aqui hubo colision');
  }
});//fin del promise

});
////////////////////////////////////////////////////////////////////////////////////
router.get('/ejecutar_retiro/:no_remesa',async(req,res)=>{
  // tambox.ensureIsSet().then(async function(){
  //   console.log("ready for sending  is:",ready_for_sending);
  //    ready_for_pooling=false;
  if(on_startup==false){
    const {no_remesa}=req.params;
  //  console.log("hasta aqui la no_remesa:"+no_remesa);
//////////////////////////////////
//verificar duplicidad
 const valid_payment= await pool.query("SELECT * FROM remesas WHERE no_remesa=? and tipo='egreso' and status='completado'" ,[no_remesa]);
// if(valid_payment.length>0){res.json("retiro_completado");return;}else{
   if(valid_payment.length>0){res.json(valid_payment);return;}else{

//////////////////////////////////
//consulta monto del retiro con codigo tal y estatus aprobado
// const monto= await pool.query("SELECT * FROM remesas WHERE no_remesa=? and (tipo='egreso' and status<>'completado' and rms_status='pendiente')" ,[no_remesa]);

const retiro= await pool.query ("SELECT * FROM remesas WHERE status='en_proceso' AND no_remesa=?",[no_remesa]);
//=>
if(retiro.length>0){
  const retirox= await pool.query ('SELECT * FROM remesas WHERE no_remesa=?',[no_remesa]);
  io.io.emit('retiro_en_proceso'," pago en proceso");
  res.json(retirox);
//  return;
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
prep1=tambox.pady(prep1,4);
prep1=tambox.changeEndianness(prep1);
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
var value=tambox.prepare_Encryption(arry);
console.log("ready for sending  is:",ready_for_sending);
//ready_for_sending=true;
  ready_for_pooling=false;
tambox.ensureIsSet().then(async function(){
        console.log("ready for sending  is:",ready_for_sending);
        tambox.envio_redundante(value)
        .then(data => {
        //  console.log(chalk.yellow("<-:"+data));
        if(data.length>30){
          tambox.handleEcommand(data);
        }else{
          tambox.handlepoll(data);
        }
        console.log("/////////////////////////////////");})
  });//fin del promise
const retiro= await pool.query ("UPDATE remesas SET status='en_proceso' WHERE no_remesa=?",[no_remesa]);
//=>
const retirox= await pool.query ('SELECT * FROM remesas WHERE no_remesa=?',[no_remesa]);
io.io.emit('retiro_en_proceso'," pago en proceso");
res.json(retirox);

//////////////////////////////////
}else{res.json("no se encontro un record valido");console.log("no se encontro un record valido");}

}
//////////////////////////////////
 }
//////////////////////////////////
  }else{
    res.send('Estoy en Startup');
  }

});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/terminar_retiro/:no_remesa',async(req,res)=>{
//ready_for_pooling=false;
tambox.ensureIsSet().then(async function(){
  //  ready_for_pooling=false;
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

            const url= tbm_adress+fix+"/"+tienda_id+"/"+no_caja+"/"+codigo_empleado+"/"+no_remesax+"/"+fecha+"/"+hora+"/"+monto+"/"+moneda+"/"+status+"/"+rms_status+"/"+tipo+"/"+status_hermes+"/"+tebs_barcode+"/"+machine_sn
            console.log("url:"+url);
            /////////////////
            const Http= new XMLHttpRequest();
          //  const url= 'http://192.168.1.12:4000/sync_remesa/22222/001/0002/9999/15000/PEN/14444330/234765/ingreso/2019-05-09/17:22:10'
            Http.open("GET",url);
            Http.send();
            ////////////////////////////
            const monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
            const monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
            // await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado'");
            const monto_remesa_hermes=monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso;
            console.log("actualizando el monto de remesa hermes:"+monto_remesa_hermes);
            await pool.query("UPDATE remesa_hermes SET monto=? WHERE status='iniciada'",[monto_remesa_hermes]);
            /////////////////////////////////////////////////////////////////////
          res.json(remesax);
    }else {
      res.json('Datos incompletos');
    }
  //  res.send('finalizando remesa');
}else{
  res.send('Estoy en Startup');
}
  });//fin del promise
});
///////////////////////////////////////////////////////////////////////////////////
module.exports= router;
