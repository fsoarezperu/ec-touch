const os = require('./it/os');
const chalk=require('chalk');
const mysql= require('mysql');
const { promisify }= require('util');
const { database }= require('./keys');
const pool=mysql.createPool(database);

pool.getConnection((err,connection)=>{
if(err){
  if(err.code === 'PROTOCOL_CONNECTION_LOST'){
    console.log('DATABASE CONNECTION WAS CLOSED');
  }
  if(err.code === 'ER_CON_COUNT_ERROR'){
    console.log('DATABASE HAS TO MANY CONNECTIONS');
  }
  if(err.code === 'ERCONNREFUSED'){
    console.log('DATABASE CONNECTIO WAS REFUSED');
  }

}

  if(connection) connection.release();
  os.logea(chalk.green('DB is conected'));
  return;
});

//promisify pool querys
pool.query=promisify(pool.query)

module.exports=pool;
