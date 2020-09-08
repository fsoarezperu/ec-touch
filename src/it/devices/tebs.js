function start_tebs_validator() {
  logea("/////////////////////////////////");
  console.log("Startup Initiated");
  //cleaRING COUNT FOR ENCRIPTION;
  it.zerox = false;
  ecount = "00000000";
  sync_and_stablish_presence_of_validator();
};
module.exports.start_tebs_validator = start_tebs_validator;
/////////////////////////////////////////////////////////
function sync_and_stablish_presence_of_validator() {
  logea("/////////////////////////////////");
  //console.log("//////////////////////////////////////////");
  console.log("sync_and_stablish_presence_of_validator");
  logea("/////////////////////////////////");
  console.log("SYNCH command sent");
  it.envio_redundante(synch) //<------------------------------ synch
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handlesynch(data);
      logea("/////////////////////////////////");
      console.log("SYNCH command sent");
      return it.envio_redundante(synch) //<--------------------- synch
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handlesynch(data);
      logea("/////////////////////////////////");
      console.log("SYNCH command sent");
      return it.envio_redundante(synch) //<--------------------- synch
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handlesynch(data);
      logea("/////////////////////////////////");
      console.log("POLL command sent");
      return it.envio_redundante(poll) //<--------------------- poll
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      return it.handlepoll2(data);
    })
    .then(data => {
      //logea(chalk.yellow('<-:'),chalk.yellow(data));
      negociate_encryption();
    })
    .catch(error => sp.retrial(error))
};
/////////////////////////////////////////////////////////
function negociate_encryption() {
  encryptionStatus = false;
  logea("/////////////////////////////////");
  console.log("SYNCH command sent");
  it.envio_redundante(synch) //<---------------------------------- synch
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handlesynch(data);
      it.getkeys();
      var setGenerator = it.set_generator_();
      logea("/////////////////////////////////");
      console.log("SET GENERATOR command sent");
      return it.envio_redundante(setGenerator) //<------------------ setGenerator
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handleSetgenerator(data);
      var setModulus = it.set_modulus();
      logea("/////////////////////////////////");
      console.log("SET MODULUS command sent");
      return it.envio_redundante(setModulus) //<--------------------- setModulus
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handleSetmodulus(data);
      var rKE = it.send_request_key_exchange();
      logea("/////////////////////////////////");
      console.log("Request Key Exchange command sent");
      return it.envio_redundante(rKE) //<--------------------------- REquest key exchange
      //
      //polly();
      //   setTimeout(()=>{
      //   console.log(chalk.red("//////////// ALL OVER AGAIN /////////////////////"));
      //   console.log(chalk.red("//////////// ALL OVER AGAIN /////////////////////"));
      //   console.log(chalk.red("//////////// ALL OVER AGAIN /////////////////////"));
      //   sync_and_stablish_presence_of_validator();
      // },500);
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      return it.handleRKE(data)
    })
    .then(data => {
      logea(chalk.green('KEY:'), chalk.green(data));
      console.log(chalk.green("KEY CALCULATED SUCCESFULLY"));
      logea("/////////////////////////////////");
      console.log("POLL command sent");
      return it.envio_redundante(poll) //<--------------------- poll
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      return it.handlepoll2(data);
    })
    .then(data => {
      //logea(chalk.yellow('<-:'),chalk.yellow(data));
      logea("/////////////////////////////////");
      set_protocol_version();
      // polly();
    })
    .catch(error => sp.retrial(error))
};
/////////////////////////////////////////////////////////
//apparenttly for testing purposes
function polly() {
  setTimeout(() => {
    console.log(chalk.red("//////////// ALL OVER AGAIN /////////////////////"));
    console.log(chalk.red("//////////// ALL OVER AGAIN /////////////////////"));
    console.log(chalk.red("//////////// ALL OVER AGAIN /////////////////////"));
    start_tebs_validator();
  }, 20);
};
/////////////////////////////////////////////////////////
function set_protocol_version() {
  console.log("set_protocol_version");
  it.envio_redundante(host_protocol_version) //<--------------------- host_protocol_version
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handleprotocolversion(data);
      logea("/////////////////////////////////");
      setup_request_command()
    })
  //  .catch(error => it.retrial(error))

};
/////////////////////////////////////////////////////////
function setup_request_command() {
  console.log("setup_request sent");
  it.envio_redundante(setup_request) //<---- setup_request
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handlesetuprequest(data);
      logea("/////////////////////////////////");
      console.log("get_serial_number sent");
      return it.envio_redundante(get_serial_number) //<-------- get_serial_number
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handleGetSerialNumber(data);
      return it.envio_redundante(poll) //<----------- poll
      logea("/////////////////////////////////");
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handlepoll(data);
      logea("/////////////////////////////////");
      if (note_validator_type == "TEBS+Payout") {
        set_routing();
      }
      if (note_validator_type == "NV200 Spectral") {
        set_channel_inhivits();
      }
      //safepool();
    })
  //  .catch(error => it.retrial(error))

};
/////////////////////////////////////////////////////////
function safepool() {
  console.log("safepoll command sent");
  var toSend = it.prepare_Encryption(poll); //<--------------------- send_10_soles_a_cashbag
  //console.log("luego del proceso de encryptacion:"+toSend);
  it.envio_redundante(toSend)
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      //  it.handlepoll(data);
      // console.log("data rec on server:"+data);
      it.handleEcommand(data);
      logea("/////////////////////////////////"); /////////////////////////////");
      setTimeout(safepool, 800); //auto renew the poll trigger;
    })
  //    .catch(error => it.retrial(error))
  //setTimeout(safepool,800); //auto renew the poll trigger;
};
/////////////////////////////////////////////////////////
function set_routing() {
  console.log("ROUTING NOTES");
  console.log("send_10_soles_a_cashbag");
  var toSend = it.prepare_Encryption(send_10_soles_a_cashbag); //<--------------------- send_10_soles_a_cashbag
  //console.log("luego del proceso de encryptacion:"+toSend);
  it.envio_redundante(toSend)
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handleEcommand(data);
      logea("/////////////////////////////////");

      console.log("send_20_soles_a_payout");
      toSend = it.prepare_Encryption(send_20_soles_a_payout); //<--------------------- send_50_soles_a_payout
      return it.envio_redundante(toSend)
      // var toSend2="";
      // toSend2=it.prepare_Encryption(send_20_soles_a_payout);//<--------------------- send_20_soles_a_payout
      // console.log("luego del proceso de encryptacion:"+toSend2);
      // return it.envio_redundante(toSend2)
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      //it.handleRoutingNotes(data);
      it.handleEcommand(data);
      logea("/////////////////////////////////");
      console.log("send_50_soles_a_payout");
      toSend = it.prepare_Encryption(send_50_soles_a_payout); //<--------------------- send_50_soles_a_payout
      return it.envio_redundante(toSend)
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      //it.handleRoutingNotes(data);
      it.handleEcommand(data);
      logea("/////////////////////////////////");
      console.log("send_100_soles_a_payout");
      toSend = it.prepare_Encryption(send_100_soles_a_payout); //<--------------------- send_50_soles_a_payout
      return it.envio_redundante(toSend)

      // return it.mandaEncrypted(send_100_soles_a_cashbag)//<--------------------- send_100_soles_a_cashbag

      //console.log("/////////////////////////////////");
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      // it.handleRoutingNotes(data);
      it.handleEcommand(data);

      logea("/////////////////////////////////");
      console.log("send_200_soles_a_cashbag");
      toSend = it.prepare_Encryption(send_200_soles_a_cashbag); //<--------------------- send_50_soles_a_payout
      return it.envio_redundante(toSend)
      // return it.mandaEncrypted(send_200_soles_a_cashbag)//<--------------------- send_200_soles_a_cashbag
      // console.log("/////////////////////////////////");
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      //    it.handleRoutingNotes(data);
      it.handleEcommand(data);
      logea("/////////////////////////////////");
      enable_payoutx();
      // set_channel_inhivits();
    })
    .catch(error => it.retrial(error))
  //  enable_payout();
};
/////////////////////////////////////////////////////////
function enable_payoutx() {
  //var enable_payout= [0x02, 0x5C, 0x01];
  //var desable_payout= [0x01, 0x5B];
  console.log("/////////////////////////////////");
  console.log("Enable PAYOUT");
  // console.log("enable_payout:"+enable_payout);
  toSend = it.prepare_Encryption(enable_payout); //<--------------------- send_10_soles_a_cashbag
  // console.log("luego del proceso de encryptacion:"+toSend);
  it.envio_redundante(toSend)
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      //it.handleRoutingNotes(data);

      it.handleEcommand(data);
      logea("/////////////////////////////////");
      //  set_routing();
      set_channel_inhivits();
    })
  //  .catch(error => it.retrial(error))

};
/////////////////////////////////////////////////////////
function set_channel_inhivits() {
  console.log("set_inhivits sent");
  it.envio_redundante(set_inhivits) //<--------------------- set_inhivits
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handleSetInhivits(data);
      logea("/////////////////////////////////");
      return it.envio_redundante(get_tebs_barcode) //<--------------------- set_inhivits
      //  enable_validator()
    })
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handleGetTebsBarcode(data);
      logea("/////////////////////////////////");
      console.log(note_validator_type);
      // if(note_validator_type=="NV200 Spectral"){
      //
      //   //enable_validator();
      //   poll_loop();
      // }
      //   enable_payout();
      ///////////////////////////////////////////////////////
      on_startup = false;
      //console.log("indica que ya no esta en startup");
      console.log("Listo...");
      /////////////////////////////////////////////////////
      io.emit('location_reload');
      it.enable_sending();
      poll_loop(); //esto tiene que descomentarse para que sea utilizado por remesa nueva.
      //        enable_validator() //bypass the enable until a new remesa has begun.
    })
  //   .catch(error => it.retrial(error))

};
/////////////////////////////////////////////////////////
function enable_validator() {
  console.log("Enabling Validator");
  it.envio_redundante(enable) //<--------------------- enable
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handlepoll(data);
      console.log(chalk.green("validator is enabled"));
      logea("/////////////////////////////////"); /////////////////////////////");
      poll_loop();
    })
  //    .catch(error => it.retrial(error))

};
/////////////////////////////////////////////////////////
function poll_loop() {
  it.ensureIsSet().then(async function() {
    //  io.emit('system_running_indicator'); //indica el punto intermitente en interface para notar que el programa esta corriendo adecuadamente.
      //  io.emit('tog_validator');

      if (ready_for_sending) {
          logea(chalk.green('ready for sending is:'),chalk.green(ready_for_sending));
        if (ready_for_pooling) {
           logea(chalk.cyan('ready for pooling is:'),chalk.green(ready_for_pooling));
          console.log(chalk.magentaBright("POLL command sent"));
          // logea(chalk.magentaBright('POLL command sent'));
          clearTimeout(timer2);
          return it.envio_redundante(poll) //<--------------------- poll
            .then(data => {
              logea(chalk.yellow('<-:'), chalk.yellow(data));
              it.handlepoll(data);
              logea("/////////////////////////////////");
              setTimeout(poll_loop, 300); //auto renew the poll trigger;
            })
            .catch(error => {
              console.log(error);
              console.log("error externo");
            })
        } else {
          console.log("poll 1 disabled");
          //  ready_for_pooling=true; // este lo calmbie al ultimo billete perdido
        } // end of if
      } else {
        console.log("ready for sending is off");
      }
      global.polltimer = setTimeout(poll_loop, 300); //auto renew the poll trigger;
    }) //fin del promise
    .catch(error => console.log(error))
};
/////////////////////////////////////////////////////////
function poll_loop2() {
  // it.ensureIsSet().then(async function(){
  //       io.emit('ping');//indica el punto intermitente en interface para notar que el programa esta corriendo adecuadamente.
  //           if(ready_for_sending){
  //             logea(chalk.green('ready for sending is:'),chalk.green(ready_for_sending));
  //                       if(ready_for_pooling){
  //                          logea(chalk.green('ready for pooling is:'),chalk.green(ready_for_pooling));
  //                             console.log(chalk.magentaBright("POLL command sent"));
  //                             // logea(chalk.magentaBright('POLL command sent'));
  //                             return
  it.envio_redundante(poll) //<--------------------- poll
    .then(data => {
      logea(chalk.yellow('<-:'), chalk.yellow(data));
      it.handlepoll(data);
      //                             logea("/////////////////////////////////");
      setTimeout(poll_loop2, 200); //auto renew the poll trigger;
    })
  //                             .catch(error => console.log(error))
  //                       }else{
  //                       //console.log("poll disabled");
  //                       ready_for_pooling=true;
  //                       }// end of if
  //             }else{
  //               console.log("ready for sending is off");
  //             }
  //      global.polltimer=setTimeout(poll_loop,800); //auto renew the poll trigger;
  // })//fin del promise
};
/////////////////////////////////////////////////////////
