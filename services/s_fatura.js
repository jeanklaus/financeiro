const db = require('../db');
const DLL = require('../public/DLL');
const Gastos = require('../services/s_gastos')

let SELECT_GERAL = `SELECT g.id,g.valor,m.descricao as motivo,c.descricao as conta,(SELECT MONTH(g.dt_vencimento)) as mes,(SELECT YEAR(g.dt_vencimento)) as ano
FROM Fatura as f
INNER JOIN Gastos as g ON f.idGasto = g.id
INNER JOIN MotivoGastos as m ON m.id = g.motivo
INNER JOIN ContaBancaria as c ON c.id = g.contaBancaria`;

//SELECT 
async function get(conta,data){ 

    const conn = await db.connect();  
    const values = [global.user.id,conta]; 

    let sql =  `${SELECT_GERAL}
    WHERE g.usuario = ?
    AND g.inFatura = 1   
    AND g.situacao != 3
    AND c.id = ? 
    AND g.dt_vencimento >= '${data}-01'
    AND g.dt_vencimento <= '${data}-31'
    ORDER BY g.dt_vencimento`
    const [rows] = await conn.query(sql,values);
   
    let newrows = rows.map(registro => {
        if(registro.dt_registro)
        {
            registro.dt_registro = DLL.formataData(registro.dt_registro);
        }      
        registro.dt_vencimento = DLL.formataData(registro.dt_vencimento);
        registro.valor = parseFloat(registro.valor).toFixed(2);
        return registro;
    });
   
    return newrows; 
}

//ADD GASTO NA FATURA 
async function AddGasto(gasto)
{
    const conn = await db.connect();

    let sql =  `INSERT INTO Fatura (idGasto,usuario) VALUES (?,?)`;
    const values = [gasto,global.user.id];
    await conn.query(sql, values); 

    sql =  `  UPDATE Gastos 
    SET inFatura = 1   
    WHERE id = ?                     
    AND usuario = ?`;

    await conn.query(sql, values); 
}


async function Pagar(fatura)
{
    const conn = await db.connect();

    fatura.forEach(async gasto => {
       await Gastos.Pagar(gasto.id,parseFloat(gasto.valor));

       let sql =  `DELETE FROM Fatura WHERE idGasto = ? AND usuario = ?`;
       const values = [gasto.id,global.user.id];
       await conn.query(sql, values); 
    });
}

//REMOVER
async function Remover(gasto)
{
    const conn = await db.connect();

    let sql =  `DELETE FROM Fatura WHERE idGasto = ? AND usuario = ?`;
    const values = [gasto,global.user.id];
    await conn.query(sql, values); 

    sql =  `  UPDATE Gastos 
    SET inFatura = 0  
    WHERE id = ?                     
    AND usuario = ?`;

    await conn.query(sql, values); 
}

module.exports = {get,AddGasto,Pagar,Remover}