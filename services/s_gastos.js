const db = require('../db');
const DLL = require('../public/DLL');
const Credito = require('../services/s_creditos')

//SELECT 
async function getAll(){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `SELECT g.id,g.valor,g.dt_registro,g.dt_vencimento,formaPagamento,m.descricao as motivo,s.descricao as situacao,c.descricao as conta FROM Gastos as g
    INNER JOIN MotivoGastos as m ON m.id = g.motivo
    INNER JOIN SituacaoGastos as s ON s.id = g.situacao
    INNER JOIN ContaBancaria as c ON c.id = g.contaBancaria
    WHERE g.usuario = ${global.user.id}`
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

//SELECT  FILTROS
async function getAll_Filtros(filtro){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `SELECT g.id,g.valor,g.dt_registro,g.dt_vencimento,formaPagamento,m.descricao as motivo,s.descricao as situacao,c.descricao as conta FROM Gastos as g
    INNER JOIN MotivoGastos as m ON m.id = g.motivo
    INNER JOIN SituacaoGastos as s ON s.id = g.situacao
    INNER JOIN ContaBancaria as c ON c.id = g.contaBancaria
    WHERE ${filtro} AND g.usuario = ${global.user.id}`
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

//GRAVAR
async function Gravar(valor,dt_registro,dt_vencimento,formaPagamento,motivo,situacao,contaBancaria,inAnoTodo)
{
    let data = new Date(); 
    let mes = data.getMonth() + 1;
    let dia = DLL.getPedacoData(dt_vencimento,"DIA")
    let ano = DLL.getPedacoData(dt_vencimento,"ANO")

    const conn = await db.connect();  

    const sql =  `INSERT INTO Gastos
    (usuario,valor,dt_registro,dt_vencimento,formaPagamento,motivo,situacao,contaBancaria) 
    VALUES (?,?,?,?,?,?,?,?)`;

    const values = [global.user.id,valor,dt_registro,dt_vencimento,formaPagamento,motivo,situacao,contaBancaria]; 
    await conn.query(sql, values);

    if(inAnoTodo)    
    {
        for(let i = (mes + 1);i <= 12;i++)
        {
            const values = [global.user.id,valor,null,`${ano}-${i}-${dia}`,formaPagamento,motivo,1,contaBancaria]; 
            await conn.query(sql, values);
        }
    }
}

//BUSCA GASTO PELO ID
async function getGastoID(id){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `SELECT g.id,g.valor,g.dt_registro,g.dt_vencimento,formaPagamento,m.descricao as motivo,s.descricao as situacao,c.descricao as conta FROM Gastos as g
    INNER JOIN MotivoGastos as m ON m.id = g.motivo
    INNER JOIN SituacaoGastos as s ON s.id = g.situacao
    INNER JOIN ContaBancaria as c ON c.id = g.contaBancaria
    WHERE g.usuario = ${global.user.id}
    AND g.id = ${id}`
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
   
    return newrows[0]; 
}

//PAGAR GASTO
async function Pagar(id,valor){

    const conn = await db.connect();

    const sql =  `  UPDATE Gastos 
                    SET situacao = 3,
                    dt_registro = now()
                    WHERE id = ?
                    AND usuario = ?`;

    const values = [id,global.user.id];   
    await conn.query(sql, values); 

    await Credito.DiminuiSaldo(valor);
}

module.exports = {getAll,getAll_Filtros,Gravar,getGastoID,Pagar}


