// class Rectangulo {
//   constructor(alto, ancho) {
//     this.alto = alto;
//     this.ancho = ancho;
//   }
// };
const chalk = require('chalk');

function  Rectangulo(value){
  return value*2;
}
exports.Rectangulo = Rectangulo;






function  compara_array_y_devuelve_lo_que_falta_enviar(array_local,array_tbm){
  var to_synch=[];
  console.log("aaray local length:"+array_local.length);
  for (var i = 0; i < array_local.length; i++) {
    //coge el primer item de local,
    console.log(array_local[i]);
    var primer_digito=array_local[i];
      console.log("primer_digito:"+primer_digito);
    //copmparalao con cada uno de los itemes en tbm
 for (var e = 0; e < array_tbm.length; e++) {
   console.log("aaray tbm length:"+array_tbm.length);
   var segundo_digito=array_tbm[e];
     console.log("segundo_digito:"+segundo_digito);
       console.log("verificando item:"+e+" en tbm:"+  array_tbm[e]);
      if (primer_digito==array_tbm[e]) {
        console.log(chalk.green("se detecto igualdad y se debe de eliminar el campo:"+primer_digito));
      //  array_local.splice(array_local[i],array_local[i]+1);
        to_synch.push(segundo_digito);
        console.log("deleted from array local");
      }else {
        console.log("no se detecto igualdad, se deja aqui");
      //  to_synch.push(segundo_digito);
      }
//       if (primer_digito==array_tbm.length) {
//           return;
//       }
//     //  return;
if (segundo_digito==array_tbm.length) {
    continue;
}
}
    //si se detecta igualdad, se elimina de local.
    //si no se detecta igualdad, se pasa al siguiente.
    if (primer_digito==array_local.length) {
        continue;
    }

  }
  var result=arr_diff()
  return to_synch;
}
exports.compara_array_y_devuelve_lo_que_falta_enviar = compara_array_y_devuelve_lo_que_falta_enviar;
