const db = require('../db');
const DLL = require('../public/DLL');
const Credito = require('../services/s_creditos')
const ContaB = require('../services/s_contaBancaria')
const MotivosGastos = require('../services/s_motivoGastos')

//SITUAÇÃO 
//[1]= PENDENTE
//[2]=ATRASADO
//[3]=PAGO
//[4]=ORCAMENTO

let SELECT_GERAL = `SELECT g.id,g.valor,g.dt_registro,g.dt_vencimento,formaPagamento,m.descricao as motivo,s.descricao as situacao,
c.descricao as conta,inOrcamentario,parcela,inFatura,(SELECT YEAR(g.dt_vencimento)) as ano ,(SELECT MONTH(g.dt_vencimento)) as mes,tag
FROM Gastos as g
INNER JOIN MotivoGastos as m ON m.id = g.motivo
INNER JOIN SituacaoGastos as s ON s.id = g.situacao
INNER JOIN ContaBancaria as c ON c.id = g.contaBancaria`;


//SELECT 
async function getAll(){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `${SELECT_GERAL}
    WHERE g.usuario = ${global.user.id}
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

//SELECT  FILTROS
async function getAll_Filtros(filtro){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `${SELECT_GERAL}
    WHERE ${filtro} AND g.usuario = ${global.user.id}
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

//SELECT RESUMO DO ANO
async function getResumoAno(){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `SELECT m.id,SUM(g.valor) as valor,(SELECT MONTH(g.dt_vencimento)) as mes,(SELECT YEAR(g.dt_vencimento)) as ano,m.descricao as motivo,inOrcamentario,g.situacao
    FROM Gastos as g
    INNER JOIN MotivoGastos as m ON m.id = g.motivo
    WHERE g.usuario = ?
    GROUP BY motivo,mes,ano`
    const [rows] = await conn.query(sql,values);

    let newrows = rows.map(registro => {        
        registro.valor = parseFloat(registro.valor).toFixed(2);
        return registro;
    });
   
    return newrows; 
}

//GRAVAR
async function Gravar(valor,dt_registro,dt_vencimento,formaPagamento,motivo,situacao,contaBancaria,inAnoTodo,inFatura,tag)
{
    let inFaturaBd = 0;

    if(inFatura)
    {
        inFaturaBd = 1
    }
  
    let mes = parseInt(DLL.getPedacoData(dt_vencimento,"MES"))
    let dia = DLL.getPedacoData(dt_vencimento,"DIA")
    let ano = DLL.getPedacoData(dt_vencimento,"ANO")

    const conn = await db.connect(); 

    const sql =  `INSERT INTO Gastos
    (usuario,valor,dt_registro,dt_vencimento,formaPagamento,motivo,situacao,contaBancaria,inFatura,tag) 
    VALUES (?,?,?,?,?,?,?,?,?,?)`;

    const values = [global.user.id,valor,dt_registro,dt_vencimento,formaPagamento,motivo,situacao,contaBancaria,inFaturaBd,tag]; 
    await conn.query(sql, values);

    if(inAnoTodo)    
    {
        for(let i = (mes + 1);i <= 12;i++)
        {
            const values = [global.user.id,valor,null,`${ano}-${i}-${dia}`,formaPagamento,motivo,1,contaBancaria,inFaturaBd,tag]; 
            await conn.query(sql, values);
        }
    }
}

//ORCAMENTO
async function GravarOrcamento(valor,dt_vencimento,formaPagamento,motivo,contaBancaria,inAnoTodo,tag)
{
    let mes = parseInt(DLL.getPedacoData(dt_vencimento,"MES"))
    let dia = DLL.getPedacoData(dt_vencimento,"DIA")
    let ano = DLL.getPedacoData(dt_vencimento,"ANO")

    const conn = await db.connect(); 

    const sql =  `INSERT INTO Gastos
    (usuario,valor,dt_registro,dt_vencimento,formaPagamento,motivo,situacao,contaBancaria,inOrcamentario,tag) 
    VALUES (?,?,?,?,?,?,?,?,?,?)`;

    const values = [global.user.id,valor,null,dt_vencimento,formaPagamento,motivo,4,contaBancaria,1,tag]; 
    await conn.query(sql, values);

    if(inAnoTodo)    
    {
        for(let i = (mes + 1);i <= 12;i++)
        {
            const values = [global.user.id,valor,null,`${ano}-${i}-${dia}`,formaPagamento,motivo,4,contaBancaria,1,tag]; 
            await conn.query(sql, values);
        }
    }
}

//GRAVAR PARCELADO
async function GravarParcelado(valor,dt_registro,dt_vencimento,formaPagamento,motivo,situacao,contaBancaria,qtParcelas,inBruto,inFatura,tag)
{
    let vlRegistro = 0;
    let inFaturaBd = 0

    if(inBruto)
    {
        vlRegistro = valor / qtParcelas;
    }
    else
    {
        vlRegistro = valor;
    }

    if(inFatura)
    {
        inFaturaBd = 1
    }

    const conn = await db.connect();

    for(let i = 0; i < qtParcelas; i++)
    {
        let sql =  `INSERT INTO Gastos
        (usuario,valor,dt_registro,dt_vencimento,formaPagamento,motivo,situacao,contaBancaria,parcela,inFatura,tag) 
        VALUES (?,?,?,DATE_ADD("${dt_vencimento}", INTERVAL ${i} MONTH),?,?,?,?,'${i+1}/${qtParcelas}',?,?)`;

        if(i == 0)
        {
            let values = [global.user.id,vlRegistro,dt_registro,formaPagamento,motivo,situacao,contaBancaria,inFaturaBd,tag]; 
            await conn.query(sql, values);
        }  
        else
        {
            let values = [global.user.id,vlRegistro,null,formaPagamento,motivo,1,contaBancaria,inFaturaBd,tag]; 
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

//EDITAR O VALOR DO GASTO
async function EditarValor(id,valorNew,inAnoTodo = false)
{
    const conn = await db.connect();
    let gasto = await getGasto(id);
   
    let saldoAtual =  parseFloat(global.user.saldo)
    let saldoOriginal = parseFloat(gasto.valor).toFixed(2)
    let diferença = 0
   
    if(gasto.situacao == 3 && valorNew != saldoOriginal)
    {
        if(valorNew > saldoOriginal)//TIRAR
        {
            diferença =  parseFloat(valorNew) - saldoOriginal
            saldoAtual -= diferença;
        }

        if(valorNew < saldoOriginal)//SOMAR
        {
            diferença = saldoOriginal - parseFloat(valorNew) 
            saldoAtual += diferença;
        }

        let sql =  `UPDATE Usuario 
                    SET saldo = ?
                    WHERE id = ?`;

        let values = [saldoAtual,global.user.id];
        await conn.query(sql, values);
    }

    let sql = ""
    let values = []

    if(inAnoTodo)
    {
        let ano = gasto.dt_vencimento.getFullYear()
        let mes = gasto.dt_vencimento.getMonth() + 1
        
        sql =  `UPDATE  Gastos 
        SET valor = ?
        where (SELECT YEAR(dt_vencimento)) = ? 
        AND (SELECT MONTH(dt_vencimento)) >= ?
        AND (SELECT MONTH(dt_vencimento)) <= 12
        AND valor = ?
        AND usuario = ?
        AND motivo = ?;`;

        values = [valorNew,ano,mes,gasto.valor,global.user.id,gasto.motivo];
    }
    else
    {
        sql =  `  UPDATE Gastos 
        SET valor = ?
        WHERE id = ?
        AND usuario = ?`;

        values = [valorNew,id,global.user.id];  
    }
    
    await conn.query(sql, values);

    global.user.saldo =  parseFloat(saldoAtual).toFixed(2)
}

//GET GASTO
async function getGasto(id){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `SELECT * FROM Gastos 
    WHERE usuario = ${global.user.id}
    AND id = ${id}`

    const [rows] = await conn.query(sql,values);   
    return rows[0]; 
}

//CONSUMIR ORCAMENTO
async function Consumir(gasto,valor,data,inZerar,inFatura,inPaga){

    const conn = await db.connect();
    
    if(inFatura)
    {
        if(inPaga)
        {
            await Gravar(valor,data,data,gasto.formaPagamento,await MotivosGastos.getID(gasto.motivo),3,await ContaB.getID(gasto.conta),false,inFatura);
            await Credito.DiminuiSaldo(valor);
        }
        else
        {
            await Gravar(valor,null,data,gasto.formaPagamento,await MotivosGastos.getID(gasto.motivo),1,await ContaB.getID(gasto.conta),false,inFatura);
        }
       
    }
    else
    {
        if(inPaga)
        {
            await Gravar(valor,data,data,gasto.formaPagamento,await MotivosGastos.getID(gasto.motivo),3,await ContaB.getID(gasto.conta),false);
            await Credito.DiminuiSaldo(valor);
        }
        else
        {
            await Gravar(valor,null,data,gasto.formaPagamento,await MotivosGastos.getID(gasto.motivo),1,await ContaB.getID(gasto.conta),false);           
        }
       
    }  

    if(inZerar)
    {
        const sql =  `DELETE FROM Gastos WHERE id = ? AND usuario = ?`;
        const values = [gasto.id,global.user.id];   
        await conn.query(sql, values);
    }
    else
    {
        const sql =  `  UPDATE Gastos 
        SET valor = valor - ?
        WHERE id = ?
        AND usuario = ?`;

        const values = [valor,gasto.id,global.user.id];   
        await conn.query(sql, values); 
    }
}

//DELETAR ORCAMENTO
async function DelOrcamento(id){
    const conn = await db.connect();
    const sql =  `DELETE FROM Gastos WHERE id = ? AND usuario = ?`;

    const values = [id,global.user.id];
    let result = await conn.query(sql, values);
   
    return result
}

//DELETAR ORCAMENTO
async function Dell(id){
    const conn = await db.connect();

    let gasto = await getGasto(id);

    if(gasto.situacao == 3)
    {
        await Credito.AumentaSaldo(parseFloat(gasto.valor))
    }

    const sql =  `DELETE FROM Gastos WHERE id = ? AND usuario = ?`;

    const values = [id,global.user.id];
    await conn.query(sql, values);
}

module.exports = {getAll,getAll_Filtros,Gravar,getGastoID,Pagar,EditarValor,Consumir,
    DelOrcamento,GravarOrcamento,GravarParcelado,getResumoAno,Dell}


