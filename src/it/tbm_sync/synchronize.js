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
const os = require('./../os');

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
    console.log(chalk.cyan("get_tbm_remesas.....enviando socket para consultar remesas."));
    to_tbm.socket_to_tbm.emit('consultando_excistencia_de_records',numero_de_serie);
    to_tbm.socket_to_tbm.on('no_records', function(data) {
    console.log(chalk.cyan("no_records:"+data));
    return resolve("ok")
    // io.emit('messages', 'Hello');
    });


    to_tbm.socket_to_tbm.on('tbm_records', function(data) {
    console.log(chalk.cyan("tbm_records received by sockets:"+JSON.stringify(data)));
    var new_data=[];
    for (var i=0; i <data.length;i++){
    new_data.push(data[i].no_remesa);
    }
    console.log(chalk.cyan("/////////////////////////////////////////////////"));
    console.log(chalk.cyan("/////////////  RESOLVING HERE   /////////////////"));
    console.log(chalk.cyan("/////////////////////////////////////////////////"));
    os.logea("new_data received by socket"+new_data);
    return resolve(new_data)
    // io.emit('messages', 'Hello');
    });

  });


}
async function remote_update(id){
      console.log("updading... id:"+id);
      var record_to_synch=await pool.query("SELECT * FROM remesas WHERE no_remesa=?",[id]);
      if (record_to_synch.length!=0) {
              os.logea("this record:"+JSON.stringify(record_to_synch));
              to_tbm.socket_to_tbm.emit('synch_remesas',record_to_synch);
              //await confirmation_from_tbm()
      }else {
        console.log("record skipped");
      }

  // function remote_update= every time a transaction is done on the machine , this function will be used to send via sockets the transaccion just accomplished , manteining both machines always synced
};
//////////////////////////////////////////////////////////
async function get_tbm_rh(this_tebs){ //envie socket a tbm consultando la existencia de
  // remesas hermes en la base de datos y devuelve un array con los tebs existentes.
try {
  return  new Promise(function(resolve, reject) {
  console.log(chalk.cyan("/////////////////////////////////////////////////"));
  console.log(chalk.cyan("///////// Socket Requestd to TBM ////////////////"));
  console.log(chalk.cyan("/////////// to "+this_tebs+"/////////////////////"));
  to_tbm.socket_to_tbm.emit('consultando_excistencia_de_rh',this_tebs);
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

  setTimeout(function () {
    return resolve("error conecting to tbm");
  }, 1000);

    });
} catch (e) {
  console.log(e);
} finally {
  console.log(chalk.cyan("//////////////////////////////////////////////"));
  console.log(chalk.cyan("////// Socket responded from TBM /////////////"));
  console.log(chalk.cyan("//////////////////////////////////////////////"));
}

}
module.exports.get_tbm_rh=get_tbm_rh;
//////////////////////////////////////////////////////////////
async function consulta_limite_maximo_de_pago_en_tbm(){
  if (tbm_status==true) {
    return new Promise(async function(resolve, reject) {
      try {
        to_tbm.socket_to_tbm.emit('consulta_limite_maximo_de_pago_en_tbm',global.numero_de_serie);
        os.logea("socket enviado consultado limite para machine_sn:"+global.numero_de_serie);
        to_tbm.socket_to_tbm.on('consulta_limite_maximo_de_pago_en_tbm', async function(data) {
          os.logea("lo de abajo es data");
          os.logea(data);
          if (data.length>0) {
            //console.log(chalk.cyan("consulta_limite_maximo_de_pago_en_tbm:"+data[0].limite_maximo_de_retiro));
            var respuesta123=data[0].limite_maximo_de_retiro;
            return resolve(respuesta123);
          }else {
            console.log("data fue undefined");
            setTimeout(function () {
              console.log(chalk.red("RESOLVED BY TIMEOUT"));
              return resolve(200);
            }, 1000);
          }

        });
      } catch (e) {
        console.log(e);
      } finally {
        os.logea("consulta_limite_maximo_de_pago_en_tbm ejecutada");
      }
    });
  }else {
    console.log("no tbm socket");
  }

}
module.exports.consulta_limite_maximo_de_pago_en_tbm=consulta_limite_maximo_de_pago_en_tbm;
/////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////
async function remote_update_rh(this_tebs){
  try {
    if(tbm_status==true){
      console.log(chalk.cyan("///////////////////////////////////////////////////////////////"));
      console.log(chalk.cyan("///////////////////////////////////////////////////////////////"));
      console.log("///////////// updading rh... tebs:"+this_tebs);
      console.log(chalk.cyan("///////////////////////////////////////////////////////////////"));

          var rh_to_synch=await pool.query("SELECT * FROM remesa_hermes WHERE tebs_barcode=?",[this_tebs]);
          if (rh_to_synch.length!=0) {
                  console.log("this rh:"+JSON.stringify(rh_to_synch));
//aqui get alllevels.,
//GET ALL LEVELS Aqui
//try {
//    var new_valuesy5=await os.consulta_all_levels();
//    console.log(new_valuesy5);
    //respuesta agragada a socket emitido.
                 var machine_level_values=[{
                   no_billetes_reci:global.no_billetes_reci,
                   monto_en_reciclador:global.total_dinero_acumulado_en_reciclador,
                   billetes_de_10:global.billetes_de_10_en_reciclador,
                   billetes_de_20:global.billetes_de_20_en_reciclador,
                   billetes_de_50:global.billetes_de_50_en_reciclador,
                   billetes_de_100:global.billetes_de_100_en_reciclador,
                   billetes_de_200:global.billetes_de_200_en_reciclador,
                   public_machine_ip:global.public_machine_ip,
                   note_validator_type:global.note_validator_type

                //   billetes_de_10:new_values[0].cantidad_de_billetes_en_reciclador.de10,
                //   billetes_de_20:new_values[0].cantidad_de_billetes_en_reciclador.de20,
                //   billetes_de_50:new_values[0].cantidad_de_billetes_en_reciclador.de50,
                //   billetes_de_100:new_values[0].cantidad_de_billetes_en_reciclador.de100,
                //   billetes_de_200:new_values[0].cantidad_de_billetes_en_reciclador.de200
              }];
                       var rh_y_machine={rh_to_synch,machine_level_values}
                       to_tbm.socket_to_tbm.emit('synch_rh',rh_y_machine);

// } catch (e) {
//   console.log(e);
// }finally{
//   console.log("get new values se ejecuto correctamente");
//   console.log("abajo monto actual");
//   console.log(rh_to_synch[0].monto);
//
// }

          }else {
            console.log("record skipped");
          }

      // function remote_update= every time a transaction is done on the machine , this function will be used to send via sockets the transaccion just accomplished , manteining both machines always synced

    }else {
      console.log("TBM Offline right now, booomer");
    }
  } catch (e) {
    console.log(e);
  } finally {
    console.log("remote update function finished.");
  }

};
module.exports.remote_update_rh=remote_update_rh;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function synch_required(){
  console.log(chalk.magenta("Entering synch required..."));
  return new Promise(async function(resolve, reject) {
    //si esta conectado a TBM
    if (tbm_status) {
      os.logea(chalk.green("Conexion a tambx manager satisfactoria"));
      os.logea("lo de abajo es numero de serie");
      os.logea(numero_de_serie);
      const local_id_records= await pool.query("SELECT no_remesa FROM remesas WHERE machine_sn=?",[numero_de_serie]);
      os.logea(local_id_records);
      var local_array=JSON.parse(JSON.stringify(local_id_records));
      os.logea(local_array);
      os.logea(chalk.cyan("a continuacion se muestran las "+local_array.length+" remesas existentes en maquina"));
      os.logea(local_array);
      os.logea(local_array.length);
      var local=[];
      //creo un subarray donde solo se muestran los no_remesa
      for (var i=0; i <local_array.length;i++){
        local.push(local_array[i].no_remesa);
      }
      //aqui consulto las remesas existentes en tbm (asumo que para este tebsbarcode)
      if (local_array.length>0) {
        console.log("local array es mayor a cero");
        var consulta=await get_tbm_remesas();
        console.log(chalk.cyan("lo que ya existe en tbm:"+consulta));
        console.log(chalk.green("lo que yo tengo:"+local));
        const toUpdate= arr_diff(consulta,local);
        console.log(chalk.green("toUpdate:"+toUpdate));
        for (var i=0; i <toUpdate.length;i++){
          await remote_update(toUpdate[i])
        }
        console.log(toUpdate.length+" Records updated succesfully");
      }else {
        console.log("local array es vacio");
        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
      }

    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////
    os.logea("consultando remesas hermes para sincronizar.");
    const local_rh_records= await pool.query("SELECT tebs_barcode FROM remesa_hermes WHERE machine_sn=?",[global.numero_de_serie]);
    var local_rh_array=JSON.parse(JSON.stringify(local_rh_records));
    //var local_rh_array=JSON.stringify(local_rh_records);
    os.logea("regarding local_rh_records:",global.numero_de_serie);
    os.logea(local_rh_array);
    //console.log(local_rh_array.length);
    var local_rh=[];
    for (var i=0; i <local_rh_array.length;i++){
      local_rh.push(local_rh_array[i].tebs_barcode);
    }
    try {
      var consulta_rh=await get_tbm_rh(local_rh_array[0].tebs_barcode);
      os.logea("lo de abajo es consulta rh");
      os.logea(consulta_rh);
      console.log(chalk.cyan("rh que ya existe en tbm:"+consulta_rh));
      //console.log(chalk.green("rh que yo tengo:"+consulta_rh[0].tebs_barcode));
      console.log(chalk.green("rh que yo tengo:"+local_rh));

      const toUpdate_rh= arr_diff(consulta_rh,local_rh);
      console.log("toUpdate rh:12345:"+toUpdate_rh);
      for (var i=0; i <toUpdate_rh.length;i++){
        await remote_update_rh(toUpdate_rh[i])
      }
      console.log(toUpdate_rh.length+" Records updated succesfully");
      return resolve("OK")
    } catch (e) {
      console.log(chalk.red("no se pudo ejecutar esta accion IMPORTANTE"));
      resolve("no se pudo ejecutar esta accion IMPORTANTE")
    }

    }else {
      console.log(chalk.red("TBM is offline right now, sorry"));
      resolve("TBM is offline right now, sorry")
    }

  });

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
