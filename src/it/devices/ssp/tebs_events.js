const os = require('./../../os');
const ssp = require('./../../ssp');


async function handle_evento(poll_event_array_response){
  return new Promise(function(resolve, reject) {
    try {
      var result="evento_manejado correctamente:"+poll_event_array_response;
      var poll_responde=poll_event_array_response.match(/.{1,2}/g);
    //    console.log("data despues de match:"+new_data);
      var data_length_on_pool=parseInt(ssp.hex_to_dec(poll_responde[0]));
      data_length_on_pool=(data_length_on_pool+1);
      poll_responde=poll_responde.slice(0,data_length_on_pool);
    //    console.log("data length on pool data:"+data_length_on_pool);
      if(poll_responde == undefined || poll_responde.length < 1){
        console.log("ERROR Receiving data");
        return reject("ERROR Receiving data 001");
        }else{
          os.logea_a_client_side("poll_responde:");
          os.logea_a_client_side(poll_responde);
          resolve(result);
      }
      // setTimeout(function () {
      //
      // }, 1000);

    } catch (e) {
      console.log(e.message);
    } finally {
      return
    }

  });
}
 module.exports.handle_evento=handle_evento;
//funcion crea manejador_de_eventos(slave_reset[0xF1]);
//funcion crea manejador_de_eventos(read[0xEF]);
//funcion crea manejador_de_eventos(note_credit[0xEE]);

//funcion crea_manejador_de_eventos(codigo_de_evento,objeto_de_instruccion);
var codigo_de_evento="[0x01]";

 var objecto_de_instruccion={
   F0:"console.log('todo ok'); return resolve('OK')",
   F1:"return reject('error will be handled appropriately')"
 }
module.exports.objecto_de_instruccion=objecto_de_instruccion;

 var lista_de_eventos={
   slave_reset:0xF1,
   read:0xEF,
   note_credit:0xEE,
   rejecting:0xED,
   rejected:0xEC,
   staking:0xCC,
   staked:0xEB,
   unsafe_jam:0xE9,
   disabled:0xE8,
   fraud_attempt:0xE6,
   stacker_full:0xE7,
   note_cleared_from_front:0xE1,
   note_cleared_into_cashbox:0xE2,
   cashbox_removed:0xE3,
   cashbox_replaced:0xE4,
   barcode_ticked_validated:0xE5,
   barcode_ticket_ack:0xD1,
   note_path_open:0xE0,
   channel_disable:0xB5,
   initializing:0xB6,
   ticket_printing:0xA5,
   ticket_printed:0xA6,
   ticket_printing_error:0xA8,
   print_halted:0xAE,
   ticket_in_bezel:0xAD,
   printed_to_cashbox:0xAF
 }
module.exports.lista_de_eventos=lista_de_eventos;

 var lista_de_ordenes={
   0xF1:"slave_reset",
   0xEF:"read",
   0xEE:"note_credit",
   0xED:"rejecting",
   0xEC:"rejected",
   0xCC:"staking",
   0xEB:"staked",
   0xE9:"unsafe_jam",
   0xE8:"disabled",
   0xE6:"fraud_attempt",
   0xE7:"stacker_full",
   0xE1:"note_cleared_from_front",
   0xE2:"note_cleared_into_cashbox",
   0xE3:"cashbox_removed",
   0xE4:"cashbox_replaced",
   0xE5:"barcode_ticked_validated",
   0xD1:"barcode_ticket_ack",
   0xE0:"note_path_open",
   0xB5:"channel_disable",
   0xB6:"initializing",
   0xA5:"ticket_printing",
   0xA6:"ticket_printed",
   0xA8:"ticket_printing_error",
   0xAE:"print_halted",
   0xAD:"ticket_in_bezel",
   0xAF:"printed_to_cashbox"
 }
 module.exports.lista_de_ordenes=lista_de_ordenes;
