const db = require('../db');
const DLL = require('../public/DLL');
const Gastos = require('../services/s_gastos')

let SELECT_GERAL = `SELECT g.id,g.valor,g.dt_registro,g.dt_vencimento,formaPagamento,m.descricao as motivo,s.descricao as situacao,c.descricao as conta,inOrcamentario,parcela,inFatura 
FROM Fatura as f
INNER JOIN Gastos as g ON f.idGasto = g.id
INNER JOIN MotivoGastos as m ON m.id = g.motivo
INNER JOIN SituacaoGastos as s ON s.id = g.situacao
INNER JOIN ContaBancaria as c ON c.id = g.contaBancaria`;


//SELECT 
async function getAll(){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `${SELECT_GERAL}
    WHERE g.usuario = ${global.user.id}
    AND g.inFatura = 1
    AND (SELECT MONTH(g.dt_vencimento)) = (SELECT MONTH(now())) 
    AND g.situacao != 3
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

//ADD GASTO NA FATURA 
async function Pagar()
{
    let fatura = await getAll()
   
    fatura.forEach(async gasto => {
       await Gastos.Pagar(gasto.id,parseFloat(gasto.valor));
    });
}

module.exports = {getAll,AddGasto,Pagar}