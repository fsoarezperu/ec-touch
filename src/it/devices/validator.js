// const server = require('./server');
// const ssp = require('./it/ssp');
// const glo = require('./globals');
// ///////////////////////////////////////////////////////////
// exports.start_validator=function(){
//   console.log("starting_smart_hopper");
//   os.logea("/////////////////////////////////");
//    ssp.sync_and_stablish_presence_of(validator_address);
// }
// ///////////////////////////////////////////////////////////
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
                //  console.log("step3 es:"+step3);
              //  },9000);
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
  // try {
    //  console.log("aqui global.poll:"+global.poll);
      var step1= await ssp.envia_encriptado2(receptor,global.poll);
    //  console.log("step1x:" +step1);
      // await  setTimeout(async function(){
      //     var data=await ssp.handlepoll(step1);
      //     //console.log("esto se dispara al recibir handlepoll");
      //     //console.log(data);
      //   },100);
        return "OK";
    // } catch (e) {
    //   return e;
    // }

  }; //hace consulta de poll pero no hace bucle
  module.exports.validatorpoll=validatorpoll;
////////////////////////////////////////////////////////
// function handle_poll_validator(data){
//   var passingby=data;
//   //console.log("data en handle pool es:"+data);
//   return new Promise( async function(resolve, reject) {
//   try {
//     var poll_responde=data.match(/.{1,2}/g);
//   //  console.log("data en poll_responde es:"+poll_responde);
//     var data_length_on_pool=parseInt(poll_responde[0]);
//     data_length_on_pool=data_length_on_pool+1;
//     poll_responde=poll_responde.slice(0,data_length_on_pool);
//     //console.log("data en poll_responde es:"+data_length_on_pool);
//     //(console.log(poll_responde);
//      if(poll_responde == undefined || poll_responde.length < 1){
//        console.log("ERROR Receiving data");
//        return reject();
//            }else{
//              for (var i =1; i<poll_responde.length; i++ )
//                 {
//                 //  console.log(poll_responde[i]);
//                   switch(poll_responde[i])
//                {
//                  case("83"):
//                  console.log(chalk.red.inverse("Calibration failed"));
//                  break;
//
//                  case("8B"):
//                  console.log(chalk.red.inverse("Escrow Active"));
//                  break;
//
//                  case("90"):
//                  console.log(chalk.red.inverse("Cashbox out of Service"));
//                  server.io.emit('Cashbox_out_of_Service', "Cashbox out of Service");
//                  break;
//
//                  case("92"):
//                  console.log(chalk.red.inverse("Cashbox Back in Service"));
//                  server.io.emit('Cashbox_Back_in_Service', "Cashbox Back in Service");
//                  break;
//
//                  case("93"):
//                  console.log(chalk.red.inverse("Cashbox Unlock Enable"));
//                    server.io.emit('Cashbox_Unlock_Enable', "Cashbox Unlock Enable");
//                  break;
//
//                  case("A5"):
//                  console.log(chalk.red.inverse("Ticket Printing"));
//                  break;
//
//                  case("A6"):
//                  console.log(chalk.red.inverse("Ticket Printed"));
//                  break;
//
//                  case("A8"):
//                  console.log(chalk.red.inverse("Ticket Printing Error"));
//                  break;
//
//                  case("AD"):
//                  console.log(chalk.red.inverse("Ticket in Bezel"));
//                  break;
//
//                  case("AE"):
//                  console.log(chalk.red.inverse("Print Halted"));
//                  break;
//
//                  case("AF"):
//                  console.log(chalk.red.inverse("Printed to Cashbox"));
//                  break;
//
//                  case("B0"):
//                  console.log(chalk.red.inverse("Jam recovery"));
//                    server.io.emit('Jam_recovery', "Jam recovery");
//                  break;
//
//                  case("B1"):///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                  console.log(chalk.red.inverse("Error During Payout"));
//                  break;
//
//                  case("B3"):
//                  console.log(chalk.red.inverse("Smart emptying"));
//                    server.io.emit('Smart_emptying', "Smart emptying");
//                  break;
//
//                  case("B4"):
//                  console.log(chalk.red.inverse("Smart emptied"));
//                  //read event data
//                  var value_in_hex=data.substr(8,8);
//                  value_in_hex=enc.changeEndianness(value_in_hex);
//                  value_in_hex=value_in_hex.toString(10);
//                 //  console.log(value_in_hex);
//                  // console.log(typeof(value_in_hex));
//                   var prefix="0x";
//                  // var value="0000073D";
//                   value_in_hex=prefix.concat(value_in_hex);
//                   value_in_hex=parseInt(value_in_hex);
//                   value_in_hex=value_in_hex/100;
//                 //  console.log(value_in_hex);
//                  //value dispensed:
//                  server.io.emit('Smart_emptied', "Smart emptied");
//                  break;
//
//                  case("B5"):
//                  console.log(chalk.red("channel disabled"));
//                  break;
//
//                  case("B6"):
//                  console.log(chalk.red.inverse("Device Initializing"));
//                  server.io.emit('Device_Initializing', "Device Initializing");
//                  break;
//
//                  case("B7"):
//                  console.log(chalk.red.inverse("Coin Mech Error"));
//                  break;
//
//                  case("BA"):
//                  console.log(chalk.red.inverse("Coin Rejected"));
//                  break;
//
//                  case("BD"):
//                  console.log(chalk.red.inverse("Attached Coin Mech Disabled"));
//                  break;
//
//                  case("BE"):
//                  console.log(chalk.red.inverse("Attached Coin Mech enabled"));
//                  break;
//
//                  case("BF"):
//                  console.log(chalk.red.inverse("Value Added"));
//                    server.io.emit('Value_Added', "Value Added");
//                  break;
//
//                  case("C0"):
//                  console.log(chalk.cyan("Maintenance Required"));
//                    server.io.emit('Maintenance_Required', "Maintenance Required");
//                  break;
//
//                  case("C1"):
//                  console.log(chalk.cyan("Pay-In Active"));
//                  break;
//
//                  case("C2"):
//                  console.log(chalk.cyan("emptying"));
//                  server.io.emit('emptying', "emptying");
//                  break;
//
//                  case("C3"):
//                  console.log(chalk.cyan("emptied"));
//                  server.io.emit('emptied', "emptied");
//                  break;
//
//                  case("C4"):
//                  console.log(chalk.cyan("coin mech jam"));
//                  break;
//
//                  case("C5"):
//                  console.log(chalk.cyan("coin mech return active"));
//                  break;
//
//                  case("C9"):
//                  console.log(chalk.cyan("Note Transfered to Stacker"));
//                  server.io.emit('Note_Transfered_to_Stacker', "Note Transfered to Stacker");
//                  break;
//
//                  case("CA"):///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                  console.log(chalk.cyan("Note into Stacker at Reset"));
//                  server.io.emit('Note_into_Stacker_at_Reset', "Note into Stacker at Reset");
//                  break;
//
//                  case("CB"):///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                  console.log(chalk.cyan("Note into Store at Reset"));
//                  server.io.emit('Note_into_Store_at_Reset', "Note into Store at Reset");
//                  break;
//
//                  case("CC"):
//                  console.log(chalk.cyan("Stakingx"));
//                  server.io.emit('Staking', "Staking");
//                  break;
//
//                  case("CE"):
//                //  console.log(chalk.cyan("Note Held in Bezel"));
//                  server.io.emit('note_held_in_bezel', "Retirar Billete");
//                  break;
//
//                  case("CF"):
//                  console.log(chalk.cyan("Device full"));
//                  server.io.emit('Device_full', "Device full");
//                  break;
//
//                  case("D1"):
//                  console.log(chalk.red.inverse("Barcode Ticket Ack"));
//                  //do not assign credit
//                  break;
//
//                  case("D2"):
//                  console.log(chalk.red.inverse("Dispensed"));
//                  //read event data
//                  var value_in_hex=data.substr(8,8);
//                  value_in_hex=enc.changeEndianness(value_in_hex);
//                  value_in_hex=value_in_hex.toString(10);
//                  // console.log(value_in_hex);
//                  // console.log(typeof(value_in_hex));
//                   var prefix="0x";
//                  // var value="0000073D";
//                   value_in_hex=prefix.concat(value_in_hex);
//                   value_in_hex=parseInt(value_in_hex);
//                   value_in_hex=value_in_hex/100;
//                   console.log(chalk.yellow("totalmente pagado:"+value_in_hex));
//                  //value dispensed:
//                  //update current payment with the full value of amount dispensed;
//                  const remesa1 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='egreso' ");
//                  var id_remesa1 = remesa1[0].no_remesa;
//                  await pool.query ("UPDATE remesas SET status='completado', monto=? WHERE no_remesa=?",[value_in_hex,id_remesa1]);
//                  server.io.emit('Dispensed', value_in_hex);
//                  //do not assign credit
//                  break;
//
//                  case("D3"):
//                  console.log(chalk.red.inverse("Coins Low"));
//                  //do not assign credit
//                  break;
//
//                  case("D5"):
//                  console.log(chalk.red.inverse("Hopper Jam"));
//                  //do not assign credit
//                  break;
//
//                  case("D6"):
//                  console.log(chalk.red.inverse("Halted"));
//                  //do not assign credit
//                  break;
//
//                  case("D7"):
//                  console.log(chalk.red.inverse("floating"));
//                  //do not assign credit
//                  break;
//
//                  case("D8"):
//                  console.log(chalk.red.inverse("floated"));
//                  //do not assign credit
//                  break;
//
//                  case("D9"):
//                  console.log(chalk.red.inverse("Tiempout"));
//                  //do not assign credit
//                  break;
//
//                  case("DA"):
//                  console.log(chalk.red.inverse("Dispensing"));
//                  //read event data
//                  var value_in_hex=data.substr(8,8);
//                  value_in_hex=enc.changeEndianness(value_in_hex);
//                  value_in_hex=value_in_hex.toString(10);
//                  // console.log(value_in_hex);
//                  // console.log(typeof(value_in_hex));
//                   var prefix="0x";
//                  // var value="0000073D";
//                   value_in_hex=prefix.concat(value_in_hex);
//                   value_in_hex=parseInt(value_in_hex);
//                   value_in_hex=value_in_hex/100;
//              //     console.log(chalk.cyan("pago acumulado:"+value_in_hex));
//                  //value dispensed:
//          //        const remesa2 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='egreso' ");
//                  if(remesa2.length>0){
//                     var id_remesa2 = remesa2[0].no_remesa;
//                     await pool.query ("UPDATE remesas SET monto=? WHERE no_remesa=?",[value_in_hex,id_remesa2]);
//                   }
//                  server.io.emit('Dispensing', value_in_hex);
//                  //do not assign credit
//                  break;
//
//                  case("DB"):
//                  console.log(chalk.green.inverse("Note Stored in Payout"));
//                  server.io.emit('Note_Stored_in_Payout', "Note Stored in Payout");
//                  //do not assign credit
//                  break;
//
//                  case("DC"):
//                  console.log(chalk.red.inverse("Incomplete payout"));
//                  server.io.emit('Incomplete_payout', "Incomplete payout");
//                  // 0CF0 F1 DC 00 00000058 1B 00 00 E8
//                  //do not assign credit
//                  break;
//
//                  case("DD"):
//                  console.log(chalk.red.inverse("Incomplete float"));
//                  //do not assign credit
//                  break;
//
//                  case("DE"):
//                  console.log(chalk.red.inverse("cashbox paid"));
//                  server.io.emit('cashbox_paid', "cashbox paid");
//                  //do not assign credit
//                  break;
//
//                  case("DF"):
//                  console.log(chalk.red.inverse("Coin Credit"));
//                  //do not assign credit
//                  break;
//
//                  case("E0"):
//                  console.log(chalk.red.inverse("Note Path Open"));
//
//                  //do not assign credit
//                  break;
//
//                  case("E1"):
//                  console.log(chalk.red.inverse("Note cleared from front"));
//                      server.io.emit('Note_cleared_from_front', "Note cleared from front");
//                  //do not assign credit
//                  break;
//
//                  case("E2"):
//                  console.log(chalk.red.inverse("Note cleared into cashbox"));
//                  server.io.emit('Note_cleared_into_cashbox', "Note cleared into cashbox");
//                  //asign credit
//                  break;
//
//                  case("E3"):
//                  console.log(chalk.red.inverse("Cashbox Removedx"));
//                  server.io.emit('Cashbox_Removed', "Cashbox Removed");
//                  break;
//
//                  case("E4"):
//                  console.log(chalk.red.inverse("Cashbox Replaced"));
//                  server.io.emit('Cashbox_Replaced', "Cashbox Replaced");
//                  break;
//
//                  case("E5"):
//                  console.log(chalk.red.inverse("Barcode Ticket Validated"));
//                  break;
//
//                  case("E6"):
//                  console.log(chalk.red.inverse("Fraud Attemp"));
//                  break;
//
//                  case("E7"):
//                  console.log(chalk.red.inverse("Stacker Full"));
//                  server.io.emit('Stacker_Full', "Stacker Full");
//                  break;
//
//                  case("E8"):
//                  if(!global.last_sent==poll_responde[2]){
//                    console.log(chalk.red("Validator Disabled here"));
//                    server.io.emit('Validator_Disabled', "Validator Disabled");
//                    global.last_sent=poll_responde[2];
//                  }
//                  break;
//
//                  case("E9"):
//                  console.log(chalk.cyan("Unsafe Jam"));
//                  break;
//
//                  case("EB"):
//                  console.log(chalk.cyan("Staked"));
//                  server.io.emit('Staked', "Staked");
//                  break;
//
//                  case("EC"):
//                  console.log(chalk.cyan("Rejected"));
//                  break;
//
//                  case("ED"):
//                  console.log(chalk.cyan("Rejecting"));
//                  break;
//
//                  case("EF"):
//                  console.log(chalk.cyan("Read"));
//                  {
//                    //var channel=poll_responde[i+1];
//                    //console.log("channel:"+channel);
//                  //  console.log("Leyendo billete");
//                  }
//                  break;
//
//                  case("EE"):
//                  //console.log(chalk.cyan("Note credit"));
//                  {
//                    var channel=poll_responde[i+1];
//                    //console.log("channel:"+channel);
//                    if(country_code=='PEN'){
//                      if(channel==01){
//                        ssp.store_note(10);
//                        console.log("10 soles");
//                      }
//                      if(channel==02){
//                        ssp.store_note(20);
//                        console.log("20 soles");
//                      }
//                      if(channel==03){
//                        ssp.store_note(50);
//                        console.log("50 soles");
//                      }
//                      if(channel==04){
//                        ssp.store_note(100);
//                        console.log("100 soles");
//                      }
//                      if(channel==05){
//                        ssp.store_note(200);
//                        console.log("200 soles");
//                      }
//                    }
//                    if(country_code=='USD'){
//                      if(channel==01){
//                        ssp.store_note(1);
//                        console.log("1 dolar");
//                      }
//                      if(channel==02){
//                        ssp.store_note(2);
//                        console.log("2 dolares");
//                      }
//                      if(channel==03){
//                        ssp.store_note(5);
//                        console.log("5 dolares");
//                      }
//                      if(channel==04){
//                        ssp.store_note(10);
//                        console.log("10 dolares");
//                      }
//                      if(channel==05){
//                        ssp.store_note(20);
//                        console.log("20 dolares");
//                      }
//                      if(channel==06){
//                        ssp.store_note(50);
//                        console.log("50 dolares");
//                      }
//                      if(channel==07){
//                        ssp.store_note(100);
//                        console.log("100 dolares");
//                      }
//                    }
//
//
//                  //   const remesa4 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso' ");
//                  //   var id_remesa4 = remesa4[0].no_remesa;
//                  //   console.log("la remesa en proceso es:"+id_remesa4);
//                  //   //consultar monto;
//                  //   const calculando_monto = await pool.query("SELECT SUM(monto) AS totalremesa FROM creditos WHERE no_remesa=? AND status='processing'", [id_remesa4]);
//                  //   var monto_acumulado_remesa = calculando_monto[0].totalremesa;
//                  //
//                  // //  var monto_acumulado=await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso' ");
//                  //   await pool.query ("UPDATE remesas SET status='en_proceso',monto=? WHERE no_remesa=?",[monto_acumulado_remesa,id_remesa4]);
//                  }
//                  break;
//
//                  case("F0"):
//                 // console.log(chalk.cyan("OK"));
//                  break;
//
//                  case("F1"):
//                  console.log(chalk.cyan("Slave Reset"));
//                  break;
//                 }//switch closing
//               }//switch closing
//              }//end of FOR loop
//             // enable_sending();
//       console.log(chalk.green("POLLING END"));
//       console.log(chalk.green("////////////////////////"));
//       return resolve(passingby);
//
//   } catch (e) {
//       return reject(e);
//   } finally {
//   //  return;
//   }
//
//   });
// }
// module.exports.handle_poll_validator=handle_poll_validator;
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
      //console.log("number_of_byte:"+number_of_byte);
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

        //console.log("tebs_barcode current value is:"+tebs_barcode);
        tebs_barcode = tebs_barcode.concat(i);
      }
      current_tebs_barcode=tebs_barcode;
      return resolve(tebs_barcode);
    //  console.log(chalk.green("tebs barcode is:" + tebs_barcode));
    } catch (e) {
      return reject(e);
    } finally {

    }
  });
}
module.exports.handleGetTebsBarcode=handleGetTebsBarcode;
/////////////////////////////////////////////////////////
// function transmite_a_validator(a_quien, orden){
//
//       return  new Promise(async function(resolve, reject) {
//         sp.disable_hopper_pooling();
//         var dato=await super_comando(a_quien,orden)
//         console.log("dato:"+dato);
//         //var pol=await promise_handlePoll(dato);
//         var pol=await va.handle_poll_validator(dato);
//
//         console.log("pol:"+pol);
//         sp.enable_hopper_pooling();
//         return resolve(pol);
//       });
// }
// module.exports.transmite=transmite_a_validator;
/////////////////////////////////////////////////////////
// function mandate_al_validador(esto) {
//   return new Promise(function(resolve, reject) {
//     sp.disable_hopper_pooling();
//     super_comando(smart_hopper_address,esto).then(data =>{return enc.promise_handleEcommand();}).then(data =>{return ssp.handlepoll(data);})
//     .then(data =>{console.log(chalk.yellow(device+'<-:'), chalk.yellow(data));sp.enable_hopper_pooling();return resolve(data)})
//   });
// }
// module.exports.mandate_al_hopper= mandate_al_hopper;
