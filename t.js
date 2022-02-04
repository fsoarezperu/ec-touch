const SerialPort = require('serialport')

SerialPort.list().then(ports=>console.log(ports), err=>console.log(err))
