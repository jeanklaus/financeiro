const Origem = require('../services/s_origemCredito')
const MotivoGastos = require('../services/s_motivoGastos')
const db = require('../db');
const DLL = require('../public/DLL');

function getCustoTotal(lista) {
    let resultado = 0;

    for (const prod of lista) {
        resultado += parseFloat(prod.valor)
    }

    return resultado;
}

async function getGastoTotalPendente(ano,Gastos) {
      let resultado = 0;
   
    for (const prod of Gastos) {
        if (prod.situacao != 'PAGO' && prod.ano == ano) {          
            resultado += parseFloat(prod.valor)
        }
    }

    return resultado;
}

async function getCreditoTotalPendente(ano,Creditos) {   
    let resultado = 0;

    for (const prod of Creditos) {      
        if (prod.situacao != 'RECEBIDO' && prod.ano == ano) {
            resultado += parseFloat(prod.valor)
        }
    }

    return resultado;
}

async function montarResumoAnual(gastos, anoSelect,listaGastos) {
    let lista = []
    let Motivos = await MotivoGastos.getAll();

    for (const m of Motivos) 
    {
        for (const g of gastos) 
        {
            if (g.motivo == m.descricao && anoSelect == g.ano) 
            {
                if (verificaSeMotivoExisteLista(m.descricao, g.ano, lista)) 
                {
                    let i = getIndexObjLista(m.descricao, g.ano, lista);

                    lista[i].mes[g.mes] = g.valor;
                  
                    let inPendencia = getInGastosPendenteMes(g.mes,anoSelect,m.descricao,listaGastos)

                    if(inPendencia)
                    {
                        lista[i].pago[g.mes] = 0
                    } 
                }
                else {
                    let obj = {}
                    obj.motivo = m.descricao
                    obj.id = g.id
                    obj.ano = g.ano
                  
                    obj.mes = []  
                    obj.pago = []

                    for(let i = 1; i <= 12;i++)
                    {
                        obj.mes[i] = 0
                        obj.pago[i] = 1
                    }

                    let inPendencia = getInGastosPendenteMes(g.mes,anoSelect,m.descricao,listaGastos)                

                    if(inPendencia)
                    {
                        obj.pago[g.mes] = 0
                    }       

                    obj.mes[g.mes] = g.valor;                   

                    lista.push(obj);
                }
            }
        }//fim for

        let inExiste = verificaSomenteMotivo(m.descricao, lista)

        if (!inExiste) {
            let obj = {}
            obj.motivo = m.descricao
            obj.id = m.id
            obj.ano = anoSelect         
            obj.mes = []
            obj.pago = []

            for(let i = 1; i <= 12;i++)
            {
                obj.mes[i] = 0
                obj.pago[i] = 1
            }
                    
            lista.push(obj);
        }
    }

    return lista;
}

async function montarResumoAnualCredi(creditos, anoSelect,listaCreditos) {
    let lista = []    
    let Motivos = await Origem.getAll();
   
    for (const m of Motivos) 
    {
        for (const g of creditos) 
        {
            if (g.motivo == m.descricao && anoSelect == g.ano) {
                if (verificaSeMotivoExisteLista(m.descricao, g.ano, lista)) {
                    let i = getIndexObjLista(m.descricao, g.ano, lista);
                    
                    lista[i].mes[g.mes] = g.valor;

                    let inPendencia = getInCreditoPendenteMes(g.mes,anoSelect,m.descricao,listaCreditos)
                   
                    if(inPendencia)
                    {
                        lista[i].pago[g.mes] = 0
                    }     

                }
                else {
                    let obj = {}
                    obj.motivo = m.descricao
                    obj.id = g.id
                    obj.ano = g.ano
                    
                    obj.mes = []
                    obj.pago = []

                    for(let i = 1; i <= 12;i++)
                    {
                        obj.mes[i] = 0
                        obj.pago[i] = 1
                    }

                    let inPendencia = getInCreditoPendenteMes(g.mes,anoSelect,m.descricao,listaCreditos)            

                    if(inPendencia)
                    {
                        obj.pago[g.mes] = 0
                    }                   

                    obj.mes[g.mes] = g.valor;
                    lista.push(obj);
                }
            }
        }//fim for

        let inExiste = verificaSomenteMotivo(m.descricao, lista)

        if (!inExiste) {
            let obj = {}
            obj.motivo = m.descricao
            obj.id = m.id           
            obj.ano = anoSelect

            obj.mes = []
            obj.pago = []

            for(let i = 1; i <= 12;i++)
            {
                obj.mes[i] = 0
                obj.pago[i] = 1
            }
           
            lista.push(obj);
        }
    }
   
    return lista;
}

function getTotalMesResumoAnual(lista, ano) {

    let totais = {}
    totais.mes = []
   
    for(let i = 1; i <= 12;i++)
    {
        totais.mes[i] = 0;
    }

    for (const g of lista) {
        if (g.ano == ano) {

            for(let i = 1; i <= 12;i++)
            {
                totais.mes[i] += parseFloat(g.mes[i]);
            }
        }
    }
    
    return totais;
}

function verificaSeMotivoExisteLista(motivo, ano, lista) {
    for (const l of lista) {
        if (l.motivo == motivo && l.ano == ano) {
            return true;
        }
    }
    return false;
}

function verificaSomenteMotivo(motivo, lista) {
    for (const l of lista) 
    {
        if (l.motivo == motivo) 
        {
            return true;
        }
    }
    return false;
}

function getIndexObjLista(motivo, ano, lista) {
    let index = 0;

    for (const l of lista) {
        if (l.motivo == motivo && l.ano == ano) {
            return index;
        }

        index++;
    }
}

async function getValorLiquidoMes(ano,creditos,gastos)
{
    let liquidez = {}

   let saldoInicial = await getSaldoFimAno(ano - 1);
   let saldoInicialReal = await getSaldoFimAnoReal(ano - 1);
   
    liquidez.inicial = []  
    liquidez.liquido = []
    liquidez.final = []

    liquidez.inicialReal = []
    liquidez.liqReal = []
    liquidez.finalReal = []
    

    for(let i = 1; i <= 12;i++)
    {
        liquidez.inicial[i] = saldoInicial
        liquidez.inicialReal[i] = saldoInicialReal

        let liquido = await getTotalMes(i,ano,creditos) - await getTotalMes(i,ano,gastos) 
        let liqReal = await getTotalMesReal(i,ano,creditos) - await getTotalMes(i,ano,gastos) 

        liquidez.liquido[i] = liquido;
        liquidez.liqReal[i] = liqReal;

        liquidez.final[i] = liquido + (saldoInicial);
        liquidez.finalReal[i] = liqReal + (saldoInicialReal);

        saldoInicial = liquidez.final[i];
        saldoInicialReal = liquidez.finalReal[i];
    }

   return liquidez
}

async function getTotalMes(mes,ano,registros) {  
    let resultado = 0;
   
    for (const prod of registros) { 

        if (prod.ano == ano && prod.mes == mes) {
          
            resultado += parseFloat(prod.valor)
        }
    }

    return resultado;
}

async function getTotalMesReal(mes,ano,registros) {  
    let resultado = 0;
   
    for (const prod of registros) { 

        let dataAtual = new Date()
        let dataRegistro = DLL.ConvertDateToNumber(prod.dt_previsao)        
        dataAtual =DLL.ConvertDateToNumber(DLL.formataData(dataAtual))

        if (prod.ano == ano && prod.mes == mes) {

            if(prod.situacao == 'RECEBIDO' || dataAtual < dataRegistro)
            {
                resultado += parseFloat(prod.valor)
            }           
        }
    }

    return resultado;
}

//SELECT 
async function getSaldoFimAno(ano){   

    const conn = await db.connect(); 

    let sql =  `SELECT (SELECT SUM(valor) from Credito where Usuario = ${global.user.id} and (SELECT YEAR(dt_previsao)) = '${ano}' GROUP BY (SELECT YEAR(dt_previsao))) - 
    (SELECT SUM(valor) from Gastos where Usuario = ${global.user.id} and (SELECT YEAR(dt_vencimento)) = '${ano}' GROUP BY (SELECT YEAR(dt_vencimento)))  as saldoFinal`

    const [rows] = await conn.query(sql);

    if(rows[0].saldoFinal)
    {
        return  parseFloat(rows[0].saldoFinal)
    }
    else
    {
        return 0
    }
}

//SELECT 
async function getSaldoFimAnoReal(ano){   

    const conn = await db.connect(); 

    let sql = `SELECT (SELECT SUM(valor) from Credito where Usuario = ${global.user.id} and (SELECT YEAR(dt_previsao)) = '${ano}' and (situacao = 2 OR now() < dt_previsao) GROUP BY (SELECT YEAR(dt_previsao))) - 
    (SELECT SUM(valor) from Gastos where Usuario = ${global.user.id} and (SELECT YEAR(dt_vencimento)) = '${ano}' GROUP BY (SELECT YEAR(dt_vencimento)))  as saldoFinal;`

    const [rows] = await conn.query(sql);

    if(rows[0].saldoFinal)
    {
        return  parseFloat(rows[0].saldoFinal)
    }
    else
    {
        return 0
    }
}


//BUSCA GASTOS PELO ID
function getInGastosPendenteMes(mes,ano,motivo,motivos){  
  
    let inPendencia = false
    let resultados = []
    
    resultados = motivos.filter(element => {
        return element.situacao != 'PAGO' && element.mes == mes && element.ano == ano && element.motivo == motivo;
     });    
    
    if(resultados.length > 0)
    {
        inPendencia = true
    }
    
    return inPendencia
}

//BUSCA CREDITO PELO ID
 function getInCreditoPendenteMes(mes,ano,motivo,motivos){  
    
    let inPendencia = false 
    let resultados = []
   
    resultados = motivos.filter(element => {
        return element.situacao != 'RECEBIDO' && element.mes == mes && element.ano == ano && element.descricao == motivo;
     });

    if(resultados.length > 0)
    {
        inPendencia = true
    }
    
    return inPendencia
}



module.exports = {getCustoTotal,getGastoTotalPendente,getCreditoTotalPendente,montarResumoAnual,montarResumoAnualCredi,
    getTotalMesResumoAnual,getValorLiquidoMes}