const db = require('../db');
const DLL = require('../public/DLL');
const Gastos = require('../services/s_gastos')
const ContaBancaria = require('../services/s_contaBancaria')

let SELECT_GERAL = `SELECT f.id,c.descricao as conta,mes,ano,inPaga as Situacao,dt_pagamento
FROM Fatura as f
INNER JOIN ContaBancaria as c ON c.id = f.conta`;

async function getAll(){ 
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `${SELECT_GERAL}
    WHERE f.usuario = ?
    ORDER BY f.ano,f.mes`
    const [rows] = await conn.query(sql,values);
   
    let newrows = rows.map(registro => {
        if(registro.dt_pagamento)
        {
            registro.dt_pagamento = DLL.formataData(registro.dt_pagamento);
        } 

        if(registro.Situacao == 0)
        {
            registro.Situacao = "PENDENTE"
        } 
        else if(registro.Situacao == 1)
        {
            registro.Situacao = "PAGO"
        } 
      
        return registro;
    });
   
    return newrows; 
}

//SELECT 
async function get(conta,data){ 

    let [ano,mes] = data.split('-')

    const conn = await db.connect();  
    const values = [global.user.id,conta,mes,ano]; 

    let sql =  `${SELECT_GERAL}
    WHERE f.usuario = ?
    AND c.id = ? 
    AND f.mes = ?
    AND f.ano = ?
    ORDER BY f.ano,f.mes`
    const [rows] = await conn.query(sql,values);
   
    let newrows = rows.map(registro => {
        if(registro.dt_pagamento)
        {
            registro.dt_pagamento = DLL.formataData(registro.dt_pagamento);
        } 

        if(registro.Situacao == 0)
        {
            registro.Situacao = "PENDENTE"
        } 
        else if(registro.Situacao == 1)
        {
            registro.Situacao = "PAGO"
        } 
      
        return registro;
    });
   
    return newrows; 
}

//SELECT 
async function getAllFiltros(filtros){ 

    const conn = await db.connect(); 

    let sql =  `${SELECT_GERAL}
    WHERE ${filtros}
    ORDER BY f.ano,f.mes`
    const [rows] = await conn.query(sql);
   
    let newrows = rows.map(registro => {
        if(registro.dt_pagamento)
        {
            registro.dt_pagamento = DLL.formataData(registro.dt_pagamento);
        } 

        if(registro.Situacao == 0)
        {
            registro.Situacao = "PENDENTE"
        } 
        else if(registro.Situacao == 1)
        {
            registro.Situacao = "PAGO"
        } 
      
        return registro;
    });
   
    return newrows; 
}

//ADD GASTO NA FATURA 
async function AddGasto(gasto,mes,ano,conta)
{
    const conn = await db.connect();
    let sql = ""
    let values = []
    let idFatura = 0;
    let idConta = await ContaBancaria.getID(conta);

    sql =  `SELECT * FROM Fatura WHERE mes = ? AND ano = ? AND usuario = ? AND conta = ?`;
    values = [mes,ano,global.user.id,idConta];
    let [rows] = await conn.query(sql, values);
   
    console.log(rows)

    if(rows.length > 0)//ACHO
    {
        idFatura = rows[0].id
    }
    else
    {
        sql =  `INSERT INTO  Fatura (usuario,conta,mes,ano) VALUES (?,?,?,?)`;
        values = [global.user.id,idConta,mes,ano];
        await conn.query(sql, values);

        idFatura = await getIdFatura(mes,ano,idConta);
    }

    sql =  `INSERT INTO ItemFatura (fatura,gasto,usuario) VALUES (?,?,?)`;
    values = [idFatura,gasto,global.user.id];
    await conn.query(sql, values); 

    sql =  `  UPDATE Gastos 
    SET inFatura = 1   
    WHERE id = ?                     
    AND usuario = ?`;

    values = [gasto,global.user.id];
    await conn.query(sql, values); 
}

async function getIdFatura(mes,ano,conta)
{ 
    const conn = await db.connect();  
    const values = [global.user.id,mes,ano,conta]; 

    let sql =  `SELECT id FROM Fatura
    WHERE usuario = ?
    AND mes = ? 
    AND ano = ?
    AND conta = ?`
    const [rows] = await conn.query(sql,values);
   
   return rows[0].id
}

async function Pagar(fatura)
{
    const conn = await db.connect();

    let itemsFatura = await getItemsFatura(fatura);

    itemsFatura.forEach(async obj => {     
       await Gastos.Pagar(obj.gasto,parseFloat(obj.valor));
    });

    let sql =  `UPDATE Fatura 
                SET inPaga = 1,
                dt_pagamento = now()
                WHERE id = ?`;
    const values = [fatura];
    await conn.query(sql, values); 
}

//REMOVER
async function Remover(fatura,gasto)
{
    const conn = await db.connect();

    let sql =  `DELETE FROM ItemFatura WHERE fatura = ? AND gasto = ? AND usuario = ?`;
    let values = [fatura,gasto,global.user.id];
    await conn.query(sql, values); 


    values = [gasto,global.user.id];
    sql =  `  UPDATE Gastos 
    SET inFatura = 0  
    WHERE id = ?                     
    AND usuario = ?`;

    await conn.query(sql, values); 
}

async function getItemsFatura(fatura){ 

    const conn = await db.connect();  
    const values = [fatura]; 

    let sql =  `SELECT i.fatura as fatura,i.gasto,m.descricao as motivo,g.valor,s.descricao as situacao
    FROM ItemFatura i
    INNER JOIN Gastos g ON g.id = i.gasto
    INNER JOIN MotivoGastos m ON m.id = g.motivo
    INNER JOIN SituacaoGastos s ON s.id = g.situacao
    WHERE i.fatura = ?`

    const [rows] = await conn.query(sql,values);
    return rows; 
}

module.exports = {get,AddGasto,getAll,getItemsFatura,getAllFiltros,Remover,Pagar}