const Gasto = require('../services/s_gastos')
const Credito = require('../services/s_creditos')
const Origem = require('../services/s_origemCredito')
const MotivoGastos = require('../services/s_motivoGastos')
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

async function montarResumoAnual(gastos, anoSelect) {
    let lista = []
    let Motivos = await MotivoGastos.getAll();
   
    for (const m of Motivos) {
        for (const g of gastos) {
            if (g.motivo == m.descricao && anoSelect == g.ano) {
                if (verificaSeMotivoExisteLista(m.descricao, g.ano, lista)) {
                    let i = getIndexObjLista(m.descricao, g.ano, lista);

                    lista[i].mes[g.mes] = g.valor;
                }
                else {
                    let obj = {}
                    obj.motivo = m.descricao
                    obj.id = g.id
                    obj.ano = g.ano
                  
                    obj.mes = []
                    for(let i = 1; i <= 12;i++)
                    {
                        obj.mes[i] = 0
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

            for(let i = 1; i <= 12;i++)
            {
                obj.mes[i] = 0
            }            
            lista.push(obj);
        }
    }

    return lista;
}

async function montarResumoAnualCredi(creditos, anoSelect) {
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
                }
                else {
                    let obj = {}
                    obj.motivo = m.descricao
                    obj.id = g.id
                    obj.ano = g.ano
                    
                    obj.mes = []
                    for(let i = 1; i <= 12;i++)
                    {
                        obj.mes[i] = 0
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

            for(let i = 1; i <= 12;i++)
            {
                obj.mes[i] = 0
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

    let saldoInicial = 0;
    liquidez.inicial = []
    liquidez.liquido = []
    liquidez.final = []

    for(let i = 1; i <= 12;i++)
    {
        liquidez.inicial[i] = saldoInicial

        let liquido = await getCreditoTotalMes(i,ano,creditos) - await getGastoTotalMes(i,ano,gastos) 

        liquidez.liquido[i] = liquido;
        liquidez.final[i] = liquido + (saldoInicial);
        saldoInicial = liquidez.final[i];
    }
 

   return liquidez
}

async function getGastoTotalMes(mes,ano,Gastos) {  
    let resultado = 0;
   
    for (const prod of Gastos) {  

        if (prod.ano == ano && prod.mes == mes) {
          
            resultado += parseFloat(prod.valor)
        }
    }

    return resultado;
}

async function getCreditoTotalMes(mes,ano,Creditos) {
    let resultado = 0;

    for (const prod of Creditos) {

        if (prod.ano == ano && prod.mes == mes) {
            resultado += parseFloat(prod.valor)
        }
    }

    return resultado;
}

module.exports = {getCustoTotal,getGastoTotalPendente,getCreditoTotalPendente,montarResumoAnual,montarResumoAnualCredi,
    getTotalMesResumoAnual,getValorLiquidoMes}