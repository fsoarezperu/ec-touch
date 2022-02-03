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
//  var variable1=glo.existe_bolsa;

  console.log("aqui estoy entrando a arranque sin bolsa y la variable es existe_bolsa="+global.existe_bolsa);

  if (global.existe_bolsa==false){
    await validatorpoll(validator_address);
    console.log("si existe bolsa es:"+global.existe_bolsa);
  }else {
    console.log(chalk.yellow("variable existe_bolsa fue detectada y estoy retornando OK para continuar"));
    return "OK";
  }
//  arranque_sin_bolsa();
   setTimeout(arranque_sin_bolsa,200);
}


async function validatorpoll(receptor) {
  //console.log("aqui cambio la promesa de validator poll");
   try {
    //  console.log("aqui global.poll:"+global.poll);
      var step1= await ssp.envia_encriptado(receptor,global.poll);
    //  console.log("step1x:" +step1);
      // await  setTimeout(async function(){
           var data=await ssp.handlepoll(step1);

           // if (existe_bolsa==false) {
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
  console.log(chalk.yellow("CHANNELS INHIVITs"));
  return new Promise(async function(resolve, reject) {
    try {
      await ssp.envia_encriptado(receptor,set_inhivits);
      return resolve("OK");
    } catch (e) {
      return reject("no funciono set_channel_inhivits");
    }

  });
};
module.exports.set_channel_inhivits=set_channel_inhivits;
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

        // console.log("tebs_barcode current value is:"+tebs_barcode);
        tebs_barcode = tebs_barcode.concat(i);
      }
      current_tebs_barcode=tebs_barcode;
        //console.log(chalk.green("tebs barcode is:" + tebs_barcode));
      return resolve(tebs_barcode);

    } catch (e) {
      return reject(e);
    } finally {

    }
  });
}
module.exports.handleGetTebsBarcode=handleGetTebsBarcode;
/////////////////////////////////////////////////////////
