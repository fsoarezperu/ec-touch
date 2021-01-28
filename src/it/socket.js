const fs = require('fs') //para escribir archivo.
const chalk=require('chalk');
const os = require('./os');
const globals= require('./globals');
const ssp =require('./ssp');
const path = require('path');
module.exports = function (io) {
//let io = require('socket.io')(server,{cookie: false});
const sp= require('./serial_port')(io);
const ssp = require('./ssp')(io);

function  nuevo_enlace(pagina,ruta){
  fs.readFile(path.join(__dirname,ruta), 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
  var vardata="vardata";
  var totaldata=[vardata,data];
//  console.log(data);
  io.emit(pagina,totaldata);
 });

}

io.on('connection', async function (socket) {

  console.log(chalk.cyan("usuario conectado"));
  socket.on('reset', async function(msg) {
    console.log(msg);
    //  io.emit('reset', "reseting system");
    it.zerox = false;
    ecount = "00000000";
    //await  ssp.transmite_encriptado_y_procesa(validator_address,reset)
    shutdown(function(output){
        console.log(output);
    });
  });
  socket.on('reset_counters', async function(msg) {
    console.log(msg);
    //  io.emit('reset', "reseting system");
    it.zerox = false;
    ecount = "00000000";
    await ssp.transmite_encriptado_y_procesa(validator_address,reset_counters)
  });
  /////////////////////////////////////////////////////////////
  socket.on('enable_validator',async function(msg) {
   await ssp.ensureIsSet();
  return  new Promise(async function(resolve, reject) {
     try {
       console.log(chalk.green("disparo de enable_validator"));
       var data=await ssp.envia_encriptado(validator_address,enable);
       if (data=="01F0") {
       //  console.log(chalk.green(data));
         console.log(chalk.cyan("ENABLE VALIDATOR"));

        return resolve();
       }else {
         reject("el validador no se habilito");
       }

     } catch (e) {
       return reject(chalk.red("error en socket:")+e);
     } finally {
     io.emit('validator_enabled', "validator_enabled");
     }
         });
  });
  socket.on('habilita_validador',async function(msg) {
    await ssp.ensureIsSet();
    return new Promise(async function(resolve, reject) {
    try {
      var data=await ssp.envia_encriptado(validator_address,enable);
      if (data=="01F0") {
      //  console.log(chalk.green(data));
        console.log(chalk.cyan("ENABLE VALIDATOR"));
      //  io.emit('validator_enabled', "validator_enabled");
        io.emit('paso2', "paso2");
        return resolve();
      }else {
        reject("el validador no se habilito");
      }

    } catch (e) {
      return reject(chalk.red("error en socket:")+e);
    } finally {

    }
        });
  });
  socket.on('disable_validator',async function(msg) {
     await ssp.ensureIsSet();
     await ssp.envia_encriptado(validator_address,desable);
     console.log(chalk.cyan("DISABLE VALIDATOR"));
  });
  /////////////////////////////////////////////////////////////
  socket.on('lock_cashbox', async function(msg) {
    io.emit('lock_cashbox', "lock_cashbox");
    console.log(chalk.cyan("LOCKING CASHBOX"));
    await  ssp.transmite_encriptado_y_procesa(validator_address,cashbox_lock_enable)
  });
  socket.on('unlock_cashbox', async function(msg) {
    console.log(chalk.cyan("UNLOCKING CASHBOX"));
    io.emit('unlock_cashbox', "unlock_cashbox");
    console.log(global.validator_address);
  //   await  ssp.transmite_encriptado_y_procesa(global.validator_address,global.cashbox_unlock_enable);
     await  ssp.envia_encriptado(validator_address,cashbox_unlock_enable);

  });
  /////////////////////////////////////////////////////////////
  socket.on('finish', async function(msg) {
    await  ssp.ensureIsSet();
    return new Promise(async function(resolve, reject) {
      try {
        console.log(chalk.cyan("Finalizando remesa"));
        var t124=await  ssp.transmite_encriptado_y_procesa(validator_address,desable);
        if (t124.length>0) {
          io.emit('finishy', "finishy");
          return resolve();
        }

      } catch (e) {
        return reject(e);
      } finally {
      //  return;
      }
    });
  });
  socket.on('refresh_window', function(msg) {
    console.log(msg);
  });
  socket.on('consultar_remesa', async function(msg) {
    const remesax = await pool.query("SELECT * FROM remesas WHERE status='terminado' ");
    io.emit('consultar_remesa', remesax);
    console.log("consultar_remesa___________________________________________________ ");
  });
  socket.on('consultar_monto_remesa', async function(msg) {
    const monto_remesa = await pool.query("SELECT * FROM remesas WHERE status='terminado' AND no_remesa=? ", [msg]);
    console.log(monto_remesa[0].monto);
    const creditos = await pool.query("SELECT * FROM creditos WHERE status='processed' and no_remesa=?", [msg]);
    io.emit('consultar_monto_remesa', monto_remesa[0].monto, creditos);
    console.log("consultar_monto_remesa_______________________________________________");
  });
  socket.on('consultar_lista_tienda_id', async function(msg) {
    //consulta lista de tienda_id para el dropdown del filtro en la pagina niveles
    const tienda_id = await pool.query("SELECT DISTINCT tienda_id FROM remesas WHERE status='terminado' ");
    io.emit('consultar_lista_tienda_id', tienda_id);

  });
  socket.on('consultar_total_tienda_id', async function(msg) {
    const total_tienda_id = await pool.query("SELECT SUM(monto) AS totalxtienda_id FROM remesas WHERE tienda_id=? AND status='terminado'", [msg]);
    console.log(total_tienda_id[0].totalxtienda_id);
    io.emit('consultar_total_tienda_id', total_tienda_id[0].totalxtienda_id);
  });

  socket.on('nuevo_billete_recivido', function(msg) {
    var tt = msg.monto;
    var ttt = msg.country_code;
    console.log("monto:" + tt);
    console.log("country code:" + ttt);
  });
  socket.on('vbnet', function(msg) {
    console.log(chalk.green("from visual basic"));
  });
  socket.on('update_requested', function(msg) {
    console.log(chalk.green(msg));
    io.emit('update_requested', "display message from update_requested");
  });
  socket.on('no_cabezal', function(msg) {
    console.log(chalk.green(msg));
    io.emit('no_cabezal', "display message from update_requested");
  });
  /////////////////////////////////////////////////////////////
  socket.on('envio_serial', async function(msg) {
    await ssp.ensureIsSet();
    console.log(chalk.green(msg +" para:"+device) );
    var esto=await sp.transmision_insegura(validator_address,poll);
    esto=await ssp.handlepoll(esto);
    console.log(chalk.green(esto));
    console.log("--------------------------");
  });
  socket.on('envio_serial_seguro', async function(msg) {
      console.log(chalk.green(msg +" para:"+device) );
      esto();
      console.log("--------------------------");
    });
  async function esto(){
    //setTimeout(async function () {
      var current_tebs2x=await ssp.envia_encriptado(validator_address,get_tebs_barcode);
      //    data= await enc.handleEcommand(data);
      //   data= await va.handleGetTebsBarcode(data);
      //  console.log(current_tebs2x);
          var current_tebs2=await sp.transmision_insegura(receptor,get_tebs_barcode) //<-------- get_serial_number
        //  console.log(current_tebs2);
          current_tebs2=await va.handleGetTebsBarcode(current_tebs2);
          console.log("CUrrents TEBS ES:"+current_tebs2);
    //      esto();
    //}, 800);
    }
  socket.on('blocking_pooling', function(msg) {
  console.log(chalk.green(msg));
    ssp.ensureIsSet2();
      ready_for_pooling=!ready_for_pooling;
      console.log("SENDING IS:"+ready_for_sending+" And Pooling is:"+ready_for_pooling);
      io.emit('blocking_pooling', "pooling blocked");
  });
  socket.on('force_serial', function(msg) {
    console.log(chalk.green("FORCING SERIAL"));
    console.log(chalk.green("ready for sending is:" + ready_for_sending));
    console.log(chalk.green("ready for pooling is:" + ready_for_pooling));
    ssp.ensureIsSet2()
      ready_for_sending=!ready_for_sending;
      console.log("SENDING IS:"+ready_for_sending+" And Pooling is:"+ready_for_pooling);
      io.emit('blocking_sending', "blocking_sending");
  });
  /////////////////////////////////////////////////////////////
  socket.on('empty_hoppper', function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,empty_all)
      .then(data =>{
        logea(chalk.yellow(device+'<-:'), chalk.yellow(data));
        sp.enable_hopper_pooling();
    })
    io.emit('empty_hoppper', "empty_hoppper");
  });
  socket.on('reset_hoppper', function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
    //  ecount=0;
    sh.super_comando(smart_hopper_address,reset)
      .then(data =>{
        logea(chalk.yellow(device+'<-:'), chalk.yellow(data));
        sp.enable_hopper_pooling();
    })
    io.emit('reset_hoppper', "reset_hoppper");
  });
  socket.on('pay_10c',async function(msg) {
      console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay10c).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay10c', "pay10c");sp.enable_hopper_pooling();})

  });
  socket.on('pay_20c',async function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay20c).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_20c', "pay_20c");sp.enable_hopper_pooling();})
  });
  socket.on('pay_50c',async function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay50c).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_50c', "pay_50c");sp.enable_hopper_pooling();})
  });
  socket.on('pay_1s',async function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay1s).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_1s', "pay_1s");sp.enable_hopper_pooling();})
  });
  socket.on('pay_2s',async function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay2s).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_2s', "pay_2s");sp.enable_hopper_pooling();})
  });
  socket.on('pay_5s',async function(msg) {
    console.log(chalk.green(msg));
      sp.disable_hopper_pooling();
      sh.super_comando(smart_hopper_address,pay5s).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
      .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));io.emit('pay_5s', "pay_5s");sp.enable_hopper_pooling();})
  });
  /////////////////////////////////////////////////////////////
  socket.on('registradora', function(msg) {
    // console.log(chalk.green(msg));
    //   sp.disable_hopper_pooling();
    //   sh.super_comando(smart_hopper_address,reset)
    //   .then(data =>{
    //     os.logea(chalk.yellow(device+'<-:'), chalk.yellow(data));
    //     sp.enable_hopper_pooling();
    // })
    io.emit('registradora', "registradora");
  });
  socket.on('niveles_hopper', function(msg) {
    // console.log(chalk.green(msg));
    //   sp.disable_hopper_pooling();
    //   sp.super_comando(smart_hopper_address,reset)
    //   .then(data =>{
    //     os.logea(chalk.yellow(device+'<-:'), chalk.yellow(data));
    //     sp.enable_hopper_pooling();
    // })
    io.emit('niveles_hopper', "niveles_hopper");
  });
  socket.on('actualizar_niveles',async function(msg) {
     console.log(chalk.green(msg));
     var levels= await  sh.transmite(smart_hopper_address,get_all_levels)
     io.emit('actualizar_niveles', levels);
    console.log("data final:"+levels);
  });
  socket.on('add_coins',async  function(msg) {
     console.log(chalk.green(msg));
     switch (msg) {
      case "add_0.1":
      console.log(chalk.green(msg));
      await  sh.mandate_al_hopper(set_coin_amount_10c)
      io.emit('actualiza_grafico', "actualiza_grafico");
      break;
      case "add_0.2":
      await  sh.mandate_al_hopper(set_coin_amount_20c)
      io.emit('actualiza_grafico', "actualiza_grafico");
      break;
      case "add_0.5":
      await  sh.mandate_al_hopper(set_coin_amount_50c)
      io.emit('actualiza_grafico', "actualiza_grafico");
      break;
      case "add_1":
      await  sh.mandate_al_hopper(set_coin_amount_1s)
      io.emit('actualiza_grafico', "actualiza_grafico");
      break;
      case "add_2":
      await  sh.mandate_al_hopper(set_coin_amount_2s)
      io.emit('actualiza_grafico', "actualiza_grafico");
      break;
      case "add_5":
      await  sh.mandate_al_hopper(set_coin_amount_5s)
      io.emit('actualiza_grafico', "actualiza_grafico");
      break;
      case "vaciar":
      var quefue=await  sh.mandate_al_hopper(empty_all)
      console.log("quefue"+quefue);
    //  setTimeout(function () {
          io.emit('actualiza_grafico', "actualiza_grafico");
    //  }, 30000);
      break;
       default:

     }
  });
  socket.on('pay_value', async function(msg) {
    payout_amount[2]=msg;
    console.log("pay_amount"+payout_amount);
    await  sh.mandate_al_hopper(payout_amount);
    //io.emit('pay_value',"pay_value");
  });
  /////////////////////////////////////////////////////////////
  socket.on('read_new_tebs', async function(msg) {
      var data_Tebs=await ssp.envia_encriptado(validator_address,get_tebs_barcode);
      console.log(data_Tebs);
    //io.emit('pay_value',"pay_value");
  });
  socket.on('interno', async function(msg) {
    //  var data_Tebs=await ssp.envia_encriptado(validator_address,get_tebs_barcode);
      console.log(msg);
    //io.emit('pay_value',"pay_value");
  });
  /////////////////////////////////////////////////////////
  // socket.on('iniciar_nueva_remesa', async function(msg) {
  //   console.log(msg);k
  //   await  os.validator_enabled_now();
  // //  io.emit('iniciar_nueva_remesa_paso2', "iniciar_nueva_remesa_paso2");
  //   console.log("orden completada");
  // });
  socket.on('terminar_remesa', async function(msg) {
    console.log(msg);
    await validator_disabled_now();
    console.log("orden completada");
  });
  // socket.on('cancelar_remesa', async function(msg) {
  //   console.log(msg);
  //   await os.validator_disabled_now();
  //   console.log("orden completada");
  //   //io.emit('main');
  // });
  /////////////////////////////////////////////////////////
//  os.conectar_enlace_de(socket,'iniciar_nueva_remesa','../system/remesa/remesa_1.html',"vardata");
  os.conectar_enlace_de(socket,'main','../system/buffer.html',"vardata");
//  os.conectar_enlace_de(socket,'config','../system/configuracion.html',"vardata");
//  os.conectar_enlace_de(socket,'cancelar_remesa','../system/buffer.html',"vardata");

  // socket.on('iniciar_nueva_remesax',async function(){
  //   console.log(chalk.yellow("Orden Cancelar remesa detectado"));
  //   await  os.validator_disabled_now();
  //   //  io.emit("main");
  //   fs.readFile(path.join(__dirname, '../system/remesa/remesa_1.html'), 'utf8', function (err,data) {
  //
  //   if (err) {
  //     return console.log(err);
  //   }
  //   var vardata="vardata";
  //       var totaldata=[vardata,data];
  //   //console.log(chalk.green("se emite socket:"+xid+ "variable:"+totaldata));
  //   io.emit('iniciar_nueva_remesax',totaldata);
  //   // if(cb !== undefined){
  //   //     cb();
  //   // }
  //
  // });
  // //  io.emit('main',path.join(__dirname, ));
  //   //ssp.emite_como_cliente();
  // //  io.emit('prueba','prueba');
  //  });

  socket.on('cancelar_remesa',async function(data){
    console.log(chalk.yellow("Orden Cancelar remesa detectado"));
    await  os.validator_disabled_now();
    //  io.emit("main");
    fs.readFile(path.join(__dirname, '../system/buffer.html'), 'utf8', function (err,data) {

    if (err) {
      return console.log(err);
    }
    var vardata="vardata";
        var totaldata=[vardata,data];
    //console.log(chalk.green("se emite socket:"+xid+ "variable:"+totaldata));
    io.emit('main',totaldata);
    // if(cb !== undefined){
    //     cb();
    // }

   });
  //  io.emit('main',path.join(__dirname, ));
    //ssp.emite_como_cliente();
  //  io.emit('prueba','prueba');
   });

  var this_machine={
    machine_sn:numero_de_serie,
    Tebs_barcode:tebs_barcode,
    os_version:release_version,
    direccion_ip:machine_ip,
    puerto:machine_port,
    creado_por:machine_developer,
    soporte_tecnico:machine_support
  }
  os.conectar_enlace_de(socket,'info','../system/info/info.html',this_machine);
  ///////////////////////////////////////////////////////////////////////////
  var totales= await os.calcular_cuadre_diario();
  os.conectar_enlace_de(socket,'cuadre_diario','../system/cuadre_diario/cuadre_diario.html',totales);

  ////////////////////////////////////////////////////////////////////////////////////////////////

  os.conectar_enlace_de(socket,'cifras_generales','../system/cifras_generales/cifras_generales.html',global.mis_cifras_generales);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  socket.on('smart_empty', async function(msg) {
    console.log(chalk.green('will smart_empty:' + msg));
    await  ssp.transmite_encriptado_y_procesa(validator_address,smart_empty);
    console.log("aqui salgo de smart empty");
  });
  socket.on('Cashbox_Unlock_Enable', function(msg) {
    io.emit('Cashbox_Unlock_Enable',"cashbox Unlocked");
  });

  os.conectar_enlace_de(socket,'remesa_hermes','../system/remesa_hermes/rm_1.html',"null");
  os.conectar_enlace_de(socket,'Smart_emptying','../system/remesa_hermes/rm_2.html',"null");
  os.conectar_enlace_de(socket,'Smart_emptied','../system/remesa_hermes/rm_3.html',"null");
  os.conectar_enlace_de(socket,'cashbox_unlocked','/..system/remesa_hermes/rm_4.html',"null");
  os.conectar_enlace_de(socket,'Cashbox_Back_in_Service','../system/remesa_hermes/rm_5.html',"null",os.testing_callback);

  socket.on('get_machine_information', async function(msg) {
    console.log(msg);
    var this_machine2={
      machine_sn:numero_de_serie,
      Tebs_barcode:tebs_barcode,
      os_version:release_version,
      direccion_ip:machine_ip,
      puerto:machine_port,
      creado_por:machine_developer,
      soporte_tecnico:machine_support
    }
      io.emit('get_machine_information',this_machine);
    });

  // socket.on('trigger_socket', function(){
  //   console.log(chalk.yellow("trigger_socket fired"));
  //   ssp.emite_como_cliente();
  // });
  socket.on('cancelling',async function(){
    console.log(chalk.yellow("canceling si funciono"));
    //ssp.emite_como_cliente();
    await  os.validator_disabled_now();
   // io.emit('main','../system/buffer.html');
   });
//////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////

  socket.on('iniciar_nueva_remesa',async function(){
    console.log(chalk.yellow("Nueva remesa manual iniciada"));
    await  os.validator_enabled_now();
    nuevo_enlace('iniciar_nueva_remesa','../system/remesa/remesa_1.html')
   });

  socket.on('fer',async function(){
    console.log(chalk.yellow("fer nuevo enlace si funciono"));
    await  os.validator_enabled_now();
    nuevo_enlace('iniciar_nueva_remesa','../system/remesa/remesa_1.html')

    //ssp.emite_como_cliente();
    //io.emit('prueba','prueba');
   });

   socket.on('config',async function(){
     console.log(chalk.yellow("Configuration page"));
    // await  os.validator_enabled_now();
     nuevo_enlace('config','../system/configuracion.html');
    });

    // socket.on('main',async function(){
    //   console.log(chalk.yellow("Configuration page"));
    //  // await  os.validator_enabled_now();
    //   nuevo_enlace('main','../system/buffer.html');
    //  });

  // os.conectar_enlace_de(socket,'config','../system/configuracion.html',"vardata");



})
}
