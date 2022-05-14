
const server=require('./../../server');
const socket = require('../socket');
const os = require('../os');
const glo = require('../globals');
const chalk = require('chalk');
const pool = require('./../../database');
//TAMBOX MANAGER
var adrees=global.tbm_adressx;
const synchronize = require('./synchronize');



async function iniciar_handshake_con_tbm(){
  return new Promise(async function(resolve, reject) {
    try {
      console.log(chalk.green("Connected to Tambox Manager cloud with ID:"+socket_to_tbm.id));
     //lee el estado actual del campo is_registered en la base de datos.
      const current_registered_status= await pool.query("SELECT is_registered FROM machine");
      if (current_registered_status[0].is_registered==1) {
        console.log(chalk.green("Machine already registered"));
        //aqui se bifurca el camino cuando la maquina ya ah sido registrada antes en tbm, comprobando que la maquina existe con ese numero de serie.
        //y es necesario confirmar los datos recibidos desde TBM sobre esta maquina, y actualizarlo en la copia local de la base de datos.
      }else {
        console.log(chalk.red("Machine IS NOT registered"));
      //  console.log('hola desde aqui2');
        // SI ESTA MAQUINA NO INDICA QUE ESTA REGISTRADA.

        //marca is_regis como falso. //indicando que esta maquina no esta registrada
        console.log(chalk.yellow("on database, is_regis="+current_registered_status[0].is_registered));

        // is_regis=current_registered_status[0].is_registered;
        //         if (is_regis==0) {
        //           console.log("esta maquina no esta registrada y ya hay conexion con el servidor, se autoregistrará");
        //           var regis=await os.is_this_machine_registered();
        //           console.log(chalk.green("Register to tbm status:"+regis));
        //             var nombre_maquina =await pool.query("SELECT machine_name FROM machine");
        //              global.my_resgistered_machine_name=nombre_maquina[0].machine_name;
        //           //socket.io.emit("iniciando");
        //           server.io.emit("iniciando");
        //         }
      }

      //socket.io.emit('show_connected_to_TBM');
      server.io.emit('show_connected_to_TBM');
      return resolve('OK');
    } catch (e) {
      return reject("no se pudo hacer handshake"+e);
    }
  });

}
module.exports.iniciar_handshake_con_tbm=iniciar_handshake_con_tbm;

//console.log(chalk.cyan("AQUI ME ESTOY CONECTANDO A SERVIDOR REMOTO TBM;"));
console.log(chalk.yellow("TBM ADRESS HARDCODED IS:"+global.tbm_adressx));
var socket_to_tbm = require("socket.io-client")(adrees);
socket_to_tbm.on("connect",async function(socket) {
  console.log(chalk.yellow("a user connected :"+socket_to_tbm.id));
  tbm_status=true;
  await os.comprueba_maquina_inicial();
  await synchronize.synch_required();


});
  socket_to_tbm.on('disconnect', function() {
  console.log("Tambox_manager is offline..."+socket_to_tbm.id);
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

  // socket_to_tbm.on('synch_confirmation', function(data) {
  //   //io.to('lobby').emit('message', data);
  //   console.log(chalk.cyan("synch confirmation received:",data));
  //   if (JSON.stringify(data)===JSON.stringify(socket_sent)) {
  //     console.log(chalk.green("data integrity perfect"));
  //     console.log(chalk.green(JSON.stringify(socket_sent)));
  //
  //   }else {
  //     console.log(chalk.red("data received different"));
  //   }
  // });

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

  // socket_to_tbm.on('synch_request', function(msg){
  //       console.log(chalk.cyan("se ah recivido un sych_request"));
  // });
  ////////////////////////////////////////////////////////////////
  socket_to_tbm.on('lock_machine', async function(msg){
        console.log("///////////////////////////////////////");
        console.log(chalk.cyan("001-se ah recivido un lock_machine:"+msg.machine_sn +" con la orden:"+msg.orden));
        ////////////////////////////////
        console.log("verificando status de bloqueo");
        console.log("glo.numero_de_serie:"+numero_de_serie);
        console.log("msg.machine_sn:"+msg.machine_sn);

        if(msg.machine_sn==numero_de_serie){
            console.log(chalk.green("numero de serie local y orden coinciden"));
          if (msg.orden=="lock") {
            is_locked=true;
            //safe here on database lock status
            await pool.query("UPDATE machine SET is_locked=? WHERE machine_sn=?", [is_locked,numero_de_serie]);
            console.log(chalk.red("Machine Locked"));
            console.log("///////////////////////////////////////");
            //comunica a client side via socket , incando que tiene que ocultar pantalla de bloqueo
            server.io.emit('lock_machinex',msg);
          }else {
            is_locked=false;
            // safe here on database lock status.
            await pool.query("UPDATE machine SET is_locked=? WHERE machine_sn=?", [is_locked,numero_de_serie]);
            console.log(chalk.green("Machine UnLocked"));
            console.log("///////////////////////////////////////");
            //comunica a client side via socket , incando que tiene que ocultar pantalla de bloqueo
            server.io.emit('lock_machinex',msg);
          }
        }else {
          console.log(chalk.red("numero de serie local y orden no coinciden"));
        }

        ///////////////////////////////
  });
/////////////////////////////////////////////////////////////////////////////
  socket_to_tbm.on('adopt', function(msg) {
    //console.log(chalk.cyan("se ah recivido un lock_machine:"+msg.machine_sn +" con la orden:"+msg.orden));
    console.log(chalk.cyan("se ah recivido un adopt:"+msg.machine_sn));
    server.io.emit('adopt',msg.machine_sn);
  });
  //esta variable es muy importante porque indica si la maquina se encuentra conectada a TBM.

/////////////////////////////////////////
socket_to_tbm.on('synch_confirmation', function(data) {
  //io.to('lobby').emit('message', data);
//  console.log(chalk.cyan("synch confirmation received:",data));
  if (JSON.stringify(data)===JSON.stringify(socket_sent)) {
  //  console.log(chalk.green("data integrity perfect"));
    console.log(chalk.green("received:"+JSON.stringify(socket_sent)+ "from id:"+socket_to_tbm.id));
  }else {
    console.log(chalk.red("data received different"));
  }
});
/////////////////////////////////////////////////////////
exports.socket_to_tbm = socket_to_tbm;
