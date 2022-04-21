// proceso de sincronia entre tambox y tamboxmanager
//
// crear sync status la table remesa , que indique si ese record ya fue envia a tambox manager.
// guardar esta info en una tsbla de parametros. en db LISTO
//Guardarlo en base de dstos
//consultarlo y popular variable en inicializacion
const chalk = require('chalk');
const pool= require ('../../database');
const io = require("../../server.js");
const glo = require('../../it/globals');
const to_tbm=require("./tbm_synch_socket");


//console.log("machine_sn="+numero_de_serie);
var sinchronized=false;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function are_synched(){
  var machine_sn=global.numero_de_serie;
  // -consulta cuantos records hay en db local where machine sn
  console.log(chalk.green("Consultando cantidad de remesas en la base de datos local de la maquina:"+machine_sn));
const local_n_records= await pool.query("SELECT COUNT(no_remesa) AS local_n_records FROM remesas WHERE machine_sn=?",[machine_sn]);
// -se obtiene un numero local y se guarda en variable current_local_records.
var current_local_records=local_n_records[0].local_n_records;
//console.log("local_n_records:"+JSON.stringify(local_n_records));
//console.log(chalk.green("current_local_records:"+current_local_records));

//si no es igual a cero.
if(!current_local_records==0){
  console.log(chalk.yellow(chalk.green("localmente existen:"+current_local_records+" records.")));
    // -envia socket consultando # de records existentes en remoto where machine-sn
    //io.to_tbm.emit('consultando_excistencia_de_records',machine_sn);
if (tbm_status) {
  var current_remote_records=consultar_cantidad_de_remesas_a_servidor_remoto();
  console.log(chalk.yellow("remotamente existen:"+current_remote_records+" records."));
  if(current_local_records==current_remote_records){
   // -SI local records y remote records coinciden the se pone en true la variable “synchhronized” y se muestra icono en pantalla visual.
    console.log("sinchronized");
  }else{
    if(current_local_records>current_remote_records){
       // -si no coinciden se muestra icono “sync pending “ en pantalla visual y se programa la funcion “sync required”
      console.log(chalk.red("synch required"));
      console.log(chalk.red("se actualizaran "+(current_local_records-current_remote_records)+" Records."));

      synch_required();
    }else{
      console.log("remote tiene mas que local, al parecer se borraron archivos localmente");
    }
  }
}else{
  console.log(chalk.cyan("TBM is offline, can not synch right now..."));
}


}else{
    // si la consulta local da como resultado cero nada sucede.
    console.log("nada que sincronizar, db vacia");
}

};
module.exports.are_synched=are_synched;
/////////////////////////////////////////////////////////
async function get_tbm_remesas(){
return  new Promise(function(resolve, reject) {
    //emit al tbm
    // if (true) {
    console.log("tryng to get records here.");
    to_tbm.socket_to_tbm.emit('consultando_excistencia_de_records',global.numero_de_serie);

    // }else {
    //   return reject("error");
    // }

    to_tbm.socket_to_tbm.on('no_records', function(data) {
    console.log(chalk.cyan("no_records:"+data));
    return resolve("ok")
    // io.emit('messages', 'Hello');
    });
    to_tbm.socket_to_tbm.on('tbm_records', function(data) {
//    console.log(chalk.cyan("tbm_records:"+JSON.stringify(data)));
    var new_data=[];
    for (var i=0; i <data.length;i++){
    new_data.push(data[i].no_remesa);
    }

    return resolve(new_data)
    // io.emit('messages', 'Hello');
    });

  });


}
async function remote_update(id){
      console.log("updading... id:"+id);
      var record_to_synch=await pool.query("SELECT * FROM remesas WHERE no_remesa=?",[id]);
      if (record_to_synch.length!=0) {
              console.log("this record:"+JSON.stringify(record_to_synch));
              to_tbm.socket_to_tbm.emit('synch_remesas',record_to_synch);
              //await confirmation_from_tbm()
      }else {
        console.log("record skipped");
      }

  // function remote_update= every time a transaction is done on the machine , this function will be used to send via sockets the transaccion just accomplished , manteining both machines always synced
};
async function get_tbm_rh(){
return  new Promise(function(resolve, reject) {
    to_tbm.socket_to_tbm.emit('consultando_excistencia_de_rh',global.numero_de_serie);
    to_tbm.socket_to_tbm.on('no_records', function(data) {
    console.log(chalk.cyan("no_records:"+data));
    return resolve("ok")
    });
    to_tbm.socket_to_tbm.on('tbm_rh', function(data) {
    var new_data_rh=[];
    for (var i=0; i <data.length;i++){
    new_data_rh.push(data[i].tebs_barcode);
    }
    return resolve(new_data_rh)
    });
  });
}
async function remote_update_rh(id){
      console.log("updading rh... id:"+id);
      var rh_to_synch=await pool.query("SELECT * FROM remesa_hermes WHERE tebs_barcode=?",[id]);
      if (rh_to_synch.length!=0) {
              console.log("this rh:"+JSON.stringify(rh_to_synch));
              to_tbm.socket_to_tbm.emit('synch_rh',rh_to_synch);
              //await confirmation_from_tbm()
      }else {
        console.log("record skipped");
      }

  // function remote_update= every time a transaction is done on the machine , this function will be used to send via sockets the transaccion just accomplished , manteining both machines always synced
};
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function synch_required(){
  console.log(chalk.magenta("Entering synch required..."));
  if (tbm_status) {
    const local_id_records= await pool.query("SELECT no_remesa FROM remesas WHERE machine_sn=?",[global.numero_de_serie]);
    var local_array=JSON.parse(JSON.stringify(local_id_records));
    console.log("a continuacion se muestran los "+local_array.length+" records a ser sincronizados");
    console.log(local_array);
    // console.log(local_array.length);
    var local=[];
    for (var i=0; i <local_array.length;i++){
      local.push(local_array[i].no_remesa);
    }
    var consulta=await get_tbm_remesas();
    console.log(chalk.cyan("lo que ya existe en tbm:"+consulta));
    console.log(chalk.green("lo que yo tengo:"+local));
    const toUpdate= arr_diff(consulta,local);
    console.log("toUpdate:"+toUpdate);
    for (var i=0; i <toUpdate.length;i++){
      await remote_update(toUpdate[i])
    }
    console.log(toUpdate.length+" Records updated succesfully");
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////////////
  const local_rh_records= await pool.query("SELECT tebs_barcode FROM remesa_hermes WHERE machine_sn=?",[global.numero_de_serie]);
  var local_rh_array=JSON.parse(JSON.stringify(local_rh_records));
  //var local_rh_array=JSON.stringify(local_rh_records);
  console.log("regarding local_rh_records:",global.numero_de_serie);
  console.log(local_rh_array);
  console.log(local_rh_array.length);
  var local_rh=[];
  for (var i=0; i <local_rh_array.length;i++){
    local_rh.push(local_rh_array[i].no_remesa);
  }
  try {
    var consulta_rh=await get_tbm_rh();
    console.log(chalk.cyan("rh que ya existe en tbm:"+consulta_rh));
    console.log(chalk.green("rh que yo tengo:"+local_rh_records[0].tebs_barcode));
    // const toUpdate_rh= arr_diff(consulta_rh,local_rh);
    // console.log("toUpdate rh:"+toUpdate_rh);
    // for (var i=0; i <toUpdate_rh.length;i++){
    //   await remote_update_rh(toUpdate_rh[i])
    // }
    // console.log(toUpdate_rh.length+" Records updated succesfully");
  } catch (e) {
    console.log(chalk.red("no se pudo ejecutar esta accion IMPORTANTE"));
  } finally {

  }

  }else {
    console.log(chalk.cyan("TBM is offline right now, sorry"));
  }


};
module.exports.synch_required=synch_required;
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////
function arr_diff (local, a2) {

    var a = [], diff = [];

    for (var i = 0; i < local.length; i++) {
        a[local[i]] = true;
    }

    for (var i = 0; i < a2.length; i++) {
        if (a[a2[i]]) {
            delete a[a2[i]];
        } else {
            a[a2[i]] = true;
        }
    }

    for (var k in a) {
        diff.push(k);
    }

    return diff;
}
module.exports.arr_diff=arr_diff;
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////

function consultar_cantidad_de_remesas_a_servidor_remoto(){
  //enviar orden via socket
  // -envia socket consultando # de records existentes en remoto where machine-sn
  console.log(chalk.green("enviando consulta via socket"));
    to_tbm.socket_to_tbm.emit('consultando_excistencia_de_records',global.numero_de_serie);

  //esperar respuesta del socket

  //continuar con la tarea
  return 1;
}
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////
///////////////////////////////////////////////////////
