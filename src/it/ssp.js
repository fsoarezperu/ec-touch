const server = require('./../server');
const chalk=require('chalk');
const sp = require('./../serial_port');
const enc = require('./encryption');
const io = require("./../server.js");
const sh = require("./../smart_hopper");
/////////////////////////////
//var sync = false;
//var seq_bit = 1;
function sequencer() {
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
module.exports.spectral_crc=spectral_crc

function prepare_command_to_be_sent(receiver,command){
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

  server.logea(chalk.cyan(device+'->:'),chalk.cyan(single_command));
  var hexiando = "0x" + chunk(command_listo, 2).join('0x');
  hexiando = hexiando.match(/.{1,4}/g);
  formed_command_to_send = hexiando;
  sent_command = formed_command_to_send;
//  console.log("SENT COMMAND:"+sent_command);
  return sent_command;
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
  //  console.log("received command to be evaluted:"+command);
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
                // console.log("received command to be evaluted:"+command);
                // console.log(chalk.red("Stuffed on reception "));
                //  console.log(chalk.cyan("----------------Receive Stuffed:"+accumulated_chart));
                 current_char="";
                 toggy=true;
               }
            }
      accumulated_chart=accumulated_chart+current_char;
      };
    //console.log(chalk.cyan("----------------Receive Stuffed:"+accumulated_chart));
    return resolve(accumulated_chart);
  });


};
module.exports.received_byte_stuffing=received_byte_stuffing;
////////////////////////////////////////////////////
function handlesynch(data){
return new Promise(function(resolve, reject) {
    var poll_responde=data.match(/.{1,2}/g);
    if(poll_responde[1] == "F0"){
      console.log(chalk.green("Synch OK"));
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
////////////////////////////////////////////////////
async function handlepoll(data){
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
  //   console.log(poll_responde[i]);
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
        value_in_hex=enc.changeEndianness(value_in_hex);
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
return (data);
//ready_for_sending=true;
//console.log("habilitando next write");
///////////////////////
}
module.exports.handlepoll=handlepoll;
///////////////////////////////////////////////////////////
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
///////////////////////////////////////////////////////////
function handleprotocolversion(data){
  return new Promise(function(resolve, reject) {
    var poll_responde=data.match(/.{1,2}/g);
    if(poll_responde[1] == "F0"){
      console.log(chalk.green(device+" Protocol version set to version:"+hopper_protocol_version[2]));
      return resolve("OK")
    }else{
        console.log(chalk.red("////////////ERROR/////////////"));
        reject("////////////ERROR/////////////")
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
function get_count_bytes_received() {
  var number_of_byte = received_command.substr(0, 2);
  number_of_byte = ConvertBase.hex2bin(number_of_byte);
  number_of_byte = ConvertBase.bin2dec(number_of_byte);
  //console.log(number_of_byte);
  return number_of_byte;
}
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
    console.log("Device type:" + note_validator_type);

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
value_multiplier = parseInt(hex_to_dec(value_multiplier));
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

    console.log(chalk.green("The serial number is:" + serialN));
    //console.log("/////////////////////////////////");
    return resolve(data);
  });

}
module.exports.handleGetSerialNumber=handleGetSerialNumber;
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
exports.handleGetTebsBarcode=function(data){
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
  //var mytebsbarcode = tebs_barcode;
//  bag_barcode=tebs_barcode;
  //exports.mytebsbarcode = mytebsbarcode;
  //return;
    enable_sending();
}
/////////////////////////////////////////////////////////
async function handlepoll2(data){
   console.log("iniciando handle poll2");
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
        value_in_hex=enc.changeEndianness(value_in_hex);
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
 console.log("aqui");
 resolve();
// ///////////////////////
// enable_sending();
// //ready_for_sending=true;
// //console.log("habilitando next write");
///////////////////////
});
}
module.exports.handlepoll2=handlepoll2;
/////////////////////////////////////////////////////////
function handlepoll3(data){
//   console.log("iniciando handle poll3");
//   return
  return new Promise((resolve,reject)=>{
      var poll_responde=data.match(/.{1,2}/g);
    //  console.log(poll_responde);
       if(poll_responde == undefined || poll_responde.length < 1){
         console.log("ERROR Receiving data");
         reject();
             }else{
               for (var i =1; i< poll_responde.length; i++ )
                  {
                    switch(poll_responde[i])
                 {
                    case("90"):
                    console.log(chalk.red.inverse("Cashbox out of Service"));
                    io.io.emit('Cashbox_out_of_Service', "Cashbox out of Service");
                    break;
                    case("92"):
                    console.log(chalk.red.inverse("Cashbox Back in Service"));
                    io.io.emit('Cashbox_Back_in_Service', "Cashbox Back in Service");
                    break;
                    case("B0"):
                    console.log(chalk.red.inverse("Jam recovery"));
                      io.io.emit('Jam_recovery', "Jam recovery");
                    break;
                    case("B3"):
                     console.log(chalk.red.inverse("Smart emptying"));
                       io.io.emit('Smart_emptying', "Smart emptying");
                    break;
                    case("B4"):
                    console.log(chalk.red.inverse("Smart emptied"));
                    //read event data
                    var value_in_hex=data.substr(8,8);
                    value_in_hex=enc.changeEndianness(value_in_hex);
                    value_in_hex=value_in_hex.toString(10);
                     console.log(value_in_hex);
                     var prefix="0x";
                     value_in_hex=prefix.concat(value_in_hex);
                     value_in_hex=parseInt(value_in_hex);
                     value_in_hex=value_in_hex/100;
                     console.log(value_in_hex);
                    //value dispensed:
                    io.io.emit('Smart_emptied', "Smart emptied");
                    break;
                    case("C2"):
                    console.log(chalk.cyan("emptying"));
                    io.io.emit('emptying', "emptying");
                    break;
                    case("C3"):
                    console.log(chalk.cyan("emptied"));
                    io.io.emit('emptied', "emptied");
                    break;
                    case("C9"):
                    console.log(chalk.cyan("Note Transfered to Stacker"));
                    io.io.emit('Note_Transfered_to_Stacker', "Note Transfered to Stacker");
                    break;
                    case("E8"):
                     console.log(chalk.red(device+" Disabled"));
                    break;
                    case("F0"):
                    //  console.log(chalk.green("OK"));
                    break;
                  }//switch closing
            //         //enable_sending();
                }//switch closing
               }//end of FOR loop

      // console.log("fin poll_loop3");
       resolve();
      });
  //    console.log("se esta llamando esto?");
}
module.exports.handlepoll3=handlepoll3;
/////////////////////////////////////////////////////////
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
/////////////////////////////////////////////////////////
function set_protocol_version(receptor,version_de_receptor) {
  return new Promise( async function(resolve, reject) {
    server.logea("set_protocol_version");
      server.logea(receptor);
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
         server.logea("setup_request sent");
        var step1= await envia_encriptado(receptor,setup_request) //<---- setup_request
        if (step1.length>0) {
          console.log("step1:"+step1);
          var step2=await handlesetuprequest(step1);
          if(step2=="OK"){
            var step3=await envia_encriptado(receptor,get_serial_number) //<-------- get_serial_number
            if (step3.length>0) {
              var step4=await handleGetSerialNumber(step3);
              if (step4="OK") {
                return resolve("OK");
              }
            }
          }
        }
  });
};
module.exports.setup_request_command=setup_request_command;
/////////////////////////////////////////////////////////
function set_coin_mech_inhibits(receptor){
  server.logea("set_coin_mech_inhibits sent");
  sp.transmision_insegura(receptor,coin_mech_global_inhibit) //<---- setup_request
    .then(data => {
      server.logea(chalk.yellow('<-:'), chalk.yellow(data));
      handles_coin_mech_inhivits(data);
      server.logea("/////////////////////////////////");
    //  console.log("get_serial_number sent");
    //  return sp.transmision_insegura(receptor,get_serial_number) //<-------- get_serial_number
  //  })
    // .then(data => {
    //   server.logea(chalk.yellow('<-:'), chalk.yellow(data));
    //   handleGetSerialNumber(data);
    //   return sp.transmision_insegura(receptor,poll) //<----------- poll
    //   server.logea("/////////////////////////////////");
    // })
    // .then(data => {
    //   server.logea(chalk.yellow('<-:'), chalk.yellow(data));
    //   handle_coin_mech_inhivits(data);
  //    server.logea("/////////////////////////////////");
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
    enable_sending();
}



////////////////////////////////////////////////////////
function envia_encriptado(receptorx,orden){
    return new Promise(function(resolve, reject) {
    var  toSend = enc.prepare_Encryption(orden);
      sp.transmision_insegura(receptorx,toSend)
        .then(data =>{return enc.promise_handleEcommand(data)})
        .then(data=>{ console.log("Recivio:"+orden+" se encripto, envio, recivio y desencripto:"+data); return resolve(data);})
        .catch(function(error) {console.log(error);sp.retrial(error);});
    });
}
module.exports.envia_encriptado=envia_encriptado;
////////////////////////////////////////////////////////
function sync_and_stablish_presence_of(receptor) {
  return new Promise(async function(resolve, reject) {
    server.logea("/////////////////////////////////");
    server.logea(chalk.green("sync_and_stablish_presence_of:"+device));
    server.logea("/////////////////////////////////");
    server.logea("SYNCH command sent to Hopper");
  for (var i = 0; i < 3; i++) {
    var step1=await sp.transmision_insegura(receptor,synch) //<------------------------------ synch
      server.logea(chalk.yellow(device+'<-:'), chalk.yellow(step1));
    var step2=await handlesynch(step1);
       server.logea(chalk.yellow(device+'<-:'), chalk.yellow(step2));
       if (!step2=="OK") {
         reject(step2)
       }
  }
    return resolve("OK")
  });


};
module.exports.sync_and_stablish_presence_of=sync_and_stablish_presence_of;
/////////////////////////////////////////////////////////
function negociate_encryption(receptor) {
  encryptionStatus = false;
  return new Promise( async function(resolve, reject) {
           enc.getkeys();
           setGenerator = enc.set_generator_();
           server.logea("/////////////////////////////////");
           server.logea("SET GENERATOR command sent");

             var step1=await sp.transmision_insegura(receptor,setGenerator) //<------------------------------ synch
               server.logea(chalk.yellow(device+'<-:'), chalk.yellow(step1));
             var step2=await enc.handleSetgenerator(step1);
                server.logea(chalk.yellow(device+'<-:'), chalk.yellow(step2));
                if (step2=="OK") {
                  var setModulus = enc.set_modulus();
                  server.logea("/////////////////////////////////");
                  server.logea("SET MODULUS command sent");
                  var step3=await sp.transmision_insegura(receptor,setModulus) //<------------------------------ synch
                    server.logea(chalk.yellow(device+'<-:'), chalk.yellow(step3));
                    var step4=await enc.handleSetmodulus(step3);
                       server.logea(chalk.yellow(device+'<-:'), chalk.yellow(step4));
                       if (step4=="OK") {

                             var rKE = enc.send_request_key_exchange();
                             server.logea("/////////////////////////////////");
                             server.logea("Request Key Exchange command sent");
                            var step5=await sp.transmision_insegura(receptor,rKE); //<--------------------------- REquest key exchange
                             var step6=await enc.handleRKE(step5);
                             if(step6.length>0){
                               server.logea(chalk.green('KEY:'), chalk.green(step6));
                               console.log(chalk.green("KEY CALCULATED SUCCESFULLY"));
                               server.logea("/////////////////////////////////");
                               encryptionStatus = true;
                              return resolve("OK")

                            }else {
                              return reject("NO KEY:"+step6)
                            }

                        }else {
                          return reject(step4)
                        }
                }else{
                  reject(step2)
                }

  });
};
module.exports.negociate_encryption=negociate_encryption;
/////////////////////////////////////////////////////////
function hex_to_dec(input){
  var cantidad_en_hex=input
  console.log(cantidad_en_hex);
  var cantidad_en_bin=ConvertBase.hex2bin(cantidad_en_hex);
  console.log(cantidad_en_bin);
  var cantidad_en_dec=ConvertBase.bin2dec(cantidad_en_bin);
  console.log(cantidad_en_dec);
  return cantidad_en_dec
}
module.exports.hex_to_dec=hex_to_dec;
