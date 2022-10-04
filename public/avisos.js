const db = require('../db');

async function Viu()
{
    const conn = await db.connect();

    let sql = `SELECT msg,visualizado FROM tbl_avisos`;   
    let [row] =  await conn.query(sql); 
    
    if(row.length > 0 )
    {
        return [row[0].visualizado,row[0].msg.split('|')];
    }
    else
    {
        return [true,[]];
    }
}

async function AtualizaVizualizacao()
{
    const conn = await db.connect();
    let sql = `UPDATE  tbl_avisos set visualizado = 1`; 
    await conn.query(sql); 
}

module.exports = {Viu,AtualizaVizualizacao}