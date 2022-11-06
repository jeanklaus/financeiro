const db = require('../db');
const DLL = require('../public/DLL');

//INSERT 
async function Cadastrar(nome,login,senha,email)
{
    const conn = await db.connect();

    const sql =  `INSERT INTO Usuario (nome,login,senha,email,dt_validade) VALUES (?,?,?,?,ADDDATE(now(), INTERVAL 1 MONTH))`;

    const values = [nome,login,senha,email]; 
    let result = await conn.query(sql, values);   
    return result[0]
}


module.exports = {Cadastrar}