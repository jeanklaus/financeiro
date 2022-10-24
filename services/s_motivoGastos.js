const db = require('../db');
const DLL = require('../public/DLL');

//SELECT 
async function getAll(){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `SELECT * FROM MotivoGastos WHERE usuario = ${global.user.id}`
    const [rows] = await conn.query(sql,values);
    return rows;
}

//INSERT 
async function Gravar(nome)
{
    const conn = await db.connect();
    const sql =  `INSERT INTO MotivoGastos (usuario,descricao) VALUES (?,?)`;
    const values = [global.user.id,nome]; 
    let result = await conn.query(sql, values);   
    return result[0]
}

//UPDATE
async function Update(id,nome){

    const conn = await db.connect();
    const sql =  `  UPDATE MotivoGastos 
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

    let sql =  `SELECT id FROM MotivoGastos WHERE descricao = ? AND usuario = ?`
    const [rows] = await conn.query(sql,values);
    return rows[0].id;
}

//DELETAR 
async function Del(id)
{
    const conn = await db.connect();
    let sql =  `DELETE FROM Gastos WHERE motivo = ? AND usuario = ?`;

    const values = [id,global.user.id];
    await conn.query(sql, values);

    sql =  `DELETE FROM MotivoGastos WHERE id = ? AND usuario = ?`;
    await conn.query(sql, values);
}



module.exports = {getAll,Gravar,Update,getID,Del}