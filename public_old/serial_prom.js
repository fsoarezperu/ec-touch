//
// var is_channel_available = new Promise(
//   function(resolve,reject){
//     if(ready_for_sending){
//       resolve();
//     }else{
//       var reason = new Error('channel is not available yet');
//       reject(reason);
//     }
//   }
//
// );
//
// var send_this=function(){
// is_channel_available
// .then(function(fulfilled){
//   console.log("channel is available send the data");
// })
// .catch(function(error){
//   console.log(error.message);
// })
//
// };
//
// module.exports.send_this=send_this;


function ensureIsSet() {
    return new Promise(function (resolve, reject) {
        (function waitForFoo(){
            if (!ready_for_sending) return resolve();
            setTimeout(waitForFoo, 30);
        })();
    });
}
module.exports.ensureIsSet=ensureIsSet;
