const express= require('express');
const router = express.Router();

require('./server.js')(io);
// define constructor function that gets `io` send to it
module.exports = function(io) {
    // io.on('connection', function(socket) {
    //     socket.on('message', function(message) {
    //         logger.log('info',message.value);
    //         socket.emit('ditConsumer',message.value);
    //         console.log('from console',message.value);
    //     });
    // });
    router.get('/iox', function(req, res){
    //  io.sockets.emit('home.accessed');
     io.emit('enable_validator',"enabling validator ");
    res.send("hello");
    })
  //  io.emit('enable_validator',"enabling validator ");
    return router;
};

//module.exports=router;


exports.ecommand=function (datax) {
//  const encrypted_command_ready =prepare_command_to_be_sent(datax);
//  console.log("encrypted_command_ready:"+encrypted_command_ready);

  var ebuffer = elength;
  handle_count();
  ebuffer = ebuffer.concat(exports.ecount);
  ebuffer = ebuffer.concat(datax);
  ebuffer = ebuffer.concat(epacking);
  var ebuffer_length = ebuffer.length / 2;
  ebuffer = String(ebuffer, 'hex');
  var command_clean = ebuffer;
  var hexiando = "0x" + chunk(ebuffer, 2).join('0x');
  ebuffer = hexiando.match(/.{1,4}/g);
  var el_crc = new Buffer.from(spectral_crc(ebuffer), 'hex').toString('hex');
  //Agrega el STX a la cadena ya preformada, culminando asi el dato completo
  var command_listo = command_clean + el_crc;
  command_listo = command_listo.toUpperCase();

  var encrypted_data = encrypt(command_listo);
  console.log("ecommand encrypted order:"+encrypted_data.toUpperCase());
  // console.log("encrypted data length:"+encrypted_data.length/2);
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
  //send this package using the regular commands
  //   console.log("encrypted command sent: "+full_encrypted_data);
  exports.manda(full_encrypted_data)
//  send_command_ssp(full_encrypted_data, func, after_encription);
    .then(data => {
      console.log(chalk.yellow("<-:"+data));
      exports.handleEcommand(data);
      console.log("/////////////////////////////////");

    })

}

0100000000670000000000000000A413
010000000067000000000000000A413
01 00 00 00 00 67 00 00 00 00 00 00 00 0
01 00 00 00 00 67 00 00 00 00 00 00 00 0
1   2  3  4  5  6  7  8  9  10 11 12 13      15 16
