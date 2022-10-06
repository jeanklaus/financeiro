const db = require('../db');
const DLL = require('../public/DLL');

//SELECT 
async function getAll(){   
    const conn = await db.connect();  
    const values = [global.user.id]; 

    let sql =  `SELECT c.id,c.valor,c.dt_recebimento,o.descricao,c.dt_previsao,s.descricao as situacao,cc.descricao as conta 
    FROM Credito as c
    INNER JOIN OrigemCredito as o ON o.id = c.origemCredito
    INNER JOIN SituacaoCredito as s ON s.id = c.situacao
    INNER JOIN ContaBancaria as cc ON cc.id = c.contaBancaria
    WHERE c.usuario = ${global.user.id}`
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

    let sql = `SELECT c.id,c.valor,c.dt_recebimento,o.descricao,c.dt_previsao,s.descricao as situacao,cc.descricao as conta 
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
async function Gravar(valor,dt_recebimento,dt_previsao,origem,situacao,contaBancaria,inAnoTodo)
{
    let data = new Date(); 
    let mes = data.getMonth() + 1;
    let dia = DLL.getPedacoData(dt_previsao,"DIA")
    let ano = DLL.getPedacoData(dt_previsao,"ANO")

    const conn = await db.connect();  

    const sql =  `INSERT INTO Credito
    (usuario,valor,dt_recebimento,dt_previsao,origemCredito,situacao,contaBancaria) 
    VALUES (?,?,?,?,?,?,?)`;

    const values = [global.user.id,valor,dt_recebimento,dt_previsao,origem,situacao,contaBancaria]; 
    await conn.query(sql, values);

    if(inAnoTodo)    
    {
        for(let i = (mes + 1);i <= 12;i++)
        {
            const values = [global.user.id,valor,null,`${ano}-${i}-${dia}`,origem,1,contaBancaria]; 
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

module.exports = {getSaldo,DiminuiSaldo,AtualizaSaldo,getAll,getAll_Filtros,AumentaSaldo,Gravar,getCreditoID,Receber}


