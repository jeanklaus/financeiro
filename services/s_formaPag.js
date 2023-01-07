const db = require('../db');

//SELECT 
async function getAll(){ 

    const conn = await db.connect(); 
    let sql =  `SELECT id,descricao FROM FormaPagamento`
    let [rows] =  await conn.query(sql);
    return rows
}

module.exports = {getAll}