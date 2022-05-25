const fs = require('fs') //para escribir archivo.
const chalk=require('chalk');
const os = require('./os');
const globals= require('./globals');
const tambox= require('./devices/tambox');
const to_tbm=require('./tbm_sync/tbm_synch_socket');
const sspx =require('./ssp');
const path = require('path');
const val = require("./devices/validator");
const pool = require('./../database');
const sp2= require('./serial_port');
module.exports = function (io) {
//let io = require('socket.io')(server,{cookie: false});
const sp= require('./serial_port')(io);
const ssp = require('./ssp')(io);
const moment=require("moment");
const synch_tbm = require('./tbm_sync/synchronize');
const tebs_events= require('./devices/ssp/tebs_events');
function  nuevo_enlace(pagina,ruta,vardata1){
  fs.readFile(path.join(__dirname,ruta), 'utf8', function (err,data) {
      if (err) {
        return console.log(err);
      }
//  var vardata="vardata";
  var totaldata=[vardata1,data];
  // console.log(totaldata);
  io.emit(pagina,totaldata);
 });

}
module.exports.nuevo_enlace=nuevo_enlace;

io.on('connect', async function(socket) {
  console.log(chalk.cyan("the client ID:"+socket.id+" is connected from ip:"+socket.handshake.address));
  socket.on('disconnect', function(reason) {
    console.log(chalk.yellow("a user leave, reason:"+ chalk.cyan(reason)));

  });
  socket.on('orden_sync', async function(msg){
  var remesas_a_sincronizar= await pool.query("SELECT * FROM remesas WHERE tebs_barcode=?",current_tebs_barcode);
  // var remesas_a_sincronizar={
  //   no_remesa:11111,
  //   tienda_id:0103
//  }
  console.log("estoy detectando una orden para sincronizar remesas esta remesa:"+JSON.stringify(remesas_a_sincronizar));
    to_tbm.socket_to_tbm.emit("synch_remesas",remesas_a_sincronizar);
    await synch_tbm.remote_update_rh(global.tebs_barcode);
})
socket.on('orden_sync2', async function(msg){
console.log("orden sync recibida; "+msg);
})


// function update_remesas_hermes_via_socket_to_tbm(res) {
//   var remesas_a_sincronizar={
//     no_remesa:11111,
//     tienda_id:0103
//   }
//  console.log("estoy detectando una orden para sincronizar remesas esta remesa:"+JSON.stringify(remesas_a_sincronizar));
//    to_tbm.socket_to_tbm.emit("synch_remesas",remesas_a_sincronizar);

// }
  socket.on('socket_to_tbm',async function(socket_data){
//    console.log(chalk.yellow("socket to tbm detected from client:"+socket_data.id));
    console.log(chalk.yellow("synch request sent:"+ JSON.stringify(socket_data)));
    //guardando valor en socket_sent para comparar recepcion
    socket_sent=socket_data;
//    to_tbm.socket_to_tbm.emit('Machine_alive','123456');
  //  to_tbm.socket_to_tbm.emit('registration',"machine_en_cuestion");
//    to_tbm.socket_to_tbm("my other event",{ my: 'data' });
      to_tbm.socket_to_tbm.emit("synch_request",socket_data);

   });
});

io.on('connection', async function (socket) {
  socket.on('reset', async function(msg) {
    console.log(msg);
    //  io.emit('reset', "reseting system");k
    it.zerox = false;
    ecount = "00000000";
    await  ssp.transmite_encriptado_y_procesa(validator_address,reset);
    // shutdown(function(output){
    //     console.log(output);
    // });
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
      }
    });
  });
  socket.on('disable_validator',async function(msg) {
    try {
      await ssp.ensureIsSet();
      await ssp.envia_encriptado(validator_address,desable);
      console.log(chalk.cyan("DISABLE VALIDATOR"));
    } catch (e) {
        console.log("validator could not be disabled");
    }
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
  socket.on('update_requested', function(msg) {
    console.log(chalk.green(msg));
    io.emit('update_requested', "display message from update_requested");
  });
  socket.on('no_cabezal', function(msg) {
    console.log(chalk.green(msg));
    io.emit('no_cabezal', "display message from update_requested");
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
  //  var data_Tebs=await os.new_read_new_tebs();
  //  var data_Tebs2=await val.handleGetTebsBarcode(data_Tebs)
    //var data_Tebs=await ssp.verificar_existencia_de_bolsa(receptor);

  //    console.log(data_Tebs);
  console.log("forcing restart");
  process.exit(1);
  });
  /////////////////////////////////////////////////////////
  socket.on('cancelar_remesa',async function(data){
    console.log(chalk.yellow("Orden Cancelar remesa detectado"));
    await  os.validator_disabled_now();
    var mi_objeto=await os.carga_informacion_para_main();
    nuevo_enlace('main','../system/buffer.html',mi_objeto);
    // fs.readFile(path.join(__dirname, '../system/buffer.html'), 'utf8', function (err,data) {
    // if (err) {
    //   return console.log(err);
    // }
    // var vardata="vardata";
    //     var totaldata=[vardata,data];
    // io.emit('main',totaldata);
    //   });
   });
  socket.on('Cashbox_Unlock_Enable', function(msg) {
    io.emit('Cashbox_Unlock_Enable',"cashbox Unlocked");
  });
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
  socket.on('cancelling',async function(){
    console.log(chalk.yellow("canceling si funciono"));
    //ssp.emite_como_cliente();
    await  os.validator_disabled_now();
   // io.emit('main','../system/buffer.html');
   });

  socket.on('iniciar_nueva_remesa',async function(){
    new_manual_remesa= Math.floor((Math.random() * 10000) + 1);
    console.log(chalk.yellow("Nueva remesa manual iniciada"));
    const this_machine= await pool.query("SELECT * FROM machine");
    global.manual_remesa==true;
    os.crear_nueva_remesa(new_manual_remesa,this_machine[0].tienda_id,001,8888,tambox.fecha_actual(),tambox.hora_actual());
    //await  os.validator_enabled_now();
    //nuevo_enlace('iniciar_nueva_remesa','../system/remesa/remesa_1.html');
    io.emit('iniciando_remesa', "iniciando_remesa");
   });


   socket.on('pay_a_10',async function(){
      new_manual_pay= Math.floor((Math.random() * 10000) + 1);
      console.log(chalk.yellow("Nuevo pago manual ejecutado"));
      const this_machine= await pool.query("SELECT * FROM machine");
      global.manual_pay=true;
      os.crear_nuevo_pay_20(10,new_manual_pay,this_machine[0].tienda_id,001,8888,tambox.fecha_actual(),tambox.hora_actual());
     });

  socket.on('pay_a_20',async function(){
     new_manual_pay= Math.floor((Math.random() * 10000) + 1);
     console.log(chalk.yellow("Nuevo pago manual ejecutado"));
     const this_machine= await pool.query("SELECT * FROM machine");
     global.manual_pay=true;
     os.crear_nuevo_pay_20(20,new_manual_pay,this_machine[0].tienda_id,001,8888,tambox.fecha_actual(),tambox.hora_actual());
     //os.crear_nueva_remesa(new_manual_pay,this_machine[0].tienda_id,001,8888,tambox.fecha_actual(),tambox.hora_actual());
     //await  os.validator_enabled_now();
     //nuevo_enlace('iniciar_nueva_remesa','../system/remesa/remesa_1.html');
    //io.emit('realizando_pago', "realizando_pago");
    });

    socket.on('pay_a_60',async function(){
        new_manual_pay= Math.floor((Math.random() * 10000) + 1);
        console.log(chalk.yellow("Nuevo pago manual ejecutado"));
        const this_machine= await pool.query("SELECT * FROM machine");
        global.manual_pay=true;
        os.crear_nuevo_pay_20(60,new_manual_pay,this_machine[0].tienda_id,001,8888,tambox.fecha_actual(),tambox.hora_actual());
       });

  socket.on('pay_a_50',async function(){
      new_manual_pay= Math.floor((Math.random() * 10000) + 1);
      console.log(chalk.yellow("Nuevo pago manual ejecutado"));
      const this_machine= await pool.query("SELECT * FROM machine");
      global.manual_pay=true;
      os.crear_nuevo_pay_20(50,new_manual_pay,this_machine[0].tienda_id,001,8888,tambox.fecha_actual(),tambox.hora_actual());
     });
  socket.on('pay_a_100',async function(){
       new_manual_pay= Math.floor((Math.random() * 10000) + 1);
       console.log(chalk.yellow("Nuevo pago manual ejecutado"));
       const this_machine= await pool.query("SELECT * FROM machine");
       global.manual_pay=true;
       os.crear_nuevo_pay_20(100,new_manual_pay,this_machine[0].tienda_id,001,8888,tambox.fecha_actual(),tambox.hora_actual());
      });

      socket.on('pay_a_200',async function(){
         new_manual_pay= Math.floor((Math.random() * 10000) + 1);
         console.log(chalk.yellow("Nuevo pago manual ejecutado"));
         const this_machine= await pool.query("SELECT * FROM machine");
         global.manual_pay=true;
         os.crear_nuevo_pay_20(200,new_manual_pay,this_machine[0].tienda_id,001,8888,tambox.fecha_actual(),tambox.hora_actual());
        });

  socket.on('finish',async function(){
     console.log(chalk.yellow("Nueva remesa manual terminada"));
     try {
       await os.terminar_nueva_remesa(new_manual_remesa);
       await  os.validator_disabled_now();
       io.emit('remesa_finalizada', "remesa_finalizada");
      // nuevo_enlace('main','../system/buffer.html')
       // fs.readFile(path.join(__dirname, '../system/buffer.html'), 'utf8', function (err,data) {
       //
       // if (err) {
       //   return console.log(err);
       // }
       // var vardata="vardata";
       //     var totaldata=[vardata,data];
       //console.log(chalk.green("se emite socket:"+xid+ "variable:"+totaldata));
       io.emit('go_to_main','estoy aqui');
       // if(cb !== undefined){
       //     cb();
       // }

      //});
     } catch (e) {
       console.log("error de finish:"+e);
     }

    });
  socket.on('smart_empty', async function(msg) {
       on_remesa_hermes=true;
       console.log(chalk.green('will smart_empty:' + msg));
     //  await  ssp.transmite_encriptado_y_procesa(validator_address,smart_empty);
       nuevo_enlace('smart_empty','../system/remesa_hermes/rm_2.html');
       await synch_tbm.remote_update_rh(global.tebs_barcode);
       await os.begin_remesa_hermes();
       console.log("aqui salgo de smart emptyy pASO A RM2");
     });
  socket.on('Smart_emptied',function(){
       console.log(chalk.yellow("recibi smart emptied"));
       nuevo_enlace('Smart_emptied','../system/remesa_hermes/rm_3.html');
      });
  // socket.on('Cashbox_Back_in_Service',async function(){
  //   io.emit('lock_cashbox', "lock_cashbox");
  //       // console.log(chalk.yellow("Cashbox_Back_in_Service123"));
  //       // existe_bolsa=true;
  //       // if(on_remesa_hermes==true){
  //       //     nuevo_enlace('Cashbox_Back_in_Service','../system/remesa_hermes/rm_5.html');
  //       // }else{
  //       //   nuevo_enlace('Cashbox_Back_in_Service','../system/buffer.html');
  //       // }
  //      });
  socket.on('reciclador',async function(msg){
     var mi_objeto=await os.consulta_all_levels();
     console.log(mi_objeto);
     var solo_values=[
       mi_objeto[0].cantidad_de_billetes_en_reciclador.de10,
       mi_objeto[0].cantidad_de_billetes_en_reciclador.de20,
       mi_objeto[0].cantidad_de_billetes_en_reciclador.de50,
       mi_objeto[0].cantidad_de_billetes_en_reciclador.de100,
       mi_objeto[0].cantidad_de_billetes_en_reciclador.de200
     ];
     console.log("solo_values="+solo_values);
     var grupo=[mi_objeto[0].total_notes,solo_values,mi_objeto[1]]
     nuevo_enlace('reciclador','../system/reciclador/reciclador.html',grupo);

   });
  socket.on('cuadre_diario',async function(msg){
  console.log(chalk.yellow("socket on cuadre_diario"));
  //var soy_la_voz=await os.consulta_remesa_hermes_actual();
  var totales_cuadre_diarioyy= await os.calcular_cuadre_diario();
  console.log("totales_cuadre_diario:"+JSON.stringify(totales_cuadre_diarioyy));

  nuevo_enlace('cuadre_diario','../system/cuadre_diario/cuadre_diario.html',totales_cuadre_diarioyy);
  });
  socket.on('info',async function(msg){
   console.log(chalk.yellow("socket on info"));
   var this_machine3={
     machine_sn:numero_de_serie,
     Tebs_barcode:tebs_barcode,
     os_version:release_version,
     direccion_ip:machine_ip,
     ip_publico:global.public_machine_ip,
     puerto:machine_port,
     creado_por:machine_developer,
     soporte_tecnico:machine_support
   }
   console.log("vardata de info en este punto es:"+JSON.stringify(this_machine3));
   nuevo_enlace('info','../system/info/info.html',this_machine3);
  });
  socket.on('remesa_hermes',async function(msg){
  console.log(chalk.yellow("socket on remesa_hermes"));
  var soy_la_voz=await os.consulta_remesa_hermes_actual();
    //var this_ts=moment(new Date()).format("YYYY-MM-DD HH:mm:ss");
    var rh2=[];
    moment.locale("es");
      for (let rh of soy_la_voz){
         var formatear_ts_inicio=rh["ts_inicio"];
        rh["ts_inicio"]=moment(formatear_ts_inicio).format('LLL');
       //  var formatear_ts_fin=rh["ts_fin"];
       // rh["ts_fin"]=moment(formatear_ts_fin).format('LLL');
        //console.log(rh);
        rh2.push(rh);
      }


  //console.log("soy la voz es:"+JSON.stringify(soy_la_voz));
  nuevo_enlace('remesa_hermes','../system/remesa_hermes/rm_1.html',rh2);
  });
  socket.on('cifras_generales',async function(msg){
   console.log(chalk.yellow("socket on cifras_generales"));
   var thi_cifras_generales=await os.calcular_cifras_generales();
   console.log("vardata de cifras_generales es:"+JSON.stringify(thi_cifras_generales));
   nuevo_enlace('cifras_generales','../system/cifras_generales/cifras_generales.html',thi_cifras_generales);
  });
  socket.on('main',async function(msg){
    var mi_objeto=await os.carga_informacion_para_main();
    nuevo_enlace('main','../system/buffer.html',mi_objeto);
  });
  socket.on('retiro_en_proceso', function(msg) {
  //  window.location.replace("/retiro_en_proceso");
    var mi_objeto={ nombre:"pago"};
    nuevo_enlace('retiro_en_proceso','../system/retiro/retiro_en_proceso.html',mi_objeto);
  });
  socket.on('lock_machine', function(msg) {

    io.emit('lock_machine','lock_machine');
  });
  socket.on('adopt', function(msg) {
  console.log("machine adopted requested");
    io.emit('adopt','adopt');
  });
  socket.on('monto_exacto', function(msg) {
    console.log("monto_exacto");
    io.emit('monto_exacto','monto_exacto');
  });
  socket.on('pago_completado', function(msg) {
    console.log("pago_completado");
    io.emit('pago_completado','pago_completado');
  });
  socket.on('anuncio_saldo_insuficiente', function(msg) {
    console.log("anuncio_saldo_insuficiente");
    io.emit('anuncio_saldo_insuficiente','anuncio_saldo_insuficiente');
  });
  socket.on('reconectar_validador', function(msg) {
    console.log("reconectar_validador");
    io.emit('reconectar_validador','reconectar_validador');
  });
  socket.on('request_support_online', function(msg) {
    console.log("request_support_online");
    io.emit('request_support_online','request_support_online');
    to_tbm.socket_to_tbm.emit("request_support_online",global.numero_de_serie);
  });
  socket.on('close_serial_port', function(msg) {
    sp2.cerrar_puerto_serial();
    console.log("close_serial_port");
    // io.emit('close_serial_port','close_serial_port');
  });
  socket.on('open_serial_port', function(msg) {
    sp2.abrir_puerto_serial();
    console.log("open_serial_port");
    // io.emit('open_serial_port','open_serial_port');
  });

async function autostart(){
  console.log("this is autostart beginning");
  slave_count="00000000";
  ecount="00000000";
  zerox=false;
  ready_for_sending=true;
  console.log("ecount:",ecount+" slave_count:",slave_count);
  try {

  //   let step1=await tambox.finalizar_pagos_en_proceso();
  //   console.log(chalk.green("Operaciones Inconclusas fueron finalizadas:"+step1));
  //   console.log(chalk.green("Iniciando Validador"));
  //   var validator = await os.inicializar_validador();
  //   console.log(chalk.green("Validador inicio:" + validator));
  //   console.log(chalk.green("***************************************"));
  // //
     await os.obtener_datos_de_conexion();
     await os.habilita_sockets();
     await os.comprobar_serialcom();
     await os.arranca_tambox_os();
  //
  //   await sspx.sync_and_stablish_presence_of(global.validator_address);
  //   await sspx.negociate_encryption(global.validator_address);
  //   console.log("end of restart");
  //   var step1xy=await sp2.transmision_insegura(receptor,synch) //<------------------------------ synch
  //   console.log(chalk.yellow(device+'<-:'), chalk.yellow(step1xy));
  //   var step2=await sspx.handlesynch(step1xy);
  //   if (show_details) {
  //     console.log(chalk.yellow(device+'<-:'), chalk.yellow(step2));
  //   }
  //
  //    await synch_tbm.are_synched();
  //   var data=await os.consulta_all_levels();
//      console.log("all levels es:"+JSON.stringify(data[0].cantidad_de_billetes_en_reciclador));
  } catch (e) {
    console.log(chalk.magenta.inverse("error General de OS:"+e));
  }finally{
    ultimo_valor_enviado="Poll loop";
    await os.idle_poll_loop();
    console.log(chalk.green("El sistema arranco sin problemas, iniciando Poll loop"));
    console.log(chalk.green("idle"));
    return;
    //  io.emit('open_serial_port','open_serial_port');
  }


}
module.exports.autostart=autostart;

  socket.on('initialize_validator', async function(msg) {
    await autostart();
  //  await os.arranca_tambox_os();
  //  console.log("initialize_validator");
  //  io.emit('initialize_validator','initialize_validator');
  });
  socket.on('send_synch', async function(msg) {
      console.log("sending synch via serialport to de validator");
      var step1xy=await sp2.transmision_insegura(receptor,synch) //<------------------------------ synch
      console.log(chalk.yellow(device+'<-:'), chalk.yellow(step1xy));
      var step2=await sspx.handlesynch(step1xy);
      if (show_details) {
        console.log(chalk.yellow(device+'<-:'), chalk.yellow(step2));
      }
      os.logea_a_client_side(device+'<-:'+step2)
      // setTimeout(async function () {
      //   var data=await os.consulta_all_levels();
      //   console.log(chalk.green("all levels es:"+JSON.stringify(data[0].cantidad_de_billetes_en_reciclador)));
      // }, 300);

  });

  socket.on('send_enable_from_ui', async function(msg) {
      console.log("sending enable via serialport to de validator");
      var step1xy=await sp2.transmision_insegura(receptor,enable) //<------------------------------ synch
      console.log(chalk.yellow(device+'<-:'), chalk.yellow(step1xy));
      os.logea_a_client_side("enable ->:"+step1xy);

  });
  socket.on('send_desable_from_ui', async function(msg) {
      console.log("sending desable via serialport to de validator");
      var step1xy=await sp2.transmision_insegura(receptor,desable) //<------------------------------ synch
      console.log(chalk.yellow(device+'<-:'), chalk.yellow(step1xy));
      os.logea_a_client_side("desable ->:"+step1xy);
  });
  socket.on('send_all_levels_from_ui', async function(msg) {
      console.log("sending get_all_levels via serialport to de validator");
    //  os.logea_a_client_side("send_all_levels_from_ui ->:"+msg);
      //var step1xy=await sp2.transmision_insegura(receptor,get_all_levels) //<------------------------------ synch
      //console.log(chalk.yellow(device+'<-:'), chalk.yellow(step1xy));
         var data=await os.consulta_all_levels();
         console.log(chalk.green("all levels es:"+JSON.stringify(data[0].cantidad_de_billetes_en_reciclador)));
         os.logea_a_client_side("send_all_levels_from_ui ->:"+JSON.stringify(data[0]));
  });

  socket.on('encripted_poll', async function(msg) {
      console.log("sending get_all_levels via serialport to de validator");
       var estox=await os.validatorpoll2(validator_address);
       console.log(estox);
       await tebs_events.handle_evento(estox);
       os.logea_a_client_side("encripted_poll ->:"+estox);
      //var step1xy=await sp2.transmision_insegura(receptor,get_all_levels) //<------------------------------ synch
      //console.log(chalk.yellow(device+'<-:'), chalk.yellow(step1xy));
      //   var data=await os.consulta_all_levels();
    //     console.log(chalk.green("all levels es:"+JSON.stringify(data[0].cantidad_de_billetes_en_reciclador)));

  });
  socket.on('reset_from_ui', async function(msg) {
      console.log("sending reset_from_ui via serialport to de validator");
      var step1xy=await sp2.transmision_insegura(receptor,reset) //<------------------------------ synch
      console.log(chalk.yellow(device+'<-:'), chalk.yellow(step1xy));
       os.logea_a_client_side("reset_from_ui ->:"+msg);
  });
  socket.on('stop_polling_from_ui', async function(msg) {
      console.log("sending stop_polling_from_ui via serialport to de validator");
      clearTimeout(os.myTimeout);
       os.logea_a_client_side("stop_polling_from_ui ->:"+msg);
  });
  socket.on('online_from_ui', async function(msg) {
      //console.log("sending online_from_ui via serialport to tbm");
    //  clearTimeout(os.myTimeout);
      to_tbm.socket_to_tbm.emit('online', numero_de_serie);
       os.logea_a_client_side("online_from_ui ->:"+msg);
  });

  var this_machine = await pool.query("SELECT * FROM machine");
  var this_passcode=this_machine[0].passcode
  var config_data={
    current_tebs:"global.current_tebs"
  }
  var pass_code_data={
    pass_code:this_passcode
  }
// os.conectar_enlace_de(socket,'config','../system/configuracion.html',config_data);
os.conectar_enlace_de(socket,'Smart_emptied','../system/remesa_hermes/rm_3.html',"null");
os.conectar_enlace_de(socket,'cashbox_unlocked','../system/remesa_hermes/rm_4.html',"null");
os.conectar_enlace_de(socket,'Cashbox_Back_in_Service','../system/remesa_hermes/rm_5.html',"null");

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

  super_enlace('config','config','../system/configuracion.html',config_data);
  super_enlace('Smart_emptying','../system/remesa_hermes/rm_2.html');
  super_enlace('security_page','security_page','../system/security_page.html',pass_code_data);

})
}
 // await pool.query("SELECT * FROM remesas WHERE status='terminado' ");
