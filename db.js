async function connect()
{       
    if(global.conectado)
    return global.connection
   
   const mysql = require("mysql2/promise");
     
    const connection = await mysql.createConnection(       
        {
        host:'ns847.hostgator.com.br', 
        user:'tornei65_jeanadm',
        password:'PpOoIi876@',
        database: 'tornei65_financeiro'
    });
 
    global.connection = connection;
    global.conectado = true;  
    return connection;
}

module.exports = {connect}