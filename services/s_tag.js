const db = require('../db');

//INSERT 
async function Add(id,descricao,tp)
{
    const conn = await db.connect();

    if(tp == 'CREDITO')
    {
        const sql =  `UPDATE Credito 
        SET tag = ?   
        WHERE id = ?                     
        AND usuario = ?`;

        const values = [descricao,id,global.user.id];   
        await conn.query(sql, values); 
    }
    else
    {
        const sql =  `UPDATE Gastos 
        SET tag = ?   
        WHERE id = ?                     
        AND usuario = ?`;

        const values = [descricao,id,global.user.id];   
        await conn.query(sql, values); 
    }
}


//DELETAR 
async function Del(id,tp)
{
    const conn = await db.connect();
    
    if(tp == 'CREDITO')
    {
        const sql =  `UPDATE Credito 
        SET tag = null   
        WHERE id = ?                     
        AND usuario = ?`;

        const values = [id,global.user.id];   
        await conn.query(sql, values); 
    }
    else
    {
        const sql =  `UPDATE Gastos 
        SET tag = null   
        WHERE id = ?                     
        AND usuario = ?`;

        const values = [id,global.user.id];   
        await conn.query(sql, values); 
    }
}

module.exports = {Add,Del}