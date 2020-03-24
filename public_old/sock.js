const {Router}=require('express');
const router=Router();
const path=require('path');
const io=require('./server.js');

router.get('/',(req,res)=>{
  res.sendFile(__dirname+'/sock.html');
  setTimeout(tick,1000);
});


const tick=function(){
//  console.log("tick");
  io.io.emit('sock',"lo emitio sock.js");
  setTimeout(function(){io.io.emit('anuncio_diferido',"anuncio_diferido")},2000);

}



module.exports=router;
