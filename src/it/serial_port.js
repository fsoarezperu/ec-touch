const server = require('./../server');
const ssp = require('./ssp');
const glo = require('./globals');
const enc = require('./encryption');

const chalk=require('chalk');
const it = require('./devices/tambox');
const sh = require('./devices/smart_hopper');
const va = require('./devices/validator');

const SerialPort = require('serialport')
const InterByteTimeout = require('@serialport/parser-inter-byte-timeout')
const port = new SerialPort('/dev/ttyUSB0')
// var port;
// try {
//   // return new Promise(function(resolve, reject) {
//   //     const port = new SerialPort('/dev/ttyUSB0')
//   //     if(port){
//   //       return port;
//   //       return resolve(port)
//   //     }else {
//   //       return reject("puerto faltanse");
//   //     }});
//   port = new SerialPort('/dev/ttyUSB0');
//  return  port;
// } catch (e) {
//   const port="";
//   return ("puerto no encontrado:"+e);
// } finally {
//   console.log(port);
//   console.log("puerto com encontrado");
//   return;
// }

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
//  console.log("command to be send is:"+command);

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
         ////////////////////////////
         //.then(recivido =>{resolve (recivido)})
         ////////////////////////////
         //.catch(err =>{  });
         ////////////////////////////
       } catch (e) {
        return  reject(e)
       } finally {

       }
  })



};
module.exports.transmision_insegura=transmision_insegura;
//////////////////////////////////////////////////////////////////////////
function canal_ocupado(){
  ready_for_sending=false;
//  ready_for_pooling=false;
server.logea("Canal ocupado");
}
//////////////////////////////////////////////////////////////////////////
function canal_liberado(){
  ready_for_sending=true;
//  ready_for_pooling=true;
server.logea("Canal liberado");
}
module.exports.canal_liberado=canal_liberado;
//////////////////////////////////////////////////////////////////////////
function disable_hopper_pooling(){
  ready_for_pooling=false;
server.logea("disabling hopper_pooling");
}
module.exports.disable_hopper_pooling=disable_hopper_pooling;
//////////////////////////////////////////////////////////////////////////
function enable_hopper_pooling(){
  ready_for_pooling=true;
server.logea("enabling hopper_pooling");
}
module.exports.enable_hopper_pooling=enable_hopper_pooling;
//////////////////////////////////////////////////////////////////////////
async function hacer_consulta_serial(receiver,command){
  return new Promise(async(resolve,reject)=>{
    try {
      console.log("en este punto rfs:"+ready_for_sending);
    var go=await ssp.ensureIsSet()
    if(go=="OK"){
          canal_ocupado();
          server.logea("hasta aqui command es:"+command);
          const command_ready =await ssp.prepare_command_to_be_sent(receiver,command);
          server.io.emit("system_running_indicator","system_running_indicator")
        //  console.log("command_ready"+command_ready);
        console.log("rfs:"+ready_for_sending+ " and rfp:"+ready_for_pooling);
          port.write(command_ready, function(err) {if (err) {return reject(err)}});
          server.logea("aqui ya se transmitio el dato"+command_ready+" a puerto");
          //console.log(parser);
          var mytime=setTimeout(()=>{const error= "No se recibio respuesta en puerto serial.";
                                    console.log("rfs:"+ready_for_sending+ "and rfp:"+ready_for_pooling);
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
                                            var data=await ssp.received_byte_stuffing(received_command)
                                            //.then(data =>{
                                            //  console.log("data_received:"+data)
                                          //  console.log("global slave_count is:"+slave_count);
                                            //  console.log(chalk.yellow(slave_count+" -> "+device+'->:'),chalk.yellow(data));
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
      }else {
        console.log("not sure if it is waiting for ensureIsSet");
        return reject(go);
      }
    } catch (e) {
      return reject(e);
    } finally {
      return
    }
  });
};
module.exports.hacer_consulta_serial=hacer_consulta_serial;
//////////////////////////////////////////////////////////////////////////
exports.retrial=async function(command_ready){
console.log(chalk.yellow("retrial now--------------------------------------------------------------------------"));
//setTimeout(function(){
  //it.start_tebs_validator();
  zerox=false;
  ecount="00000000";
  slave_count=0;
  canal_liberado();
 await va.start_validator();
//},5000);
//////////////////////////////////////////////////////////////////////////
};
