
const server=require('./../../server');
const socket = require('../socket');
const os = require('../os');
const glo = require('../globals');
const chalk = require('chalk');
const pool = require('./../../database');
//TAMBOX MANAGER
var adrees=global.tbm_adressx;

async function iniciar_handshake_con_tbm(){
  return new Promise(async function(resolve, reject) {
    try {
      console.log(chalk.green("Connected to Tambox Manager cloud with ID:"+socket_to_tbm.id));
      const current_registered_status= await pool.query("SELECT is_registered FROM machine");
      if (current_registered_status[0].is_registered==1) {
        console.log(chalk.green("Machine already registered"));
      }else {
      //  console.log('hola desde aqui2');
        console.log(chalk.yellow("on database, is_regis="+current_registered_status[0].is_registered));
        is_regis=current_registered_status[0].is_registered;
                if (is_regis==0) {
                  console.log("esta maquina no esta registrada y ya hay conexion con el servidor, se autoregistrará");
                  var regis=await os.is_this_machine_registered();
                  console.log(chalk.green("Register to tbm status:"+regis));
                    var nombre_maquina =await pool.query("SELECT machine_name FROM machine");
                     global.my_resgistered_machine_name=nombre_maquina[0].machine_name;
                  //socket.io.emit("iniciando");
                  server.io.emit("iniciando");
                }
      }

      //socket.io.emit('show_connected_to_TBM');
      server.io.emit('show_connected_to_TBM');
      tbm_status = true;
      return resolve();
    } catch (e) {
      return reject("no se pudo hacer handshake"+e);
    }
  });

}
module.exports.iniciar_handshake_con_tbm=iniciar_handshake_con_tbm;

//console.log(chalk.cyan("AQUI ME ESTOY CONECTANDO A SERVIDOR REMOTO TBM;"));
console.log(chalk.yellow("TBM ADRESS HARDCODED IS:"+global.tbm_adressx));
var socket_to_tbm = require("socket.io-client")(adrees);
socket_to_tbm.on("connect",async function() {
  socket_to_tbm.on('disconnect', function() {
    console.log("Tambox_manager is offline...");
    server.io.emit('show_not_connected');
    tbm_status = false;
  });
  socket_to_tbm.on('machine', function(data) {
    //io.to('lobby').emit('message', data);
    console.log("ticking...");
  });
  socket_to_tbm.on('is_tbm_alive', function(data) {
    //io.to('lobby').emit('message', data);
    console.log("ticking...aqui",data);
  });
  socket_to_tbm.on('refresh_navigators', function(data) {
    //io.to('lobby').emit('message', data);
    console.log("refreshing navigators from TBM...");
  });

  socket_to_tbm.on('registration', (msg) => {
        console.log("se ah recivido un mensaje desde el servidor TBM:" + JSON.stringify(msg));
      //  console.log(msg[1].tienda_id);
        if (msg[0] == "machine_found_on_tbm") {
          console.log(JSON.stringify(msg[1]));
        }
        // return resolve("OK");
  });

  socket_to_tbm.on('synch_request', function(msg){
        console.log(chalk.cyan("se ah recivido un sych_request"));
  });

});
/////////////////////////////////////////////////////////
exports.socket_to_tbm = socket_to_tbm;
