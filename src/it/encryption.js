const server = require('./../server');
var aesjs = require('aes-js');
var Big_Number = require('big-number');
const BigNumber = require('bignumber.js');
const ssp = require('./ssp');
const os = require('./os');
const socket= require('./socket')
const chalk=require('chalk');
const glo = require('./globals');
const sp = require('./serial_port');

///////////////////////////////////////////////////
var acomodando2,acomodando,hexiando,hexiado;
//var slave_count;
////////////////////////////////////////////////////
function set_generator_(){
  //console.log("set generator to send:" + set_generator + " this has to be a prime number");
  calc_generator = set_generator;
  //console.log(calc_generator);
  set_generator = ssp.ConvertBase.dec2hex(set_generator);
  set_generator = set_generator.toUpperCase();
  //console.log("set generator to hex:" + set_generator);
  pre_set = changeEndianness(String(set_generator));
  //console.log("pre_set is:"+pre_set);
  acomodando2 = "000000000000";
  pre_set = pre_set.concat(acomodando2);
  //console.log("pre_set is:"+pre_set);
  acomodando = "094A";
  acomodando = acomodando.concat(pre_set);
  //console.log("acomodando is:"+acomodando);
  hexiando = "0x" + ssp.chunk(acomodando, 2).join('0x');
  //console.log("hexiando is:"+hexiando);
  hexiando = hexiando.match(/.{1,4}/g);
  hexiado = hexiando;
  //console.log("hexiado is:"+hexiado);
  set_generator = hexiado;
  //console.log(set_generator);
  return set_generator;
}
module.exports.set_generator_=set_generator_;
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
function handleSetgenerator(data){
  return new Promise(function(resolve, reject) {
    var poll_responde=data.match(/.{1,2}/g);
    //console.log("poll_responde is:"+poll_responde);
    if(poll_responde[1] == "F0"){
    os.logea(chalk.green("GENERATOR EXCHANGED SUCCESFULLY"));
      return resolve("OK");
    }
    if(poll_responde[1] == "F4"){
      console.log(chalk.green("Parameter Out Of Range"));
      return reject("Parameter Out Of Range")
    }
    if(poll_responde[1] == "F8"){
      console.log(chalk.green("GENERATOR FAILED"));
      return reject("GENERATOR FAILED")
    }
    //ssp.enable_sending();
    //return;
  });
}
module.exports.handleSetgenerator=handleSetgenerator;
////////////////////////////////////////////////////
function handleSetmodulus(data){
  return new Promise(function(resolve, reject) {
    var poll_responde=data.match(/.{1,2}/g);
    if(poll_responde[1] == "F0"){
      os.logea(chalk.green("MODULUS EXCHANGED SUCCESFULLY"));
        return resolve("OK");
    }
    if(poll_responde[1] == "F4"){
      console.log(chalk.green("Parameter Out Of Range"));
      return reject("Parameter Out Of Range")
    }
    if(poll_responde[1] == "F8"){
      console.log(chalk.green("MODULUS FAILED"));
      return reject("MODULUS FAILED")
    }
  //  ssp.enable_sending();
  //  return;
  });

}
module.exports.handleSetmodulus=handleSetmodulus;
////////////////////////////////////////////////////
exports.getkeys=function(){
  var forge = require('node-forge');
  var keyPair = forge.pki.rsa.generateKeyPair(32);
  var my_key;
  set_generator = keyPair.privateKey.p;
  set_modulus = keyPair.privateKey.q;
  console.log("GENERADOR:" + set_generator);
  console.log("MODULUS:" + set_modulus);
  console.log("Prime numbers generated!");
//  enable_sending();
return;
}
////////////////////////////////////////////////////
exports.set_modulus=function () {
  //console.log("SetModulus command sent");
  //console.log("set modulus to send:" + set_modulus);
  calc_modulus = set_modulus;
  set_modulus = ssp.ConvertBase.dec2hex(set_modulus);
  set_modulus = set_modulus.toUpperCase();
  //console.log("set generator to hex:" + set_modulus);
  var pre_set = changeEndianness(String(set_modulus));
  var acomodando2 = "000000000000";
  pre_set = pre_set.concat(acomodando2);
  var acomodando = "094B";
  acomodando = acomodando.concat(pre_set);
  var hexiando = "0x" + ssp.chunk(acomodando, 2).join('0x');
  hexiando = hexiando.match(/.{1,4}/g);
  var hexiado = hexiando;
  set_modulus = hexiado;
  return set_modulus;
}
////////////////////////////////////////////////////
function send_request_key_exchange() {
  return new Promise(function(resolve, reject) {
    try {
    //  console.log("request_key_exchange command sent");
      //my_HOST_RND = 999;
      var HostInterKey = 0;
      os.logea("my_HOST_RND:" + my_HOST_RND);
      calc_generator = parseInt(calc_generator, 10);
      calc_modulus = parseInt(calc_modulus, 10);
      os.logea("my calc_generator:" + calc_generator);
      os.logea("my calc_modulus:" + calc_modulus);
      HostInterKey = Big_Number(calc_generator).pow(my_HOST_RND);
      HostInterKey = Big_Number(HostInterKey).mod(calc_modulus);
      if (HostInterKey.lenth < 4) {
        if (HostInterKey.lenth == 3) {
          os.logea("prefix");
          var prefix = "0";
          HostInterKey = prefix.concat(HostInterKey);
        }
        if (HostInterKey.lenth == 2) {
          os.logea("prefix");
          var prefix = "00";
          HostInterKey = prefix.concat(HostInterKey);
        }
        os.logea("Host interkey padded");
      }
      //console.log("HostInterKey:" + HostInterKey);
      ///////////////////////////////////////////////
      HostInterKey = ssp.ConvertBase.dec2hex(HostInterKey).toUpperCase();
      HostInterKey = pady(HostInterKey, 4);
      //console.log("HostInterKey to hex:" + HostInterKey);
      var pre_set = changeEndianness(String(HostInterKey));
      var acomodando2 = "000000000000";
      pre_set = pre_set.concat(acomodando2);
      var acomodando = "094C";
      acomodando = acomodando.concat(pre_set);
      var hexiando = "0x" + ssp.chunk(acomodando, 2).join('0x');
      hexiando = hexiando.match(/.{1,4}/g);
      var hexiado = hexiando;
      request_key_exchange = hexiado;
      //////////////////////////////////////////////
      os.logea(request_key_exchange);
    //  console.log("fin de send request key exchange");
      return resolve(request_key_exchange);
    } catch (e) {
        return reject(e);
    } finally {
    //  return;
    }
  });

}
module.exports.send_request_key_exchange=send_request_key_exchange
////////////////////////////////////////////////////
function pady(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
module.exports.pady=pady;
////////////////////////////////////////////////////
function this_timer(amount){
  return new Promise(function(resolve, reject) {
    setTimeout(function () {
      return resolve ("ok");
    }, amount);
  });
}

function handleRKE(data){
    return new Promise(async function(resolve,reject){
  //    console.log(data);
try {
  var myData;
  var number_of_byte = data.substr(0, 2);
  myData = data.substr(2, number_of_byte + 2);
//  console.log("number_of_byte:" + number_of_byte);
  var firstbyte = myData.substr(0, 2);
  var slaveInterKey = myData.substr(2, 8);
   slaveInterKey = changeEndianness(slaveInterKey);
   var dec_SlaveInterKey = new BigNumber(slaveInterKey, 16);
    dec_SlaveInterKey = dec_SlaveInterKey.toString(10);

    if (firstbyte == "F0") {
      os.logea("OK received SlaveInterKey RECEIVED");
      os.logea("SlaveInterKey:" + slaveInterKey);
      os.logea("SlaveInterKey dec:" + (dec_SlaveInterKey));
      var final_key = Big_Number(dec_SlaveInterKey).pow(my_HOST_RND);
      final_key = Big_Number(final_key).mod(calc_modulus);
      os.logea("Encryption KEY:" + final_key);
      final_key = ssp.ConvertBase.dec2hex(final_key).toUpperCase();
      final_key =pady(final_key,4); //para rellenar con 0 a la izqeuirda cuando el hex salga muy pequeño
    //  console.log("Encryption KEY to hex:" + final_key);
      final_key = changeEndianness(final_key);
      var higherpart = "000000000000";
      var lowerpart =  "0123456701234567";
      lowerpart = changeEndianness(lowerpart);
      final_key = final_key.concat(higherpart);
      full_KEY = lowerpart.concat(final_key);
      console.log(chalk.green("KEY:" + full_KEY));
    //  ssp.enable_sending();
      //return full_KEY;
       return resolve(full_KEY);
    //  setTimeout(send_poll, 200);
    }


    if (firstbyte == "F8") {
        console.log(chalk.red("Not Possible to create the Key"));
        //sp.port.close();
        //sp.port.open();
        console.log("we need to restart here buddy!...123");
      var abc1= await sp.cerrar_puerto_serial();
      console.log("abc1"+abc1);
        console.log("starting wait");
      var  abc2=await this_timer(10000);
      console.log("abc2"+abc2);
        console.log("finish wait");
      var  abc3=await sp.abrir_puerto_serial();
      console.log("abc3"+abc3);
      var  abc4=await socket.autostart();
      console.log("abc4"+abc4);

      //  server.io.emit('initialize_validator','initialize_validator');
    //  console.log(chalk.green("KEY:" + full_KEY));
    // var rKE = exports.send_request_key_exchange();
    // os.logea("/////////////////////////////////");
    // os.logea("Request Key Exchange command sent");
    // var step5=await sp.transmision_insegura(receptor,rKE); //<--------------------------- REquest key exchange
    // try {
    //   var step6=await handleRKE(step5);
    //   if(step6.length>0){
    //     os.logea(chalk.green('KEY:'), chalk.green(step6));
    //     console.log(chalk.green("KEY CALCULATED SUCCESFULLY"));
    //     os.logea("/////////////////////////////////");
    //     encryptionStatus = true;
    //    return resolve("OK")
    //
    //  }else {
    //    return reject("NO KEY:"+step6)
    //  }
    // } catch (e) {
    //   return reject(e);
    // } finally {
    //   return;
    // }
    //
    // os.logea("/////////////////////////////////");
    // setTimeout(function () {
    //   sp.retrial();
    // }, 1000);
       return resolve("Not Possible to create the Key");

    }
    if (firstbyte == "F4") {
      console.log(chalk.red("Parameter out of range"));
      os.logea("/////////////////////////////////");
      return  reject("Parameter out of range");
    }
} catch (e) {
  return reject(e);
} finally {
//  return;
}
//  ssp.enable_sending();
  });
}
module.exports.handleRKE=handleRKE;
////////////////////////////////////////////////////
////////////////////////////////////////////////////
var full_KEY=0;
//var slave_count=0;
function encrypt(mensaje) {
return new Promise(function(resolve, reject) {
  try {
    var myKey = full_KEY;
    var key = aesjs.utils.hex.toBytes(myKey);
    var text = mensaje;
  //  console.log("--message:" + mensaje);
    var textBytes = aesjs.utils.hex.toBytes(text);
    var aesEcb = new aesjs.ModeOfOperation.ecb(key);
    var encryptedBytes = aesEcb.encrypt(textBytes);
    var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  // console.log("encripted:" + encryptedHex.toUpperCase() + " and has:" + encryptedHex.length / 2 + "Hex bytes");
    return resolve(encryptedHex);
  } catch (e) {
    return reject(e);
  } finally {
    return;
  }
});

}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
async function reenviar_ultimo_dato(){
  console.log(chalk.red("reenviando ultimo dato"));
      ready_for_sending=true;
      return new Promise(async function(resolve, reject) {
        try {
          //reenvia el ultimo dato aqui.
          var data=await envia_encriptado(validator_address,synch)
          return resolve(data);
        } catch (e) {
          return reject(chalk.magenta("no se pudo enviar el ultimo dato nuevamente."));
        } finally {
          //return;
        }
});
  console.log(chalk.red("finalizo el reenvio"));
}
module.exports.reenviar_ultimo_dato=reenviar_ultimo_dato;

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
function decrypt(mensaje) {
  return new Promise( function(resolve, reject) {
    try {
      //si el mesnaje tiene tamaño estandart
      if(mensaje.length==32||mensaje.length==64||mensaje.length==96||mensaje.length==128||mensaje.length==160||mensaje.length==192||mensaje.length==224||mensaje.length==256){
      var key = aesjs.utils.hex.toBytes(full_KEY);
      var aesEcb = new aesjs.ModeOfOperation.ecb(key);
      var encryptedBytes = aesjs.utils.hex.toBytes(mensaje);
      var decryptedBytes = aesEcb.decrypt(encryptedBytes);
      var decryptedText = aesjs.utils.hex.fromBytes(decryptedBytes);
    //  console.log("decrypted:"+decryptedText.toUpperCase());
      return resolve(decryptedText);
    }else{
      //si el mensaje viene con bytes extras al final que necesitan ser cortados.
      os.logea(chalk.cyan("NO desencriptado: "+mensaje));
      os.logea("mensaje length: "+mensaje.length);
      if(mensaje.length==34||mensaje.length==66||mensaje.length==98||mensaje.length==130||mensaje.length==162||mensaje.length==194||mensaje.length==226||mensaje.length==258){
        //console.log(chalk.magenta("CORTADO"));
        mensaje=mensaje.substr(0,mensaje.length-2);
        os.logea("new message trimmed is:"+mensaje);
        var key = aesjs.utils.hex.toBytes(full_KEY);
        var aesEcb = new aesjs.ModeOfOperation.ecb(key);
        var encryptedBytes = aesjs.utils.hex.toBytes(mensaje);
        var decryptedBytes = aesEcb.decrypt(encryptedBytes);
        var decryptedText = aesjs.utils.hex.fromBytes(decryptedBytes);
      //  console.log("decrypted:"+decryptedText.toUpperCase());
        return resolve(decryptedText);
      }else {
        //console.log("hay un byter extra, HAY QUE CORTARLO");
        return reject(chalk.red("error 4322:"+e));
      }
      console.log(chalk.red("NO SE PUDO DESENCRIPTAR"));
      //Reenvia el ultimo dato, igualito, misma cuenta, mismo todo.
      //await reenviar_ultimo_dato();
      /////////////////////////////////////////////////////////////
      //hANDLE pool
      return resolve("00000000000000000000000000000000");
      //return ("00000000000000000000000000000000");
    }
    } catch (e) {
      return reject(chalk.magenta("no se pudo desnciptar,")+e);
    } finally {
    //  return;
    }
  });
}
//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
function handle_count() {
  return new Promise(function(resolve, reject) {
  try {
    ecount = changeEndianness(ecount);
    ecount = parseInt(ecount, 16);
    if (zerox == true) {
      ecount = ecount + 1;
    } else {
      ecount = ecount;
      zerox = true;
    }
    slave_count= pady(slave_count,8)
    ecount = ssp.ConvertBase.dec2hex(ecount);
    ecount= ecount.toUpperCase();
    ecount = pady(ecount, 8);
    console.log("Mi Cuenta(ecount):" + ecount);
    console.log(chalk.cyan("lo que asumo que tiene el:(slave_count)" + slave_count));
    if(slave_count == ecount){
      //console.log(chalk.green("COINCIDEN"));
      //tengo que usar esta punta para continuar, desde aqui ya que aqui se verifica que la suma
      //concuerda.
      os.logea("slave_count es:"+slave_count+" y ecount:"+ecount);
      ecount = changeEndianness(ecount);
      return resolve(ecount);
    }else{
      console.log(chalk.red.inverse("NO COINCIDEN"));
      //aqui me falta entender que tengo que hacer cuando los ecounts no coinciden.
      //creo que tengo que reintentar enviar el dato anterior
    //  return reject("los paquetes de ecount no coinciden");
    ecount = changeEndianness(ecount);
    return resolve(ecount);
    }
    //setTimeout(handle_count,1000);
  } catch (e) {
  return reject(e);
  } finally {
  //  return (ecount);
  }
  });

};
////////////////////////////////////////////////////
////////////////////////////////////////////////////
var padding;//= Array(29).join('0');
function determinar_send_padding() {
//  console.log("llego a determinar padding");
   if (numero_de_packs==1) {
    padding = Array(29).join('0');//cuando mando 1 solo paquete de 16bytes
   }
   if (numero_de_packs==2) {
    padding = Array(61).join('0');//cuando mando 1 solo paquete de 16bytes
   }
   if (numero_de_packs==3) {
    padding = Array(93).join('0');//cuando mando 1 solo paquete de 16bytes
   }
   if (numero_de_packs==4) {
    padding = Array(125).join('0');//cuando mando 1 solo paquete de 16bytes
   }
   if (numero_de_packs==5) {
    padding = Array(157).join('0');//cuando mando 1 solo paquete de 16bytes
   }
   if (numero_de_packs==6) {
    padding = Array(189).join('0');//cuando mando 1 solo paquete de 16bytes
   }
   if (numero_de_packs==7) {
    padding = Array(221).join('0');//cuando mando 1 solo paquete de 16bytes
   }
   if (numero_de_packs==8) {
    padding = Array(253).join('0');//cuando mando 1 solo paquete de 16bytes
   }
  // if (x.length<=33bytes) {
                                  //padding = Array(61).join('0');
  // }
  // if (x.length<=33bytes) {
  //  padding = Array(61).join('0');
  // }
  // if (x.length<=33bytes) {
  //  padding = Array(61).join('0');
  // }
  //
}

function padx(pad, str, padLeft) {
  os.logea("padding es:"+padding);
  if (typeof str === 'undefined')
    return pad;
  if (padLeft) {
    return (pad + str).slice(-pad.length);
  } else {
    return (str + pad).substring(0, pad.length);
  }
}


async function prepare_Encryption(datax) {
  return new Promise(async function(resolve, reject) {
    try {
 os.logea(chalk.cyan("esto es lo que me envian como data total:"+datax));
  // os.logea("esto tiene datax[0]:"+datax[0]);
  // console.log("esto tiene datax[1]:"+datax[1]);
  // console.log("esto tiene datax[2]:"+datax[2]);
  // console.log("esto tiene datax[3]:"+datax[3]);

  //poll = [0X01, 0X07];
  var ebuffer = pady(datax[0], 2).toString(16);
  //var ebuffer = datax[0];
  var last_length=ebuffer;
  //console.log("datax padded and to string16:"+ebuffer);
//  console.log("////////////////////////////////////////////////////");
  //console.log("-> Length de la DATA que se quiere enviar en bytes:"+datax.length);
  //console.log("DataLength:"+ebuffer+ " Bytes");


   await handle_count();
   os.logea("DataLength + ecount:"+chalk.green(ebuffer)+ chalk.cyan(ecount) );
   ebuffer = ebuffer.concat(ecount);

   var i;
   var data_line="";
   var data_full_line="";
   for ( i=1; i<datax.length;i++){
        data_line=pady(datax[i].toString(16).toUpperCase(),2);
        data_full_line=data_full_line.concat(data_line);
   }
   os.logea(chalk.cyan("Orden original:"+data_full_line));
   if(data_full_line.length>=0 && data_full_line.length<=9){
  os.logea(chalk.cyan("el paquete requiere encryptar 16"));
  numero_de_packs=1;
   }
   if(data_full_line.length>=9 && data_full_line.length<=25){
  os.logea(chalk.cyan("el paquete requiere encryptar 32"));
    numero_de_packs=2;
   }
   if(data_full_line.length>=25 && data_full_line.length<=41){
  os.logea(chalk.cyan("el paquete requiere encryptar 48"));
    numero_de_packs=3;
   }
   if(data_full_line.length>=41 && data_full_line.length<=57){
  os.logea(chalk.cyan("el paquete requiere encryptar 64"));
    numero_de_packs=4;
   }
   if(data_full_line.length>=57 && data_full_line.length<=73){
  os.logea(chalk.cyan("el paquete requiere encryptar 80"));
    numero_de_packs=5;
   }
   if(data_full_line.length>=73 && data_full_line.length<=89){
  os.logea(chalk.cyan("el paquete requiere encryptar 96"));
    numero_de_packs=6;
   }
   if(data_full_line.length>=89 && data_full_line.length<=105){
  os.logea(chalk.cyan("el paquete requiere encryptar 112"));
    numero_de_packs=7;
   }
   if(data_full_line.length>=105 && data_full_line.length<=121){
  os.logea(chalk.cyan("el paquete requiere encryptar 128"));
    numero_de_packs=8;
   }
   ebuffer = ebuffer.concat(data_full_line);
  // os.logea("Sin packing tiene:"+ebuffer.length/2+" Bytes");
  // console.log(chalk.yellow("Data Sin Packing:"+ebuffer));
   // if((ebuffer.length/2)/14>1 ){
   //   os.logea("we need to pack more than 1");
   // }
      //epacking
      determinar_send_padding(ebuffer);
   ebuffer = padx(padding,ebuffer,false);
    //console.log(chalk.yellow("__________PackeT:"+ebuffer));
//  console.log("Luego del packing la data tiene ahora:"+ebuffer.length/2 +" bytes,por lo tanto:"+chalk.red(14-ebuffer.length/2)+" Bytes (0's) a la derecha del ultimo dato.");

     ebuffer = String(ebuffer, 'hex');
     var command_clean = ebuffer;
     var hexiando = "0x" + ssp.chunk(ebuffer, 2).join('0x');
     //os.logea("chunking:"+hexiando);
     ebuffer = hexiando.match(/.{1,4}/g);
     //os.logea("matching:"+hexiando);
     var el_crc = new Buffer.from(ssp.spectral_crc(ebuffer), 'hex').toString('hex');
    //Agrega el STX a la cadena ya preformada, culminando asi el dato completo
    var command_listo = command_clean + el_crc;
    command_listo = command_listo.toUpperCase();
    os.logea(chalk.yellow("__+ CRC al final:"+command_listo)+ chalk.cyan(" -->ESTO SE ENCRIPTA!!! ")+command_listo.length+" Bytes");
    /////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////
    var encrypted_data =await encrypt(command_listo);
    os.logea(chalk.red("_______encrypted:"+encrypted_data.toUpperCase()));
  if ((encrypted_data.length/2)==16) {
    os.logea(chalk.cyan("PAKETE COMPLETO"));
  } else {
    os.logea("cantidad de bytes:"+encrypted_data.length/2);
  }
   //Al trasmitir 17 bytes es necesario ponerlo como HEX en la cadena de envio es decir 17dec=11hex
    var the_length = (encrypted_data.length / 2) + 1;
  //  console.log("encrypted_data.length:"+encrypted_data.length/2+"Bytes");
    if (encrypted_data.length/2==16) {
      the_length=11; //numero de paquetes encryptados multiplo de 16 +1 es decir  16+1, 32+1,48+1 y la respuesta en HEX
    }
    if (encrypted_data.length/2==32) {
      the_length=21;
    }
    if (encrypted_data.length/2==48) {
      the_length=31;
    }
    if (encrypted_data.length/2==64) {
      the_length=41;
    }
    if (encrypted_data.length/2==80) {
      the_length=51;
    }
    if (encrypted_data.length/2==96) {
      the_length=61;
    }
    if (encrypted_data.length/2==112) {
      the_length=71;
    }
    if (encrypted_data.length/2==128) {
      the_length=81;
    }

    var finalizando_envio=the_length+"7E"+encrypted_data; // se usa este valor cuando se va a utilizar 16 bytes para transmision
//    var finalizando_envio = "217E" + encrypted_data; //se usa este valor cuando se va a utilizar 32 bytes para transmision
  //  var finalizando_envio = "217E" + encrypted_data; //se usa este valor cuando se va a utilizar 48 bytes para transmision

    finalizando_envio = finalizando_envio.toUpperCase();
    os.logea(chalk.green("_encrypt2send:"+finalizando_envio));
    var to_send = "0x" + ssp.chunk(finalizando_envio, 2).join('0x');
    to_send = to_send.match(/.{1,4}/g);
    //os.logea("to send:"+to_send);
    var full_encrypted_data = to_send; // make this equal to the full legth data encrypted ready to be send
  //  return full_encrypted_data;
    return resolve(full_encrypted_data);
 } catch (e) {
    return reject(e);
 } finally {
  // return
 }
});
}
module.exports.prepare_Encryption=prepare_Encryption;
////////////////////////////////////////////////////
async function handleEcommand(){
  var handler="";
  var myData;
  var number_of_byte = received_command.substr(0, 2);
  myData = received_command.substr(2, number_of_byte + 2);
  var firstbyte = myData.substr(0, 2);
//  console.log("after_encription received:" + number_of_byte + " Bytes of responde data");
  // console.log("witch are:" + myData);
  myData=myData.substr(2,number_of_byte+ 2)
  os.logea("cleaned recevided data:"+myData);
  os.logea(myData.length);
  var number_of_packets=myData.length/32;
  os.logea(number_of_packets);
// if(myData.length>32){
//   myData=myData.substr(0, 32);
//   console.log(chalk.red.inverse("Cutted length:"+myData));
// }
var ready=[];

// forEach((MyData, i) => {
//
// });
 for (var i = 0; i < number_of_packets; i++) {
   os.logea(i);
   var from, to;
   from=i*32;
   to=from+32;
   os.logea("From:"+from+" To:"+to);
   os.logea(myData);
   var myData2="";
   myData2=myData.substr(from, 32);
   os.logea("Grupo:"+(i+1)+":"+myData2);
   var tempo=await decrypt(myData2).toUpperCase();
   ready=ready+tempo;
 }
//for each
  //ready=decrypt(myData).toUpperCase();
  console.log(chalk.green("<-:"+ready));
  var data_length = ready.substr(0, 2);
  handler=data_length;
  data_length=parseInt(data_length,10);
  os.logea("data length is:"+data_length);
  var read_ecount=ready.substr(2, 8);
  read_ecount=changeEndianness(read_ecount);
  os.logea("reaD COUNT:"+read_ecount);
  //read_ecount=parseInt(read_ecount,10);
  slave_count=read_ecount;
  slave_count=pady(slave_count,8);
  //slave_count = parseInt(slave_count, 16);
//  console.log("slave_read_ecount is:"+slave_count);
  var read_data=ready.substr(10,data_length*2);
  os.logea("read_data is:"+read_data);
  //exports.handleRoutingNotes(read_data);
  handler=handler+read_data; //this concant the data lentth and the data itself in order to be able to hableit by pollresponse.
  await ssp.handlepoll(handler);
  return handler;
}
module.exports.handleEcommand=handleEcommand;
////////////////////////////////////////////////////
async function promise_handleEcommand(data){
  return new Promise(async function(resolve, reject) {
try {
  var handler="";
  var myData;
  var number_of_byte =received_command.substr(0, 2);
  number_of_byte=ssp.hex_to_dec(number_of_byte);//////////////////////
  myData = received_command.substr(2, number_of_byte + 2);
  var firstbyte = myData.substr(0, 2);
  os.logea("after_encription received:" + number_of_byte + " Bytes of responde data");
  os.logea("witch are:" + myData);
  myData=myData.substr(2,number_of_byte+ 2)
  os.logea("cleaned recevided data:"+myData);
  os.logea(myData.length);
  var number_of_packets=myData.length/32;
  os.logea(number_of_packets);
  // if(myData.length>32){
  //   myData=myData.substr(0, 32);
  //   console.log(chalk.red.inverse("Cutted length:"+myData));
  // }
  var ready=[];

  // forEach((MyData, i) => {
  //
  // });
  for (var i = 0; i < number_of_packets; i++) {
   os.logea(i);
   var from, to;
   from=i*32;
   to=from+32;
   //console.log("From:"+from+" To:"+to);
   //console.log(myData);
   var myData2="";
   myData2=myData.substr(from, 32);
   //console.log(myData2);
   os.logea("Grupo:"+(i+1)+":"+myData2);
   //var tempo=await decrypt(myData2).toUpperCase();
   var tempo=await decrypt(myData);
   tempo=tempo.toUpperCase();
   ready=ready+tempo;
   //console.log("queda asi"+ready);
  }
  //for each
  //ready=decrypt(myData).toUpperCase();
  os.logea(chalk.green("<-:"+ready));
  var data_length = ready.substr(0, 2);
  handler=data_length;
  data_length=parseInt(data_length,16);
  os.logea("data length is:"+data_length);
  var read_ecount=ready.substr(2, 8);
  read_ecount=changeEndianness(read_ecount);
  //console.log("reaD COUNT:"+read_ecount);
  // if(global.show_details===true){
  //   console.log(chalk.yellow(read_ecount+"<-"+device+'<-:'),chalk.yellow(received_command));
  // }
  //read_ecount=parseInt(read_ecount,10);
  slave_count=read_ecount;
  slave_count=pady(slave_count,8);
  //slave_count = parseInt(slave_count, 16);
  //  console.log("slave_read_ecount is:"+slave_count);
  var read_data=ready.substr(10,ready.length);
  os.logea("en promise_handleEcommand read_data is:"+read_data);
  //exports.handleRoutingNotes(read_data);
  data_length=data_length*2;
  read_data=read_data.substr(0,data_length);
  handler=handler+read_data; //this concant the data lentth and the data itself in order to be able to hableit by pollresponse.
  //ssp.handlepoll(handler);
  if(show_details){
    //console.log("handler es:"+handler);
    console.log(chalk.yellow(read_ecount+"<-"+device+'<-:')+" "+chalk.red(handler));//,chalk.yellow(received_command));
    console.log("-----------------------------------");
  }
    return resolve(handler);
      //reject();

} catch (e) {
  return reject(chalk.red("error 003 en promise_handleEcommand;"+e));
}

  });
}
module.exports.promise_handleEcommand=promise_handleEcommand;
