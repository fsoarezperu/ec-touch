//variable que indica el monto de la tranaccion
var pagar=0;
//variable que indica el monto del valor que se ah ingresado a la maquina para cubrir el pago
var depositado=0;
//indica el valor que la maquina tiene que devolver en caso el valor depositado sea mayor que el monto adeudado
var vuelto=depositado-pagar;
//valor que falta cubrir para culminar la Venta
var saldo_pendiente=pagar-depositado;
//valor que la maquina devolvio al culminar la venta o haber sido cancelada
var devuelto=0;
//monto acumulativo de ventas procesadas correctamente
var monto_venta_acumulado=0;
var completado=false;
var uptime_var=0;
//necesario para comunicacion via sockets
var socket = io();
<!-- ///////////////////////////////////////////// -->
<!-- ///////////////////////////////////////////// -->
<!-- ///////////////////////////////////////////// -->
//inicio de ejecucion
$(document).ready(function(){


//    var url = window.location.pathname;
//   alert(url);
//Actualiza valores de las variables de funcionamiento
  calcular();
  //detecta el click en la interface del boton de deposito
  $("#deposito").click( function(){agregar();});
  //detecta el click en la interface del boton de cancelar
  $("#cancelar").click( function(){ cancelar_operacion();});
  //detecta el click en la interface del boton de comprar
  $("#comprar").click( function(){comprar();});
  //detecta el click de send serial data
  $("#burst").click(function(){
    send_serial_command()
  });

  $("#config").click(function(){
  window.location.replace("/configuracion");
  });


//Detecta en mensaje de socket y procede
// socket.on('online', function(){
//       alert("online");
//     });

socket.on('pago', function(msg){
      pagar=msg;
      calcular()
    });
socket.on('cancelar', function(msg){
      completado=false;
      devuelto=depositado;
      vuelto=0;
      pagar=0;
      depositado=0;
      calcular();
      display_message(msg);
    });

socket.on('agregar', function(msg){
     depositado=msg;
     calcular();
     display_message(depositado);
    });

    socket.on('inicializando', function(){
         display_message("inicializando TEBS");
        });

// socket.on('sent_serial', function(msg){
//   //alert("hola");
//   display_message("Comando serial recivido");
//       display_message(msg);
//         });

socket.on('response', function(msg){
 var data
 switch (msg){
   case "01F0": data="OK";
     //display_message(data);
    break;
  case "02F0E8": data="Validator Disabled";
      display_message(data);
    break;
  case "02F0F1": data="Slave Reset";
        display_message(data);
      break;
  case "03F0E7E8": data="Cashbox Removed";
        display_message(data);
      break;
  case "02F0E4": data="Cashbox Replaced";
        display_message(data);
      break;
  case "02F0E7": data="Introducir CashBox";
        display_message(data);
      break;
  case "02F0EC": data="Billete Rechazado";
        display_message(data);
     break;
 case "02F0ED": data="Billete Rechazado";
       display_message(data);
     break;
 case "03F0EF00": data="Validando";
       display_message(data);
     break;
 case "02F0CC": data="Billete Almacenado";
       display_message(data);
     break;
};

// socket.on('probando', function(msg){
//   alert(msg);
//   //display_message(msg);
// });

        });
///////////////////////////////////////////////
});
// fin de document ready function
//////////////////////////////////////////////
//////////////////////////////////////////////

//recalcula los numeros y los actualiza en pantalla.
function calcular(){
  //si el valor depositado es mayor a pagar, el monto de vuelto es la diferencia
  if(depositado>pagar){vuelto=pagar-depositado;}else {vuelto=pagar-depositado;}
  //pone en pantalla el valor de las variables.
  document.getElementById('pagar').innerHTML=pagar;
  document.getElementById('depositado').innerHTML=depositado;
  document.getElementById('vuelto').innerHTML=vuelto;
  document.getElementById('devuelto').innerHTML=devuelto;
  document.getElementById('acumuladox').innerHTML=monto_venta_acumulado;
//si pagar es diferente de cero, es decir es mas que cero.
if(pagar!=0){
  //si pagar es igual a lo depositado significa que se completo la operacion
        if(pagar==depositado){
          //el monto acumulado se suma a lo que ya existia
          monto_venta_acumulado=monto_venta_acumulado+depositado;
          //la variable depositado se resetea
          depositado=0;
          //la variable pagar se resetea
          pagar=0;
          //la variable se setea.
          completado=true;
          //se presenta el mensaje satisfactorio
          display_message("Pago completo, Gracias");
          //se llama a la formula calcular
          calcular();
        }
  //si pagar es igual a cero, se ejecuta la siguiente linea
  }else{
          if(completado==false & devuelto!=0){
            display_message("la maquina esta devoliendo "+ devuelto);
            devuelto=0;
          }
  }
};

//Agrega 1 al valor depositado
 function agregar(){
    depositado=depositado+1;
   // calcular();
   socket.emit('agregar',depositado);
 };
 //agrega 1 al valor pagado
 function comprar(){
   pagar=pagar+1;
   socket.emit('pago',pagar);
   //calcular();
 };
//cancela la operacion de venta y resetea las variables
 function cancelar_operacion(){
    socket.emit('cancelar',"operacion Cancelada");
    // completado=false;
    // devuelto=depositado;
    // vuelto=0;
    // pagar=0;
    // depositado=0;
    // calcular();
  };
//emite una orden de envio de datos seriales
  function send_serial_command(){
    socket.emit('send_command_ssp');
    display_message("Comando serial enviado");
  };

  function display_message(mes_to_display){
    document.getElementById("message").innerHTML=mes_to_display;
  //  $("ol").append("<li>"+mes_to_display+"</li>");
    setTimeout(clear_message,1000);
  };

function clear_message(){
  document.getElementById("message").innerHTML=""
};
