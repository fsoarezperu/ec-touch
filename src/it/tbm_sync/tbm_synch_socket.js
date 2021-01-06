
const socket = require('../socket');
const glo = require('../globals');
const chalk = require('chalk');
//TAMBOX MANAGER
var adrees=global.tbm_adressx;
console.log(chalk.yellow("TBM ADRESS REGISTERED IS:"+global.tbm_adressx));
var to_tbm = require("socket.io-client")(adrees);
// var to_tbm = require("socket.io-client")('https://tbm-cloud.herokuapp.com');
exports.to_tbm = to_tbm;
to_tbm.on("connect",async function() {
  to_tbm.on('disconnect', function() {
    console.log("Tambox_manager is offline...");
    socket.io.emit('show_not_connected');
    tbm_status = false;
  });
  to_tbm.on('machine', function(data) {
    //io.to('lobby').emit('message', data);
    console.log("ticking...");
  });
  to_tbm.on('is_tbm_alive', function(data) {
    //io.to('lobby').emit('message', data);
    console.log("ticking...");
  });
  to_tbm.on('refresh_navigators', function(data) {
    //io.to('lobby').emit('message', data);
    console.log("refreshing navigators from TBM...");
  });

  console.log(chalk.green("Connected to Tambox Manager cloud"));
  const current_registered_status= await pool.query("SELECT is_registered FROM machine");
  if (current_registered_status[0].is_registered==1) {
    console.log(chalk.green("Machine already registered"));
  }else {
  //  console.log('hola desde aqui2');
    console.log(current_registered_status[0].is_registered);
    is_regis=current_registered_status[0].is_registered;
            if (is_regis==0) {
              console.log("esta maquina no esta registrada y ya hay conexion con el servidor, se autoregistrará");
              var regis=await os.is_this_machine_registered();
              console.log(chalk.green("Register to tbm status:"+regis));
                var nombre_maquina =await pool.query("SELECT machine_name FROM machine");
                 glo.my_resgistered_machine_name=nombre_maquina[0].machine_name;
              socket.io.emit("iniciando");
            }
  }

  socket.io.emit('show_connected_to_TBM');
  tbm_status = true;
//  console.log('hola desde aqui');
  await tambox_manager_ping();
});
/////////////////////////////////////////////////////////
