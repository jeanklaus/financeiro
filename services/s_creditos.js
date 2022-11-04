const db = require('../db');
const DLL = require('../public/DLL');

//SELECT 
async function getAll(){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `SELECT c.id,c.valor,c.dt_recebimento,o.descricao,c.dt_previsao,s.descricao as situacao,cc.descricao as conta,(SELECT YEAR(c.dt_previsao)) as ano,(SELECT MONTH(c.dt_previsao)) as mes,tag 
    FROM Credito as c
    INNER JOIN OrigemCredito as o ON o.id = c.origemCredito
    INNER JOIN SituacaoCredito as s ON s.id = c.situacao
    INNER JOIN ContaBancaria as cc ON cc.id = c.contaBancaria
    WHERE c.usuario = ${global.user.id}
    ORDER BY c.dt_previsao asc`
    const [rows] = await conn.query(sql,values);

    let newrows = rows.map(registro => {
        if(registro.dt_recebimento)
        {
            registro.dt_recebimento = DLL.formataData(registro.dt_recebimento);
        }      
        registro.dt_previsao = DLL.formataData(registro.dt_previsao);
        registro.valor = parseFloat(registro.valor).toFixed(2);
        return registro;
    });
   
    return newrows; 
}

//SELECT  FILTROS
async function getAll_Filtros(filtro){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql = `SELECT c.id,c.valor,c.dt_recebimento,o.descricao,c.dt_previsao,s.descricao as situacao,cc.descricao as conta,tag 
    FROM Credito as c
    INNER JOIN OrigemCredito as o ON o.id = c.origemCredito
    INNER JOIN SituacaoCredito as s ON s.id = c.situacao
    INNER JOIN ContaBancaria as cc ON cc.id = c.contaBancaria
    WHERE ${filtro} AND c.usuario = ${global.user.id}`
    const [rows] = await conn.query(sql,values);

    let newrows = rows.map(registro => {
        if(registro.dt_recebimento)
        {
            registro.dt_recebimento = DLL.formataData(registro.dt_recebimento);
        }      
        registro.dt_previsao = DLL.formataData(registro.dt_previsao);
        registro.valor = parseFloat(registro.valor).toFixed(2);
        return registro;
    });
   
    return newrows; 
}

//GRAVAR
async function Gravar(valor,dt_recebimento,dt_previsao,origem,situacao,contaBancaria,inAnoTodo,tag)
{
    let mes = parseInt(DLL.getPedacoData(dt_previsao,"MES"))
    let dia = DLL.getPedacoData(dt_previsao,"DIA")
    let ano = DLL.getPedacoData(dt_previsao,"ANO")

    const conn = await db.connect();  

    const sql =  `INSERT INTO Credito
    (usuario,valor,dt_recebimento,dt_previsao,origemCredito,situacao,contaBancaria,tag) 
    VALUES (?,?,?,?,?,?,?,?)`;

    const values = [global.user.id,valor,dt_recebimento,dt_previsao,origem,situacao,contaBancaria,tag]; 
    await conn.query(sql, values);

    if(inAnoTodo)    
    {
        for(let i = (mes + 1);i <= 12;i++)
        {
            const values = [global.user.id,valor,null,`${ano}-${i}-${dia}`,origem,1,contaBancaria,tag]; 
            await conn.query(sql, values);
        }
    }
}

//GRAVAR PARCELADO
async function GravarParcelado(valor,dt_recebimento,dt_previsao,origem,situacao,contaBancaria,qtParcelas,inBruto,tag)
{
    let vlRegistro = 0;   

    if(inBruto)
    {
        vlRegistro = valor / qtParcelas;
    }
    else
    {
        vlRegistro = valor;
    }

    const conn = await db.connect();  

    for(let i = 0; i < qtParcelas; i++)
    {
        const sql =  `INSERT INTO Credito
        (usuario,valor,dt_recebimento,dt_previsao,origemCredito,situacao,contaBancaria,tag) 
        VALUES (?,?,?,DATE_ADD("${dt_previsao}", INTERVAL ${i} MONTH),?,?,?,?)`;

        if(i == 0)
        {
            const values = [global.user.id,vlRegistro,dt_recebimento,origem,situacao,contaBancaria,tag]; 
            await conn.query(sql, values);
        }  
        else
        {
            const values = [global.user.id,vlRegistro,dt_recebimento,origem,1,contaBancaria,tag]; 
            await conn.query(sql, values);
        } 
    }    
}

//SELECT 
async function getSaldo(){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `SELECT saldo FROM Usuario
    WHERE id = ${global.user.id}`

    const [rows] = await conn.query(sql,values);

    let newrows = rows.map(registro => {
        registro.saldo = parseFloat(registro.saldo).toFixed(2);
        return registro;
    });
   
    return newrows[0].saldo; 
}

//DIMUNUIR SALDO
async function DiminuiSaldo(valor){

    const conn = await db.connect();
    const sql =  `  UPDATE Usuario 
                    SET saldo = saldo - ?   
                    WHERE id = ?`;

    const values = [valor,global.user.id];   
    await conn.query(sql, values); 
    global.user.saldo = await getSaldo();
}

//AUMENTA SALDO
async function AumentaSaldo(valor){

    const conn = await db.connect();
    const sql =  `  UPDATE Usuario 
                    SET saldo = saldo + ?   
                    WHERE id = ?`;

    const values = [valor,global.user.id];   
    await conn.query(sql, values); 
    global.user.saldo = await getSaldo();
}

//ATUALIZA O SALDO
async function AtualizaSaldo(valor){

    const conn = await db.connect();
    const sql =  `  UPDATE Usuario 
                    SET saldo = ?   
                    WHERE id = ?`;

    const values = [valor,global.user.id];   
    await conn.query(sql, values); 
    global.user.saldo = valor;
}

//BUSCA CREDITO PELO ID
async function getCreditoID(id){   
    const conn = await db.connect();   

    let sql =  `SELECT c.id,c.valor,c.dt_recebimento,o.descricao,c.dt_previsao,s.descricao as situacao,cc.descricao as conta 
    FROM Credito as c
    INNER JOIN OrigemCredito as o ON o.id = c.origemCredito
    INNER JOIN SituacaoCredito as s ON s.id = c.situacao
    INNER JOIN ContaBancaria as cc ON cc.id = c.contaBancaria
    WHERE c.usuario = ${global.user.id}
    AND c.id = ${id}`

    const [rows] = await conn.query(sql);

    let newrows = rows.map(registro => {
        if(registro.dt_recebimento)
        {
            registro.dt_recebimento = DLL.formataData(registro.dt_recebimento);
        }      
        registro.dt_previsao = DLL.formataData(registro.dt_previsao);
        registro.valor = parseFloat(registro.valor).toFixed(2);
        return registro;
    });
   
    return newrows[0];
}

//RECEBER
async function Receber(id,valor){

    const conn = await db.connect();

    const sql =  `  UPDATE Credito 
                    SET situacao = 2,
                    dt_recebimento = now()
                    WHERE id = ?
                    AND usuario = ?`;

    const values = [id,global.user.id];   
    await conn.query(sql, values); 

    await AumentaSaldo(valor);
}

//EDITAR O VALOR DO CREDITO
async function EditarValor(id,valorNew){

    const conn = await db.connect();
    let credito = await getCredito(id)
   
    let saldoAtual = parseFloat(global.user.saldo)   
    let saldoOriginal = parseFloat(credito.valor).toFixed(2)
    let diferença = 0
    
    if(credito.situacao == 2 && valorNew != saldoOriginal)
    {
        if(valorNew > saldoOriginal)//TIRAR
        {
            diferença = parseFloat(valorNew) - saldoOriginal
            saldoAtual += diferença;
        }

        if(valorNew < saldoOriginal)//SOMAR
        {
            diferença = saldoOriginal - parseFloat(valorNew)
            saldoAtual -= diferença;
        }

        let sql =  `UPDATE Usuario 
                    SET saldo = ?
                    WHERE id = ?`;

        let values = [saldoAtual,global.user.id];
        await conn.query(sql, values);
    }

    let sql =  `  UPDATE Credito 
    SET valor = ?
    WHERE id = ?
    AND usuario = ?`;

    let values = [valorNew,id,global.user.id];   
    await conn.query(sql, values);

    global.user.saldo = parseFloat(saldoAtual).toFixed(2)
}

//GET CREDITO
async function getCredito(id){   
    const conn = await db.connect();   

    let sql =  `SELECT * FROM Credito 
    WHERE usuario = ${global.user.id}
    AND id = ${id}`

    const [rows] = await conn.query(sql);
   
    return rows[0];
}

//SELECT RESUMO DO ANO
async function getResumoAno(){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `SELECT o.id,SUM(c.valor) as valor,(SELECT MONTH(c.dt_previsao)) as mes,(SELECT YEAR(c.dt_previsao)) as ano,o.descricao as motivo,c.situacao
    FROM Credito as c
    INNER JOIN OrigemCredito as o ON o.id = c.origemCredito
    WHERE c.usuario = ?
    GROUP BY motivo,mes`
    const [rows] = await conn.query(sql,values);

    let newrows = rows.map(registro => {        
        registro.valor = parseFloat(registro.valor).toFixed(2);
        return registro;
    });
   
    return newrows; 
}

//DELETAR
async function Dell(id){
    const conn = await db.connect();
    const sql =  `DELETE FROM Credito WHERE id = ? AND usuario = ?`;

    const values = [id,global.user.id];
    await conn.query(sql, values);
}


module.exports = {getResumoAno,getSaldo,DiminuiSaldo,AtualizaSaldo,getAll,getAll_Filtros,AumentaSaldo,
    Gravar,getCreditoID,Receber,EditarValor,GravarParcelado,Dell}


