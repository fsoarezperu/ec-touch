const ssp = require('./../ssp');
const server = require('./../../server');
const it = require('./tambox');
const sp = require('./../serial_port');
const enc = require('./../encryption');
const chalk=require('chalk');
const glo = require('./../globals');
const va = require('./validator');

///////////////////////////////////////////////////////////
function start_smart_hopper() {
  return new Promise( async function(resolve, reject) {
    try {
      os.logea(chalk.green("starting_smart_hopper"));
      os.logea("/////////////////////////////////");
      var stat=await ssp.sync_and_stablish_presence_of(smart_hopper_address);
      if (stat=="OK") {
        var step2=await ssp.negociate_encryption(smart_hopper_address);
             if (step2=="OK") {
                var step3= await hopperpoll(smart_hopper_address);
                 if (step3=="OK") {
                   var step4= await ssp.set_protocol_version(smart_hopper_address,hopper_protocol_version);
                   if (step4=="OK") {
                     var step5= await ssp.setup_request_command(smart_hopper_address);
                     if (step5=="OK") {
                       var step6= await set_hopper_routing(smart_hopper_address);
                       if (step6=="OK") {
                           var step7=await enable_hopper(smart_hopper_address);
                            if (step7=="OK") {
                            //  await carga_monedas_al_hopper(smart_hopper_address);
                             var step8=await hopperpoll_loop(smart_hopper_address);
                             console.log("step8:"+step8);
                            }
                           //var step7= await get_all_levels_hopper(smart_hopper_address);
            //             //

                       }
                     }
                   }
                 }
            //   console.log("Sale por aqui sin problema")
            //     return resolve("OK");
             }else {
                   reject(step2)
                 }

      }else {
        reject(stat)
      }
    } catch (e) {
      console.log(e);
    } finally {
      console.log("error2");
    }


  });

}
module.exports.start_smart_hopper=start_smart_hopper;
///////////////////////////////////////////////////////////
function set_hopper_routing(receptor) {
  os.logea(chalk.yellow("ROUTING COINS"));
  return new Promise(async function(resolve, reject) {
  await ssp.envia_encriptado(receptor,send_10_centimos_a_reciclaje);
  await ssp.envia_encriptado(receptor,send_20_centimos_a_reciclaje);
  await ssp.envia_encriptado(receptor,send_50_centimos_a_reciclaje);
  await ssp.envia_encriptado(receptor,send_1_sole_a_reciclaje);
  await ssp.envia_encriptado(receptor,send_2_soles_a_reciclaje);
  await ssp.envia_encriptado(receptor,send_5_soles_a_reciclaje);
  resolve("OK")
  });
};
////////////////////////////////////////////////////////
function enable_hopper(receptor) {
 return new Promise( async function(resolve, reject) {
     console.log("Enable HOPPER");
     await ssp.envia_encriptado(receptor,global.poll);
     await ssp.envia_encriptado(receptor,global.enable);
     await ssp.envia_encriptado(receptor,global.poll);
     await ssp.envia_encriptado(receptor,global.poll);
     return resolve("OK");
 });
}
////////////////////////////////////////////////////////
function hopperpoll(receptor) {
return  new Promise(async function(resolve, reject) {
    var step1= await ssp.envia_encriptado(receptor,global.poll);
    if(step1.length>0){
      await handle_poll_hopper(step1);

      return resolve("OK");
    }else {
      return reject(step1);
    }
  });
} //hace consulta de poll pero no hace bucle
////////////////////////////////////////////////////////
async function hopperpoll_loop(receptor) {
  await ensureIsReadyForPolling()
  if (ready_for_pooling==true) {
    ready_for_pooling=false;
    return  new Promise(async function(resolve, reject) {
        var step1= await ssp.envia_encriptado(receptor,global.poll);
        if(step1.length>0){
          await handle_poll_hopper(step1);
          setTimeout(async function () {
            console.log(chalk.green("POLLING"));
            await hopperpoll_loop(receptor)
          }, 3000);
          ready_for_pooling=true;
          return resolve("OK");
        }else {
          return reject(step1);
        }
      });

  }else {
    console.log("ready for polling NOT READY");
  }
}// hace consulta de poll y reinicia ciclicamente.
////////////////////////////////////////////////////////
function spread(mensaje) {
  console.log(chalk.cyan(mensaje));
  server.io.emit(mensaje, mensaje);
}
////////////////////////////////////////////////////////
function handle_poll_hopper(data){
  var passingby=data;
  console.log("data en handle pool es:"+data);
  return new Promise(function(resolve, reject) {
    var poll_responde=data.match(/.{1,2}/g);
    var data_length_on_pool=parseInt(poll_responde[0]);
    data_length_on_pool=data_length_on_pool+1;
    poll_responde=poll_responde.slice(0,data_length_on_pool);
    //console.log(data_length_on_pool);
       console.log(poll_responde);
     if(poll_responde == undefined || poll_responde.length < 1){
       console.log("ERROR Receiving data");
       reject();
           }else{
             for (var i =1; i<poll_responde.length; i++ )
                {
                //  console.log(poll_responde[i]);
                  switch(poll_responde[i])

               {
                  // case("90"):
                  // console.log(chalk.red.inverse("Cashbox out of Service"));
                  // io.io.emit('Cashbox_out_of_Service', "Cashbox out of Service");
                  // break;
                  // case("92"):
                  // console.log(chalk.red.inverse("Cashbox Back in Service"));
                  // io.io.emit('Cashbox_Back_in_Service', "Cashbox Back in Service");
                  // break;
                  // case("B0"):
                  // console.log(chalk.red.inverse("Jam recovery"));
                  //   io.io.emit('Jam_recovery', "Jam recovery");
                  // break;
                  // case("B3"):
                  //  console.log(chalk.red.inverse("Smart emptying"));
                  //    io.io.emit('Smart_emptying', "Smart emptying");
                  // break;
                  // case("B4"):
                  // console.log(chalk.red.inverse("Smart emptied"));
                  // //read event data
                  // var value_in_hex=data.substr(8,8);
                  // value_in_hex=enc.changeEndianness(value_in_hex);
                  // value_in_hex=value_in_hex.toString(10);
                  //  console.log(value_in_hex);
                  //  var prefix="0x";
                  //  value_in_hex=prefix.concat(value_in_hex);
                  //  value_in_hex=parseInt(value_in_hex);
                  //  value_in_hex=value_in_hex/100;
                  //  console.log(value_in_hex);
                  // //value dispensed:
                  // io.io.emit('Smart_emptied', "Smart emptied");
                  // break;
                  case("C2"):
                  console.log(chalk.cyan("emptying"));
                  server.io.emit('emptying', "emptying");
                  break;
                  case("C3"):
                  console.log(chalk.cyan("emptied"));
                  server.io.emit('emptied', "emptied");
                  break;
                  case("D3"):
                  console.log(chalk.cyan("Pocas Monedas"));
                  server.io.emit('pocas_monedas', "pocas_monedas");
                  break;
                  case("D5"):
                  console.log(chalk.cyan("Atorado"));
                  server.io.emit('atorado', "atorado");
                  break;
                  case("DC"):
                  console.log(chalk.cyan("Pago Incompleto"));
                  server.io.emit('pago_incompleto', "pago_incompleto");
                  break;
                  //traduce("DC","pago_incompleto");
                   case("DF"):
                  spread("moneda_agregada")
                   break;

                  case("E8"):
                   console.log(chalk.red(device+" Disabled"));
                  break;
                  case("F0"):
                     console.log(chalk.green("OK"));
                  break;

                  case("F5"):
                  console.log(chalk.green("No puede ser procesado"));
                  break;
                }//switch closing
              }//switch closing
             }//end of FOR loop

            // enable_sending();
      console.log(chalk.green("POLLING END"));
        console.log(chalk.green("////////////////////////"));
      return resolve(passingby);


  });
}
module.exports.handle_poll_hopper=handle_poll_hopper;
function promise_handlePoll(data){
   console.log("iniciando handlePoll");
  return new Promise((resolve,reject)=>{
      var poll_responde=data.match(/.{1,2}/g);
       if(poll_responde == undefined || poll_responde.length < 1){
         console.log("ERROR Receiving data");
         reject();
       }else{
         var i;
         for (i=1; i< poll_responde.length; i++ )
            {
              switch(poll_responde[i])
           {
              // case("90"):
              // console.log(chalk.red.inverse("Cashbox out of Service"));
              // io.io.emit('Cashbox_out_of_Service', "Cashbox out of Service");
              // break;
              // case("92"):
              // console.log(chalk.red.inverse("Cashbox Back in Service"));
              // io.io.emit('Cashbox_Back_in_Service', "Cashbox Back in Service");
              // break;
              // case("B0"):
              // console.log(chalk.red.inverse("Jam recovery"));
              //   io.io.emit('Jam_recovery', "Jam recovery");
              // break;
              // case("B3"):
              //  console.log(chalk.red.inverse("Smart emptying"));
              //    io.io.emit('Smart_emptying', "Smart emptying");
              // break;
              // case("B4"):
              // console.log(chalk.red.inverse("Smart emptied"));
              // //read event data
              // var value_in_hex=data.substr(8,8);
              // value_in_hex=enc.changeEndianness(value_in_hex);
              // value_in_hex=value_in_hex.toString(10);
              //  console.log(value_in_hex);
              //  var prefix="0x";
              //  value_in_hex=prefix.concat(value_in_hex);
              //  value_in_hex=parseInt(value_in_hex);
              //  value_in_hex=value_in_hex/100;
              //  console.log(value_in_hex);
              // //value dispensed:
              // io.io.emit('Smart_emptied', "Smart emptied");
              // break;
              case("C2"):
              console.log(chalk.cyan("emptying"));
              server.io.emit('emptying', "emptying");
              break;
              case("C3"):
              console.log(chalk.cyan("emptied"));
              server.io.emit('emptied', "emptied");
              break;
              // case("C9"):
              // console.log(chalk.cyan("Note Transfered to Stacker"));
              // io.io.emit('Note_Transfered_to_Stacker', "Note Transfered to Stacker");
              // break;
              // case("E8"):
              //  console.log(chalk.red(device+" Disabled"));
              // break;
              case("F0"):
                console.log(chalk.green("OK"));
                var puntero=1;
                var no_denominations=poll_responde[i+puntero];
                var valores=[];
                console.log("no_denominations:"+no_denominations);
                for (var ia = 0; ia < (parseInt(no_denominations)); ia++) {
                  console.log("denomination:"+(ia+1));
                  var centena=2
                  var decena=1
                  var cantidad_en_hex=(poll_responde[i+(puntero+centena)]+poll_responde[i+(puntero+decena)]);
                  var cantidad_en_dec=ssp.hex_to_dec(cantidad_en_hex);
                  // console.log(cantidad_en_hex);
                  // var cantidad_en_bin=ssp.ConvertBase.hex2bin(cantidad_en_hex);
                  // console.log(cantidad_en_bin);
                  // var cantidad_en_dec=ssp.ConvertBase.bin2dec(cantidad_en_bin);
                  // console.log(cantidad_en_dec);
                  valores.push(cantidad_en_dec)
                  puntero=puntero+9;
                }

              break;
            }//switch closing
          }//for closing
        }//iF closing
      return resolve(valores);
      });
}
module.exports.promise_handlePoll=promise_handlePoll;
////////////////////////////////////////////////////////

////////////////////////////////////////////////////////
function get_all_levels_hopper(receptor){
  return new Promise(async function(resolve, reject) {
  //  var here=await handle_all_levels_hopper(await ssp.envia_encriptado(receptor,get_all_levels));
    var here=await ssp.envia_encriptado(receptor,get_all_levels);
  //  var here2=await carga_monedas_al_hopper();
    console.log("here:"+here2);
    return resolve("OK");
  });

}
function carga_monedas_al_hopper(receptor){
return new Promise(async function(resolve, reject) {
  var pol1=await transmite(receptor,set_coin_amount_10c);
  console.log("pol1:"+pol1);
   await ssp.envia_encriptado(receptor,set_coin_amount_20c);
   await ssp.envia_encriptado(receptor,set_coin_amount_50c);
   await ssp.envia_encriptado(receptor,set_coin_amount_1s);
   await ssp.envia_encriptado(receptor,set_coin_amount_2s);
   await ssp.envia_encriptado(receptor,set_coin_amount_5s);
   return resolve("OK");
});


  // console.log("handling all levels hopper");
  // sp.canal_liberado();
  // // poll_hopper(receptor);
  // super_comando(receptor,set_coin_amount_10c)
  // .then(data =>{
  //   console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));
  //   os.logea("//////////////////////////////////////////");
  //   return enc.promise_handleEcommand(data)
  // })
  // .then(data => {
  // //os.logea(chalk.yellow(device+'<-:'), chalk.yellow(data));
  // console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));
  // os.logea("RESULT:"+data);
  // return super_comando(receptor,set_coin_amount_20c)
  // })
  // .then(data =>{
  //   console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));
  //   return enc.promise_handleEcommand(data)
  // //  return super_comando(receptor,set_coin_amount_50c)
  // })
  // .then(data =>{
  //   console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));
  //   return super_comando(receptor,set_coin_amount_1s)
  // })
  // .then(data =>{
  //   console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));
  //   return super_comando(receptor,set_coin_amount_2s)
  // })
  // .then(data =>{
  //   console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));
  //   return super_comando(receptor,set_coin_amount_5s)
  // })
  // .then(data =>{
  //   console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));
  //
  // })
  // .catch(function(error) {console.log(error);sp.retrial(error);});
}
////////////////////////////////////////////////////////


// function poll_hopper(receptor){
//   //setTimeout(function () {
//     ssp.ensureIsSet().then(async function() {
//         server.io.emit('system_running_indicator'); //indica el punto intermitente en interface para notar que el programa esta corriendo adecuadamente.
//         //  io.emit('tog_validator');
//
//         if (ready_for_sending) {
//             os.logea(chalk.green('ready for sending is:'),chalk.green(ready_for_sending));
//           if (ready_for_pooling) {
//              os.logea(chalk.cyan('ready for pooling is:'),chalk.green(ready_for_pooling));
//             os.logea(chalk.magentaBright("HOPPER POLL"));
//             // logea(chalk.magentaBright('POLL command sent'));
//             clearTimeout(sp.timer2);
//             //console.log(chalk.red("justo antes de supercomando, poll tiene el valor de:"+poll));
//              super_comando(receptor,global.poll)
//             .then(data =>{
//               os.logea(chalk.yellow("and also from here"+device+'<-:'), chalk.yellow(data));
//               sp.canal_liberado();
//               //poll_hopper(receptor);
//               setTimeout(function(){
//                 poll_hopper(receptor);}, 800);
//             })
//                   .catch(function(error) {console.log(error);sp.retrial(error);});
//           } else {
//             console.log("poll 1 disabled");
//             //  ready_for_pooling=true; // este lo calmbie al ultimo billete perdido
//           } // end of if
//         } else {
//           console.log("ready for sending is off");
//         }
//       //  global.polltimer = setTimeout(poll_hopper(receptor), 300); //auto renew the poll trigger;
//       }) //fin del promise
//       .catch(function(error) {console.log(error);sp.retrial(error);});
//   //}, 1000);
// }


////////////////////////////////////////////////////////
function super_comando(receptorx,poll){
return new Promise(function(resolve, reject) {
  //  pollx[0]=parseInt(receptorx) ;
    toSend = enc.prepare_Encryption(poll);
    sp.transmision_insegura(receptorx,toSend)
      .then(data =>{return enc.promise_handleEcommand(data)})
      .then(async function(data){os.logea(chalk.yellow("from here"+device+'<-:'), chalk.yellow(data));return await va.handle_poll_validator(data)})
      .then(data=>{return resolve(data);})
      .catch(function(error) {console.log(error);sp.retrial(error);});
});
}
module.exports.super_comando=super_comando;
function transmite(a_quien, orden){

      return  new Promise(async function(resolve, reject) {
        sp.disable_hopper_pooling();
        var dato=await super_comando(a_quien,orden)
        console.log("dato:"+dato);
        //var pol=await promise_handlePoll(dato);
        var pol=await va.handle_poll_validator(dato);

        console.log("pol:"+pol);
        sp.enable_hopper_pooling();
        return resolve(pol);
      });
}
module.exports.transmite=transmite;
/////////////////////////////////////////////////////////
function mandate_al_hopper(esto) {
  return new Promise( async function(resolve, reject) {
    sp.disable_hopper_pooling();
    super_comando(smart_hopper_address,esto).then(data =>{return enc.promise_handleEcommand();}).then(async function(data){return await ssp.handlepoll(data);})
    .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));sp.enable_hopper_pooling();return resolve(data)})
  });
}
module.exports.mandate_al_hopper= mandate_al_hopper;
//////////////////////////////////////////////////////////
