const fs = require('fs') //para escribir archivo.
const chalk=require('chalk');
const os = require('./os');
const globals= require('./globals');
const tambox= require('./devices/tambox');
const to_tbm=require('./tbm_sync/tbm_synch_socket');
const ssp =require('./ssp');
const path = require('path');
const val = require("./devices/validator");
module.exports = function (io) {
//let io = require('socket.io')(server,{cookie: false});
const sp= require('./serial_port')(io);
const ssp = require('./ssp')(io);

function  nuevo_enlace(pagina,ruta,vardata1){
  fs.readFile(path.join(__dirname,ruta), 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
//  var vardata="vardata";
  var totaldata=[vardata1,data];
//  console.log(data);
  io.emit(pagina,totaldata);
 });

}
module.exports.nuevo_enlace=nuevo_enlace;

io.on('connect', function(socket) {
//    console.log(chalk.red("local_cashbox is offline..."+socket.handshake.address));
  console.log(chalk.cyan("the client ID"+socket.id+" is connected from ip:"+socket.handshake.address));
  socket.on('disconnect', function(reason) {
    console.log(chalk.yellow("a user leave, reason:"+ chalk.cyan(reason)));

  });

  socket.on('socket_to_tbm',async function(socket){
    console.log(chalk.yellow("socket to tbm detected from client:"+socket.id));
    console.log(chalk.yellow("orden para mandar socket to tbm detected"));


    //await  os.validator_enabled_now();
    //nuevo_enlace('iniciar_nueva_remesa','../system/remesa/remesa_1.html')
  //  console.log("");
    //ssp.emite_como_cliente();
    //io.emit('prueba','prueba');
//    to_tbm.socket_to_tbm.emit('Machine_alive','123456');
  //  to_tbm.socket_to_tbm.emit('registration',"machine_en_cuestion");

//    to_tbm.socektyy.emit("my other event",{ my: 'data' });
      to_tbm.socket_to_tbm.emit("Machine_alive","vamos bien");

   });

});



io.on('connection', async function (socket) {




//  console.log(chalk.cyan("usuario conectado, ID:"+socket.id+ " desde ip:"+socket.handshake.address+" detectada"));
  socket.on('reset', async function(msg) {
    console.log(msg);
    //  io.emit('reset', "reseting system");k
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
    console.log(chalk.cyan("LOCKING CASHBOX"));
    await os.new_lock_cashbox()
    io.emit('lock_cashbox', "lock_cashbox");
  });
  socket.on('unlock_cashbox', async function(msg) {
    console.log(chalk.cyan("UNLOCKING CASHBOX"));
    await os.new_unlock_cashbox()
    if (on_remesa_hermes) {
       nuevo_enlace('cashbox_unlocked','../system/remesa_hermes/rm_4.html');
    }
    io.emit('unlock_cashbox', "unlock_cashbox");
  });
  /////////////////////////////////////////////////////////////
  // socket.on('finish', async function(msg) {
  //   await  ssp.ensureIsSet();
  //   return new Promise(async function(resolve, reject) {
  //     try {
  //       console.log(chalk.cyan("Finalizando remesa"));
  //       var t124=await  ssp.transmite_encriptado_y_procesa(validator_address,desable);
  //       if (t124.length>0) {
  //         io.emit('finishy', "finishy");
  //         return resolve();
  //       }
  //
  //     } catch (e) {
  //       return reject(e);
  //     } finally {
  //     //  return;
  //     }
  //   });
  // });
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
          current_tebs2=await val.handleGetTebsBarcode(current_tebs2);
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
    var data_Tebs=await os.new_read_new_tebs();
  //  var data_Tebs2=await val.handleGetTebsBarcode(data_Tebs)
    //var data_Tebs=await ssp.verificar_existencia_de_bolsa(receptor);

      console.log(data_Tebs);

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

/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
//  os.conectar_enlace_de(socket,'main','../system/buffer.html',"vardata");
  os.conectar_enlace_de(socket,'config','../system/configuracion.html',"vardata");
  /////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////
  /////////////////////////////////////////////////////////




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


//  os.conectar_enlace_de(socket,'info','../system/info/info.html',this_machine);
  ///////////////////////////////////////////////////////////////////////////
  // var totales= await os.calcular_cuadre_diario();
  // os.conectar_enlace_de(socket,'cuadre_diario','../system/cuadre_diario/cuadre_diario.html',totales);

  ////////////////////////////////////////////////////////////////////////////////////////////////

  //os.conectar_enlace_de(socket,'cifras_generales','../system/cifras_generales/cifras_generales.html',global.mis_cifras_generales);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  socket.on('Cashbox_Unlock_Enable', function(msg) {
    io.emit('Cashbox_Unlock_Enable',"cashbox Unlocked");
  });
  var my_remesa_hermes_now={
    nombre:"fernando",
    tienda_id:12345,
    dias_acumulados:14,
    fecha_de_creacion:"02/07/2121",
    monto_en_bolsa:3850,
    monto_en_reciclador:2000
  };
//  os.conectar_enlace_de(socket,'remesa_hermes','../system/remesa_hermes/rm_1.html',my_remesa_hermes_now);
//  os.conectar_enlace_de(socket,'Smart_emptying','../system/remesa_hermes/rm_2.html',"null");
  os.conectar_enlace_de(socket,'Smart_emptied','../system/remesa_hermes/rm_3.html',"null");
  os.conectar_enlace_de(socket,'cashbox_unlocked','../system/remesa_hermes/rm_4.html',"null");
  //os.conectar_enlace_de(socket,'Cashbox_Back_in_Service','../system/remesa_hermes/rm_5.html',"null",os.testing_callback);
  os.conectar_enlace_de(socket,'Cashbox_Back_in_Service','../system/remesa_hermes/rm_5.html',"null");


  socket.on('get_machine_information', async function(msg) {
    console.log("fet machine information triggeret with this message:"+msg);
    var this_machine2={
      machine_sn:numero_de_serie,
      Tebs_barcode:tebs_barcode,
      os_version:release_version,
      direccion_ip:machine_ip,
      puerto:machine_port,
      creado_por:machine_developer,
      soporte_tecnico:machine_support
    }
      io.emit('get_machine_information',this_machine2);
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
//  var new_manual_remesa;

  socket.on('iniciar_nueva_remesa',async function(){
    new_manual_remesa= Math.floor((Math.random() * 100) + 1);
    console.log(chalk.yellow("Nueva remesa manual iniciada"));

    os.crear_nueva_remesa(new_manual_remesa,999,001,8888,tambox.fecha_actual(),tambox.hora_actual());
    await  os.validator_enabled_now();
    nuevo_enlace('iniciar_nueva_remesa','../system/remesa/remesa_1.html')
   });

   socket.on('finish',async function(){
     console.log(chalk.yellow("Nueva remesa manual terminada"));
     os.terminar_nueva_remesa(new_manual_remesa);
     await  os.validator_disabled_now();
     nuevo_enlace('main','../system/buffer.html')

    });



     socket.on('smart_empty', async function(msg) {
       on_remesa_hermes=true;
       console.log(chalk.green('will smart_empty:' + msg));
     //  await  ssp.transmite_encriptado_y_procesa(validator_address,smart_empty);
       nuevo_enlace('smart_empty','../system/remesa_hermes/rm_2.html');
       await os.begin_remesa_hermes();
       console.log("aqui salgo de smart emptyy pASO A RM2");
     });

     socket.on('Smart_emptied',function(){
       console.log(chalk.yellow("recibi smart emptied"));
       nuevo_enlace('Smart_emptied','../system/remesa_hermes/rm_3.html');
      });

      socket.on('Cashbox_Back_in_Service',async function(){
        console.log(chalk.yellow("Cashbox_Back_in_Service123"));
        si_existe_bolsa=true;
        if(on_remesa_hermes==true){
            nuevo_enlace('Cashbox_Back_in_Service','../system/remesa_hermes/rm_5.html');
        }else{
          nuevo_enlace('Cashbox_Back_in_Service','../system/buffer.html');
        }


       });

    //  socket.on('smart_empty', async function(msg) {
    //    console.log(chalk.green('will smart_empty:' + msg));
    //  //  await  ssp.transmite_encriptado_y_procesa(validator_address,smart_empty);
    // //   await os.begin_remesa_hermes();
    //    console.log("aqui salgo de smart empty");
    //  });

   // socket.on('config',async function(){
   //   console.log(chalk.yellow("Configuration page"));
   //   nuevo_enlace('config','../system/configuracion.html');
   //  });
   // socket.on('info',async function(){
   //    console.log(chalk.yellow("Configuration page"));
   //    nuevo_enlace('info','../system/info/info.html');
   //   });

function super_enlace(orden,mensaje,ruta_de_plantilla,vardataxxy,pre_call_back){
  if(pre_call_back !== undefined){
      pre_call_back();
  }
   //console.log(chalk.yellow("entrando a super enlace"));
  socket.on(orden,async function(vardataxx){
     console.log(chalk.yellow(mensaje)+" with data="+chalk.cyan(JSON.stringify(vardataxxy)));
     nuevo_enlace(orden,ruta_de_plantilla,vardataxxy);
    });
};
module.exports.super_enlace=super_enlace;

//super_enlace('info','info','../system/info/info.html');
super_enlace('config','config','../system/configuracion.html');
//super_enlace('main','main','../system/buffer.html');
//super_enlace('cuadre_diario','cuadre_diario','../system/cuadre_diario/cuadre_diario.html');
//super_enlace('cifras_generales','cifras_generales','../system/cifras_generales/cifras_generales.html');

//super_enlace('remesa_hermes','remesa_hermes','../system/remesa_hermes/rm_1.html',my_remesa_hermes_now,os.consulta_remesa_hermes_actual);
socket.on('cuadre_diario',async function(msg){
  console.log(chalk.yellow("socket on cuadre_diario"));
  //var soy_la_voz=await os.consulta_remesa_hermes_actual();
  var totales_cuadre_diarioyy= await os.calcular_cuadre_diario();
  console.log("totales_cuadre_diario:"+JSON.stringify(totales_cuadre_diarioyy));

  nuevo_enlace('cuadre_diario','../system/cuadre_diario/cuadre_diario.html',totales_cuadre_diarioyy);
 });

/////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
 var this_machine={
   machine_sn:globals.numero_de_serie,
   Tebs_barcode:tebs_barcode,
   os_version:release_version,
   direccion_ip:machine_ip,
   ip_publico:globals.public_machine_ip,
   puerto:machine_port,
   creado_por:machine_developer,
   soporte_tecnico:machine_support
 }

 var this_machine3={
   machine_sn:numero_de_serie,
   Tebs_barcode:tebs_barcode,
   os_version:release_version,
   direccion_ip:machine_ip,
   ip_publico:globals.public_machine_ip,
   puerto:machine_port,
   creado_por:machine_developer,
   soporte_tecnico:machine_support
 }
 socket.on('info',async function(msg){
   console.log(chalk.yellow("socket on info"));
  // var thi_info=await os.calcular_cifras_generales();
  // var mi_objeto={
  //   color:"negro",
  //   tamano:"pequeño"
  // }
   console.log("mi nuevo objeto:"+numero_de_serie);
   console.log("vardata de info en este punto es:"+JSON.stringify(this_machine3));
   nuevo_enlace('info','../system/info/info.html',this_machine3);
  });

socket.on('remesa_hermes',async function(msg){
  console.log(chalk.yellow("socket on remesa_hermes"));
  var soy_la_voz=await os.consulta_remesa_hermes_actual();
  //console.log("soy la voz es:"+JSON.stringify(soy_la_voz));
  nuevo_enlace('remesa_hermes','../system/remesa_hermes/rm_1.html',soy_la_voz);
 });

 socket.on('cifras_generales',async function(msg){
   console.log(chalk.yellow("socket on cifras_generales"));
   var thi_cifras_generales=await os.calcular_cifras_generales();
   console.log("vardata de cifras_generales es:"+JSON.stringify(thi_cifras_generales));
   nuevo_enlace('cifras_generales','../system/cifras_generales/cifras_generales.html',thi_cifras_generales);
  });

 socket.on('main',async function(msg){
   console.log(chalk.yellow("socket on MAIN"));
   var this_machine_info=await os.consulta_this_machine();
//   console.log("vardata de main es:"+JSON.stringify(this_machine_info));
   var historial=await os.consulta_historial();
  // console.log("vardata de hisotiral es:"+JSON.stringify(historial));
   var mi_objeto={this_machine_info,historial };
   nuevo_enlace('main','../system/buffer.html',mi_objeto);
  console.log("vardata de hisotiral es:"+JSON.stringify(mi_objeto));
   // nuevo_enlace('main','../system/buffer.html',this_machine_info);

  });

super_enlace('rm_5','rm_5','../system/remesa_hermes/rm_5.html');
super_enlace('rm_1','rm_1','../system/remesa_hermes/rm_1.html');
super_enlace('rm_2','rm_2','../system/remesa_hermes/rm_2.html');
super_enlace('rm_3','rm_3','../system/remesa_hermes/rm_3.html');
super_enlace('rm_4','rm_4','../system/remesa_hermes/rm_4.html');
super_enlace('rm_4_1','rm_4_1','../system/remesa_hermes/rm_4_1.html');
//super_enlace('rm_5','rm_5','../system/remesa_hermes/rm_5.html');
//listo
//super_enlace('remesa_hermes','../system/remesa_hermes/rm_1.html');
super_enlace('Smart_emptying','../system/remesa_hermes/rm_2.html');
//super_enlace('Smart_emptied','../system/remesa_hermes/rm_3.html');
//super_enlace('cashbox_unlocked','../system/remesa_hermes/rm_4.html');
//super_enlace('Cashbox_Back_in_Service','../system/remesa_hermes/rm_5.html');



    // socket.on('main',async function(){
    //   console.log(chalk.yellow("Configuration page"));
    //  // await  os.validator_enabled_now();
    //   nuevo_enlace('main','../system/buffer.html');
    //  });

  // os.conectar_enlace_de(socket,'config','../system/configuracion.html',"vardata");



})
}
