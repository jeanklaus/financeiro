async function connect()
{       
    if(global.conectado)
    return global.connection
   
   const mysql = require("mysql2/promise");
     
   const connection = mysql.createPool({
    host:'ns847.hostgator.com.br', 
    user:'tornei65_jeanadm',
    database: 'tornei65_financeiro',
    password:'PpOoIi876@',
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0
  });
 
    global.connection = connection;
    global.conectado = true;  
    return connection;
}

module.exports = {connect}