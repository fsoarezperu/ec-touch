const sp = require('./serial_port');
const os = require('./os');
const socketjs = require('./socket');
//const socket = require('./server')(io);
const server = require('./../server');
const chalk=require('chalk');

const enc = require('./encryption');
//const io = require("./../server.js");
const sh = require("./devices/smart_hopper");
const pool = require('./../database');
const val = require("./devices/validator");
const tambox = require("./devices/tambox");


function thisy3(){
  console.log(chalk.yellow("thisy3 was trigeret"));
  socketjs.nuevo_enlace('main','../system/buffer.html')
}
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
// var client = require("socket.io-client");
// var my_server_port= "http://localhost:"+machine_port
// var socket2 = client.connect(my_server_port);
// module.exports.socket2=socket2;
// socket2.on('connect', function () {
//   // socket connected
//     console.log(chalk.magenta("connected como cliente desde otro js"));
//   //  server.io.emit('connected','connected');
//
//     socket2.on('prueba', function (msg) {
//       // socket connected
//         console.log("si lo recibo adecuadamente");
//         //server.io.emit('connected','connected');
//     });
//
//     // console.log('connect',socket.id);
//     // socket.on('connection',function (socket) {
//     //     console.log('conenction',socket.id);
//     // });
// });
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
const moment=require("moment");
const glo = require('./globals');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
/////////////////////////////
// var sync = false;
// var seq_bit = 0;
// socket2.on('connect',function(socket){
//
// })
function emite_como_cliente() {
  server.io.emit('fer',"'fer'");
  console.log("emitting como cliente");
};
module.exports.emite_como_cliente=emite_como_cliente;
function sequencer() {
//  console.log("sequencer in:"+sync);
  if (sync == true) {
    sync = false;
    seq_bit = 0;
  } else {
    sync = true;
    seq_bit = 128;
  }
};
module.exports.sequencer=sequencer;
/////////////////////////////
var ConvertBase = function(num) {
  return {
    from: function(baseFrom) {
      return {
        to: function(baseTo) {
          return parseInt(num, baseFrom).toString(baseTo);
        }
      };
    }
  };
};
module.exports.ConvertBase=ConvertBase;
ConvertBase.dec2bin = function(num) {
  return ("00000000" + ConvertBase(num).from(10).to(2)).substr(-8);
};
ConvertBase.hex2bin = function(num) {
  return ("00000000" + ConvertBase(num).from(16).to(2)).substr(-8);
};
ConvertBase.dec2hex = function(num) {
  return ConvertBase(num).from(10).to(16);
};
ConvertBase.bin2dec = function(num) {
  return ConvertBase(num).from(2).to(10);
};
function pad(d) {
  return (d < 10) ? '0' + d.toString() : toString();
};
module.exports.pad=pad;
function chunk(str, n) {
  var ret = [];
  var i;
  var len;
  for (i = 0, len = str.length; i < len; i += n) {
    ret.push(str.substr(i, n))
  }
  return ret
};
module.exports.chunk=chunk;
//////////////// crc inplementation //////////////
const crc = require('node-crc');
var reverse = require("buffer-reverse");
function spectral_crc(buffer) {
  var crc_result = crc.crc(16, false, 0x8005, 0x0, 0xFFFF, 0x0, 0x0, 0x0, Buffer.from(buffer, 'utf8')).toString('hex');
  var crc_hex = new Buffer.from(crc_result, 'hex');
  var inv_crc_hex = reverse(crc_hex);
  var data = Buffer.from(buffer, 'hex');
  var formed_command = '7F' + data.toString('hex') + inv_crc_hex.toString('hex');
  var command_to_send = Buffer.from(inv_crc_hex, 'hex');
  return command_to_send;
}
module.exports.spectral_crc=spectral_crc

function prepare_command_to_be_sent(receiver,command){
return new Promise(function(resolve, reject) {

  try {
    os.logea("en prepare command to be send:"+command);
    var formed_command_to_send;
    sequencer();
    var seq_bit_hex = ConvertBase.dec2bin(seq_bit); //seq_bit to hex
    var biny = ConvertBase.hex2bin(receiver);
  //  console.log(biny);
    var calc = ConvertBase.dec2hex(ConvertBase.bin2dec(ConvertBase.dec2bin(seq_bit_hex ^ biny)));
    var seq_id_hex;
    if (calc < 10) {
      seq_id_hex = pad(calc);
    } else {
      seq_id_hex = calc;
    }
    formed_command_to_send = seq_id_hex;
    formed_command_to_send = formed_command_to_send + new Buffer.from(command, 'hex').toString('hex');
    var clean_command = formed_command_to_send;
    var prepared = "0x" + chunk(formed_command_to_send, 2).join('0x');
    formed_command_to_send = prepared;
    var to_crc = formed_command_to_send.match(/.{1,4}/g);
    var el_crc = new Buffer.from(spectral_crc(to_crc), 'hex').toString('hex');
    var prestuffing_command=clean_command+el_crc;
  //  console.log("prestuffing_command:"+prestuffing_command.toUpperCase());
    //console.log(typeof(prestuffing_command));
    prestuffing_command=prestuffing_command.toUpperCase();
    var stuffed=send_byte_stuffing(prestuffing_command);
  //  console.log("stuffed:"+stuffed);
  //  console.log("comando listo pre stuffing"+stuffed);
  //  var command_listo = "7f" + clean_command + el_crc;
    var command_listo = "7f" + stuffed;
    command_listo = command_listo.toUpperCase();
  //  console.log("comando listo pre stuffing"+command_listo);
    var lastFive = clean_command.substr(2, clean_command.length); // => "Tabs1"
    single_command = lastFive.toUpperCase();
    //console.log(chalk.cyan('->:' + single_command)); //IMPRIME MENSAJE DE SALIDA LIMPIO
  var device="";
    if (receiver=='10'|| receiver=='90') {
      device="Hopper";
    }
    if (receiver=='00' || receiver=='80') {
      device="Validator";
    }
    if(global.show_details===true){
  //  console.log(chalk.cyan(enc.changeEndianness(ecount)+"->"+device+'->:'),chalk.cyan(single_command)); //este muestra el valor enviado encriptado
//    console.log(chalk.cyan(enc.changeEndianness(ecount)+"->"+device+'->:'),chalk.cyan(clean_command.substr(2, clean_command.length).toUpperCase())); //este muestra el valor enviado SIN encriptar pero lo envia encriptado
    console.log(chalk.magenta("------------------------------"));
    console.log(chalk.cyan(enc.changeEndianness(ecount)+"->"+device+'->:'),chalk.cyan(ultimo_valor_enviado)); //este muestra el valor enviado SIN encriptar pero lo envia encriptado

     }
    var hexiando = "0x" + chunk(command_listo, 2).join('0x');
    hexiando = hexiando.match(/.{1,4}/g);
    formed_command_to_send = hexiando;
    sent_command = formed_command_to_send;
  //  console.log("SENT COMMAND:"+sent_command);
    return resolve(sent_command);
  } catch (e) {
    return reject(chalk.cyan("06-no se pudo preparar el comando para ser enviado->")+e);
  } finally {
  //  return;
  }
});


}
module.exports.prepare_command_to_be_sent=prepare_command_to_be_sent;

function send_byte_stuffing(command){
  var res="";
  var thisy2="";
    const thelength=command.length/2;
            for (var i=0;i<thelength;i++){
              var thisy=command.substr(i*2,2);
              if(thisy=="7F"){
              //  console.log("command to be stuff:"+command);
              //  console.log(chalk.yellow("bytestuffed"));

                res = thisy.replace(/7F/g, "7F7F");
                thisy=res;
              }
              thisy2=thisy2+thisy;
             }
             //console.log("thisy2:"+thisy2);
            //   console.log(chalk.cyan("----------------Send Stuffed:"+thisy2));
             return thisy2;
};
function received_byte_stuffing(command){
  return new Promise(function(resolve, reject) {
    //console.log("received command to be evaluted:"+command);
    var accumulated_chart="";
    var toggy=true;
    var current_char="";
    const thelength=command.length/2;
  //  console.log("the length used for byte stuffing:"+thelength);
try {
  for (var i=0;i<thelength;i++){
         current_char=command.substr(i*2,2);
      //  console.log("current_char:"+current_char);
          if(current_char=="7F"){
            if(toggy==true){
                os.logea(chalk.yellow("STUFF"));
                os.logea(chalk.cyan("received command to be evaluted:"+command));
                toggy=false;
             }else{
              // console.log("received command to be evaluted:"+command);
              // console.log(chalk.red("Stuffed on reception "));
              //  console.log(chalk.cyan("----------------Receive Stuffed:"+accumulated_chart));
               current_char="";
               toggy=true;
             }
          }
    accumulated_chart=accumulated_chart+current_char;
    };
//  console.log(chalk.cyan("----------------Receive Stuffed:"+accumulated_chart));
  return resolve(accumulated_chart);
} catch (e) {
  return reject(e);
} finally {
  //return;
}
  });
};
module.exports.received_byte_stuffing=received_byte_stuffing;
////////////////////////////////////////////////////
function handlesynch(data){
return new Promise(function(resolve, reject) {
    var poll_responde=data.match(/.{1,2}/g);
    if(poll_responde[1] == "F0"){
      os.logea(chalk.green("Synch OK"));
      enable_sending();
    return resolve("OK")
    }else{
        console.log("ERROR WITH SYNCH");
        reject(data)
    }
  });

}
module.exports.handlesynch=handlesynch;
////////////////////////////////////////////////////
function enable_sending(){
  ready_for_sending=true;
  ready_for_pooling = true;
  return;
}
module.exports.enable_sending=enable_sending;
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function handlepoll(data){
return new Promise(async function(resolve, reject) {
  try {
  //  console.log("data antes de match:"+data);
    var poll_responde=data.match(/.{1,2}/g);
  //  console.log("data despues de match:"+data);
    var data_length_on_pool=parseInt(hex_to_dec(poll_responde[0]));
    data_length_on_pool=(data_length_on_pool+1);
    poll_responde=poll_responde.slice(0,data_length_on_pool);
  //  console.log("data length on pool data:"+data_length_on_pool);
    if(poll_responde == undefined || poll_responde.length < 1){
      console.log("ERROR Receiving data");
      return reject("ERROR Receiving data 001");
      }else{

        if(!global.last_sent==poll_responde){
          console.log(chalk.yellow(device+"<-:"+poll_responde));
          global.last_sent=poll_responde;
        }


        if(poll_responde[1] == "F0"){
                  for (var i =1; i< poll_responde.length; i++ ){
                              switch(poll_responde[i])
                             {
                                  case("83"):
                                  console.log(chalk.red.inverse("Calibration failed"));
                                  break;

                                  case("8B"):
                                  console.log(chalk.red.inverse("Escrow Active"));
                                  break;

                                  case("90"):
                                  //console.log(poll_responde[i]);
                                  console.log(chalk.red.inverse("Cashbox out of Service"));
                                  // if(on_startup){
                                     server.io.emit('Cashbox_out_of_Service', "Cashbox out of Service");
                                  //   await inicio_sin_cajon();
                                  //   console.log(chalk.red("iniciando sin cajon de dinero puesto"));
                                  //   return resolve("inicio_sin_cajon")
                                  // }else {
                                  //   server.io.emit('Cashbox_out_of_Service', "Cashbox out of Service");
                                  //   if(!global.last_sent===poll_responde[2]){
                                  //   console.log("Cashbox out of Service");
                                  //   global.last_sent=poll_responde[2];
                                  //    }
                                  // }

                                  break;

                                  case("92"):
                                  console.log(chalk.red.cyan("Cashbox Back in Service"));
                                //  server.io.emit('Cashbox_Back_in_Service', "Cashbox_Back_in_Service");
                                if (on_remesa_hermes) {
                                  os.new_lock_cashbox();
                                  socketjs.nuevo_enlace('Cashbox_Back_in_Service','../system/remesa_hermes/rm_5.html');


                                  setTimeout(thisy3,10000);
                                  on_remesa_hermes=false;
                                }
                                  break;

                                  case("93"):
                                //  if(global.last_sent===""){
                                  //  console.log(chalk.green("Cashbox Unlock Enable"));
                                  if(global.last_sent=="93"){
                                  //  console.log(chalk.cyan("viaset "));
                                }else{
                                  console.log(chalk.cyan("SENT ONCE"));
                                  if (on_remesa_hermes) {
                                  //  socket.super_enlace('Cashbox_Back_in_Service','../system/remesa_hermes/rm_5.html');
                                  //console.log(last_sent);
                                  console.log(chalk.green("Cashbox Unlock Enable desde remesa hermes"));
                                  //global.last_sent=poll_responde[2];
                                //  server.io.emit('Cashbox_Unlock_Enable', "Cashbox Unlock Enable");
                              //    socketjs.super_enlace('cashbox_unlocked','../system/remesa_hermes/rm_4.html');
                                    }else {
                                    console.log(chalk.red("Cashbox Unlock Enable fuera remesa hermes"));
                                  //  console.log(poll_responde[3]);
                                    server.io.emit('Cashbox_Unlock_Enable', "Cashbox Unlock Enable");

                                    }
                                }
                                  global.last_sent=poll_responde[3];
                                  break;

                                  case("A5"):
                                  console.log(chalk.red.inverse("Ticket Printing"));
                                  break;

                                  case("A6"):
                                  console.log(chalk.red.inverse("Ticket Printed"));
                                  break;

                                  case("A8"):
                                  console.log(chalk.red.inverse("Ticket Printing Error"));
                                  break;

                                  case("AD"):
                                  console.log(chalk.red.inverse("Ticket in Bezel"));
                                  break;

                                  case("AE"):
                                  console.log(chalk.red.inverse("Print Halted"));
                                  break;

                                  case("AF"):
                                  console.log(chalk.red.inverse("Printed to Cashbox"));
                                  break;

                                  case("B0"):
                                  console.log(chalk.red.inverse("Jam recovery"));
                                    server.io.emit('Jam_recovery', "Jam recovery");
                                  break;

                                  case("B1"):///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                  console.log(chalk.red.inverse("Error During Payout"));
                                  break;

                                  case("B3"):
                                  //console.log(global.last_sent);
                                  //if(global.last_sent===""){
                                  server.io.emit('Smart_emptying', "Smart_emptying");
                                    //console.log(chalk.red("Smart emptying"));
                                  //  global.last_sent=poll_responde[2];
                                  //}
                                  break;
                                  /////////////////////////////////////////////////////////
                                  case("B4"):
                                //  if(global.last_sent===""){
                                    console.log(chalk.green("Smart emptied"));
                                    //read event data
                                    var value_in_hex=data.substr(8,8);
                                    value_in_hex=enc.changeEndianness(value_in_hex);
                                    value_in_hex=value_in_hex.toString(10);
                                    // console.log(value_in_hex);
                                    // console.log(typeof(value_in_hex));
                                     var prefix="0x";
                                    // var value="0000073D";
                                     value_in_hex=prefix.concat(value_in_hex);
                                     value_in_hex=parseInt(value_in_hex);
                                     value_in_hex=value_in_hex/100;
                                     //console.log(value_in_hex);
                                    //value dispensed:
                                    socketjs.nuevo_enlace('Smart_emptied', '../system/remesa_hermes/rm_3.html');
                                //    global.last_sent=poll_responde[2];
                                //  }
                                  break;
                                  ///////////////////////////////////////////////////////
                                  case("B5"):
                                  console.log(chalk.red("channel disabled"));
                                  break;

                                  case("B6"):
                                  console.log(chalk.red.inverse("Device Initializing"));
                                  server.io.emit('Device_Initializing', "Device Initializing");
                                  break;

                                  case("B7"):
                                  console.log(chalk.red.inverse("Coin Mech Error"));
                                  break;

                                  case("BA"):
                                  console.log(chalk.red.inverse("Coin Rejected"));
                                  break;

                                  case("BD"):
                                  console.log(chalk.red.inverse("Attached Coin Mech Disabled"));
                                  break;

                                  case("BE"):
                                  console.log(chalk.red.inverse("Attached Coin Mech enabled"));
                                  break;

                                  case("BF"):
                                  console.log(chalk.red.inverse("Value Added"));
                                    server.io.emit('Value_Added', "Value Added");
                                  break;

                                  case("C0"):
                                  console.log(chalk.cyan("Maintenance Required"));
                                    server.io.emit('Maintenance_Required', "Maintenance Required");
                                  break;

                                  case("C1"):
                                  console.log(chalk.cyan("Pay-In Active"));
                                  break;

                                  case("C2"):
                                  console.log(chalk.cyan("emptying"));
                                  server.io.emit('emptying', "emptying");
                                  break;

                                  case("C3"):
                                  console.log(chalk.cyan("emptied"));
                                  server.io.emit('emptied', "emptied");
                                  break;

                                  case("C4"):
                                  console.log(chalk.cyan("coin mech jam"));
                                  break;

                                  case("C5"):
                                  console.log(chalk.cyan("coin mech return active"));
                                  break;

                                  case("C9"):
                                  console.log(chalk.cyan("Note Transfered to Stacker"));
                                  server.io.emit('Note_Transfered_to_Stacker', "Note Transfered to Stacker");
                                  break;

                                  case("CA"):///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                  console.log(chalk.cyan("Note into Stacker at Reset"));
                                  server.io.emit('Note_into_Stacker_at_Reset', "Note into Stacker at Reset");
                                  break;

                                  case("CB"):///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                  console.log(chalk.cyan("Note into Store at Reset"));
                                  server.io.emit('Note_into_Store_at_Reset', "Note into Store at Reset");
                                  break;

                                  case("CC"):
                                  console.log(chalk.cyan("Staking y"));
                                  //server.io.emit('Staking', "Staking");
                                  break;

                                  case("CE"):
                                  console.log(chalk.cyan("Note Held in Bezel"));
                                  server.io.emit('note_held_in_bezel', "Retirar Billete");
                                  break;

                                  case("CF"):
                                  console.log(chalk.cyan("Device full"));
                                  server.io.emit('Device_full', "Device full");
                                  break;

                                  case("D1"):
                                  console.log(chalk.red.inverse("Barcode Ticket Ack"));
                                  //do not assign credit
                                  break;

                                  case("D2"):
                                //  if(global.last_sent===""){
                                  console.log(chalk.red.inverse("Dispensed"));
                                  //read event data
                                  var value_in_hex=data.substr(8,8);
                                  value_in_hex=enc.changeEndianness(value_in_hex);
                                  value_in_hex=value_in_hex.toString(10);
                                  // console.log(value_in_hex);
                                  // console.log(typeof(value_in_hex));
                                   var prefix="0x";
                                  // var value="0000073D";
                                   value_in_hex=prefix.concat(value_in_hex);
                                   value_in_hex=parseInt(value_in_hex);
                                   value_in_hex=value_in_hex/100;
                                   console.log(chalk.yellow("totalmente pagado:"+value_in_hex));
                                  //value dispensed:
                                  //update current payment with the full value of amount dispensed;
                                  const remesa1 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='egreso' ");
                                  var id_remesa1 = remesa1[0].no_remesa;
                                  await pool.query ("UPDATE remesas SET status='completado', monto=? WHERE no_remesa=?",[value_in_hex,id_remesa1]);
                                  server.io.emit('Dispensed', value_in_hex);
                                  //do not assign credit
                              //    global.last_sent=poll_responde[2];
                              //  }
                                  break;

                                  case("D3"):
                                  console.log(chalk.red.inverse("Coins Low"));
                                  //do not assign credit
                                  break;

                                  case("D5"):
                                  console.log(chalk.red.inverse("Hopper Jam"));
                                  //do not assign credit
                                  break;

                                  case("D6"):
                                  console.log(chalk.red.inverse("Halted"));
                                  //do not assign credit
                                  break;

                                  case("D7"):
                                  console.log(chalk.red.inverse("floating"));
                                  //do not assign credit
                                  break;

                                  case("D8"):
                                  console.log(chalk.red.inverse("floated"));
                                  //do not assign credit
                                  break;

                                  case("D9"):
                                  console.log(chalk.red.inverse("Tiempout"));
                                  //do not assign credit
                                  break;

                                  case("DA"):
                                //          if(global.last_sent===""){
                                  console.log(chalk.red.inverse("Dispensing"));
                                  //read event data
                                  var value_in_hex=data.substr(8,8);
                                  value_in_hex=enc.changeEndianness(value_in_hex);
                                  value_in_hex=value_in_hex.toString(10);
                                  // console.log(value_in_hex);
                                  // console.log(typeof(value_in_hex));
                                   var prefix="0x";
                                  // var value="0000073D";
                                   value_in_hex=prefix.concat(value_in_hex);
                                   value_in_hex=parseInt(value_in_hex);
                                   value_in_hex=value_in_hex/100;
                              //     console.log(chalk.cyan("pago acumulado:"+value_in_hex));
                                  //value dispensed:
                                  const remesa2 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='egreso' ");
                                  if(remesa2.length>0){
                                     var id_remesa2 = remesa2[0].no_remesa;
                                     await pool.query ("UPDATE remesas SET monto=? WHERE no_remesa=?",[value_in_hex,id_remesa2]);
                                   }
                                  server.io.emit('Dispensing', value_in_hex);
                                  //do not assign credit
                              //    global.last_sent=poll_responde[2];
                              //  }
                                  break;

                                  case("DB"):
                                  console.log(chalk.green.inverse("Note Stored in Payout"));
                                  server.io.emit('Note_Stored_in_Payout', "Note Stored in Payout");
                                  //do not assign credit
                                  break;

                                  case("DC"):
                                  console.log(chalk.red.inverse("Incomplete payout"));
                                  server.io.emit('Incomplete_payout', "Incomplete payout");
                                  // 0CF0 F1 DC 00 00000058 1B 00 00 E8
                                  //do not assign credit
                                  break;

                                  case("DD"):
                                  console.log(chalk.red.inverse("Incomplete float"));
                                  //do not assign credit
                                  break;

                                  case("DE"):
                                  console.log(chalk.red.inverse("cashbox paid"));
                                  server.io.emit('cashbox_paid', "cashbox paid");
                                  //do not assign credit
                                  break;

                                  case("DF"):
                                  console.log(chalk.red.inverse("Coin Credit"));
                                  //do not assign credit
                                  break;

                                  case("E0"):
                                  console.log(chalk.red.inverse("Note Path Open"));

                                  //do not assign credit
                                  break;

                                  case("E1"):
                                  console.log(chalk.red.inverse("Note cleared from front"));
                                      server.io.emit('Note_cleared_from_front', "Note cleared from front");
                                  //do not assign credit
                                  break;

                                  case("E2"):
                                  console.log(chalk.red.inverse("Note cleared into cashbox"));
                                  server.io.emit('Note_cleared_into_cashbox', "Note cleared into cashbox");
                                  //asign credit
                                  break;

                                  case("E3"):
                                  console.log(chalk.red.inverse("Cashbox Removedx"));
                                  server.io.emit('Cashbox_Removed', "Cashbox Removed");
                                  break;

                                  case("E4"):
                                  console.log(chalk.red.inverse("Cashbox Replaced"));
                                  server.io.emit('Cashbox_Replaced', "Cashbox Replaced");
                                  break;

                                  case("E5"):
                                  console.log(chalk.red.inverse("Barcode Ticket Validated"));
                                  break;

                                  case("E6"):
                                  console.log(chalk.red.inverse("Fraud Attemp"));
                                  break;

                                  case("E7"):
                                  console.log(chalk.red.inverse("Stacker Full"));
                                  server.io.emit('Stacker_Full', "Stacker Full");
                                  break;

                                  case("E8"):
                                //  global.last_sent=poll_responde[2];
                                  //console.log("aqui last_Sent es:"+global.last_sent);
                                  //console.log("aqui el dato es:"+poll_responde[2]);
                                  if(global.last_sent===""){
                                    console.log(chalk.yellow("Validator Disabled"));
                                    io.emit('Validator_Disabled', "Validator Disabled");
                                    global.last_sent=poll_responde[2];
                                  }
                                //  console.log(chalk.red("Validator Disabled"));
                                //  server.io.emit('Validator_Disabled', "Validator Disabled");
                                  break;

                                  case("E9"):
                                  console.log(chalk.cyan("Unsafe Jam"));
                                  break;

                                  case("EB"):
                                  console.log(chalk.cyan("Staked"));
                                  server.io.emit('Staked', "Staked");
                                  break;

                                  case("EC"):
                                  console.log(chalk.cyan("Rejected"));
                                  break;

                                  case("ED"):
                                  console.log(chalk.cyan("Rejecting"));
                                  break;

                                  case("EF"):
                                  console.log(chalk.cyan("Read"));
                                  {
                                    var channel=poll_responde[i+1];
                                    console.log("channel:"+channel);
                                    console.log("Leyendo billete");
                                  }
                                  break;

                                  case("EE"):
                                  console.log(chalk.cyan("Note credit"));
                                  {
                                    var channel=poll_responde[i+1];
                                    //console.log("channel:"+channel);
                                    if(country_code=='PEN'){
                                      if(channel==01){
                                        store_note(10);
                                        console.log("10 soles");
                                      }
                                      if(channel==02){
                                        store_note(20);
                                        console.log(chalk.yellow("20 soles"));
                                      }
                                      if(channel==03){
                                        store_note(50);
                                        console.log("50 soles");
                                      }
                                      if(channel==04){
                                        store_note(100);
                                        console.log("100 soles");
                                      }
                                      if(channel==05){
                                        store_note(200);
                                        console.log("200 soles");
                                      }
                                    }
                                    if(country_code=='USD'){
                                      if(channel==01){
                                        store_note(1);
                                        console.log("1 dolar");
                                      }
                                      if(channel==02){
                                        store_note(2);
                                        console.log("2 dolares");
                                      }
                                      if(channel==03){
                                        store_note(5);
                                        console.log("5 dolares");
                                      }
                                      if(channel==04){
                                        store_note(10);
                                        console.log("10 dolares");
                                      }
                                      if(channel==05){
                                        store_note(20);
                                        console.log("20 dolares");
                                      }
                                      if(channel==06){
                                        store_note(50);
                                        console.log("50 dolares");
                                      }
                                      if(channel==07){
                                        store_note(100);
                                        console.log("100 dolares");
                                      }
                                    }


                                  //   const remesa4 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso' ");
                                  //   var id_remesa4 = remesa4[0].no_remesa;
                                  //   console.log("la remesa en proceso es:"+id_remesa4);
                                  //   //consultar monto;
                                  //   const calculando_monto = await pool.query("SELECT SUM(monto) AS totalremesa FROM creditos WHERE no_remesa=? AND status='processing'", [id_remesa4]);
                                  //   var monto_acumulado_remesa = calculando_monto[0].totalremesa;
                                  //
                                  // //  var monto_acumulado=await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso' ");
                                  //   await pool.query ("UPDATE remesas SET status='en_proceso',monto=? WHERE no_remesa=?",[monto_acumulado_remesa,id_remesa4]);
                                  }
                                  break;

                                  case("F1"):
                                  console.log(chalk.cyan("Slave Reset"));
                                  break;
                                  case("F5"):
                                  console.log(chalk.cyan("NO SE PUEDE PROCESAR ORDEN"));
                                  break;
                          }
                         };
                         return resolve(data);
        };
        if(poll_responde[1] == "F5"){
          if (poll_responde[2] == "01") {
          console.log("NO HAY DINERO SUFICIENTE");
        }
        console.log("OPERACION NO SE PUEDE PROCESAR");
        return resolve(poll_responde);
      }
        else{
          console.log(chalk.red("THERE IS AN ERROR HERE:"+poll_responde));
        };
          return resolve(poll_responde);
        }

  } catch (e) {
    return reject(e);
  } finally {
  //  return;
//  last_sent="";
  }
});
}
module.exports.handlepoll=handlepoll;

function inicio_sin_cajon() {
  return new Promise(function(resolve, reject) {
    try {
      //que se muentre en pantalla, que la maquina requiere el cajon para continuar.
      //el sistema operativo necesita continuar sin el valor de tebsbarcode

      //cuando se inserte el cajon , se lee el tebs_barcode y se graba lo que se tenga que grabar, para luego continuar con el sistema operativo normal.
      return resolve();
    } catch (e) {
      return reject(chalk.red("No se pudo iniciar sin cajon:"+e))
    } finally {

    }
  });
}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function store_note(monto) {
  const remesa = await pool.query("SELECT * FROM remesas WHERE status='iniciada' OR status='en_proceso' ");
    if (remesa === undefined || remesa.length == 0) {
      console.log(chalk.cyan("INGRESO DIRECTO....... "));
      //const remesa = await pool.query("SELECT * FROM remesas WHERE status='iniciada' OR status='en_proceso' ");
      // var rem1;
      // if (remesa[0].no_remesa === 'undefined'){
         rem1="0000";
      // }else {
      //   rem1=remesa[0].no_remesa;
      // }
  //    console.log("la remes en cuestion es:"+rem1);
      const nueva_note = {
        no_remesa: rem1,
        monto: monto,
        moneda:country_code,
        status: 'processing'
      }
      await pool.query('INSERT INTO creditos set ?', [nueva_note]);
      console.log(chalk.yellow("nuevo note guardado"));
      await pool.query ("UPDATE remesas SET status='en_proceso' WHERE tipo='ingreso' and no_remesa=?",[rem1]);
      const calculando_monto = await pool.query("SELECT SUM(monto) AS totalremesa FROM creditos WHERE no_remesa=? AND status='processing'", [rem1]);
      var monto_total_remesa = calculando_monto[0].totalremesa;
      const qty_monto = await pool.query("SELECT COUNT(id) AS total_qty_remesa FROM creditos WHERE no_remesa=? AND status='processing'", [rem1]);
      var qty_result=qty_monto[0].total_qty_remesa;
      await pool.query("UPDATE remesas SET monto=?,no_billetes=? WHERE status='en_proceso' AND no_remesa=?", [monto_total_remesa,qty_result, rem1]);
      console.log("se van acumulando:"+qty_result+ " billetes");

      var msg={
        monto:monto,
        country_code:country_code,
        qty_bill2:qty_result,
        monto_total_remesa:monto_total_remesa
      }
      server.io.emit('nuevo_billete_recivido', msg);
      console.log(chalk.cyan("SUCCESFULL"));
    }else{
       var rem2 = remesa[0].no_remesa;
    //  console.log("la remes en cuestion es:"+rem2);
      const nueva_note = {
        no_remesa: rem2,
        monto: monto,
        moneda:country_code,
        status: 'processing'
      }
      await pool.query('INSERT INTO creditos set ?', [nueva_note]);
      //console.log("nuevo note guardado");
      await pool.query ("UPDATE remesas SET status='en_proceso' WHERE tipo='ingreso' and no_remesa=?",[rem2]);
      const calculando_monto = await pool.query("SELECT SUM(monto) AS totalremesa FROM creditos WHERE no_remesa=? AND status='processing'", [rem2]);
      var monto_total_remesa = calculando_monto[0].totalremesa;
      const qty_monto = await pool.query("SELECT COUNT(id) AS total_qty_remesa FROM creditos WHERE no_remesa=? AND status='processing'", [rem2]);
      var monto_total_remesa = calculando_monto[0].totalremesa;
      await pool.query("UPDATE remesas SET monto=?,no_billetes=? WHERE status='en_proceso' AND no_remesa=?", [monto_total_remesa,qty_result, rem2]);
      console.log("se van acumulando:"+qty_result+ " billetes");

      var msg={
        monto:monto,
        country_code:country_code,
        qty_bill2:qty_result,
        monto_total_remesa:monto_total_remesa
      }
      server.io.emit('nuevo_billete_recivido', msg);
    }

    const remesa4 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso' ");
    var id_remesa4 ;
    if (remesa4 === undefined || remesa.length == 0){
        id_remesa4="0000"
      } else {
          id_remesa4 = remesa4[0].no_remesa;
        }
    const calculando_monto = await pool.query("SELECT SUM(monto) AS totalremesa FROM creditos WHERE no_remesa=? AND status='processing'", [id_remesa4]);
    var monto_acumulado_remesa = calculando_monto[0].totalremesa;
  //  var monto_acumulado=await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso' ");
    await pool.query ("UPDATE remesas SET status='en_proceso',monto=? WHERE no_remesa=?",[monto_acumulado_remesa,id_remesa4]);

}
module.exports.store_note=store_note;
///////////////////////////////////////////////////////////
function handleprotocolversion(data){
  return new Promise(function(resolve, reject) {
    var poll_responde=data.match(/.{1,2}/g);
    if(poll_responde[1] == "F0"){
    os.logea(chalk.green(device+" Protocol version set to version:"+hopper_protocol_version[2]));
      return resolve("OK")
    }else{
        console.log(chalk.red("////////////ERROR/////////////"));
        return reject("////////////ERROR/////////////")
    }
  });
//  enable_sending();
}
module.exports.handleprotocolversion=handleprotocolversion;
////////////////////////////////////////////////////
function hex_to_ascii(str1) {
  var hex = str1.toString();
  var str = '';
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}
///////////////////////////////////////////////////////
function get_count_bytes_received() {
  var number_of_byte = received_command.substr(0, 2);
  //console.log("number of byte:"+ number_of_byte);
  number_of_byte = ConvertBase.hex2bin(number_of_byte);
  number_of_byte = ConvertBase.bin2dec(number_of_byte);
  //console.log(number_of_byte);
  return number_of_byte;
}
module.exports.get_count_bytes_received=get_count_bytes_received;
////////////////////////////////////////////////////
function handlesetuprequest(data){
  return new Promise( function(resolve, reject) {
    var number_of_byte = get_count_bytes_received();
    var myData = data.substr(2, number_of_byte + 2);
    var firstbyte = myData.substr(0, 2);
    //////////////////////////////////////////////////////
    note_validator_type = myData.substr(2, 2);
    switch(note_validator_type) {
      case "0E":
        note_validator_type = "TEBS+Payout"
        break;
      case "00":
        note_validator_type = "NV200 Spectral"
        break;
      case "03":
        note_validator_type = "Smart Hopper"
        break;
      default:
    }
    console.log(chalk.white("Device type: " + chalk.yellow(note_validator_type)));

///////////////////////////////////////////////////////
//////////////////////////////////////////////////////
var firmware_version = myData.substr(4, 8);
// change firmware_version to ASCII
firmware_version = hex_to_ascii(firmware_version);
firmware_version = parseInt(firmware_version);

os.logea("firmware_version:" + firmware_version);
///////////////////////////////////////////////////////
//////////////////////////////////////////////////////
country_code = myData.substr(12, 6);
//console.log("Country code HEX:" + country_code);
country_code = hex_to_ascii(country_code);
os.logea("Country code:" + country_code);
///////////////////////////////////////////////////////
//////////////////////////////////////////////////////
var value_multiplier = myData.substr(18, 6);
value_multiplier = parseInt(hex_to_dec(value_multiplier));
os.logea("value_multiplier:" + value_multiplier);
///////////////////////////////////////////////////////
//////////////////////////////////////////////////////
var numbers_of_channels = myData.substr(24, 2);
numbers_of_channels = parseInt(numbers_of_channels);
os.logea("Numbers of channels:" + numbers_of_channels);
///////////////////////////////////////////////////////
if(numbers_of_channels==7){
  //////////////////////////////////////////////////////
  numbers_of_channels = ConvertBase.hex2bin(numbers_of_channels);
  numbers_of_channels = ConvertBase.bin2dec(numbers_of_channels);
  numbers_of_channels = numbers_of_channels * 2;
  var channel_value = myData.substr(26, numbers_of_channels);
  var first_channel = channel_value.substr(0, 2);
  //console.log("channel_value_1_HEX:" + first_channel);
  var second_channel = channel_value.substr(2, 2);
  //console.log("channel_value_2_HEX:" + second_channel);
  var third_channel = channel_value.substr(4, 2);
  //console.log("channel_value_3_HEX:" + third_channel);
  var fourth_channel = channel_value.substr(6, 2);
  //console.log("channel_value_4_HEX:" + fourth_channel);
  var fifth_channel = channel_value.substr(8, 2);
  //console.log("channel_value_5_HEX:" + fifth_channel);
  var sixth_channel = channel_value.substr(10, 2);
  //console.log("channel_value_6_HEX:" + sixth_channel);
  var seventh_channel = channel_value.substr(12, 2);
  //console.log("channel_value_7_HEX:" + seventh_channel);
  ////////////////////////////////////////////////////////
  var channels_country_code = myData.substr(62, 42);
  var country_code_channel_one = hex_to_ascii(channels_country_code.substr(0, 6));
  var country_code_channel_two = hex_to_ascii(channels_country_code.substr(6, 6));
  var country_code_channel_three = hex_to_ascii(channels_country_code.substr(12, 6));
  var country_code_channel_four = hex_to_ascii(channels_country_code.substr(18, 6));
  var country_code_channel_five = hex_to_ascii(channels_country_code.substr(24, 6));
  var country_code_channel_six = hex_to_ascii(channels_country_code.substr(30, 6));
  var country_code_channel_seven = hex_to_ascii(channels_country_code.substr(36, 6));

  ///////////////////////////////////////////////////////
  os.logea("channel_value_1:" + parseInt(first_channel, 16) + country_code_channel_one);
  os.logea("channel_value_2:" + parseInt(second_channel, 16) + country_code_channel_two);
  os.logea("channel_value_3:" + parseInt(third_channel, 16) + country_code_channel_three);
  os.logea("channel_value_4:" + parseInt(fourth_channel, 16) + country_code_channel_four);
  os.logea("channel_value_5:" + parseInt(fifth_channel, 16) + country_code_channel_five);
  os.logea("channel_value_6:" + parseInt(sixth_channel, 16) + country_code_channel_six);
  os.logea("channel_value_7:" + parseInt(seventh_channel, 16) + country_code_channel_seven);
  ///////////////////////////////////////////////////////
  var protocol_version = myData.substr(52, 2);
  os.logea("protocol version:" + "Version " + parseInt(protocol_version, 16));
  ///////////////////////////////////////////////////////
}
if(numbers_of_channels==5){
  //////////////////////////////////////////////////////
numbers_of_channels = ConvertBase.hex2bin(numbers_of_channels);
numbers_of_channels = ConvertBase.bin2dec(numbers_of_channels);
numbers_of_channels = numbers_of_channels * 2;
var channel_value = myData.substr(26, numbers_of_channels);
var first_channel = channel_value.substr(0, 2);
//console.log("channel_value_1_HEX:" + first_channel);
var second_channel = channel_value.substr(2, 2);
//console.log("channel_value_2_HEX:" + second_channel);
var third_channel = channel_value.substr(4, 2);
//console.log("channel_value_3_HEX:" + third_channel);
var fourth_channel = channel_value.substr(6, 2);
//console.log("channel_value_4_HEX:" + fourth_channel);
var fifth_channel = channel_value.substr(8, 2);
//console.log("channel_value_5_HEX:" + fifth_channel);
////////////////////////////////////////////////////////
var channels_country_code = myData.substr(54, 30);
var country_code_channel_one = hex_to_ascii(channels_country_code.substr(0, 6));
var country_code_channel_two = hex_to_ascii(channels_country_code.substr(6, 6));
var country_code_channel_three = hex_to_ascii(channels_country_code.substr(12, 6));
var country_code_channel_four = hex_to_ascii(channels_country_code.substr(18, 6));
var country_code_channel_five = hex_to_ascii(channels_country_code.substr(24, 6));
///////////////////////////////////////////////////////
os.logea("channel_value_1:" + parseInt(first_channel, 16) + country_code_channel_one);
os.logea("channel_value_2:" + parseInt(second_channel, 16) + country_code_channel_two);
os.logea("channel_value_3:" + parseInt(third_channel, 16) + country_code_channel_three);
os.logea("channel_value_4:" + parseInt(fourth_channel, 16) + country_code_channel_four);
os.logea("channel_value_5:" + parseInt(fifth_channel, 16) + country_code_channel_five);
///////////////////////////////////////////////////////
var protocol_version = myData.substr(52, 2);
os.logea("protocol version:" + "Version " + parseInt(protocol_version, 16));
///////////////////////////////////////////////////////
}
//console.log("/////////////////////////////////");
//  enable_sending();
return resolve("OK");
});
}
module.exports.handlesetuprequest=handlesetuprequest;
////////////////////////////////////////////////////
function handleGetSerialNumber(data){
  return new Promise(function(resolve, reject) {
    var number_of_byte = get_count_bytes_received();
    var myData = data.substr(2, number_of_byte + 2);
    var firstbyte = myData.substr(0, 2);
    var serialN = myData.substr(2, 8);
    serialN = parseInt(serialN, 16);
    //var machine_sn = serialN;
    //exports.machine_sn = machine_sn;
    //numero_de_serie=machine_sn;
    numero_de_serie=serialN;

    console.log(chalk.white("The serial number is: " + chalk.yellow(serialN)));
    //console.log("/////////////////////////////////");
    return resolve(data);
  });

}
module.exports.handleGetSerialNumber=handleGetSerialNumber;
////////////////////////////////////////////////////

// async function handlepoll2(data){
//    console.log("iniciando handle poll2");
//   return new Promise((resolve,reject)=>{
// var poll_responde=data.match(/.{1,2}/g);
// //console.log(poll_responde);
//
//
//  if(poll_responde == undefined || poll_responde.length < 1){
//    console.log("ERROR Receiving data");
//    return reject();
// //   ready_for_sending=true;
// //   ready_for_pooling=true;
// //   return;
//  }else{
//    //if(poll_responde[1] == "F0"){
//   //   console.log(chalk.green("OK received"));
//
//    for (var i =1; i< poll_responde.length; i++ )
//       {
// //     // console.log(poll_responde[i]);
//         switch(poll_responde[i])
//      {
// //         case("83"):
// //         console.log(chalk.red.inverse("Calibration failed"));
// //         break;
// //
// //         case("8B"):
// //         console.log(chalk.red.inverse("Escrow Active"));
// //         break;
// //
//         case("90"):
//         console.log(chalk.red.inverse("Cashbox out of Service"));
//         server.io.emit('Cashbox_out_of_Service', "Cashbox out of Service");
//         break;
// //
//         case("92"):
//         console.log(chalk.red.inverse("Cashbox Back in Service"));
//         server.io.emit('Cashbox_Back_in_Service', "Cashbox Back in Service");
//         break;
// //
// //         case("93"):
// //         console.log(chalk.red.inverse("Cashbox Unlock Enable"));
// //           server.io.emit('Cashbox_Unlock_Enable', "Cashbox Unlock Enable");
// //         break;
// //
// //         case("A5"):
// //         console.log(chalk.red.inverse("Ticket Printing"));
// //         break;
// //
// //         case("A6"):
// //         console.log(chalk.red.inverse("Ticket Printed"));
// //         break;
// //
// //         case("A8"):
// //         console.log(chalk.red.inverse("Ticket Printing Error"));
// //         break;
// //
// //         case("AD"):
// //         console.log(chalk.red.inverse("Ticket in Bezel"));
// //         break;
// //
// //         case("AE"):
// //         console.log(chalk.red.inverse("Print Halted"));
// //         break;
// //
// //         case("AF"):
// //         console.log(chalk.red.inverse("Printed to Cashbox"));
// //         break;
// //
//         case("B0"):
//         console.log(chalk.red.inverse("Jam recovery"));
//           server.io.emit('Jam_recovery', "Jam recovery");
//         break;
// //
// //         case("B1"):
// //         console.log(chalk.red.inverse("Error During Payout"));
// //         break;
// //
//          case("B3"):
//          console.log(chalk.red.inverse("Smart emptying"));
//            server.io.emit('Smart_emptying', "Smart emptying");
//          break;
// //
//         case("B4"):
//         console.log(chalk.red.inverse("Smart emptied"));
//         //read event data
//         var value_in_hex=data.substr(8,8);
//         value_in_hex=enc.changeEndianness(value_in_hex);
//         value_in_hex=value_in_hex.toString(10);
//       //   console.log(value_in_hex);
//         // console.log(typeof(value_in_hex));
//          var prefix="0x";
//         // var value="0000073D";
//          value_in_hex=prefix.concat(value_in_hex);
//          value_in_hex=parseInt(value_in_hex);
//          value_in_hex=value_in_hex/100;
//       //   console.log(value_in_hex);
//         //value dispensed:
//         server.io.emit('Smart_emptied', "Smart emptied");
//         break;
// //
// //         case("B5"):
// //         console.log(chalk.red("channel disabled"));
// //         break;
// //
// //         case("B6"):
// //         console.log(chalk.red.inverse("Device Initializing"));
// //         server.io.emit('Device_Initializing', "Device Initializing");
// //         break;
// //
// //         case("B7"):
// //         console.log(chalk.red.inverse("Coin Mech Error"));
// //         break;
// //
// //         case("BA"):
// //         console.log(chalk.red.inverse("Coin Rejected"));
// //         break;
// //
// //         case("BD"):
// //         console.log(chalk.red.inverse("Attached Coin Mech Disabled"));
// //         break;
// //
// //         case("BE"):
// //         console.log(chalk.red.inverse("Attached Coin Mech enabled"));
// //         break;
// //
// //         case("BF"):
// //         console.log(chalk.red.inverse("Value Added"));
// //           server.io.emit('Value_Added', "Value Added");
// //         break;
// //
// //         case("C0"):
// //         console.log(chalk.cyan("Maintenance Required"));
// //           server.io.emit('Maintenance_Required', "Maintenance Required");
// //         break;
// //
// //         case("C1"):
// //         console.log(chalk.cyan("Pay-In Active"));
// //         break;
// //
//         case("C2"):
//         console.log(chalk.cyan("emptying"));
//         server.io.emit('emptying', "emptying");
//         break;
// //
//         case("C3"):
//         console.log(chalk.cyan("emptied"));
//         server.io.emit('emptied', "emptied");
//         break;
// //
// //         case("C4"):
// //         console.log(chalk.cyan("coin mech jam"));
// //         break;
// //
// //         case("C5"):
// //         console.log(chalk.cyan("coin mech return active"));
// //         break;
// //
//         case("C9"):
//         console.log(chalk.cyan("Note Transfered to Stacker"));
//         server.io.emit('Note_Transfered_to_Stacker', "Note Transfered to Stacker");
//         break;
// //
// //         case("CA"):
// //         console.log(chalk.cyan("Note into Stacker at Reset"));
// //         server.io.emit('Note_into_Stacker_at_Reset', "Note into Stacker at Reset");
// //         break;
// //
// //         case("CB"):
// //         console.log(chalk.cyan("Note into Store at Reset"));
// //         server.io.emit('Note_into_Store_at_Reset', "Note into Store at Reset");
// //         break;
// //
// //         case("CC"):
// //         console.log(chalk.cyan("Staking"));
// //         server.io.emit('Staking', "Staking");
// //         break;
// //
// //         case("CE"):
// //       //  console.log(chalk.cyan("Note Held in Bezel"));
// //         server.io.emit('note_held_in_bezel', "retirar bilete");
// //         break;
// //
// //         case("CF"):
// //         console.log(chalk.cyan("Device full"));
// //         server.io.emit('Device_full', "Device full");
// //         break;
// //
// //         case("D1"):
// //         console.log(chalk.red.inverse("Barcode Ticket Ack"));
// //         //do not assign credit
// //         break;
// //
// //         case("D2"):
// //         //console.log(chalk.red.inverse("Dispensed"));
// //         //read event data
// //         var value_in_hex=data.substr(8,8);
// //         value_in_hex=changeEndianness(value_in_hex);
// //         value_in_hex=value_in_hex.toString(10);
// //         // console.log(value_in_hex);
// //         // console.log(typeof(value_in_hex));
// //          var prefix="0x";
// //         // var value="0000073D";
// //          value_in_hex=prefix.concat(value_in_hex);
// //          value_in_hex=parseInt(value_in_hex);
// //          value_in_hex=value_in_hex/100;
// //          console.log(chalk.yellow("totalmente pagado:"+value_in_hex));
// //         //value dispensed:
// //         //update current payment with the full value of amount dispensed;
// //         const remesa1 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='egreso' ");
// //         var id_remesa1 = remesa1[0].no_remesa;
// //         await pool.query ("UPDATE remesas SET status='completado', monto=? WHERE no_remesa=?",[value_in_hex,id_remesa1]);
// //         server.io.emit('Dispensed', value_in_hex);
// //         //do not assign credit
// //         break;
// //
// //         case("D3"):
// //         console.log(chalk.red.inverse("Coins Low"));
// //         //do not assign credit
// //         break;
// //
// //         case("D5"):
// //         console.log(chalk.red.inverse("Hopper Jam"));
// //         //do not assign credit
// //         break;
// //
// //         case("D6"):
// //         console.log(chalk.red.inverse("Halted"));
// //         //do not assign credit
// //         break;
// //
// //         case("D7"):
// //         console.log(chalk.red.inverse("floating"));
// //         //do not assign credit
// //         break;
// //
// //         case("D8"):
// //         console.log(chalk.red.inverse("floated"));
// //         //do not assign credit
// //         break;
// //
// //         case("D9"):
// //         console.log(chalk.red.inverse("Tiempout"));
// //         //do not assign credit
// //         break;
// //
// //         case("DA"):
// //         //console.log(chalk.red.inverse("Dispensing"));
// //         //read event data
// //         var value_in_hex=data.substr(8,8);
// //         value_in_hex=changeEndianness(value_in_hex);
// //         value_in_hex=value_in_hex.toString(10);
// //         // console.log(value_in_hex);
// //         // console.log(typeof(value_in_hex));
// //          var prefix="0x";
// //         // var value="0000073D";
// //          value_in_hex=prefix.concat(value_in_hex);
// //          value_in_hex=parseInt(value_in_hex);
// //          value_in_hex=value_in_hex/100;
// //     //     console.log(chalk.cyan("pago acumulado:"+value_in_hex));
// //         //value dispensed:
// //         const remesa2 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='egreso' ");
// //         if(remesa2.length>0){
// //            var id_remesa2 = remesa2[0].no_remesa;
// //            await pool.query ("UPDATE remesas SET monto=? WHERE no_remesa=?",[value_in_hex,id_remesa2]);
// //          }
// //         server.io.emit('Dispensing', value_in_hex);
// //         //do not assign credit
// //         break;
// //
// //         case("DB"):
// //         console.log(chalk.red.inverse("Note Stored in Payout"));
// //         server.io.emit('Note_Stored_in_Payout', "Note Stored in Payout");
// //         //do not assign credit
// //         break;
// //
// //         case("DC"):
// //         console.log(chalk.red.inverse("Incomplete payout"));
// //         server.io.emit('Incomplete_payout', "Incomplete payout");
// //         // 0CF0 F1 DC 00 00000058 1B 00 00 E8
// //         //do not assign credit
// //         break;
// //
// //         case("DD"):
// //         console.log(chalk.red.inverse("Incomplete float"));
// //         //do not assign credit
// //         break;
// //
// //         case("DE"):
// //         console.log(chalk.red.inverse("cashbox paid"));
// //         server.io.emit('cashbox_paid', "cashbox paid");
// //         //do not assign credit
// //         break;
// //
// //         case("DF"):
// //         console.log(chalk.red.inverse("Coin Credit"));
// //         //do not assign credit
// //         break;
// //
// //         case("E0"):
// //         console.log(chalk.red.inverse("Note Path Open"));
// //
// //         //do not assign credit
// //         break;
// //
// //         case("E1"):
// //         console.log(chalk.red.inverse("Note cleared from front"));
// //             server.io.emit('Note_cleared_from_front', "Note cleared from front");
// //         //do not assign credit
// //         break;
// //
// //         case("E2"):
// //         console.log(chalk.red.inverse("Note cleared into cashbox"));
// //         server.io.emit('Note_cleared_into_cashbox', "Note cleared into cashbox");
// //         //asign credit
// //         break;
// //
// //         case("E3"):
// //         console.log(chalk.red.inverse("Cashbox Removed"));
// //         server.io.emit('Cashbox_Removed', "Cashbox Removed");
// //         break;
// //
// //         case("E4"):
// //         console.log(chalk.red.inverse("Cashbox Replaced"));
// //         server.io.emit('Cashbox_Replaced', "Cashbox Replaced");
// //         break;
// //
// //         case("E5"):
// //         console.log(chalk.red.inverse("Barcode Ticket Validated"));
// //         break;
// //
// //         case("E6"):
// //         console.log(chalk.red.inverse("Fraud Attemp"));
// //         break;
// //
// //         case("E7"):
// //         console.log(chalk.red.inverse("Stacker Full"));
// //         server.io.emit('Stacker_Full', "Stacker Full");
// //         break;
// //
//          case("E8"):
//          console.log(chalk.red("Validator DisabledX"));
// // //        console.log(chalk.green("Ready"));
// //         server.io.emit('Validator_Disabled', "Validator Disabled");
//          break;
// //
// //         case("E9"):
// //         console.log(chalk.cyan("Unsafe Jam"));
// //         break;
// //
// //         case("EB"):
// //         console.log(chalk.cyan("Staked"));
// //         server.io.emit('Staked', "Staked");
// //         break;
// //
// //         case("EC"):
// //         console.log(chalk.cyan("Rejected"));
// //         break;
// //
// //         case("ED"):
// //         console.log(chalk.cyan("Rejecting"));
// //         break;
// //
// //         case("EF"):
// //         console.log(chalk.cyan("Read"));
// //         {
// //           var channel=poll_responde[i+1];
// //           console.log("channel:"+channel);
// //         }
// //         break;
// //
// //         case("EE"):
// //         console.log(chalk.cyan("Note credit"));
// //         {
// //           var channel=poll_responde[i+1];
// //           console.log("channel:"+channel);
// //           if(channel==01){
// //             store_note(10);
// //             console.log("10 soles");
// //
// //           }
// //           if(channel==02){
// //             store_note(20);
// //             console.log("20 soles");
// //           }
// //           if(channel==03){
// //             store_note(50);
// //             console.log("50 soles");
// //           }
// //           if(channel==04){
// //             store_note(100);
// //             console.log("100 soles");
// //           }
// //           if(channel==05){
// //             store_note(200);
// //             console.log("200 soles");
// //           }
// //         //   const remesa4 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso' ");
// //         //   var id_remesa4 = remesa4[0].no_remesa;
// //         //   console.log("la remesa en proceso es:"+id_remesa4);
// //         //   //consultar monto;
// //         //   const calculando_monto = await pool.query("SELECT SUM(monto) AS totalremesa FROM creditos WHERE no_remesa=? AND status='processing'", [id_remesa4]);
// //         //   var monto_acumulado_remesa = calculando_monto[0].totalremesa;
// //         //
// //         // //  var monto_acumulado=await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso' ");
// //         //   await pool.query ("UPDATE remesas SET status='en_proceso',monto=? WHERE no_remesa=?",[monto_acumulado_remesa,id_remesa4]);
// //         }
// //         break;
// //
//           case("F0"):
//           console.log(chalk.cyan("OK"));
//           break;
// //         case("F1"):
// //         console.log(chalk.cyan("Slave Reset"));
// //         break;
// //                  //     case("EE"):
// //                  //     {
// //                  //       console.log("CREDIT NOTE");
// //                  //       var credit=poll_responde[i+1];
// //                  //       console.log(credit);
// //                  //       i++;
// //                  //       credit=poll_responde[i+1];
// //                  //       console.log(credit);
// //                  //       break;
// //                  //     }
// //                  //
// //
//          }//switch closing
// //         //enable_sending();
//     }//switch closing
//    }//end of FOR loop
//  //else{
// //     console.log(chalk.red("THERE IS AN ERROR HERE"));
// //  }//end iff
//  //}
//  console.log("aqui");
//  return resolve();
// // ///////////////////////
// // enable_sending();
// // //ready_for_sending=true;
// // //console.log("habilitando next write");
// ///////////////////////
// });
// }
// module.exports.handlepoll2=handlepoll2;
/////////////////////////////////////////////////////////
// function handlepoll3(data){
// //   console.log("iniciando handle poll3");
// //   return
//   return new Promise((resolve,reject)=>{
//       var poll_responde=data.match(/.{1,2}/g);
//     //  console.log(poll_responde);
//        if(poll_responde == undefined || poll_responde.length < 1){
//          console.log("ERROR Receiving data");
//          return reject();
//              }else{
//                for (var i =1; i< poll_responde.length; i++ )
//                   {
//                     switch(poll_responde[i])
//                  {
//                     case("90"):
//                     console.log(chalk.red.inverse("Cashbox out of Service"));
//                     server.io.emit('Cashbox_out_of_Service', "Cashbox out of Service");
//                     break;
//                     case("92"):
//                     console.log(chalk.red.inverse("Cashbox Back in Service"));
//                     server.io.emit('Cashbox_Back_in_Service', "Cashbox Back in Service");
//                     break;
//                     case("B0"):
//                     console.log(chalk.red.inverse("Jam recovery"));
//                       server.io.emit('Jam_recovery', "Jam recovery");
//                     break;
//                     case("B3"):
//                      console.log(chalk.red.inverse("Smart emptying"));
//                        server.io.emit('Smart_emptying', "Smart emptying");
//                     break;
//                     case("B4"):
//                     console.log(chalk.red.inverse("Smart emptied"));
//                     //read event data
//                     var value_in_hex=data.substr(8,8);
//                     value_in_hex=enc.changeEndianness(value_in_hex);
//                     value_in_hex=value_in_hex.toString(10);
//                      //console.log(value_in_hex);
//                      var prefix="0x";
//                      value_in_hex=prefix.concat(value_in_hex);
//                      value_in_hex=parseInt(value_in_hex);
//                      value_in_hex=value_in_hex/100;
//                      //console.log(value_in_hex);
//                     //value dispensed:
//                     server.io.emit('Smart_emptied', "Smart emptied");
//                     break;
//                     case("C2"):
//                     console.log(chalk.cyan("emptying"));
//                     server.io.emit('emptying', "emptying");
//                     break;
//                     case("C3"):
//                     console.log(chalk.cyan("emptied"));
//                     server.io.emit('emptied', "emptied");
//                     break;
//                     case("C9"):
//                     console.log(chalk.cyan("Note Transfered to Stacker"));
//                     server.io.emit('Note_Transfered_to_Stacker', "Note Transfered to Stacker");
//                     break;
//                     case("E8"):
//                      console.log(chalk.red(device+" DisabledX"));
//                     break;
//                     case("F0"):
//                     //  console.log(chalk.green("OK"));
//                     break;
//                   }//switch closing
//             //         //enable_sending();
//                 }//switch closing
//                }//end of FOR loop
//
//       // console.log("fin poll_loop3");
//       return  resolve();
//       });
//   //    console.log("se esta llamando esto?");
// }
// module.exports.handlepoll3=handlepoll3;
/////////////////////////////////////////////////////////
function ensureIsSet() {
    return new Promise(function (resolve, reject) {
      var secondtimer,timerout;
      function waitForFoo(){
          if (ready_for_sending){
            clearTimeout(timerout);
          //  console.log("Saliendo de ensure is set con RFS:"+ready_for_sending);
          //  console.log("saliendo a ensure is set-> ready for pooling llego:"+ready_for_pooling);
             return resolve("OK");
          }else {
          //  console.log(chalk.magenta("Canal Serial ocupado, estoy esperando"));
          //    console.log("con RFS:"+ready_for_sending);
          }
        //  clearTimeout(timerout);
          secondtimer=setTimeout(waitForFoo, 100);
        //  console.log("wait for foo was set on second timer");
    };

      try {
        //console.log("la orden aqui es:"+receiver+" "+command);
        //console.log("estoy entrando a ensureIsSet: con RFS:"+ready_for_sending);
        //console.log("entrando a ensure is set-> ready for pooling llego:"+ready_for_pooling);
            waitForFoo();
            timerout= setTimeout(function () {
                clearTimeout(secondtimer);
              //  console.log("Timeout reached");
               return reject(chalk.red("El canal serial esta ocupado mucho tiempo. ready_for_sending se mantiene en false. al intentar transmitir un dato."));
              // return resolve("OK");
            }, 1000);//este define el tiempo que esperara hasta darse por vencido de esperar que el canal se desocupe.
            // console.log("hasta aqui llegue seteando timers.");

      } catch (e) {
        console.log("rejecting01:"+e);
          return reject(e);
      } finally {
      //  return
      }

    });
};
module.exports.ensureIsSet=ensureIsSet;
/////////////////////////////////////////////////////////
function ensureIsSet2() {
  var secondtimer,timerout;
  function waitForFoo(){
        secondtimer=setTimeout(waitForFoo, 1000);
      //  console.log("sigo en wait for foo");
      if (ready_for_sending){
      //    console.log(chalk.green("Canal liberado"));
        //  console.log(secondtimer);
        //  console.log(timerout);
         clearTimeout(timerout);
         //
         return;

      }else {
      //  console.log(chalk.magenta("XXXXXXXXXXXXXXXXXXXXXXXXXX"));

        return
      }
      clearTimeout(secondtimer);
    //  clearTimeout(timerout);
    //  console.log("wait for foo was set on second timer");
  //  return;
  };
    waitForFoo();
    timerout= setTimeout(function () {
        clearTimeout(secondtimer);
      //  console.log("Timeout reached");
    //   return; // reject(chalk.red("El canal serial esta ocupado mucho tiempo. ready_for_sending se mantiene en false. al intentar transmitir un dato."));
      // return resolve("OK");
    }, 1000);//este define el tiempo que esperara hasta darse por vencido de esperar que el canal se desocupe.
    // console.log("hasta aqui llegue seteando timers.");

  //  return;
};
module.exports.ensureIsSet2=ensureIsSet2;
/////////////////////////////////////////////////////////
function set_protocol_version(receptor,version_de_receptor) {
  return new Promise( async function(resolve, reject) {
    os.logea("set_protocol_version");
      os.logea(receptor);
       var step1=await envia_encriptado(receptor,version_de_receptor) //<--------------------- host_protocol_version
        if (step1.length>0) {
          var step2 =await handleprotocolversion(step1);
          if(step2=="OK"){
            return resolve("OK");
          }
        }

  });

};
module.exports.set_protocol_version=set_protocol_version;
/////////////////////////////////////////////////////////
function setup_request_command(receptor) {
  return new Promise(async function(resolve, reject) {
try {
  os.logea("setup_request sent");
 var step1= await envia_encriptado(receptor,setup_request) //<---- setup_request
 if (step1.length>0) {
  // console.log("step1:"+step1);
   var step2=await handlesetuprequest(step1);
   //return resolve("TERMINADO");
   if(step2=="OK"){
     var step3=await envia_encriptado(receptor,get_serial_number) //<-------- get_serial_number
     if (step3.length>0) {
       var step4=await handleGetSerialNumber(step3);
       if (step4="OK") {
         if(note_validator_type == "TEBS+Payout"){
                                                   //console.log("si es tebs");
                                                   var step5= await verificar_existencia_de_bolsa(receptor);

                                                   }else {
                                                         //  console.log("RH si existe en db");
                                                           step5="OK";
                                                         }
                 //si existe, no pasa nada,
                 //si no existe, se crea una remesa hermes nueva, con el valor del tebsbarcode.
           //  console.log(step5);
             if (step5=="OK"){
               //  console.log(step5);
                 return resolve("OK");
             }else {
               //return reject(chalk.red("NO HAY BOLSA"));
               //setear variable nobolsa!
               return resolve("OK");

             }

         }else {
           return resolve("OK");
         }

       }
     }
   }
 //}
} catch (e) {
  return reject(e);
} finally {
  //return;
}
  });
};
module.exports.setup_request_command=setup_request_command;
/////////////////////////////////////////////////////////
function verificar_existencia_de_bolsa(receptor) {
  return new Promise(async function(resolve, reject) {
    try {
      var current_tebs=await sp.transmision_insegura(receptor,get_tebs_barcode) //<-------- get_serial_number
    //  console.log("current tebs es:"+current_tebs);

      current_tebs=await val.handleGetTebsBarcode(current_tebs)
      //verifica si existe en la base de datos esa bolsa,
    //  console.log("current tebs es:"+current_tebs);
      //tebs_barcode=parseInt(current_tebs);
    //  console.log(tebs_barcode.length);
      if (tebs_barcode.length===undefined) {
        //console.log(chalk.red("NO HAY BOLSA DETECTADA"));
        //return resolve("OK");
        return resolve(chalk.red("SIN BOLSA"));

                                               }else {
                                                      console.log(chalk.white("TEBSBarCode es:"+chalk.yellow(parseInt(tebs_barcode))));
                                                       const existe_remesa_hermes= await pool.query("SELECT COUNT(tebs_barcode) AS RH FROM remesa_hermes WHERE tebs_barcode=?",[tebs_barcode]);
                                                       if(existe_remesa_hermes[0].RH ===0){
                                                      //                                     //  console.log(existe_remesa_hermes[0].RH);
                                                                                             const this_machine= await pool.query("SELECT * FROM machine");
                                                                                             console.log(chalk.yellow("No existe esta bolsa, se creara una nueva remesa hermes con tebsbarcode:"+tebs_barcode));
                                                                                             const nueva_res_hermes={
                                                                                                                      tienda_id:this_machine[0].tienda_id,
                                                                                                                      monto:0,
                                                                                                                      moneda:country_code,
                                                                                                                      status:"iniciada",
                                                                                                                      tebs_barcode:tebs_barcode,
                                                                                                                      machine_sn:numero_de_serie,
                                                                                                                      //fecha:moment().format('YYYY-MM-DD'),
                                                                                                                      //hora:moment().format('h:mm:ss a'),
                                                                                                                      fecha:tambox.fecha_actual(),
                                                                                                                      hora:tambox.hora_actual(),
                                                                                                                      no_billetes:0
                                                                                                                    }
                                                                                            await pool.query('INSERT INTO remesa_hermes set ?', [nueva_res_hermes]);
                                                                                            await sincroniza_remesa_hermes([nueva_res_hermes]);
                                                                                            return resolve("OK");
                                                    }else{
                                                      //RH ya existe con este tebs. no se creara una nueva
                                                      //console.log("RH ya existente");
                                                      return resolve("OK");
                                                    }
                                                 }
    } catch (e) {
      //return reject(chalk.red("no se pudo verificar la existencia de la bolsa:")+e);
      return resolve("no_bolsa");
    } finally {

    }
  });

}
/////////////////////////////////////////////////////////
async function sincroniza_remesa_hermes(res){
var  res2=await res.json();
console.log("iniciando sincronizacion a nube:"+res2);
 return new Promise(async function(resolve, reject) {
  try {
    var tbm_adress=tbm_adressx;
    var fix= "/sync_remesa_hermes";
    var tienda_id=res[0].tienda_id;
    var monto=res[0].monto;
    var moneda=res[0].moneda;
    var status=res[0].status;
    var tebs_barcode3=res[0].tebs_barcode;
    var machine_sn=res[0].machine_sn;
    var fecha=res[0].fecha;
    var hora=res[0].hora;
    var no_billetes=res[0].no_billetes;
    // var rms_status=remesax[0].rms_status;
    // var tipo=remesax[0].tipo;
    // var status_hermes=remesax[0].status_hermes;
    const url= tbm_adress+fix+"/"+tienda_id+"/"+monto+"/"+moneda+"/"+status+"/"+tebs_barcode3+"/"+machine_sn+"/"+fecha+"/"+hora+"/"+no_billetes
    console.log("url:"+url);
    /////////////////
    const Http= new XMLHttpRequest();
  //  const url= 'http://192.168.1.2:3000/sync_remesa/22222/001/0002/9999/15000/PEN/14444330/234765/ingreso/2019-05-09/17:22:10'
    Http.open("GET",url);
    Http.send();
    return resolve();
  } catch (e) {
    return reject(e);
  } finally {
    return;
  }
});
}
/////////////////////////////////////////////////////////
function sincroniza_remesa_hermes2(res){
console.log("iniciando actualizacion de remesa hermes:");
 return new Promise(async function(resolve, reject) {
  try {
    var tbm_adress=tbm_adressx;
    var fix= "/sync_remesa_hermes2";
    var monto=res[0].monto;
    var moneda=res[0].moneda;
    var status=res[0].status;
    var tebs_barcode4=res[0].tebs_barcode;
    var no_billetes=res[0].no_billetes;
    // var rms_status=remesax[0].rms_status;
    // var tipo=remesax[0].tipo;
    // var status_hermes=remesax[0].status_hermes;
    const url= tbm_adress+fix+"/"+monto+"/"+moneda+"/"+status+"/"+tebs_barcode4+"/"+no_billetes
    console.log("url:"+url);
    /////////////////
    const Http= new XMLHttpRequest();
  //  const url= 'http://192.168.1.2:3000/sync_remesa/22222/001/0002/9999/15000/PEN/14444330/234765/ingreso/2019-05-09/17:22:10'
    Http.open("GET",url);
    Http.send();
    return resolve();
  } catch (e) {
    return reject(e);
  } finally {
    //return;
  }
});
}
module.exports.sincroniza_remesa_hermes2=sincroniza_remesa_hermes2;
/////////////////////////////////////////////////////////
function set_coin_mech_inhibits(receptor){
  os.logea("set_coin_mech_inhibits sent");
  sp.transmision_insegura(receptor,coin_mech_global_inhibit) //<---- setup_request
    .then(data => {
      os.logea(chalk.yellow('<-:'), chalk.yellow(data));
      handles_coin_mech_inhivits(data);
      os.logea("/////////////////////////////////");
    //  console.log("get_serial_number sent");
    //  return sp.transmision_insegura(receptor,get_serial_number) //<-------- get_serial_number
  //  })
    // .then(data => {
    //   os.logea(chalk.yellow('<-:'), chalk.yellow(data));
    //   handleGetSerialNumber(data);
    //   return sp.transmision_insegura(receptor,poll) //<----------- poll
    //   os.logea("/////////////////////////////////");
    // })
    // .then(data => {
    //   os.logea(chalk.yellow('<-:'), chalk.yellow(data));
    //   handle_coin_mech_inhivits(data);
  //    os.logea("/////////////////////////////////");
      // if (note_validator_type == "TEBS+Payout") {
      //   set_routing();
      // }
      // if (note_validator_type == "NV200 Spectral") {
      //   set_channel_inhivits();
      // }
      //safepool();
    })
    .catch(function(error) {console.log(error);sp.retrial(error);});
}
/////////////////////////////////////////////////////////
function handles_coin_mech_inhivits(data){
  var poll_responde=data.match(/.{1,2}/g);
  if(poll_responde[1] == "F5"){
    console.log(chalk.green(" NO SE PUEDE PROCESAR "));
  }if(poll_responde[1] == "F0"){
      console.log(chalk.green("coin mech inhivits set"));
  }
  else{
      console.log(chalk.red("////////////ERROR/////////////"));
  }
    //enable_sending();
}
////////////////////////////////////////////////////////
function envia_encriptado(receptorx,orden){
    return new Promise(async function(resolve, reject) {
      try {
        ultimo_valor_enviado=orden;
        var  toSend =await enc.prepare_Encryption(orden);
        os.logea("here to_sed is:"+toSend);
          var data=await sp.transmision_insegura(receptorx,toSend) //aqui pasar a version await.
          //console.log(data);
          if (data.length!=0) {
            data=await enc.promise_handleEcommand(data)
            return resolve(data);
          }else {
            return reject("no data received");
          }

      } catch (e) {
        return reject(chalk.red("error 0054:")+e);
      } finally {
          return;
      }
      });
}
module.exports.envia_encriptado=envia_encriptado;

async function envia_encriptado2(receptorx,orden){

        ultimo_valor_enviado=orden;
        var  toSend =await enc.prepare_Encryption(orden);
        os.logea("here to_sed is:"+toSend);
          var data=await sp.transmision_insegura(receptorx,toSend) //aqui pasar a version await.
          //console.log(data);
          if (data.length!=0) {
            data=await enc.promise_handleEcommand(data)
            return data;
          }else {
            return "no data received";
          }


}
module.exports.envia_encriptado2=envia_encriptado2;
////////////////////////////////////////////////////////
function sync_and_stablish_presence_of(receptor) {

  return new Promise(async function(resolve, reject) {

    try {

          os.logea("/////////////////////////////////");
          os.logea(chalk.green("sync_and_stablish_presence_of:"+device));
          os.logea("/////////////////////////////////");
          os.logea("SYNCH command sent to:"+device);
                for (var i = 0; i < 3; i++) {
                  ultimo_valor_enviado="synch";
                  var step1=await sp.transmision_insegura(receptor,synch) //<------------------------------ synch
                    os.logea(chalk.yellow(device+'<-:'), chalk.yellow(step1));
                  var step2=await handlesynch(step1);
                  if (show_details) {
                    console.log(chalk.yellow(device+'<-:'), chalk.yellow(step2));
                  }
                     if (!step2=="OK") {
                       return reject(step2)
                     }
                }
          return resolve("OK")
    } catch (e) {
    return  reject(chalk.cyan("03-Error en sync_and_stablish_presence_of:")+e);
    } finally {
    //  return;
    }
  });
};
module.exports.sync_and_stablish_presence_of=sync_and_stablish_presence_of;

async function sync_and_stablish_presence_of2(receptor) {
          os.logea("/////////////////////////////////");
          os.logea(chalk.green("sync_and_stablish_presence_of:"+device));
          os.logea("/////////////////////////////////");
          os.logea("SYNCH command sent to:"+device);
                for (var i = 0; i < 3; i++) {
                  ultimo_valor_enviado="synch";
                  var step1=await sp.transmision_insegura2(receptor,synch) //<------------------------------ synch
                    os.logea(chalk.yellow(device+'<-:'), chalk.yellow(step1));
                  var step2=await handlesynch(step1);
                  if (show_details) {
                    console.log(chalk.yellow(device+'<-:'), chalk.yellow(step2));
                  }
                     if (!step2=="OK") {
                       return step2;
                     }
                }
          return "OK";
};
module.exports.sync_and_stablish_presence_of2=sync_and_stablish_presence_of2;
/////////////////////////////////////////////////////////
function negociate_encryption(receptor) {
  encryptionStatus = false;
  return new Promise( async function(resolve, reject) {

           enc.getkeys();
           setGenerator = enc.set_generator_();
           os.logea("/////////////////////////////////");
           os.logea("SET GENERATOR command sent");
            ultimo_valor_enviado="setGenerator";
             var step1=await sp.transmision_insegura(receptor,setGenerator) //<------------------------------ synch
               os.logea(chalk.yellow(device+'<-:'), chalk.yellow(step1));
             var step2=await enc.handleSetgenerator(step1);
             if (show_details) {
               console.log(chalk.yellow(device+'<-:'), chalk.yellow(step2));
             }
                if (step2=="OK") {
                  var setModulus = enc.set_modulus();
                  os.logea("/////////////////////////////////");
                  os.logea("SET MODULUS command sent");
                              ultimo_valor_enviado="setModulus";
                  var step3=await sp.transmision_insegura(receptor,setModulus) //<------------------------------ synch
                    os.logea(chalk.yellow(device+'<-:'), chalk.yellow(step3));
                    var step4=await enc.handleSetmodulus(step3);
                    if (show_details) {
                      console.log(chalk.yellow(device+'<-:'), chalk.yellow(step4));
                    }
                       if (step4=="OK") {
                            //  var step6;
                            var rKE = await enc.send_request_key_exchange();
                            os.logea("/////////////////////////////////");
                            os.logea("Request Key Exchange command sent");
                            ultimo_valor_enviado="request key exchange";
                            var step5=await sp.transmision_insegura(receptor,rKE); //<--------------------------- REquest key exchange
                            try {
                              var step6=await enc.handleRKE(step5);
                              if(step6.length>0){
                                os.logea(chalk.green('KEY:'), chalk.green(step6));
                                os.logea(chalk.green("Encripted comunication Active"));
                                os.logea("/////////////////////////////////");
                                encryptionStatus = true;
                               return resolve("OK")

                             }else {
                               return reject("NO KEY:"+step6)
                             }
                            } catch (e) {
                              return reject(chalk.cyan("06-negociate encription")+e);
                            } finally {
                            //  return;
                            }
                        }else {
                          return reject(step4)
                        }
                }else{
                return  reject(step2)
                }

  });
};
module.exports.negociate_encryption=negociate_encryption;
/////////////////////////////////////////////////////////
function hex_to_dec(input){
  var cantidad_en_hex=input
  //console.log(cantidad_en_hex);
  var cantidad_en_bin=ConvertBase.hex2bin(cantidad_en_hex);
  //console.log(cantidad_en_bin);
  var cantidad_en_dec=ConvertBase.bin2dec(cantidad_en_bin);
  //console.log(cantidad_en_dec);
  return cantidad_en_dec
}
module.exports.hex_to_dec=hex_to_dec;
///////////////////////////////////////////////////////
function ensureIsReadyForPolling() {
    return new Promise(function (resolve, reject) {
      //console.log("la orden aqui es:"+receiver+" "+command);
      //console.log("en ensure is ready for pooling-> ready for polling llego:"+ready_for_pooling);
        function waitForFoo(){
            if (ready_for_pooling){
              //console.log("la orden es:"+receiver+" "+command);
              //console.log(chalk.yellow("Listo para pooling"));
               return resolve("OK");
            }
            clearTimeout(timerout3);
            setTimeout(waitForFoo, 30);
      };
          waitForFoo();
         var timerout3= setTimeout(()=>{reject("ready for pooling:"+ready_for_pooling)},1000);
    });
};
module.exports.ensureIsReadyForPolling=ensureIsReadyForPolling;
/////////////////////////////////////////////////////////
function transmite_encriptado_y_procesa(receptorx,polly){
return new Promise(async function(resolve, reject) {
  try {
    //  pollx[0]=parseInt(receptorx) ;
        // var toSend =await enc.prepare_Encryption(polly);
        // console.log("aqui toSend:"+toSend);
        //   sp.transmision_insegura(receptorx,toSend)
        //     .then(async function(data){return await enc.promise_handleEcommand(data)})
        //     .then(async function(data){console.log(chalk.yellow("from here"+device+'<-:'), chalk.yellow(data));return await handlepoll(data)})
        //     .then(data=>{return resolve(data);})
        //     .catch(function(error) {console.log(error);sp.retrial(error);});
if (bypass== false) {
  var toSendw =await enc.prepare_Encryption(polly);
  //console.log("aqui toSend:"+toSendw);
    var data=await sp.transmision_insegura(receptorx,toSendw);
  //  console.log("aqui toSend_response:"+data);

        data=await enc.promise_handleEcommand(data);
        //console.log(chalk.yellow("from here "+device+'<-:'), chalk.yellow(data));
        data= await handlepoll(data);

        if (data.length>0) {
            return resolve(data);
        }

}else {
  //setTimeout(function () {
      return reject("bypassed");
  //}, 1000);

}

  } catch (e) {
    return reject(e);
  } finally {
  //  return;
  }

});

}
module.exports.transmite_encriptado_y_procesa=transmite_encriptado_y_procesa;




function handleSetInhivits(data){
//exports.handleSetInhivits=function(data){
  var number_of_byte = get_count_bytes_received();
  var myData = received_command.substr(2, number_of_byte + 2);
  var firstbyte = myData.substr(0, 2);
  var secondbyte = myData.substr(2, 2);
  if (firstbyte == "F0") {
    console.log(chalk.green("OK Inhivit received"));
  if (secondbyte == "E8") {
    console.log("Device Disabled");
  }
}
  enable_sending();
 }
 module.exports.handleSetInhivits=handleSetInhivits;
////////////////////////////////////////////////////
//global.bag_barcode;
function handleGetTebsBarcode(data){
//exports.handleGetTebsBarcode=function(data){
  var number_of_byte = get_count_bytes_received();
  var myData = received_command.substr(2, number_of_byte + 2);
  var pointer = 0;
  for (var countery = 0; countery < 10; countery++) {
    pointer = pointer + 2;
    var i = myData.substr(pointer, 2);
    i = ConvertBase.hex2bin(i);
    i = ConvertBase.bin2dec(i);
    if (i < 10) {
      i = pad(i);
    } else {
      i = i;
    }
    tebs_barcode = tebs_barcode.concat(i);
  }
  //console.log(chalk.green("tebs barcode is:" + tebs_barcode));
  //var mytebsbarcode = tebs_barcode;
//  bag_barcode=tebs_barcode;
  //exports.mytebsbarcode = mytebsbarcode;
  //return;
  //  enable_sending();
}
module.exports.handleGetTebsBarcode=handleGetTebsBarcode;
/////////////////////////////////////////////////////////
var io;
module.exports = function(importIO) {
    io = importIO;

};
