const db = require('../db');
const DLL = require('../public/DLL');

//SELECT 
async function getAll(){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `SELECT * FROM ContaBancaria WHERE usuario = ${global.user.id}`
    const [rows] = await conn.query(sql,values);
    return rows;
}

//INSERT 
async function Gravar(nome)
{
    const conn = await db.connect();
    const sql =  `INSERT INTO ContaBancaria (usuario,descricao) VALUES (?,?)`;
    const values = [global.user.id,nome]; 
    let result = await conn.query(sql, values);   
    return result[0]
}

//UPDATE
async function Update(id,nome){

    const conn = await db.connect();
    const sql =  `  UPDATE ContaBancaria 
                    SET descricao = ?   
                    WHERE id = ?                     
                    AND usuario = ?`;

    const values = [nome,id,global.user.id];   
    let result = await conn.query(sql, values);   
    return result[0] 
}

//BUSCA ID 
async function getID(descricao){   
    const conn = await db.connect();  
    const values = [descricao,global.user.id]; 

    let sql =  `SELECT id FROM ContaBancaria WHERE descricao = ? AND usuario = ?`
    const [rows] = await conn.query(sql,values);
    return rows[0].id;
}


module.exports = {getAll,Gravar,Update,getID}