const express= require('express');
const router = express.Router();
const pool= require ('../database');
const io = require("../server.js");
const tambox = require("../it/devices/tambox.js");
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
//const glo = require('./globals');

router.get('/nueva_remesa/:tienda_id/:no_caja/:codigo_empleado/:no_remesa/:fecha/:hora',async (req,res)=>{
tambox.ensureIsSet().then(async function(){
    ready_for_pooling=false;
 if(on_startup==false){
   //var tebsbarcode=tambox.mytebsbarcode;
  // var machine_serial_number=tambox.machine_sn;
   var {no_remesa}=req.params;
    const number_remesa= await pool.query("SELECT COUNT(no_remesa) AS noRemesa FROM remesas WHERE tipo='ingreso' and no_remesa=?",[no_remesa]);
  //  console.log(number_remesa[0].noRemesa);
    if(number_remesa[0].noRemesa>0){
        res.json('Remesa ya existente, no se puede usar este codigo de remesa nuevamente.');
    }else{
     const {tienda_id,no_caja,codigo_empleado,no_remesa,fecha,hora}=req.params;
     if(tienda_id&&no_caja&&codigo_empleado&&no_remesa){
       const nueva_res={
         tienda_id,
         no_caja,
         codigo_empleado,
         no_remesa,
         fecha,
         hora,
         moneda:country_code,
         tebs_barcode:tebs_barcode,
         machine_sn:serialN,
         tipo:'ingreso'
       }
   await pool.query('INSERT INTO remesas set ?', [nueva_res]);
       ready_for_pooling=true;
     io.io.emit('comenzar_remesa',"INICIAR REMESA");
     //res.json(nueva_res);

   }else {
     res.json('Datos incompletos, revise documentacion');
   }
    }// find de else
 }else{
   res.send('Estoy en Startup');
 }
 })//fin del promise
});
router.get('/consultar_remesa/:no_remesa',async (req,res)=>{
tambox.ensureIsSet().then(async function(){ //esto es el promise
    ready_for_pooling=false;
    if(on_startup==false){
      const {no_remesa}=req.params;
          if(no_remesa){
              const {no_remesa}=req.params;
              const remesa= await pool.query ("SELECT * FROM remesas WHERE tipo='ingreso' and no_remesa=?",[no_remesa]);
              res.json(remesa);
          }else {
            res.json('Datos incompletos');
          }
    }else{
      res.send('Estoy en Startup');
    }
           ready_for_pooling=true;
  })
});
router.get('/terminar_remesa:no_remesa',async(req,res)=>{
tambox.ensureIsSet().then(async function(){
    //ready_for_pooling=false;
    if(on_startup==false){
      const {no_remesa}=req.params;
        if(no_remesa){
              const {no_remesa}=req.params;
              const remesa= await pool.query ("UPDATE remesas SET rms_status='finalizada' WHERE tipo='ingreso' and no_remesa=?",[no_remesa]);
              const remesax= await pool.query ('SELECT * FROM remesas WHERE no_remesa=?',[no_remesa]);
              io.to_tbm.emit('una_remesa_mas',"transaccion satisfactoria remesa");

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
              ////////////////////////////actualizando la remesa hermes para que refleje el nuevo monto de remesa ingresado
              const no_billetes= await pool.query("SELECT SUM(no_billetes) AS total_billetes FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
              const monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
              const monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
              // await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado'");
              const monto_remesa_hermes=monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso;
                  console.log("actualizando el monto de remesa hermes:"+monto_remesa_hermes + "y numero de billetes es:");
              await pool.query("UPDATE remesa_hermes SET monto=? WHERE status='iniciada'",[monto_remesa_hermes]);
              ////
              res.json(remesax);
        }else {
          res.json('Datos incompletos');
        }
      //  res.send('finalizando remesa');
    }else{
      res.send('Estoy en Startup');
    }
           ready_for_pooling=true;
  })//fin del promise
});
router.get('/anular_remesa/:no_remesa',async(req,res)=>{
tambox.ensureIsSet().then(async function(){
    ready_for_pooling=false;
    if(on_startup==false){
          const {no_remesa}=req.params;
            if(no_remesa){
                  const {no_remesa}=req.params;
                  const remesa= await pool.query ("UPDATE remesas SET rms_status='anulada', status='anulada' WHERE tipo='ingreso' and no_remesa=?",[no_remesa]);
                  const remesax= await pool.query ('SELECT * FROM remesas WHERE no_remesa=?',[no_remesa]);
                    io.io.emit('refresh_window',"refresh_window");
                  res.json(remesax);
            }else {
              res.json('Datos incompletos');
            }
      //  res.send('finalizando remesa');
    }else{
      res.send('Estoy en Startup');
    }
           ready_for_pooling=true;
  })//fin del promise
});
router.get('/is_startup' ,(req,res)=>{
tambox.ensureIsSet().then(async function(){
    ready_for_pooling=false;
  if(on_startup==false){
      res.send('YA ESTOY LIBRE');
  }else{
    res.send('Estoy en Startup');
  }
         ready_for_pooling=true;
    })//fin del promise
});

router.get('/test' ,async(req,res)=>{
res.send("fecha:"+tambox.fecha_actual()+" hora:"+tambox.hora_actual());
});

module.exports= router;
