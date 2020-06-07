const log = require('log-to-file');
const it = require('./server');
var aesjs = require('aes-js');
const chalk=require('chalk');
var Big_Number = require('big-number');
const BigNumber = require('bignumber.js');
const pool = require('./database');
const io = require("./server.js");
var slave_adress = '00';
var smart_hopper_address = '10';
//////////////////////////////
var slave_count=0;
/////////////////////////////
var sync = false;
var seq_bit = 1;
function sequencer() {
  if (sync == true) {
    sync = false;
    seq_bit = 0;
  } else {
    sync = true;
    seq_bit = 128;
  }
};
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
function chunk(str, n) {
  var ret = [];
  var i;
  var len;
  for (i = 0, len = str.length; i < len; i += n) {
    ret.push(str.substr(i, n))
  }
  return ret
};
///////////////////////////////////////////////////
//////////////// crc inplementation ///////////////
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
////////////////////////////////////////////////////////////////
///////////////////// SERIAL PORT CONFIG ///////////////////////
const SerialPort = require('serialport')
const InterByteTimeout = require('@serialport/parser-inter-byte-timeout')
const port = new SerialPort('/dev/ttyUSB0')
const parser = port.pipe(new InterByteTimeout({interval: 80})); //este valor era 30 pero fallaba intermitentemente.

port.on('open', function () {
    console.log(chalk.red('port open'));
    global.is_head_online=true;
});

port.on('close', function (err) {
    console.log(chalk.red('port closed', err));
    global.is_head_online=false;
});

port.on('error', function(err) {
  console.log(chalk.red('Error de puerto SERIAL.IO: ', err.message));
  global.is_head_online=false;
  verifica_coneccion_validador();
})


function verifica_coneccion_validador(){
  port.write("command_ready");
  if(global.is_head_online==true)
  {
    console.log("esta conectada");
  }else{
    console.log("esta desconectada");
    io.io.emit('no_cabezal',"display message from update_requested");
  //  window.location.replace("/no_cabezal"); //aqui quiero mostrar la pantalal de erro al arranque indicando que el cabezal no esta.
  }
}
module.exports.verifica_coneccion_validador=verifica_coneccion_validador;

function enable_sending(){
//  console.log(chalk.yellow("UNBLOCK"));
  ready_for_sending=true;
//  console.log(chalk.green("ready_for_sending:"+ready_for_sending));
//  console.log("habilitando sending");
  ready_for_pooling = true;
//  clearTimeout(polltimer);
return;
}
module.exports.enable_sending=enable_sending;
////////////////////////////////////////////////////////////////////////////////
function prepare_command_to_be_sent(command){
  var formed_command_to_send;
  sequencer();
  var seq_bit_hex = ConvertBase.dec2bin(seq_bit); //seq_bit to hex
  var biny = ConvertBase.hex2bin(slave_adress);
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
  var stuffed=exports.send_byte_stuffing(prestuffing_command);
//  console.log("stuffed:"+stuffed);
//  console.log("comando listo pre stuffing"+stuffed);
//  var command_listo = "7f" + clean_command + el_crc;
  var command_listo = "7f" + stuffed;
  command_listo = command_listo.toUpperCase();
//  console.log("comando listo pre stuffing"+command_listo);
  var lastFive = clean_command.substr(2, clean_command.length); // => "Tabs1"
  single_command = lastFive.toUpperCase();
  //console.log(chalk.cyan('->:' + single_command)); //IMPRIME MENSAJE DE SALIDA LIMPIO
  it.logea(chalk.cyan('->:'),chalk.cyan(single_command));
  //para el archivo log;
  log("->:"+single_command);
  var hexiando = "0x" + chunk(command_listo, 2).join('0x');
  hexiando = hexiando.match(/.{1,4}/g);
  formed_command_to_send = hexiando;
  sent_command = formed_command_to_send;
//  console.log("SENT COMMAND:"+sent_command);
  return sent_command;
}
////////////////////////////////////////////////////////////////////////////////
exports.retrial=function(command_ready){
console.log("retrial now--------------------------------------------------------------------------");
setTimeout(function(){
  it.start_tebs_validator();
},5000);
};
////////////////////////////////////////////////////////////////////////////////
exports.send_byte_stuffing=function(command){
  var res="";
  var thisy2="";
    const thelength=command.length/2;
            for (var i=0;i<thelength;i++){
              var thisy=command.substr(i*2,2);
              if(thisy=="7F"){
              //  console.log(chalk.magenta("Alert bytestuffing DETECTED"));
                res = thisy.replace(/7F/g, "7F7F");
                thisy=res;
              }
              thisy2=thisy2+thisy;
             }
             //console.log("thisy2:"+thisy2);
             return thisy2;
}
exports.received_byte_stuffing=function(command){
//console.log("received command to be evaluted:"+command);
var accumulated_chart="";
var toggy=true;
var current_char="";
const thelength=command.length/2;
    for (var i=0;i<thelength;i++){
           current_char=command.substr(i*2,2);
          //console.log("current_char:"+current_char);
            if(current_char=="7F"){
              if(toggy==true){
                //  console.log("Only one set");
                  toggy=false;
               }else{
                 current_char="";
                 toggy=true;
               }
            }
accumulated_chart=accumulated_chart+current_char;
};
  //console.log(chalk.cyan("----------------Receive Stuffed:"+accumulated_chart));
  return accumulated_chart;
};
////////////////////////////////////////////////////////////////////////////////
// exports.manda=function  (command){
//       const command_ready =prepare_command_to_be_sent(command);
//       return new Promise(
//         (resolve, reject) => {
//         //  console.log("writting");
//           setTimeout(function(){
//           //  console.log("command ready:"+command_ready);
//           /////////////////////////
//       //    ready_for_sending=false;
//         //  console.log("deshabilitando sending");
//           /////////////////////////
//            port.write(command_ready, function(error, response, data){
//              ready_for_sending=false;
//              ready_for_pooling=false;
//              console.log(chalk.red("ready_for_sending:"+ready_for_sending));
//              console.log(chalk.red("ready_for_pooling:"+ready_for_pooling));
//             myVar =setTimeout(function(){
//               // console.log("time outed, check MANDA");
//               // reject(command);
//                console.log("time outed, RESENT MANDA");
//                port.write(command_ready);
//
//             },5000);
//             parser.on('data', function(data){
//             //  console.log("reading");
//                 received_cleaned = new Buffer.from(data, 'hex').toString('hex').toUpperCase();
//                 var str = received_cleaned;
//                 received_command = str.slice(4, -4);
//               //  console.log('ON PARSE ON<-:' + received_command);
//             //    console.log('ON PARSE ON typeof' + typeof(received_command));
//                 var stuffed=exports.received_byte_stuffing(received_command);
//                 received_command=stuffed;
//                 //setTimeout(function(){
//           //        ready_for_sending=true;
//           //        console.log("habilitando sending");
//                 //},5);
//                 resolve(stuffed);
//                 parser.removeAllListeners('data');
//                 clearTimeout(myVar);
//               //  enable_sending();
//               });
//               // Open errors will be emitted as an error event
//           //  if (error) reject(error);
//           })
//         } ,10);
//        }
//      );
// };

// port.on('error', function(err) {
//   console.log('Error de puerto serial: ', err.message)
// });
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////
exports.handlesynch= function (data){
var poll_responde=data.match(/.{1,2}/g);
if(poll_responde[1] == "F0"){
//  console.log(chalk.green("OK"));
enable_sending();
}else{
    console.log("ERROR WITH SYNCH");
}
}
////////////////////////////////////////////////////
exports.handlepoll= async function (data){
//async function  handlepoll(data){
 var poll_responde=data.match(/.{1,2}/g);
//console.log(poll_responde);
if(poll_responde == undefined || poll_responde.length < 1){
  console.log("ERROR Receiving data");
  ready_for_sending=false;
  ready_for_pooling=false; //este lo comente para ver si deja de tragar billetes
  return;
}else{
  if(poll_responde[1] == "F0"){
  //  console.log("OK received");
  for (var i =1; i< poll_responde.length; i++ )
   {
    // console.log(poll_responde[i]);
      switch(poll_responde[i])
    {
        case("83"):
        console.log(chalk.red.inverse("Calibration failed"));
        break;

        case("8B"):
        console.log(chalk.red.inverse("Escrow Active"));
        break;

        case("90"):
        console.log(chalk.red.inverse("Cashbox out of Service"));
        io.io.emit('Cashbox_out_of_Service', "Cashbox out of Service");
        break;

        case("92"):
        console.log(chalk.red.inverse("Cashbox Back in Service"));
        io.io.emit('Cashbox_Back_in_Service', "Cashbox Back in Service");
        break;

        case("93"):
        console.log(chalk.red.inverse("Cashbox Unlock Enable"));
          io.io.emit('Cashbox_Unlock_Enable', "Cashbox Unlock Enable");
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
          io.io.emit('Jam_recovery', "Jam recovery");
        break;

        case("B1"):///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        console.log(chalk.red.inverse("Error During Payout"));
        break;

        case("B3"):
        console.log(chalk.red.inverse("Smart emptying"));
          io.io.emit('Smart_emptying', "Smart emptying");
        break;

        case("B4"):
        console.log(chalk.red.inverse("Smart emptied"));
        //read event data
        var value_in_hex=data.substr(8,8);
        value_in_hex=changeEndianness(value_in_hex);
        value_in_hex=value_in_hex.toString(10);
         console.log(value_in_hex);
        // console.log(typeof(value_in_hex));
         var prefix="0x";
        // var value="0000073D";
         value_in_hex=prefix.concat(value_in_hex);
         value_in_hex=parseInt(value_in_hex);
         value_in_hex=value_in_hex/100;
         console.log(value_in_hex);
        //value dispensed:
        io.io.emit('Smart_emptied', "Smart emptied");
        break;

        case("B5"):
        console.log(chalk.red("channel disabled"));
        break;

        case("B6"):
        console.log(chalk.red.inverse("Device Initializing"));
        io.io.emit('Device_Initializing', "Device Initializing");
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
          io.io.emit('Value_Added', "Value Added");
        break;

        case("C0"):
        console.log(chalk.cyan("Maintenance Required"));
          io.io.emit('Maintenance_Required', "Maintenance Required");
        break;

        case("C1"):
        console.log(chalk.cyan("Pay-In Active"));
        break;

        case("C2"):
        console.log(chalk.cyan("emptying"));
        io.io.emit('emptying', "emptying");
        break;

        case("C3"):
        console.log(chalk.cyan("emptied"));
        io.io.emit('emptied', "emptied");
        break;

        case("C4"):
        console.log(chalk.cyan("coin mech jam"));
        break;

        case("C5"):
        console.log(chalk.cyan("coin mech return active"));
        break;

        case("C9"):
        console.log(chalk.cyan("Note Transfered to Stacker"));
        io.io.emit('Note_Transfered_to_Stacker', "Note Transfered to Stacker");
        break;

        case("CA"):///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        console.log(chalk.cyan("Note into Stacker at Reset"));
        io.io.emit('Note_into_Stacker_at_Reset', "Note into Stacker at Reset");
        break;

        case("CB"):///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        console.log(chalk.cyan("Note into Store at Reset"));
        io.io.emit('Note_into_Store_at_Reset', "Note into Store at Reset");
        break;

        case("CC"):
        console.log(chalk.cyan("Staking"));
        io.io.emit('Staking', "Staking");
        break;

        case("CE"):
      //  console.log(chalk.cyan("Note Held in Bezel"));
        io.io.emit('note_held_in_bezel', "Retirar Billete");
        break;

        case("CF"):
        console.log(chalk.cyan("Device full"));
        io.io.emit('Device_full', "Device full");
        break;

        case("D1"):
        console.log(chalk.red.inverse("Barcode Ticket Ack"));
        //do not assign credit
        break;

        case("D2"):
        //console.log(chalk.red.inverse("Dispensed"));
        //read event data
        var value_in_hex=data.substr(8,8);
        value_in_hex=changeEndianness(value_in_hex);
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
        io.io.emit('Dispensed', value_in_hex);
        //do not assign credit
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
        //console.log(chalk.red.inverse("Dispensing"));
        //read event data
        var value_in_hex=data.substr(8,8);
        value_in_hex=changeEndianness(value_in_hex);
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
        io.io.emit('Dispensing', value_in_hex);
        //do not assign credit
        break;

        case("DB"):
        console.log(chalk.green.inverse("Note Stored in Payout"));
        io.io.emit('Note_Stored_in_Payout', "Note Stored in Payout");
        //do not assign credit
        break;

        case("DC"):
        console.log(chalk.red.inverse("Incomplete payout"));
        io.io.emit('Incomplete_payout', "Incomplete payout");
        // 0CF0 F1 DC 00 00000058 1B 00 00 E8
        //do not assign credit
        break;

        case("DD"):
        console.log(chalk.red.inverse("Incomplete float"));
        //do not assign credit
        break;

        case("DE"):
        console.log(chalk.red.inverse("cashbox paid"));
        io.io.emit('cashbox_paid', "cashbox paid");
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
            io.io.emit('Note_cleared_from_front', "Note cleared from front");
        //do not assign credit
        break;

        case("E2"):
        console.log(chalk.red.inverse("Note cleared into cashbox"));
        io.io.emit('Note_cleared_into_cashbox', "Note cleared into cashbox");
        //asign credit
        break;

        case("E3"):
        console.log(chalk.red.inverse("Cashbox Removedx"));
        io.io.emit('Cashbox_Removed', "Cashbox Removed");
        break;

        case("E4"):
        console.log(chalk.red.inverse("Cashbox Replaced"));
        io.io.emit('Cashbox_Replaced', "Cashbox Replaced");
        break;

        case("E5"):
        console.log(chalk.red.inverse("Barcode Ticket Validated"));
        break;

        case("E6"):
        console.log(chalk.red.inverse("Fraud Attemp"));
        break;

        case("E7"):
        console.log(chalk.red.inverse("Stacker Full"));
        io.io.emit('Stacker_Full', "Stacker Full");
        break;

        case("E8"):
//        console.log(chalk.red("Validator Disabled"));
//        console.log(chalk.green("Ready"));
        io.io.emit('Validator_Disabled', "Validator Disabled");
        break;

        case("E9"):
        console.log(chalk.cyan("Unsafe Jam"));
        break;

        case("EB"):
        console.log(chalk.cyan("Staked"));
        io.io.emit('Staked', "Staked");
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
          //var channel=poll_responde[i+1];
          //console.log("channel:"+channel);
        //  console.log("Leyendo billete");
        }
        break;

        case("EE"):
        //console.log(chalk.cyan("Note credit"));
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
              console.log("20 soles");
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
                 //     case("EE"):
                 //     {
                 //       console.log("CREDIT NOTE");
                 //       var credit=poll_responde[i+1];
                 //       console.log(credit);
                 //       i++;
                 //       credit=poll_responde[i+1];
                 //       console.log(credit);
                 //       break;
                 //     }
                 //

        }//switch closing
      //  enable_sending();
   }//switch closing
  }//end of FOR loop
else{
    console.log(chalk.red("THERE IS AN ERROR HERE"));
}//end iff
}
///////////////////////
enable_sending();
//ready_for_sending=true;
//console.log("habilitando next write");
///////////////////////
}
//module.exports.handlepoll=handlepoll;
////////////////////////////////////////////////////
exports.handleSetgenerator= function (data){
var poll_responde=data.match(/.{1,2}/g);
if(poll_responde[1] == "F0"){
  console.log(chalk.green("GENERATOR EXCHANGED SUCCESFULLY"));
}
if(poll_responde[1] == "F4"){
  console.log(chalk.green("Parameter Out Of Range"));
}
if(poll_responde[1] == "F8"){
  console.log(chalk.green("GENERATOR FAILED"));
}
enable_sending();
return;
}
////////////////////////////////////////////////////
exports.handleSetmodulus= function (data){
var poll_responde=data.match(/.{1,2}/g);
if(poll_responde[1] == "F0"){
  console.log(chalk.green("MODULUS EXCHANGED SUCCESFULLY"));
}
if(poll_responde[1] == "F4"){
  console.log(chalk.green("Parameter Out Of Range"));
}
if(poll_responde[1] == "F8"){
  console.log(chalk.green("GENERATOR FAILED"));
}
enable_sending();
return;
}
////////////////////////////////////////////////////
exports.getkeys=function(){
  var forge = require('node-forge');
  var keyPair = forge.pki.rsa.generateKeyPair(32);
  var my_key;
  set_generator = keyPair.privateKey.p;
  set_modulus = keyPair.privateKey.q;
  //console.log("GENERADOR:" + set_generator);
  //console.log("MODULUS:" + set_modulus);
  //console.log("Prime numbers generated!");
//  enable_sending();
return;
}
////////////////////////////////////////////////////
const changeEndianness = (string) => {
  const result = [];
  let len = string.length - 2;
  while (len >= 0) {
    result.push(string.substr(len, 2));
    len -= 2;
  }
  return result.join('');
}
module.exports.changeEndianness=changeEndianness;
////////////////////////////////////////////////////
exports.set_generator_=function() {
   //console.log("set generator to send:" + set_generator + " this has to be a prime number");
  calc_generator = set_generator;
  //console.log(calc_generator);
  set_generator = ConvertBase.dec2hex(set_generator);
  set_generator = set_generator.toUpperCase();
  //console.log("set generator to hex:" + set_generator);
  var pre_set = changeEndianness(String(set_generator));
  var acomodando2 = "000000000000";
  pre_set = pre_set.concat(acomodando2);
  var acomodando = "094A";
  acomodando = acomodando.concat(pre_set);
  var hexiando = "0x" + chunk(acomodando, 2).join('0x');
  hexiando = hexiando.match(/.{1,4}/g);
  var hexiado = hexiando;
  set_generator = hexiado;
  //console.log(set_generator);
  return set_generator;
}
////////////////////////////////////////////////////
exports.set_modulus=function () {
  //console.log("SetModulus command sent");
  //console.log("set modulus to send:" + set_modulus);
  calc_modulus = set_modulus;
  set_modulus = ConvertBase.dec2hex(set_modulus);
  set_modulus = set_modulus.toUpperCase();
  //console.log("set generator to hex:" + set_modulus);
  var pre_set = changeEndianness(String(set_modulus));
  var acomodando2 = "000000000000";
  pre_set = pre_set.concat(acomodando2);
  var acomodando = "094B";
  acomodando = acomodando.concat(pre_set);
  var hexiando = "0x" + chunk(acomodando, 2).join('0x');
  hexiando = hexiando.match(/.{1,4}/g);
  var hexiado = hexiando;
  set_modulus = hexiado;
  return set_modulus;
}
////////////////////////////////////////////////////
exports.send_request_key_exchange=function () {
  //console.log("request_key_exchange command sent");
  my_HOST_RND = 999;
  var HostInterKey = 0;
  //console.log("my_HOST_RND:" + my_HOST_RND);
  calc_generator = parseInt(calc_generator, 10);
  calc_modulus = parseInt(calc_modulus, 10);
  console.log("my calc_generator:" + calc_generator);
  console.log("my calc_modulus:" + calc_modulus);
  HostInterKey = Big_Number(calc_generator).pow(my_HOST_RND);
  HostInterKey = Big_Number(HostInterKey).mod(calc_modulus);
  if (HostInterKey.lenth < 4) {
    if (HostInterKey.lenth == 3) {
      console.log("prefix");
      var prefix = "0";
      HostInterKey = prefix.concat(HostInterKey);
    }
    if (HostInterKey.lenth == 2) {
      console.log("prefix");
      var prefix = "00";
      HostInterKey = prefix.concat(HostInterKey);
    }
    console.log("Host interkey padded");
  }
  //console.log("HostInterKey:" + HostInterKey);
  ///////////////////////////////////////////////
  HostInterKey = ConvertBase.dec2hex(HostInterKey).toUpperCase();
  HostInterKey = pady(HostInterKey, 4);
  //console.log("HostInterKey to hex:" + HostInterKey);
  var pre_set = changeEndianness(String(HostInterKey));
  var acomodando2 = "000000000000";
  pre_set = pre_set.concat(acomodando2);
  var acomodando = "094C";
  acomodando = acomodando.concat(pre_set);
  var hexiando = "0x" + chunk(acomodando, 2).join('0x');
  hexiando = hexiando.match(/.{1,4}/g);
  var hexiado = hexiando;
  request_key_exchange = hexiado;
  //////////////////////////////////////////////
  return request_key_exchange;
}
////////////////////////////////////////////////////
function pady(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
module.exports.pady=pady;
////////////////////////////////////////////////////
exports.handleRKE=function(data){
    return new Promise((resolve,reject)=>{
//console.log(data);
var myData;
var number_of_byte = data.substr(0, 2);
myData = data.substr(2, number_of_byte + 2);
//console.log("number_of_byte:" + number_of_byte);
var firstbyte = myData.substr(0, 2);
var slaveInterKey = myData.substr(2, 8);
 slaveInterKey = changeEndianness(slaveInterKey);
 var dec_SlaveInterKey = new BigNumber(slaveInterKey, 16);
  dec_SlaveInterKey = dec_SlaveInterKey.toString(10);

  if (firstbyte == "F0") {
    console.log("OK received SlaveInterKey RECEIVED");
    console.log("SlaveInterKey:" + slaveInterKey);
    console.log("SlaveInterKey dec:" + (dec_SlaveInterKey));
    var final_key = Big_Number(dec_SlaveInterKey).pow(my_HOST_RND);
    final_key = Big_Number(final_key).mod(calc_modulus);
    console.log("Encryption KEY:" + final_key);
    final_key = ConvertBase.dec2hex(final_key).toUpperCase();
    final_key =pady(final_key,4); //para rellenar con 0 a la izqeuirda cuando el hex salga muy pequeño
  //  console.log("Encryption KEY to hex:" + final_key);
    final_key = changeEndianness(final_key);
    var higherpart = "000000000000";
    var lowerpart =  "0123456701234567";
    lowerpart = changeEndianness(lowerpart);
    final_key = final_key.concat(higherpart);
    full_KEY = lowerpart.concat(final_key);
  //  console.log(chalk.green("KEY:" + full_KEY));
    enable_sending();
    //return full_KEY;
     return resolve(full_KEY);
  //  setTimeout(send_poll, 200);
  }


  if (firstbyte == "F8") {
    console.log(chalk.red("Not Possible to create the Key"));
    console.log("/////////////////////////////////");
    reject();
  }
  if (firstbyte == "F4") {
    console.log(chalk.red("Parameter out of range"));
    console.log("/////////////////////////////////");
  }
  enable_sending();
  });
}
////////////////////////////////////////////////////
exports.handleprotocolversion= function (data){
var poll_responde=data.match(/.{1,2}/g);
if(poll_responde[1] == "F0"){
  console.log(chalk.green("OK Host Protocol set to version 8"));
}else{
    console.log(chalk.red("////////////ERROR/////////////"));
}
  enable_sending();
}
////////////////////////////////////////////////////
function hex_to_ascii(str1) {
  var hex = str1.toString();
  var str = '';
  for (var n = 0; n < hex.length; n += 2) {
    str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
  }
  return str;
}
function get_count_bytes_received() {
  var number_of_byte = received_command.substr(0, 2);
  number_of_byte = ConvertBase.hex2bin(number_of_byte);
  number_of_byte = ConvertBase.bin2dec(number_of_byte);
  //console.log(number_of_byte);
  return number_of_byte;
}
////////////////////////////////////////////////////
exports.handlesetuprequest= function (data){
// var poll_responde=data.match(/.{1,2}/g);
// if(poll_responde[1] == "F0"){
//   console.log(chalk.green("OK Host Protocol set to version 8"));
// }else{
//     console.log(chalk.red("////////////ERROR/////////////"));
// }

var number_of_byte = get_count_bytes_received();
var myData = received_command.substr(2, number_of_byte + 2);
var firstbyte = myData.substr(0, 2);
//////////////////////////////////////////////////////
global.note_validator_type = myData.substr(2, 2);
// if (note_validator_type == "0E") {
//   note_validator_type = "TEBS+Payout"
// }
switch(note_validator_type) {
  case "0E":
    note_validator_type = "TEBS+Payout"
    break;
  case "00":
    note_validator_type = "NV200 Spectral"
    break;
  default:
    // code block
}
console.log("Note Validator type:" + note_validator_type);
///////////////////////////////////////////////////////
//////////////////////////////////////////////////////
var firmware_version = myData.substr(4, 8);
// change firmware_version to ASCII
firmware_version = hex_to_ascii(firmware_version);
firmware_version = parseInt(firmware_version);

console.log("firmware_version:" + firmware_version);
///////////////////////////////////////////////////////
//////////////////////////////////////////////////////
country_code = myData.substr(12, 6);
//console.log("Country code HEX:" + country_code);
country_code = hex_to_ascii(country_code);
console.log("Country code:" + country_code);
///////////////////////////////////////////////////////
//////////////////////////////////////////////////////
var value_multiplier = myData.substr(18, 6);
value_multiplier = parseInt(value_multiplier);
console.log("value_multiplier:" + value_multiplier);
///////////////////////////////////////////////////////
//////////////////////////////////////////////////////
var numbers_of_channels = myData.substr(24, 2);
numbers_of_channels = parseInt(numbers_of_channels);
console.log("Numbers of channels:" + numbers_of_channels);
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
  console.log("channel_value_1:" + parseInt(first_channel, 16) + country_code_channel_one);
  console.log("channel_value_2:" + parseInt(second_channel, 16) + country_code_channel_two);
  console.log("channel_value_3:" + parseInt(third_channel, 16) + country_code_channel_three);
  console.log("channel_value_4:" + parseInt(fourth_channel, 16) + country_code_channel_four);
  console.log("channel_value_5:" + parseInt(fifth_channel, 16) + country_code_channel_five);
  console.log("channel_value_6:" + parseInt(sixth_channel, 16) + country_code_channel_six);
  console.log("channel_value_7:" + parseInt(seventh_channel, 16) + country_code_channel_seven);
  ///////////////////////////////////////////////////////
  var protocol_version = myData.substr(52, 2);
  console.log("protocol version:" + "Version " + parseInt(protocol_version, 16));
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
console.log("channel_value_1:" + parseInt(first_channel, 16) + country_code_channel_one);
console.log("channel_value_2:" + parseInt(second_channel, 16) + country_code_channel_two);
console.log("channel_value_3:" + parseInt(third_channel, 16) + country_code_channel_three);
console.log("channel_value_4:" + parseInt(fourth_channel, 16) + country_code_channel_four);
console.log("channel_value_5:" + parseInt(fifth_channel, 16) + country_code_channel_five);
///////////////////////////////////////////////////////
var protocol_version = myData.substr(52, 2);
console.log("protocol version:" + "Version " + parseInt(protocol_version, 16));
///////////////////////////////////////////////////////
}
//console.log("/////////////////////////////////");
  enable_sending();
}
////////////////////////////////////////////////////

exports.handleGetSerialNumber=function(data){
  var number_of_byte = get_count_bytes_received();
  var myData = received_command.substr(2, number_of_byte + 2);
  var firstbyte = myData.substr(0, 2);
  var serialNx = myData.substr(2, 8);
  global.serialN = parseInt(serialNx, 16);
  //var machine_sn = serialN;
  //exports.machine_sn = machine_sn;
  //numero_de_serie=machine_sn;
  numero_de_serie=global.serialN;

  console.log(chalk.green("The serial number is:." + global.serialN));
  //console.log("/////////////////////////////////");
    enable_sending();
}
////////////////////////////////////////////////////
exports.handleSetInhivits=function(data){
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
////////////////////////////////////////////////////
//global.bag_barcode;
exports.handleGetTebsBarcode=async function (data){
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
  console.log(chalk.green("tebs barcode is:" + tebs_barcode));
//si ews cero que kle ponga el numero mayor disponible en estatus iniciada
const ultimo_no_remesa_hermes= await pool.query("SELECT MAX(tebs_barcode) AS ultimo FROM remesa_hermes WHERE validator_type='NV200 spectral'");
const consecutivo=ultimo_no_remesa_hermes[0].ultimo
tebs_barcode=consecutivo;
console.log("el_tebs_calculado_es:"+tebs_barcode);

  //var mytebsbarcode = tebs_barcode;
//  bag_barcode=tebs_barcode;
  //exports.mytebsbarcode = mytebsbarcode;
  //return;
    enable_sending();
}
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
var full_KEY;
exports.zerox = false; //to begin countiung from zero;
function encrypt(mensaje) {
  var myKey = full_KEY;
  var key = aesjs.utils.hex.toBytes(myKey);
  var text = mensaje;
//  console.log("--message:" + mensaje);
  var textBytes = aesjs.utils.hex.toBytes(text);
  var aesEcb = new aesjs.ModeOfOperation.ecb(key);
  var encryptedBytes = aesEcb.encrypt(textBytes);
  var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
//  console.log("encripted:" + encryptedHex.toUpperCase() + " and has:" + encryptedHex.length / 2 + "Hex bytes");
  return encryptedHex;
}
function decrypt(mensaje) {
//  console.log("mensaje length:"+mensaje.length);
  if(mensaje.length==32){
  var key = aesjs.utils.hex.toBytes(full_KEY);
  var aesEcb = new aesjs.ModeOfOperation.ecb(key);
  var encryptedBytes = aesjs.utils.hex.toBytes(mensaje);
  var decryptedBytes = aesEcb.decrypt(encryptedBytes);
  var decryptedText = aesjs.utils.hex.fromBytes(decryptedBytes);
//  console.log("decrypted:"+decryptedText.toUpperCase());
  return decryptedText;
}else{
  console.log("no encriptado");
  //hANDLE pool
  return "00000000000000000000000000000000";
}
}
function handle_count() {
  ecount = changeEndianness(ecount);
  ecount = parseInt(ecount, 16);
  if (exports.zerox == true) {
    ecount = ecount + 1;
  } else {
    ecount = ecount;
    exports.zerox = true;
  }
  slave_count= pady(slave_count,8)
  ecount = ConvertBase.dec2hex(ecount);
  ecount= ecount.toUpperCase();
  ecount = pady(ecount, 8);

  console.log(chalk.cyan("SLAVE ecount:" + slave_count));
  console.log("SENT  ecount:" + ecount);

  if(slave_count == ecount){
    //console.log(chalk.green("COINCIDEN"));
  }else{
    console.log(chalk.red.inverse("NO COINCIDEN"));
  }
  ecount = changeEndianness(ecount);
  //setTimeout(handle_count,1000);
};
////////////////////////////////////////////////////
////////////////////////////////////////////////////
var padding = Array(29).join('0');
function padx(pad, str, padLeft) {
  if (typeof str === 'undefined')
    return pad;
  if (padLeft) {
    return (pad + str).slice(-pad.length);
  } else {
    return (str + pad).substring(0, pad.length);
  }
}
exports.prepare_Encryption=function (datax) {
  var ebuffer = pady(datax[0], 2).toString(16);
   handle_count();
   ebuffer = ebuffer.concat(ecount);
  // console.log("ebuffer:"+ebuffer);
   var i;
   var data_line="";
   var data_full_line="";
   for ( i=1; i<datax.length;i++){
        data_line=pady(datax[i].toString(16).toUpperCase(),2);
        data_full_line=data_full_line.concat(data_line);
   }
   //console.log(data_full_line);
   ebuffer = ebuffer.concat(data_full_line);
   //console.log("ebuffer:"+ebuffer);
   //console.log("so far we have:"+ebuffer.length/2 +" bytes, then we need:"+(14-ebuffer.length/2) );
   //epacking
   ebuffer = padx(padding,ebuffer,false);
    //console.log(ebuffer);
     ebuffer = String(ebuffer, 'hex');
     var command_clean = ebuffer;
     var hexiando = "0x" + chunk(ebuffer, 2).join('0x');
     ebuffer = hexiando.match(/.{1,4}/g);
     var el_crc = new Buffer.from(spectral_crc(ebuffer), 'hex').toString('hex');
    //Agrega el STX a la cadena ya preformada, culminando asi el dato completo
    var command_listo = command_clean + el_crc;
    command_listo = command_listo.toUpperCase();
    //console.log(command_listo);
    var encrypted_data = encrypt(command_listo);
    //console.log("ecommand encrypted order:"+encrypted_data.toUpperCase());
    //console.log("encrypted data length:"+encrypted_data.length/2);
   //Al trasmitir 17 bytes es necesario ponerlo como HEX en la cadena de envio es decir 17dec=11hex
    var the_length = (encrypted_data.length / 2) + 1;
    //var finalizando_envio=the_length+"7E"+encrypted_data;
    var finalizando_envio = "117E" + encrypted_data;
    finalizando_envio = finalizando_envio.toUpperCase();
    //console.log("full encrypted command to send:"+finalizando_envio);
    var to_send = "0x" + chunk(finalizando_envio, 2).join('0x');
    to_send = to_send.match(/.{1,4}/g);
    //console.log("to send:"+to_send);
    var full_encrypted_data = to_send; // make this equal to the full legth data encrypted ready to be send
    return full_encrypted_data;
}
exports.handleEcommand=function(){
  var handler="";
  var myData;
  var number_of_byte = received_command.substr(0, 2);
  myData = received_command.substr(2, number_of_byte + 2);
  var firstbyte = myData.substr(0, 2);
//  console.log("after_encription received:" + number_of_byte + " Bytes of responde data");
  // console.log("witch are:" + myData);
  myData=myData.substr(2,number_of_byte+ 2)
//  console.log("cleaned recevided data:"+myData);
//console.log(myData.length);
if(myData.length>32){
  myData=myData.substr(0, 32);
  console.log(chalk.red.inverse("Cutted length:"+myData));
}
  var ready=decrypt(myData).toUpperCase();
  console.log(chalk.green("<-:"+ready));
  var data_length = ready.substr(0, 2);
  handler=data_length;
  data_length=parseInt(data_length,10);
//  console.log("data length is:"+data_length);
  var read_ecount=ready.substr(2, 8);
  read_ecount=changeEndianness(read_ecount);
  console.log("reaD COUNT:"+read_ecount);
  //read_ecount=parseInt(read_ecount,10);
  slave_count=read_ecount;
  slave_count=pady(slave_count,8);
  //slave_count = parseInt(slave_count, 16);
//  console.log("slave_read_ecount is:"+slave_count);
  var read_data=ready.substr(10,data_length*2);
  console.log("read_data is:"+read_data);
  //exports.handleRoutingNotes(read_data);
  handler=handler+read_data; //this concant the data lentth and the data itself in order to be able to hableit by pollresponse.
  exports.handlepoll(handler);

}
////////////////////////////////////////////////////
async function store_note(monto) {
  const remesa = await pool.query("SELECT * FROM remesas WHERE status='iniciada' OR status='en_proceso' ");
    if (remesa === undefined || remesa.length == 0) {
      console.log(chalk.cyan("RETRIALING....... "));
      const remesa = await pool.query("SELECT * FROM remesas WHERE status='iniciada' OR status='en_proceso' ");
       var rem1 = remesa[0].no_remesa;
  //    console.log("la remes en cuestion es:"+rem1);
      const nueva_note = {
        no_remesa: rem1,
        monto: monto,
        moneda:country_code,
        status: 'processing'
      }
      await pool.query('INSERT INTO creditos set ?', [nueva_note]);
      console.log("nuevo note guardado");
      await pool.query ("UPDATE remesas SET status='en_proceso' WHERE tipo='ingreso' and no_remesa=?",[rem1]);
      const calculando_monto = await pool.query("SELECT SUM(monto) AS totalremesa FROM creditos WHERE no_remesa=? AND status='processing'", [rem1]);
      var monto_total_remesa = calculando_monto[0].totalremesa;
      await pool.query("UPDATE remesas SET monto=? WHERE status='en_proceso' AND no_remesa=?", [monto_total_remesa, rem1]);
      var msg={
        monto:monto,
        country_code:country_code
      }
      io.io.emit('nuevo_billete_recivido', msg);
      console.log(chalk.cyan("RETRIALING....... SUCCESFULL"));
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
      await pool.query("UPDATE remesas SET monto=? WHERE status='en_proceso' AND no_remesa=?", [monto_total_remesa, rem2]);
      var msg={
        monto:monto,
        country_code:country_code
      }
      io.io.emit('nuevo_billete_recivido', msg);
    }
    const remesa4 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso' ");
    var id_remesa4 = remesa4[0].no_remesa;
  //  console.log("la remesa en proceso es:"+id_remesa4);
    //consultar monto;
    const calculando_monto = await pool.query("SELECT SUM(monto) AS totalremesa FROM creditos WHERE no_remesa=? AND status='processing'", [id_remesa4]);
    var monto_acumulado_remesa = calculando_monto[0].totalremesa;
  //  var monto_acumulado=await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso' ");
    await pool.query ("UPDATE remesas SET status='en_proceso',monto=? WHERE no_remesa=?",[monto_acumulado_remesa,id_remesa4]);
ready_for_sending=true;
ready_for_pooling=true;
}
////////////////////////////////////////////////////
exports.handleRoutingNotes= function (data){
var poll_responde=data.match(/.{1,2}/g);
if(poll_responde[0] == "F0"){
  console.log(chalk.green("ROUTING OK received"));
}
if(poll_responde[0] == "F5"){
  console.log(chalk.green("PAYOUT NOT DETECTED"));
}
if(poll_responde[0] == "F4"){
  console.log(chalk.green("VALUE OR CURRENCY NOT IN DATASET,OR NOT ENCRYPTED DATA"));
}
return;
}
////////////////////////////////////////////////////
exports.handlepayoutvalue=function(){
  var handler="";
  var myData;
  var number_of_byte = received_command.substr(0, 2);
  myData = received_command.substr(2, number_of_byte + 2);
  var firstbyte = myData.substr(0, 2);
//  console.log("after_encription received:" + number_of_byte + " Bytes of responde data");
  // console.log("witch are:" + myData);
  myData=myData.substr(2,number_of_byte+ 2)
//  console.log("cleaned recevided data:"+myData);
//console.log(myData.length);
if(myData.length>32){
  myData=myData.substr(0, 32);
  console.log(chalk.red.inverse("Cutted length:"+myData));
}
  var ready=decrypt(myData).toUpperCase();
  //el log de abajo muestra la info recivida decryptada
  //console.log(chalk.green("<-:"+ready));
  var data_length = ready.substr(0, 2);
  handler=data_length;
  data_length=parseInt(data_length,10);
//  console.log("data length is:"+data_length);
  var read_ecount=ready.substr(2, 8);
  read_ecount=changeEndianness(read_ecount);
//  console.log("reaD COUNT:"+read_ecount);
  //read_ecount=parseInt(read_ecount,10);
  slave_count=read_ecount;
  slave_count=pady(slave_count,8);
  //slave_count = parseInt(slave_count, 16);
//  console.log("slave_read_ecount is:"+slave_count);
  var read_data=ready.substr(10,data_length*2);
//  console.log("read_data is:"+read_data);
  var poll_responde=read_data.match(/.{1,2}/g);

  if(poll_responde[0] == "F0"){
    console.log(chalk.green("PAGO PROCEDE"));
    enable_sending();
    return "ok";
  }
  if(poll_responde[0] == "F5"){
    console.log(chalk.green("Command can not be processed"));
    if(poll_responde[1] == "01"){
      console.log(chalk.green("Not enough value in device"));
      enable_sending();
      return "saldo_insuficiente";
    }
    if(poll_responde[1] == "02"){
      console.log(chalk.green("Cannot pay exact amount"));
      enable_sending();
      return "no_monto_exacto";
    }
    if(poll_responde[1] == "03"){
      console.log(chalk.green("Device Busy"));
      enable_sending();
      return "ocupado";
    }
    if(poll_responde[1] == "04"){
      console.log(chalk.green("Device Disabled"));
      enable_sending();
      return "desabilitado";
    }
    return;
  }

return;
  //exports.handleRoutingNotes(read_data);
//  handler=handler+read_data; //this concant the data lentth and the data itself in order to be able to hableit by pollresponse.
//  exports.handlepoll(handler);

}
////////////////////////////////////////////////////
exports.finalizar_pagos_en_proceso=async function(){
  console.log("intento dar por finalizado los pagos que esten en proceso");
await pool.query ("UPDATE remesas SET status='completado' WHERE tipo='egreso' and status='en_proceso'");
await pool.query ("UPDATE remesas SET status='terminado' WHERE tipo='ingreso' and status='en_proceso'");

}
////////////////////////////////////////////////////
function ensureIsSet() {
    return new Promise(function (resolve, reject) {
        (function waitForFoo(){
            if (ready_for_sending) return resolve();
            clearTimeout(timerout);
            setTimeout(waitForFoo, 30);
        })();
        var timerout= setTimeout(()=>{reject("sending_not_ready:"+ready_for_sending)},1000);
    });
};
module.exports.ensureIsSet=ensureIsSet;
////////////////////////////////////////////////////
exports.get_all_levels_value=function (){
  var lod=0;
  var totbills=0;
  var totaccum=0;
  var note_level1 = 0;
  var value_level1 = 0;
  var acum_level1 = 0;
  var note_level2 = 0;
  var value_level2 = 0;
  var acum_level2 = 0;
  var note_level3 = 0;
  var value_level3 = 0;
  var acum_level3 = 0;
  var note_level4 = 0;
  var value_level4 = 0;
  var acum_level4 = 0;
  var note_level5 = 0;
  var value_level5 = 0;
  var acum_level5 = 0;

  console.log("consultando all levels");
  exports.envio_redundante(get_all_levels)
  .then(data => {
    console.log(chalk.yellow("<-:."+data));

    exports.enable_sending();
    var poll_responde=data.match(/.{1,2}/g);
  console.log("response length:"+poll_responde[0]);
    if(poll_responde[1] == "F0"){
      console.log(chalk.green("response is ok"));
      console.log("number of denominations:"+poll_responde[2]);
      var i=0;
      var ru=0;
      var prevalue=0;

      for (i;i<poll_responde[2];i++){
        if(i==0){
          ru=3;
          prevalue=poll_responde[ru+2];
          prevalue=prevalue + poll_responde[ru+3];
          prevalue=prevalue + poll_responde[ru+4];
          prevalue=prevalue + poll_responde[ru+5];
          prevalue=exports.changeEndianness(prevalue);
          value_level1=parseInt(prevalue,16)/100;
          console.log("value_level1 is:"+value_level1);
          note_level1=parseInt( poll_responde[ru],16);
          console.log("note_level1 is:"+note_level1);
          acum_level1=note_level1*value_level1;
          console.log("acum_level1 is:"+acum_level1);
        }
        if(i==1){
          ru=12;
          prevalue=poll_responde[ru+2];
          prevalue=prevalue + poll_responde[ru+3];
          prevalue=prevalue + poll_responde[ru+4];
          prevalue=prevalue + poll_responde[ru+5];
          prevalue=exports.changeEndianness(prevalue);
          value_level2=parseInt(prevalue,16)/100;
          console.log("value_level2 is:"+value_level2);
          note_level2=parseInt( poll_responde[ru],16);
          console.log("note_level2 is:"+note_level2);
          acum_level2=note_level2*value_level2;
          console.log("acum_level2 is:"+acum_level2);
        }
        if(i==2){
          ru=21;
          prevalue=poll_responde[ru+2];
          prevalue=prevalue + poll_responde[ru+3];
          prevalue=prevalue + poll_responde[ru+4];
          prevalue=prevalue + poll_responde[ru+5];
          prevalue=exports.changeEndianness(prevalue);
          value_level3=parseInt(prevalue,16)/100;
          console.log("value_level3 is:"+value_level3);
          note_level3=parseInt( poll_responde[ru],16);
          console.log("note_level3 is:"+note_level3);
          acum_level3=note_level3*value_level3;
          console.log("acum_level3 is:"+acum_level3);
        }
        if(i==3){
          ru=30;
          prevalue=poll_responde[ru+2];
          prevalue=prevalue + poll_responde[ru+3];
          prevalue=prevalue + poll_responde[ru+4];
          prevalue=prevalue + poll_responde[ru+5];
          prevalue=exports.changeEndianness(prevalue);
          value_level4=parseInt(prevalue,16)/100;
          console.log("value_level4 is:"+value_level4);
          note_level4=parseInt( poll_responde[ru],16);
          console.log("note_level4 is:"+note_level4);
          acum_level4=note_level4*value_level4;
          console.log("acum_level4 is:"+acum_level4);
        }
        if(i==4){
          ru=39;
          prevalue=poll_responde[ru+2];
          prevalue=prevalue + poll_responde[ru+3];
          prevalue=prevalue + poll_responde[ru+4];
          prevalue=prevalue + poll_responde[ru+5];
          prevalue=exports.changeEndianness(prevalue);
          value_level5=parseInt(prevalue,16)/100;
          console.log("value_level5 is:"+value_level5);
          note_level5=parseInt( poll_responde[ru],16);
          console.log("note_level5 is:"+note_level5);
          acum_level5=note_level5*value_level5;
          console.log("acum_level5 is:"+acum_level5);
        }
        //console.log("i:"+i);
        //console.log("ru:"+ru);
        lod=parseInt( poll_responde[ru],16);
        totbills=totbills+lod;
      //  console.log("level_of_denomination_in_device:"+poll_responde[ru]);

      //  console.log("level_of_denomination_in_device:"+lod);
      }
    }
console.log("total billetes en reciclador:"+totbills);
totaccum=acum_level1+acum_level2+acum_level3+acum_level4+acum_level5;
console.log("total monto acumulado en reciclador:"+totaccum);
    console.log("/////////// ALL LEVELS ///////////////");
return {totbills,totaccum};
})
  //return "ok";
  //return {totbills,totaccum};
}
////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////
var error_retrial_times=5;
var i;
exports.envio_redundante=function(command){
//  console.log("command to be send is:"+command);
  return new Promise((resolve,reject)=>{
          hacer_consulta_serial(command)
         ////////////////////////////
         .then(recivido =>{resolve (recivido)})
         ////////////////////////////
         .catch(err =>{
                        console.log(chalk.bold.red("error de send:"+err));
                         if(error_retrial_times>0){
                             setTimeout(()=>{
                                            //   console.log("ready_for_sending1:",ready_for_sending);
                                            //   console.log("ready_for_pooling1:",ready_for_pooling);
                                            //   ready_for_sending=true;
                                            //   ready_for_pooling=true;
                                               console.log("retrial:",error_retrial_times);
                                               it.to_tbm.emit('retrialing',numero_de_serie);
                                               return exports.envio_redundante(command);
                                               //hacer_consulta_serial(command);
                                              //exports.retrial();
                                            },1000);
                          error_retrial_times=error_retrial_times-1;
                         }else{
                           error_retrial_times=5;
                           reject("no conection found");
                         }
                      });
         ////////////////////////////
  })
};
function hacer_consulta_serial(command){
return new Promise((resolve,reject)=>{
//   console.log(chalk.cyan("BLOCK SENDING"));
      ready_for_sending=false;
      ready_for_pooling=false;
      const command_ready =prepare_command_to_be_sent(command);
      setTimeout(()=>{
                      port.write(command_ready, function(err) {
          if (err) {
            return console.log('Error on write: ', err.message)
          }
        });
      },20);

      var mytime=setTimeout(()=>{
        const error= "timeout reintentar...";
        reject(error);
      },7000);

    parser.once('data', function(data){
      //  console.log(data);
        received_cleaned = new Buffer.from(data, 'hex').toString('hex').toUpperCase();
        received_command = received_cleaned.slice(4, -4);
        received_command=exports.received_byte_stuffing(received_command);
        parser.removeAllListeners('data');
        //////////////////////////////
    //    console.log(" si va received command is:"+received_command);
    //    console.log("received length:"+ received_command.length);
        if(received_command.length>0){
        //  clearTimeout(mytime);
          setTimeout(()=>{resolve(received_command);},50);
    //      const error= "probando retrialing";
    //    reject(error);
        }else{
      //    console.log(" no va received command is:"+received_command);
          const error= "no respuesta, necesario reintentar...";
            setTimeout(()=>{ reject(error); },3000);
        //   console.log("RETRIALING SERIAL LETS PRAY");
        // port.write(command_ready, function(err) {
        // if (err) {
        // return console.log('Error on write: ', err.message)
        // }
        // });
        }
    });

});
};
module.exports.hacer_consulta_serial=hacer_consulta_serial;
exports.handlepoll2= async function (data){
  return new Promise((resolve,reject)=>{
var poll_responde=data.match(/.{1,2}/g);
//console.log(poll_responde);


 if(poll_responde == undefined || poll_responde.length < 1){
   console.log("ERROR Receiving data");
   reject();
//   ready_for_sending=true;
//   ready_for_pooling=true;
//   return;
 }else{
   //if(poll_responde[1] == "F0"){
  //   console.log(chalk.green("OK received"));

   for (var i =1; i< poll_responde.length; i++ )
      {
//     // console.log(poll_responde[i]);
        switch(poll_responde[i])
     {
//         case("83"):
//         console.log(chalk.red.inverse("Calibration failed"));
//         break;
//
//         case("8B"):
//         console.log(chalk.red.inverse("Escrow Active"));
//         break;
//
        case("90"):
        console.log(chalk.red.inverse("Cashbox out of Service"));
        io.io.emit('Cashbox_out_of_Service', "Cashbox out of Service");
        break;
//
        case("92"):
        console.log(chalk.red.inverse("Cashbox Back in Service"));
        io.io.emit('Cashbox_Back_in_Service', "Cashbox Back in Service");
        break;
//
//         case("93"):
//         console.log(chalk.red.inverse("Cashbox Unlock Enable"));
//           io.io.emit('Cashbox_Unlock_Enable', "Cashbox Unlock Enable");
//         break;
//
//         case("A5"):
//         console.log(chalk.red.inverse("Ticket Printing"));
//         break;
//
//         case("A6"):
//         console.log(chalk.red.inverse("Ticket Printed"));
//         break;
//
//         case("A8"):
//         console.log(chalk.red.inverse("Ticket Printing Error"));
//         break;
//
//         case("AD"):
//         console.log(chalk.red.inverse("Ticket in Bezel"));
//         break;
//
//         case("AE"):
//         console.log(chalk.red.inverse("Print Halted"));
//         break;
//
//         case("AF"):
//         console.log(chalk.red.inverse("Printed to Cashbox"));
//         break;
//
        case("B0"):
        console.log(chalk.red.inverse("Jam recovery"));
          io.io.emit('Jam_recovery', "Jam recovery");
        break;
//
//         case("B1"):
//         console.log(chalk.red.inverse("Error During Payout"));
//         break;
//
         case("B3"):
         console.log(chalk.red.inverse("Smart emptying"));
           io.io.emit('Smart_emptying', "Smart emptying");
         break;
//
        case("B4"):
        console.log(chalk.red.inverse("Smart emptied"));
        //read event data
        var value_in_hex=data.substr(8,8);
        value_in_hex=changeEndianness(value_in_hex);
        value_in_hex=value_in_hex.toString(10);
         console.log(value_in_hex);
        // console.log(typeof(value_in_hex));
         var prefix="0x";
        // var value="0000073D";
         value_in_hex=prefix.concat(value_in_hex);
         value_in_hex=parseInt(value_in_hex);
         value_in_hex=value_in_hex/100;
         console.log(value_in_hex);
        //value dispensed:
        io.io.emit('Smart_emptied', "Smart emptied");
        break;
//
//         case("B5"):
//         console.log(chalk.red("channel disabled"));
//         break;
//
//         case("B6"):
//         console.log(chalk.red.inverse("Device Initializing"));
//         io.io.emit('Device_Initializing', "Device Initializing");
//         break;
//
//         case("B7"):
//         console.log(chalk.red.inverse("Coin Mech Error"));
//         break;
//
//         case("BA"):
//         console.log(chalk.red.inverse("Coin Rejected"));
//         break;
//
//         case("BD"):
//         console.log(chalk.red.inverse("Attached Coin Mech Disabled"));
//         break;
//
//         case("BE"):
//         console.log(chalk.red.inverse("Attached Coin Mech enabled"));
//         break;
//
//         case("BF"):
//         console.log(chalk.red.inverse("Value Added"));
//           io.io.emit('Value_Added', "Value Added");
//         break;
//
//         case("C0"):
//         console.log(chalk.cyan("Maintenance Required"));
//           io.io.emit('Maintenance_Required', "Maintenance Required");
//         break;
//
//         case("C1"):
//         console.log(chalk.cyan("Pay-In Active"));
//         break;
//
        case("C2"):
        console.log(chalk.cyan("emptying"));
        io.io.emit('emptying', "emptying");
        break;
//
        case("C3"):
        console.log(chalk.cyan("emptied"));
        io.io.emit('emptied', "emptied");
        break;
//
//         case("C4"):
//         console.log(chalk.cyan("coin mech jam"));
//         break;
//
//         case("C5"):
//         console.log(chalk.cyan("coin mech return active"));
//         break;
//
        case("C9"):
        console.log(chalk.cyan("Note Transfered to Stacker"));
        io.io.emit('Note_Transfered_to_Stacker', "Note Transfered to Stacker");
        break;
//
//         case("CA"):
//         console.log(chalk.cyan("Note into Stacker at Reset"));
//         io.io.emit('Note_into_Stacker_at_Reset', "Note into Stacker at Reset");
//         break;
//
//         case("CB"):
//         console.log(chalk.cyan("Note into Store at Reset"));
//         io.io.emit('Note_into_Store_at_Reset', "Note into Store at Reset");
//         break;
//
//         case("CC"):
//         console.log(chalk.cyan("Staking"));
//         io.io.emit('Staking', "Staking");
//         break;
//
//         case("CE"):
//       //  console.log(chalk.cyan("Note Held in Bezel"));
//         io.io.emit('note_held_in_bezel', "retirar bilete");
//         break;
//
//         case("CF"):
//         console.log(chalk.cyan("Device full"));
//         io.io.emit('Device_full', "Device full");
//         break;
//
//         case("D1"):
//         console.log(chalk.red.inverse("Barcode Ticket Ack"));
//         //do not assign credit
//         break;
//
//         case("D2"):
//         //console.log(chalk.red.inverse("Dispensed"));
//         //read event data
//         var value_in_hex=data.substr(8,8);
//         value_in_hex=changeEndianness(value_in_hex);
//         value_in_hex=value_in_hex.toString(10);
//         // console.log(value_in_hex);
//         // console.log(typeof(value_in_hex));
//          var prefix="0x";
//         // var value="0000073D";
//          value_in_hex=prefix.concat(value_in_hex);
//          value_in_hex=parseInt(value_in_hex);
//          value_in_hex=value_in_hex/100;
//          console.log(chalk.yellow("totalmente pagado:"+value_in_hex));
//         //value dispensed:
//         //update current payment with the full value of amount dispensed;
//         const remesa1 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='egreso' ");
//         var id_remesa1 = remesa1[0].no_remesa;
//         await pool.query ("UPDATE remesas SET status='completado', monto=? WHERE no_remesa=?",[value_in_hex,id_remesa1]);
//         io.io.emit('Dispensed', value_in_hex);
//         //do not assign credit
//         break;
//
//         case("D3"):
//         console.log(chalk.red.inverse("Coins Low"));
//         //do not assign credit
//         break;
//
//         case("D5"):
//         console.log(chalk.red.inverse("Hopper Jam"));
//         //do not assign credit
//         break;
//
//         case("D6"):
//         console.log(chalk.red.inverse("Halted"));
//         //do not assign credit
//         break;
//
//         case("D7"):
//         console.log(chalk.red.inverse("floating"));
//         //do not assign credit
//         break;
//
//         case("D8"):
//         console.log(chalk.red.inverse("floated"));
//         //do not assign credit
//         break;
//
//         case("D9"):
//         console.log(chalk.red.inverse("Tiempout"));
//         //do not assign credit
//         break;
//
//         case("DA"):
//         //console.log(chalk.red.inverse("Dispensing"));
//         //read event data
//         var value_in_hex=data.substr(8,8);
//         value_in_hex=changeEndianness(value_in_hex);
//         value_in_hex=value_in_hex.toString(10);
//         // console.log(value_in_hex);
//         // console.log(typeof(value_in_hex));
//          var prefix="0x";
//         // var value="0000073D";
//          value_in_hex=prefix.concat(value_in_hex);
//          value_in_hex=parseInt(value_in_hex);
//          value_in_hex=value_in_hex/100;
//     //     console.log(chalk.cyan("pago acumulado:"+value_in_hex));
//         //value dispensed:
//         const remesa2 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='egreso' ");
//         if(remesa2.length>0){
//            var id_remesa2 = remesa2[0].no_remesa;
//            await pool.query ("UPDATE remesas SET monto=? WHERE no_remesa=?",[value_in_hex,id_remesa2]);
//          }
//         io.io.emit('Dispensing', value_in_hex);
//         //do not assign credit
//         break;
//
//         case("DB"):
//         console.log(chalk.red.inverse("Note Stored in Payout"));
//         io.io.emit('Note_Stored_in_Payout', "Note Stored in Payout");
//         //do not assign credit
//         break;
//
//         case("DC"):
//         console.log(chalk.red.inverse("Incomplete payout"));
//         io.io.emit('Incomplete_payout', "Incomplete payout");
//         // 0CF0 F1 DC 00 00000058 1B 00 00 E8
//         //do not assign credit
//         break;
//
//         case("DD"):
//         console.log(chalk.red.inverse("Incomplete float"));
//         //do not assign credit
//         break;
//
//         case("DE"):
//         console.log(chalk.red.inverse("cashbox paid"));
//         io.io.emit('cashbox_paid', "cashbox paid");
//         //do not assign credit
//         break;
//
//         case("DF"):
//         console.log(chalk.red.inverse("Coin Credit"));
//         //do not assign credit
//         break;
//
//         case("E0"):
//         console.log(chalk.red.inverse("Note Path Open"));
//
//         //do not assign credit
//         break;
//
//         case("E1"):
//         console.log(chalk.red.inverse("Note cleared from front"));
//             io.io.emit('Note_cleared_from_front', "Note cleared from front");
//         //do not assign credit
//         break;
//
//         case("E2"):
//         console.log(chalk.red.inverse("Note cleared into cashbox"));
//         io.io.emit('Note_cleared_into_cashbox', "Note cleared into cashbox");
//         //asign credit
//         break;
//
//         case("E3"):
//         console.log(chalk.red.inverse("Cashbox Removed"));
//         io.io.emit('Cashbox_Removed', "Cashbox Removed");
//         break;
//
//         case("E4"):
//         console.log(chalk.red.inverse("Cashbox Replaced"));
//         io.io.emit('Cashbox_Replaced', "Cashbox Replaced");
//         break;
//
//         case("E5"):
//         console.log(chalk.red.inverse("Barcode Ticket Validated"));
//         break;
//
//         case("E6"):
//         console.log(chalk.red.inverse("Fraud Attemp"));
//         break;
//
//         case("E7"):
//         console.log(chalk.red.inverse("Stacker Full"));
//         io.io.emit('Stacker_Full', "Stacker Full");
//         break;
//
         case("E8"):
         console.log(chalk.red("Validator Disabled"));
// //        console.log(chalk.green("Ready"));
//         io.io.emit('Validator_Disabled', "Validator Disabled");
         break;
//
//         case("E9"):
//         console.log(chalk.cyan("Unsafe Jam"));
//         break;
//
//         case("EB"):
//         console.log(chalk.cyan("Staked"));
//         io.io.emit('Staked', "Staked");
//         break;
//
//         case("EC"):
//         console.log(chalk.cyan("Rejected"));
//         break;
//
//         case("ED"):
//         console.log(chalk.cyan("Rejecting"));
//         break;
//
//         case("EF"):
//         console.log(chalk.cyan("Read"));
//         {
//           var channel=poll_responde[i+1];
//           console.log("channel:"+channel);
//         }
//         break;
//
//         case("EE"):
//         console.log(chalk.cyan("Note credit"));
//         {
//           var channel=poll_responde[i+1];
//           console.log("channel:"+channel);
//           if(channel==01){
//             store_note(10);
//             console.log("10 soles");
//
//           }
//           if(channel==02){
//             store_note(20);
//             console.log("20 soles");
//           }
//           if(channel==03){
//             store_note(50);
//             console.log("50 soles");
//           }
//           if(channel==04){
//             store_note(100);
//             console.log("100 soles");
//           }
//           if(channel==05){
//             store_note(200);
//             console.log("200 soles");
//           }
//         //   const remesa4 = await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso' ");
//         //   var id_remesa4 = remesa4[0].no_remesa;
//         //   console.log("la remesa en proceso es:"+id_remesa4);
//         //   //consultar monto;
//         //   const calculando_monto = await pool.query("SELECT SUM(monto) AS totalremesa FROM creditos WHERE no_remesa=? AND status='processing'", [id_remesa4]);
//         //   var monto_acumulado_remesa = calculando_monto[0].totalremesa;
//         //
//         // //  var monto_acumulado=await pool.query("SELECT * FROM remesas WHERE status='en_proceso' AND tipo='ingreso' ");
//         //   await pool.query ("UPDATE remesas SET status='en_proceso',monto=? WHERE no_remesa=?",[monto_acumulado_remesa,id_remesa4]);
//         }
//         break;
//
          case("F0"):
          console.log(chalk.cyan("OK"));
          break;
//         case("F1"):
//         console.log(chalk.cyan("Slave Reset"));
//         break;
//                  //     case("EE"):
//                  //     {
//                  //       console.log("CREDIT NOTE");
//                  //       var credit=poll_responde[i+1];
//                  //       console.log(credit);
//                  //       i++;
//                  //       credit=poll_responde[i+1];
//                  //       console.log(credit);
//                  //       break;
//                  //     }
//                  //
//
         }//switch closing
//         //enable_sending();
    }//switch closing
   }//end of FOR loop
 //else{
//     console.log(chalk.red("THERE IS AN ERROR HERE"));
//  }//end iff
 //}
 resolve();
// ///////////////////////
// enable_sending();
// //ready_for_sending=true;
// //console.log("habilitando next write");
///////////////////////
});
}

exports.fecha_actual=function(){
  var currentdate = new Date();
  var fecha=currentdate.getFullYear()+"-"+(currentdate.getMonth()+1)+"-"+currentdate.getDate();
  return fecha;
}
exports.hora_actual=function(){
  var currentdate = new Date();
  var hora= currentdate.getHours()+":"+currentdate.getMinutes()+":"+currentdate.getSeconds();
  return hora;
}
