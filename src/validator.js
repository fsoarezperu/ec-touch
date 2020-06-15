// const server = require('./server');
// const ssp = require('./it/ssp');
// const glo = require('./globals');
// ///////////////////////////////////////////////////////////
// exports.start_validator=function(){
//   console.log("starting_smart_hopper");
//   server.logea("/////////////////////////////////");
//    ssp.sync_and_stablish_presence_of(validator_address);
// }
// ///////////////////////////////////////////////////////////
const ssp = require('./it/ssp');
const server = require('./server');
const it = require('./tambox');
const sp = require('./serial_port');
const enc = require('./it/encryption');
const chalk=require('chalk');
const glo = require('./globals');
///////////////////////////////////////////////////////////
function start_validator() {
  return new Promise( async function(resolve, reject) {
    server.logea(chalk.green("starting_cashbox"));
    server.logea("/////////////////////////////////");
    var stat=await ssp.sync_and_stablish_presence_of(validator_address);
    if (stat=="OK") {
    //  var stat=await ssp.negociate_encryption(smart_hopper_address);
      return resolve("OK");
    }else {
      reject(stat)
    }

  });

}
module.exports.start_validator=start_validator;
///////////////////////////////////////////////////////////
