const sp = require('./../serial_port');
const ssp = require('./../ssp');
const to_tbm=require('./../tbm_sync/tbm_synch_socket');
const server = require('./../../server');
const it = require('./tambox');
const enc = require('./../encryption');
const chalk=require('chalk');
const glo = require('./../globals');
const pool = require('./../../database');
const os = require('./../os');
///////////////////////////////////////////////////////////
async function arranque_sin_bolsa(){
//  var variable1=glo.si_existe_bolsa;

  console.log("aqui estoy entrando a arranque sin bolsa y la variable es si_existe_bolsa="+global.si_existe_bolsa);

  if (global.si_existe_bolsa==false){
    await validatorpoll(validator_address);
    console.log("si existe bolsa es:"+global.si_existe_bolsa);
  }else {
    console.log(chalk.yellow("variable si_existe_bolsa fue detectada y estoy retornando OK para continuar"));
    return "OK";
  }
//  arranque_sin_bolsa();
   setTimeout(arranque_sin_bolsa,200);
}

function start_validator() {
  return new Promise( async function(resolve, reject) {
    os.logea(chalk.green("starting_validator"));
    os.logea("/////////////////////////////////");
    try {

      var stat=await ssp.sync_and_stablish_presence_of2(validator_address);
      if (stat=="OK") {
      var step2=await ssp.negociate_encryption(validator_address);
              if (step2=="OK") {
            //  await  setTimeout(async function(){
                  var step3= await validatorpoll(validator_address);
                  console.log("step3 es:"+step3);
              //  },9000);
                //  var step3= await arranque_sin_bolsa();
                  //  console.log(chalk.red("volviendo de arranque en bolsa step3="+step3));
                   if (step3=="OK") {
                 //return reject("TERMINADO");
                  ultimo_valor_enviado="set protocol version"
                   var step4= await ssp.set_protocol_version(validator_address,validator_protocol_version);
                //   console.log("step4:"+step4);
                     if (step4=="OK") {
                      var step5= await ssp.setup_request_command(validator_address);
                  //   console.log("step5"+step5);
                     if (step5=="OK") {
                       var step5_1= await set_channel_inhivits(validator_address);
                       if (step5_1=="OK") {
                                     var step6= await set_validator_routing(validator_address);
                                     if (step6=="OK") {
                                       //verificar registro de maquina.
                                            to_tbm.iniciar_handshake_con_tbm();
                                            var regis=await os.is_this_machine_registered();
                                            console.log("resgistered is:"+regis);
                                            if (regis[0]=="machine_found_on_tbm") {
                                              console.log("encontraron una maquina en TBM con este codigo, asi que actualizare mi base de datos en funcion a esa nueva data");
                                            //console.log(regis[1].tienda_id);
                                            //  remesa =
                                            var x1=regis[1].tienda_id;
                                            var x2=regis[1].machine_sn;
                                            var x3=regis[1].machine_name;

                                            console.log("x1 es:"+x1);
                                            console.log("x2 es:"+x2);
                                            console.log("x3 es:"+x3);

                                            await pool.query("UPDATE machine SET tienda_id=?, machine_name=? WHERE machine_sn=?", [x1,x3,x2]);
                                              console.log("luego del check in se actualizo el valor de tienda id a:"+regis[1].tienda_id);
                                              //   var my_resgistered_machine=await os.query_this_machine();
                                              //   //my_resgistered_machine=my_resgistered_machine[1];
                                              //   os.logea(chalk.green("query:"+my_resgistered_machine));
                                              //   console.log("Machine registered name:"+chalk.yellow(my_resgistered_machine.name));
                                              //   await pool.query ("UPDATE machine SET is_registered=1, machine_name=?",[my_resgistered_machine.name]);
                                              //   glo.my_resgistered_machine_name=my_resgistered_machine.name;

                                              //   var step7=await enable_payout(validator_address);
                                              //    if (step7=="OK") {
                                              //    //  await carga_monedas_al_hopper(validator_address);
                                              //    console.log(chalk.green("payout enabled"));
                                              //     // on_startup=false;
                                              //     var step8=await validator_poll_loop(validator_address);
                                              //     os.logea(glo.is_regis);
                                              //     return resolve("OK");
                                              //    }
                                            }
                                         if(regis=="OK"){
                                        // //  console.log("entro por aqui");
                                        //   glo.is_regis=true;
                                        //
                                        console.log(chalk.green("Registro de maquina nueva realizado:"+regis));
                                        //   //var my_resgistered_machine=JSON.parse(await server.query_this_machine());
                                        //   var my_resgistered_machine=await os.query_this_machine();
                                        //   //my_resgistered_machine=my_resgistered_machine[1];
                                        //   os.logea(chalk.green("query:"+my_resgistered_machine));
                                        //   console.log("Machine registered name:"+chalk.yellow(my_resgistered_machine.name));
                                        //   await pool.query ("UPDATE machine SET is_registered=1, machine_name=?",[my_resgistered_machine.name]);
                                        //   glo.my_resgistered_machine_name=my_resgistered_machine.name;
                                        //     //server.io.emit("iniciando","iniciando sistema");
                                        //   var step7=await enable_payout(validator_address);
                                        //    if (step7=="OK") {
                                        //    //  await carga_monedas_al_hopper(validator_address);
                                        //    console.log(chalk.green("payout enabled"));
                                        //     // on_startup=false;
                                        //     var step8=await validator_poll_loop(validator_address);
                                        //     os.logea(glo.is_regis);
                                        //     return resolve("OK");
                                        //    }
                                         }else {
                                           glo.is_regis=false;
                                        //   //  await pool.query ("UPDATE machine SET is_registered=0");
                                        //     //server.io.emit("iniciando","iniciando sistema");
                                        //console.log(global.machine_ip);
                                             await pool.query("UPDATE machine SET machine_sn=?,machine_ip=?,machine_port=?,public_machine_ip=?", [glo.numero_de_serie, global.machine_ip, global.machine_port, global.public_machine_ip]);
                                             var esty= await pool.query("SELECT machine_name FROM machine");
                                             esty=esty[0].machine_name
                                             glo.my_resgistered_machine_name=esty;
                                             console.log(chalk.green("no se pudo sincronizar en Tambox Cloud,Esta maquina ya esta registrada con nombre:")+chalk.yellow(glo.my_resgistered_machine_name));

                                               var step7=await enable_payout(validator_address);
                                                if (step7=="OK") {
                                            //    //  await carga_monedas_al_hopper(validator_address);
                                            //    //console.log(chalk.green("payout enabled in here"));
                                            //    // creo que aqui puedo poner las funciones que cargan y consultan las cifras genrales y el cuadre diario y guardarlo en las
                                            //    // variables globales para que puedan ser mostrados en pantalla , seria genial tener opcion que se ejecute cuanda esa pantalla se va a cargar.
                                            //
                                            //   //  var cifras_generales_actuales=os.calcular_cifras_generales2();
                                            //   //   console.log(chalk.cyan("////////////////////////////////////////////"));
                                            //   //   console.log(chalk.cyan("Cifras Generales obtenidas son:"+JSON.stringify(cifras_generales_actuales)));
                                            //   // //  console.log(chalk.cyan();
                                            //   //   console.log(chalk.cyan("////////////////////////////////////////////"));
                                            //
                                            //
                                                var step8=await validator_poll_loop(validator_address);
                                                os.logea(chalk.green("Inicio poll loop:"+step8));
                                                return resolve("OK");
                                                 }
                                         }
                                    }
                            }
                         }
                     }
                     console.log("TODO OK");
                  //return reject("")
                }else{
                  //entra aqui cuando en el arranque se consulta y muestra un valor que requiere de alguna accion, x ejemplo, cuando no hay bolsa en la caja al momento del arranque.
                  console.log("step3 received is:"+step3);
                  await validator_poll_loop(validator_address);
                }
               }
      //  var stat=await ssp.negociate_encryption(smart_hopper_address);
    //  console.log("y esto?"+stat);
      }else {
      return  reject("cannot stablish presence of validator");
      }
    } catch (e) {
      return reject(chalk.cyan("02-Start Validator->")+e);
    }
  });

}
module.exports.start_validator=start_validator;
///////////////////////////////////////////////////////////
////////////////////////////////////////////////////////
async function validatorpoll(receptor) {
  //console.log("aqui cambio la promesa de validator poll");
   try {
    //  console.log("aqui global.poll:"+global.poll);
      var step1= await ssp.envia_encriptado(receptor,global.poll);
    //  console.log("step1x:" +step1);
      // await  setTimeout(async function(){
           var data=await ssp.handlepoll(step1);

           // if (si_existe_bolsa==false) {
           //   await validatorpoll(receptor)
           // }else {
           //   return data
           // }

           //console.log("esto se dispara al recibir handlepoll");
          // console.log(data);
      //   },100);
        return "OK";
      //  return data;
     } catch (e) {
    //   return e;
     }

  }; //hace consulta de poll pero no hace bucle
  module.exports.validatorpoll=validatorpoll;
////////////////////////////////////////////////////////
////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
function set_validator_routing(receptor) {
  os.logea(chalk.yellow("ROUTING bills"));
  return new Promise(async function(resolve, reject) {
  var step1=await ssp.envia_encriptado(receptor,send_10_soles_a_cashbag);
//  console.log("step1:"+step1);
 var step2=await ssp.envia_encriptado(receptor,send_20_soles_a_payout);
//   console.log("step2:"+step2);
 var step3=await ssp.envia_encriptado(receptor,send_50_soles_a_payout);
//   console.log("step3:"+step3);
 var step4=await ssp.envia_encriptado(receptor,send_100_soles_a_payout);
//   console.log("step4:"+step4);
 var step5=await ssp.envia_encriptado(receptor,send_200_soles_a_cashbag);
//   console.log("step5:"+step5);
 //var step6=await ssp.envia_encriptado(receptor,send_5_soles_a_reciclaje);
//   console.log("step6:"+step6);
  return resolve("OK")
  });
};
////////////////////////////////////////////////////////
function set_channel_inhivits(receptor) {
  os.logea(chalk.yellow("CHANNELS INHIVITs"));
  return new Promise(async function(resolve, reject) {
  await ssp.envia_encriptado(receptor,set_inhivits);
  return resolve("OK")
  });
};
////////////////////////////////////////////////////////
// function enable_validator(receptor) {
//  return new Promise( async function(resolve, reject) {
//      console.log("Enable VALIDATOR");
//      await ssp.envia_encriptado(receptor,global.poll);
//      await ssp.envia_encriptado(receptor,global.enable);
//      await ssp.envia_encriptado(receptor,global.poll);
//      await ssp.envia_encriptado(receptor,global.poll);
//      return resolve("OK");
//  });
// }
////////////////////////////////////////////////////////
function enable_payout(receptor) {
 return new Promise( async function(resolve, reject) {
     os.logea("Enable payout");
     await ssp.envia_encriptado(receptor,global.poll);
     await ssp.envia_encriptado(receptor,global.enable_payout);
     await ssp.envia_encriptado(receptor,global.poll);
     await ssp.envia_encriptado(receptor,global.poll);
     return resolve("OK");
 });
}
////////////////////////////////////////////////////////
async function validator_poll_loop(receptor) {
  await ssp.ensureIsReadyForPolling()
  if (ready_for_pooling==true) {
    ready_for_pooling=false;
    return  new Promise(async function(resolve, reject) {
        var step1= await ssp.envia_encriptado(receptor,global.poll);
        if(step1.length>0){
          await ssp.handlepoll(step1);
          setTimeout(async function () {
            os.logea("//////////////////////////////");
            os.logea(chalk.green("VALIDATOR POLLING"));
            await validator_poll_loop(receptor)
          }, 300);
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
  module.exports.validator_poll_loop=validator_poll_loop;
////////////////////////////////////////////////////////
// async function get_tebs_barcode(receptor) {
//     return  new Promise(async function(resolve, reject) {
//       console.log("entro aqui");
//         var step1= await sh.super_comando(receptor,global.get_barcode_data);
//         console.log("salgo aqui:"+step1);
//         if(step1.length>0){
//           await handleGetTebsBarcode(step1);
//           // setTimeout(async function () {
//           //   console.log(chalk.green("VALIDATOR POLLING"));
//           //   await validator_poll_loop(receptor)
//           // }, 300);
//           //ready_for_pooling=true;
//           return resolve("OK");
//         }else {
//           return reject(step1);
//         }
//       });
//
//
// }// hace consulta de poll y reinicia ciclicamente.
////////////////////////////////////////////////////////
function handleGetTebsBarcode(data){
  tebs_barcode="";
  return new Promise(function(resolve, reject) {
    try {
      var number_of_byte = ssp.get_count_bytes_received();
      console.log("number_of_byte:"+number_of_byte);
      var myData = received_command.substr(2, number_of_byte + 2);
      var pointer = 0;
      for (var countery = 0; countery < 10; countery++) {
        pointer = pointer + 2;
        var i = myData.substr(pointer, 2);
        i = ssp.ConvertBase.hex2bin(i);
        i = ssp.ConvertBase.bin2dec(i);
        if (i < 10) {
          i = ssp.pad(i);
        } else {
          i = i;
        }

        // console.log("tebs_barcode current value is:"+tebs_barcode);
        tebs_barcode = tebs_barcode.concat(i);
      }
      current_tebs_barcode=tebs_barcode;
        console.log(chalk.green("tebs barcode is:" + tebs_barcode));
      return resolve(tebs_barcode);

    } catch (e) {
      return reject(e);
    } finally {

    }
  });
}
module.exports.handleGetTebsBarcode=handleGetTebsBarcode;
/////////////////////////////////////////////////////////
