const db = require('../db');

  //PACOTE [1]=1 MES
  //[2]= 3 MESES
  //[3]=1 ANO

//GERAR LOG DE COMPRA
async function gerarLog(pacote)
{
    const conn = await db.connect();  
  
    const sql =  `INSERT INTO ControleValidade
                  (email,dataSolicitacao,pacote) 
                  VALUES
                  (?,now(),?)`;

    const values = [global.user.email,pacote]; 
    await conn.query(sql, values);
}

module.exports = {gerarLog}