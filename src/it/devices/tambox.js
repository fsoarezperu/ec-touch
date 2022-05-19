//const ssp = require('./../ssp');

//const enc = require('./../encryption');
const sp = require('./../serial_port');
//const sh = require('./smart_hopper');
//const it = require('./../../server');
const chalk=require('chalk');
const pool = require('./../../database');
//const io = require("./../socket");

const os = require('./../os');

function verifica_coneccion_validador(){
  port.write("command_ready");
  if(global.is_head_online==true)
  {
    console.log("esta conectada");
  }else{
    console.log("esta desconectada");
    io.io.emit('no_cabezal',"display message from update_requested");
  //  window.location.replace("/no_cabezal"); //aqui quiero mostrar la pantalal de erro al arranque indicando que el cabezal no esta.
  }
  }
module.exports.verifica_coneccion_validador=verifica_coneccion_validador;
////////////////////////////////////////////////////

////////////////////////////////////////////////////
exports.handleRoutingNotes= function (data){
var poll_responde=data.match(/.{1,2}/g);
if(poll_responde[0] == "F0"){
  console.log(chalk.green("ROUTING OK received"));
}
if(poll_responde[0] == "F5"){
  console.log(chalk.green("PAYOUT NOT DETECTED"));
}
if(poll_responde[0] == "F4"){
  console.log(chalk.green("VALUE OR CURRENCY NOT IN DATASET,OR NOT ENCRYPTED DATA"));
}
return;
}
////////////////////////////////////////////////////
exports.handlepayoutvalue=async function(){
  var handler="";
  var myData;
  var number_of_byte = received_command.substr(0, 2);
  myData = received_command.substr(2, number_of_byte + 2);
  var firstbyte = myData.substr(0, 2);
//  console.log("after_encription received:" + number_of_byte + " Bytes of responde data");
  // console.log("witch are:" + myData);
  myData=myData.substr(2,number_of_byte+ 2)
//  console.log("cleaned recevided data:"+myData);
//console.log(myData.length);
if(myData.length>32){
  myData=myData.substr(0, 32);
  console.log(chalk.red.inverse("Cutted length:"+myData));
}
  var ready=await decrypt(myData);
  ready=ready.toUpperCase();
  //el log de abajo muestra la info recivida decryptada
  //console.log(chalk.green("<-:"+ready));
  var data_length = ready.substr(0, 2);
  handler=data_length;
  data_length=parseInt(data_length,10);
//  console.log("data length is:"+data_length);
  var read_ecount=ready.substr(2, 8);
  read_ecount=changeEndianness(read_ecount);
//  console.log("reaD COUNT:"+read_ecount);
  //read_ecount=parseInt(read_ecount,10);
  slave_count=read_ecount;
  slave_count=pady(slave_count,8);
  //slave_count = parseInt(slave_count, 16);
//  console.log("slave_read_ecount is:"+slave_count);
  var read_data=ready.substr(10,data_length*2);
//  console.log("read_data is:"+read_data);
  var poll_responde=read_data.match(/.{1,2}/g);

  if(poll_responde[0] == "F0"){
    console.log(chalk.green("PAGO PROCEDE"));
    enable_sending();
    return "ok";
  }
  if(poll_responde[0] == "F5"){
    console.log(chalk.green("Command can not be processed"));
    if(poll_responde[1] == "01"){
      console.log(chalk.green("Not enough value in device2"));
      enable_sending();
      return "saldo_insuficiente";
    }
    if(poll_responde[1] == "02"){
      console.log(chalk.green("Cannot pay exact amount"));
      enable_sending();
      return "no_monto_exacto";
    }
    if(poll_responde[1] == "03"){
      console.log(chalk.green("Device Busy"));
      enable_sending();
      return "ocupado";
    }
    if(poll_responde[1] == "04"){
      console.log(chalk.green("Device Disabled"));
      enable_sending();
      return "desabilitado";
    }
    return;
  }

return;
  //exports.handleRoutingNotes(read_data);
//  handler=handler+read_data; //this concant the data lentth and the data itself in order to be able to hableit by pollresponse.
//  exports.handlepoll(handler);

}

////////////////////////////////////////////////////
exports.finalizar_remesas_en_proceso=async function(){
  // return new Promise(async function(resolve, reject) {
  //   try {
  //     await pool.query ("UPDATE remesas SET status='completado' WHERE tipo='egreso' and status='en_proceso'");
  //     await pool.query ("UPDATE remesas SET status='terminado' WHERE tipo='ingreso' and status='en_proceso'");
  //     os.logea(chalk.green("Finalizando los pagos inconclusos"));
  //     return resolve("ok");
  //   } catch (e) {
  //     return reject(e);
  //   }
  // });

  return new Promise(async function(resolve, reject) {
    var remesay;
    var id_remesa;
    try {
      os.logea("Detectando remesa a finalizar");
      remesay = await pool.query("SELECT * FROM remesas WHERE tipo='ingreso' and status='iniciada' OR  tipo='ingreso' and status='en_proceso'");
      if (remesay === undefined || remesay.length == 0) {
          os.logea("no remesa en status iniciada");
          //res.render('index');
          return resolve("no remesa en status iniciada")
      } else {
        id_remesa = remesay[0].no_remesa;
        console.log(chalk.cyan("el valor a utilizar como id_remesa:" + id_remesa));
        const calculando_monto = await pool.query("SELECT SUM(monto) AS monto_acumulado_creditos_en_proceso FROM creditos WHERE no_remesa=? AND status='processing'", [id_remesa]);
        var monto_total_remesa_en_proceso = calculando_monto[0].monto_acumulado_creditos_en_proceso;

        const no_billetes_credito = await pool.query("SELECT COUNT(id) AS cantidad_billetes FROM creditos WHERE no_remesa=? AND status='processing'", [id_remesa]);
        var no_billetes_en_remesa=no_billetes_credito[0].cantidad_billetes;
        console.log("se encontraron billetes:"+no_billetes_en_remesa);
        await pool.query("UPDATE remesas SET monto=?,no_billetes=?,status='terminado' WHERE no_remesa=?", [monto_total_remesa_en_proceso,no_billetes_en_remesa, id_remesa]);
        await pool.query("UPDATE creditos SET status='processed' WHERE no_remesa=?", [id_remesa]);

      const no_billetes_totales= await pool.query("SELECT SUM(no_billetes) AS total_billetes FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
      const monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
      const monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
      const monto_remesa_hermes=monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso;
      console.log("actualizando el monto de remesa hermes:"+monto_remesa_hermes + "y numero de billetes es:"+no_billetes_totales[0].total_billetes);
      await pool.query("UPDATE remesa_hermes SET monto=?, no_billetes=? WHERE status='iniciada'",[monto_remesa_hermes,no_billetes_totales[0].total_billetes]);
      await actualizar_remesa_enTBM(remesay);
      /////////////////////////////////////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////////////////////////////////////
      console.log("Aqui debo de sincronizar la remesa hermes tambien.");
      /////////////////////////////////////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////////////////////////////////////
      /////////////////////////////////////////////////////////////////////////////////////////

      };
    } catch (e) {
        return reject("no se pudo finalizar adecuadamente la remesa")
    } finally {
      return
    }



  });
}

exports.finalizar_pagos_en_proceso=async function(){
return new Promise(async function(resolve, reject) {
  try {
    os.logea("Detectando egreso a finalizar");
    remesay = await pool.query("SELECT * FROM remesas WHERE tipo='egreso' and status='recibido' OR  tipo='egreso' and status='en_proceso'");
    if (remesay === undefined || remesay.length == 0) {
      os.logea("no pago en status iniciada o en proceso");
      //res.render('index');
      return resolve("no pago en status iniciada o en proceso")
  } else {
    id_remesa = remesay[0].no_remesa;
    console.log(chalk.cyan("el valor a utilizar como id_remesa:" + id_remesa));
    const calculando_monto = await pool.query("SELECT SUM(monto) AS monto_acumulado_creditos_en_proceso FROM creditos WHERE no_remesa=? AND status='processing'", [id_remesa]);
    var monto_total_remesa_en_proceso = calculando_monto[0].monto_acumulado_creditos_en_proceso;

    const no_billetes_credito = await pool.query("SELECT COUNT(id) AS cantidad_billetes FROM creditos WHERE no_remesa=? AND status='processing'", [id_remesa]);
    var no_billetes_en_remesa=no_billetes_credito[0].cantidad_billetes;
    console.log("se encontraron billetes:"+no_billetes_en_remesa);
    await pool.query("UPDATE remesas SET monto=?,no_billetes=?,status='completado' WHERE no_remesa=?", [monto_total_remesa_en_proceso,no_billetes_en_remesa, id_remesa]);
    await pool.query("UPDATE creditos SET status='processed' WHERE no_remesa=?", [id_remesa]);

  const no_billetes_totales= await pool.query("SELECT SUM(no_billetes) AS total_billetes FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
  const no_billetes_pagados= await pool.query("SELECT SUM(no_billetes) AS total_billetes_pagados FROM remesas WHERE tipo='egreso'and status='completado' and status_hermes='en_tambox'");

  const monto_total_remesas = await pool.query("SELECT SUM(monto) AS totalremesax FROM remesas WHERE tipo='ingreso'and status='terminado' and status_hermes='en_tambox'");
  const monto_total_egresos = await pool.query("SELECT SUM(monto) AS totalEgreso FROM remesas WHERE  tipo='egreso' and status='completado' and status_hermes='en_tambox'");
  const monto_remesa_hermes=monto_total_remesas[0].totalremesax - monto_total_egresos[0].totalEgreso;

  console.log("total billetes:"+no_billetes_totales[0].total_billetes);
  let billetes_remesa=no_billetes_totales[0].total_billetes;
  console.log("monto_total_remesas:"+monto_total_remesas[0].totalremesax);
  console.log("total billetes pagados:"+no_billetes_pagados[0].total_billetes_pagados);
  let billetes_pagos=no_billetes_pagados[0].total_billetes_pagados;
  let result=billetes_remesa-billetes_pagos;

  console.log("monto_total_egresos:"+monto_total_egresos[0].totalEgreso);
  console.log("actualizando el monto de remesa hermes:"+monto_remesa_hermes + "y numero de billetes es:"+result);
  await pool.query("UPDATE remesa_hermes SET monto=?, no_billetes=? WHERE status='iniciada'",[monto_remesa_hermes,result]);

  try {
      await actualizar_remesa_enTBM(remesay);
  } catch (e) {
      console.log("no conection yet");
  }

  /////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////
  console.log("Aqui debo de sincronizar la remesa hermes tambien.");
  /////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////////////////
  return resolve("pagos finalizados satisfactoriamente")
  };
  } catch (e) {
    return reject("no se pudo finalizar adecuadamente el pago")
  } finally {
      return resolve();
  }
});
};
////////////////////////////////////////////////////
exports.get_all_levels_value=async function (){
  var lod=0;
  var totbills=0;
  var totaccum=0;
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

  console.log("consultando all levels");
   var data =await os.transmite_encriptado_y_procesa2(validator_address, get_all_levels);
//  exports.envio_redundante(get_all_levels)
//  .then(data => {
    console.log(chalk.yellow("<-:"+data));
//    exports.enable_sending();
    var poll_responde=data.match(/.{1,2}/g);
  console.log("response length:"+poll_responde[0]);
    if(poll_responde[1] == "F0"){
    console.log(chalk.green("response is ok"));
      console.log("number of denominations:"+poll_responde[2]);
      var i=0;
      var ru=0;
      var prevalue=0;

      for (i;i<poll_responde[2];i++){
        if(i==0){
          ru=3;
          prevalue=poll_responde[ru+2];
          prevalue=prevalue + poll_responde[ru+3];
          prevalue=prevalue + poll_responde[ru+4];
          prevalue=prevalue + poll_responde[ru+5];
          prevalue=enc.changeEndianness(prevalue);
          value_level1=parseInt(prevalue,16)/100;
          console.log("value_level1 is:"+value_level1);
          note_level1=parseInt( poll_responde[ru],16);
          console.log("note_level1 is:"+note_level1);
          acum_level1=note_level1*value_level1;
          console.log("acum_level1 is:"+acum_level1);
        }
        if(i==1){
          ru=12;
          prevalue=poll_responde[ru+2];
          prevalue=prevalue + poll_responde[ru+3];
          prevalue=prevalue + poll_responde[ru+4];
          prevalue=prevalue + poll_responde[ru+5];
          prevalue=enc.changeEndianness(prevalue);
          value_level2=parseInt(prevalue,16)/100;
          console.log("value_level2 is:"+value_level2);
          note_level2=parseInt( poll_responde[ru],16);
          console.log("note_level2 is:"+note_level2);
          acum_level2=note_level2*value_level2;
          console.log("acum_level2 is:"+acum_level2);
        }
        if(i==2){
          ru=21;
          prevalue=poll_responde[ru+2];
          prevalue=prevalue + poll_responde[ru+3];
          prevalue=prevalue + poll_responde[ru+4];
          prevalue=prevalue + poll_responde[ru+5];
          prevalue=enc.changeEndianness(prevalue);
          value_level3=parseInt(prevalue,16)/100;
          console.log("value_level3 is:"+value_level3);
          note_level3=parseInt( poll_responde[ru],16);
          console.log("note_level3 is:"+note_level3);
          acum_level3=note_level3*value_level3;
          console.log("acum_level3 is:"+acum_level3);
        }
        if(i==3){
          ru=30;
          prevalue=poll_responde[ru+2];
          prevalue=prevalue + poll_responde[ru+3];
          prevalue=prevalue + poll_responde[ru+4];
          prevalue=prevalue + poll_responde[ru+5];
          prevalue=enc.changeEndianness(prevalue);
          value_level4=parseInt(prevalue,16)/100;
          console.log("value_level4 is:"+value_level4);
          note_level4=parseInt( poll_responde[ru],16);
          console.log("note_level4 is:"+note_level4);
          acum_level4=note_level4*value_level4;
          console.log("acum_level4 is:"+acum_level4);
        }
        if(i==4){
          ru=39;
          prevalue=poll_responde[ru+2];
          prevalue=prevalue + poll_responde[ru+3];
          prevalue=prevalue + poll_responde[ru+4];
          prevalue=prevalue + poll_responde[ru+5];
          prevalue=enc.changeEndianness(prevalue);
          value_level5=parseInt(prevalue,16)/100;
          console.log("value_level5 is:"+value_level5);
          note_level5=parseInt( poll_responde[ru],16);
          console.log("note_level5 is:"+note_level5);
          acum_level5=note_level5*value_level5;
          console.log("acum_level5 is:"+acum_level5);
        }
        //console.log("i:"+i);
        //console.log("ru:"+ru);
        lod=parseInt( poll_responde[ru],16);
        totbills=totbills+lod;
      //  console.log("level_of_denomination_in_device:"+poll_responde[ru]);

      //  console.log("level_of_denomination_in_device:"+lod);
      }
    }
console.log("total billetes en reciclador:"+totbills);
totaccum=acum_level1+acum_level2+acum_level3+acum_level4+acum_level5;
console.log("total monto acumulado en reciclador:"+totaccum);
// var bill_details={
//   billetes_de_10:note_level1,
//   billetes_de_20:note_level2,
//   billetes_de_50:note_level3,
//   billetes_de_100:note_level4,
//   billetes_de_200:note_level5
// }
// console.log("bill_details");
    console.log("/////////// ALL LEVELS ///////////////");
return {totbills,totaccum};
//})
  //return "ok";
  //return {totbills,totaccum};
}
////////////////////////////////////////////////////
exports.fecha_actual=function(){
  var currentdate = new Date();
  var fecha=currentdate.getFullYear()+"-"+(currentdate.getMonth()+1)+"-"+currentdate.getDate();
  return fecha;
}
exports.hora_actual=function(){
  var currentdate = new Date();
  var hora= currentdate.getHours()+":"+currentdate.getMinutes()+":"+currentdate.getSeconds();
  return hora;
}
