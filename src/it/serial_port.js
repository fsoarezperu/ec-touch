const sspx = require('./ssp');
const socketx = require('./socket');
const server = require('./../server');
const glo = require('./globals');
const enc = require('./encryption');
const os = require('./os');
const chalk=require('chalk');
const it = require('./devices/tambox');
const sh = require('./devices/smart_hopper');
const va = require('./devices/validator');

const SerialPort = require('serialport')
const InterByteTimeout = require('@serialport/parser-inter-byte-timeout')
const port = new SerialPort('/dev/ttyUSB0')
module.exports.port=port;

const parser = port.pipe(new InterByteTimeout({interval: 80})); //este valor era 30 pero fallaba intermitentemente.
module.exports.parser=parser;

port.on('open', function () {
    //console.log(chalk.red('port open'));
    global.is_head_online=true;
});
port.on('close', function (err) {
    console.log(chalk.red('port closed', err));
});
port.on('error', function(err) {
  console.log(chalk.red('Error de puerto SERIAL.IO: ', err.message));
  global.is_head_online=false;
  verifica_coneccion_validador();
})
var error_retrial_times=5;
var i;




function transmision_insegura(receiver,command){

  return new Promise(async (resolve,reject)=>{

    try {
              var step1= await hacer_consulta_serial(receiver,command);
              if (step1.length>0) {
                return resolve(step1);
              }else {
                console.log(chalk.bold.red("error de send:"+step1));
                 if(error_retrial_times>0){
                     setTimeout( async function(){
                                    //   console.log("ready_for_sending1:",ready_for_sending);
                                    //   console.log("ready_for_pooling1:",ready_for_pooling);
                                    //   ready_for_sending=true;
                                    //   ready_for_pooling=true;
                                       console.log("retrial:",error_retrial_times);
                                      // it.to_tbm.emit('retrialing',numero_de_serie);
                                       return await transmision_insegura(command);
                                       //hacer_consulta_serial(command);
                                      //exports.retrial();
                                    },200);
                  error_retrial_times=error_retrial_times-1;
                 }else{
                   error_retrial_times=5;
                   return reject("no conection found");
                 }
              //  reject(step1)
              }

       } catch (e) {
        return  reject(chalk.cyan("04-Error en transmision_insegura:")+e);
       } finally {
        // return;
       }
  })
};
module.exports.transmision_insegura=transmision_insegura;

async function transmision_insegura2(receiver,command){

              var step1= await hacer_consulta_serial(receiver,command);
              if (step1.length>0) {
                return step1;
              }else {
                console.log(chalk.bold.red("error de send:"+step1));
                 if(error_retrial_times>0){
                     setTimeout( async function(){
                                    //   console.log("ready_for_sending1:",ready_for_sending);
                                    //   console.log("ready_for_pooling1:",ready_for_pooling);
                                    //   ready_for_sending=true;
                                    //   ready_for_pooling=true;
                                       console.log("retrial:",error_retrial_times);
                                      // it.to_tbm.emit('retrialing',numero_de_serie);
                                       return await transmision_insegura2(command);
                                       //hacer_consulta_serial(command);
                                      //exports.retrial();
                                    },200);
                  error_retrial_times=error_retrial_times-1;
                 }else{
                   error_retrial_times=5;
                   return "no conection found";
                 }
              //  reject(step1)
              }

};
module.exports.transmision_insegura2=transmision_insegura2;
//////////////////////////////////////////////////////////////////////////
function canal_ocupado(){
  ready_for_sending=false;
//  ready_for_pooling=false;
//os.logea("Canal ocupado");
}
module.exports.canal_ocupado=canal_ocupado;
//////////////////////////////////////////////////////////////////////////
function canal_liberado(){
  ready_for_sending=true;
//  ready_for_pooling=true;
os.logea("Canal liberado");
}
module.exports.canal_liberado=canal_liberado;
//////////////////////////////////////////////////////////////////////////
function disable_hopper_pooling(){
  ready_for_pooling=false;
  os.logea("disabling hopper_pooling");
}
module.exports.disable_hopper_pooling=disable_hopper_pooling;
//////////////////////////////////////////////////////////////////////////
function enable_hopper_pooling(){
  ready_for_pooling=true;
  os.logea("enabling hopper_pooling");
}
module.exports.enable_hopper_pooling=enable_hopper_pooling;
//////////////////////////////////////////////////////////////////////////
function ensureIsSet3() {
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
  //  os.logea("en prepare command to be send:"+command);
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

async function hacer_consulta_serial(receiver,command){

  return new Promise(async(resolve,reject)=>{

    try {
              await ensureIsSet3();
    //  console.log("en este punto rfs:"+ready_for_sending);
              canal_ocupado();
              //os.logea("hasta aqui command es:"+command);
              const command_ready =await prepare_command_to_be_sent(receiver,command);
              io.emit("system_running_indicator","system_running_indicator")
              //port.write(command_ready, function(err) {if (err) {return reject(err)}});
              await port.write(command_ready);

              //os.logea("aqui ya se transmitio el dato"+command_ready+" a puerto");

              var mytime=setTimeout(()=>{
                const error= "No se recibio respuesta en puerto serial.";
                return reject(error);
                },7000);

              parser.once('data', async function(data){
                                                clearTimeout(mytime);
                                                received_cleaned = new Buffer.from(data, 'hex').toString('hex').toUpperCase();
                                                var receiver_adress= received_cleaned.slice(2, -8);
                                                  if (receiver_adress=='10' || receiver_adress=='90' ) {device="Hopper";}
                                                  if (receiver_adress=='00' || receiver_adress=='80') {device="Validator";}
                                                  received_command = received_cleaned.slice(4, -4);
                                                //received_command=ssp.received_byte_stuffing(received_command);
                                                //console.log(received_command);
                                                var data=await received_byte_stuffing(received_command)
                                                //.then(data =>{
                                                //  console.log("data_received:"+data)
                                              //  console.log("global slave_count is:"+slave_count);
                                              //    console.log(chalk.yellow(slave_count+" -> "+device+'->:'),chalk.yellow(data));
                                                  received_command=data;
                                                  parser.removeAllListeners('data');
                                                  //////////////////////////////
                                                  if(received_command.length>0){
                                                  //  setTimeout(function () {
                                                    ready_for_sending=true;
                                                //  console.log("ready_for_sending:"+ready_for_sending);
                                                //  console.log("ready_for_pooling:"+ready_for_pooling);
                                                    return resolve(received_command);
                                                  //  }, 20);
                                                  }else{
                                                    console.log("salgo por aqui1234");

                                                    const error= "no respuesta, necesario reintentar...";
                                                      setTimeout(()=>{return reject(error); retrial(error); },3000);
                                                    }
                                              //  })

                                              //  .catch(function(error) {console.log(error);sp.retrial(error);});
                                                });

    } catch (e) {
      return reject(chalk.cyan("05-Error en hacer_consulta_serial:")+e);
    }
  });
};
module.exports.hacer_consulta_serial=hacer_consulta_serial;
//////////////////////////////////////////////////////////////////////////
async function hacer_consulta_serial2(receiver,command){
  await ssp.ensureIsSet();
  return new Promise(async(resolve,reject)=>{

    try {
    //  console.log("en este punto rfs:"+ready_for_sending);
              canal_ocupado();
              os.logea("hasta aqui command es:"+command);
              const command_ready =await ssp.prepare_command_to_be_sent(receiver,command);
              socket.io.emit("system_running_indicator","system_running_indicator")
              //port.write(command_ready, function(err) {if (err) {return reject(err)}});
              await port.write(command_ready);

              os.logea("aqui ya se transmitio el dato"+command_ready+" a puerto");

              var mytime=setTimeout(()=>{
                const error= "No se recibio respuesta en puerto serial.";
                return reject(error);
                },7000);

              parser.once('data', async function(data){
                                                clearTimeout(mytime);
                                                received_cleaned = new Buffer.from(data, 'hex').toString('hex').toUpperCase();
                                                var receiver_adress= received_cleaned.slice(2, -8);
                                                  if (receiver_adress=='10' || receiver_adress=='90' ) {device="Hopper";}
                                                  if (receiver_adress=='00' || receiver_adress=='80') {device="Validator";}
                                                  received_command = received_cleaned.slice(4, -4);
                                                  var data=await ssp.received_byte_stuffing(received_command)
                                                  received_command=data;
                                                  parser.removeAllListeners('data');
                                                  //////////////////////////////
                                                  if(received_command.length>0){

                                                    ready_for_sending=true;
                                                    return resolve(received_command);
                                                  //  }, 20);
                                                  }else{
                                                    console.log("salgo por aqui1234");

                                                    const error= "no respuesta, necesario reintentar...";
                                                      setTimeout(()=>{return reject(error); retrial(error); },3000);
                                                    }
                                              //  })

                                              //  .catch(function(error) {console.log(error);sp.retrial(error);});
                                                });

    } catch (e) {
      return reject(chalk.cyan("05-Error en hacer_consulta_serial:")+e);
    } finally {
    //  return;
    }
  });
};
module.exports.hacer_consulta_serial2=hacer_consulta_serial2;
//////////////////////////////////////////////////////////////////////////
exports.retrial=async function(command_ready){
console.log(chalk.red("Inicializando Sistema automaticamente en 1 Segundos------------------"));
setTimeout(async function(){
  //it.start_tebs_validator();
  zerox=!zerox;
  ecount="00000000";
  slave_count=0;
  request_key_exchange="";
  canal_liberado();
 //await va.start_validator();

 try {
   console.log("starting validator");
   var validator= await va.start_validator();
   console.log("validator variable is:"+validator);
   if (validator=="OK") {
     console.log(chalk.green("Validator Online"));
     on_startup=false;
     var step8=await va.validator_poll_loop(validator_address);
     os.logea(chalk.green("Inicio poll loop:"+step8));
   }else {
     console.log(chalk.red("No Validator Found"));
     return reject();
   }
 } catch (e) {
 console.log("no se pudo completar:"+e);
 } finally {
     console.log("idle");
 }
},10000);
//////////////////////////////////////////////////////////////////////////
};

var io;
module.exports = function(importIO) {
    io = importIO;
};
