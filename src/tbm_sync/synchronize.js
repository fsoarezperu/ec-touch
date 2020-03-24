// proceso de sincronia entre tambox y tamboxmanager
//
// crear sync status la table remesa , que indique si ese record ya fue envia a tambox manager.
// guardar esta info en una tsbla de parametros. en db LISTO
//Guardarlo en base de dstos
//consultarlo y popular variable en inicializacion
const chalk = require('chalk');
const pool= require ('../database');
const io = require("../server.js");
//const glo = require('./globals');

var machine_sn=numero_de_serie;

var sinchronized=false;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function are_synched(){
  // -consulta cuantos records hay en db local where machine sn
const local_n_records= await pool.query("SELECT COUNT(no_remesa) AS local_n_records FROM remesas WHERE machine_sn=?",[machine_sn]);
// -se obtiene un numero local y se guarda en variable current_local_records.
var current_local_records=local_n_records[0].local_n_records;
if(!current_local_records==0){
  console.log(chalk.yellow("localmente existen:"+current_local_records+" records."));
    // -envia socket consultando # de records existentes en remoto where machine-sn
    io.to_tbm.emit('consultando_excistencia_de_records',machine_sn);
  var current_remote_records=5;
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
    // si la consulta local da como resultado cero nada sucede.
    console.log("nada que sincronizar, db vacia");
}

};
module.exports.are_synched=are_synched;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function synch_required(){
  const local_id_records= await pool.query("SELECT id FROM remesas WHERE machine_sn=?",[machine_sn]);
  var local_array=JSON.parse(JSON.stringify(local_id_records));
//  console.log(local_array);
//  console.log(local_array.length);
  var local=[];
  for (var i=0; i <local_array.length;i++){
    local.push(local_array[i].id);
  }
  console.log(chalk.cyan("local records list:"+local));

  var remoto=[1,2,3,4,5];
  console.log(chalk.cyan("remote records list:"+remoto));

  const toUpdate= arr_diff(local,remoto);
  console.log("toUpdate:"+toUpdate);

  for (var i=0; i <toUpdate.length;i++){
    remote_update(toUpdate[i])
  }
  console.log(toUpdate.length+" Records updated succesfully");
  // consulta y arma dos arrays con todos los ids de records existentes uno local y uno remoto.
  // compara uno a uno los items de los arrys y si son iguales los elimina (ya que los records son los mismos en ambas db) , dejando basicamante en el arry local los ids de los records que no se pudieron sync con tambox manager.
  // por se realiza un loop que consulta el record comoleto. arma el objeto y utiliza la funcion remote_update por cada id que quedo en el array de sync required. mostrar en consola el id del record que se acaba de sync sucesfully.
};

function arr_diff (a1, a2) {

    var a = [], diff = [];

    for (var i = 0; i < a1.length; i++) {
        a[a1[i]] = true;
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

function remote_update(id){
      console.log("updading... id:"+id);
  // function remote_update= every time a transaction is done on the machine , this function will be used to send via sockets the transaccion just accomplished , manteining both machines always synced
};
