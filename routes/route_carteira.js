const express = require('express');
const bodyparser = require('body-parser');
const Gasto = require('../services/s_gastos')
const Credito = require('../services/s_creditos')
const Origem = require('../services/s_origemCredito')
const MotivoGastos = require('../services/s_motivoGastos')
const ContaBancaria = require('../services/s_contaBancaria')
const Func = require('../public/funcoes');
const DLL = require('../public/DLL');
const Fatura = require('../services/s_fatura')

const router = express.Router();
router.use(bodyparser.urlencoded({ extended: false }));

//=============================================================

let wheres = []
let filtros = {}
filtros.motivoGastos = {}
filtros.conta = {}
filtros.Situacao = {}
filtros.origemCredito = {}

let idGasto = null;
let idCredito = null;
let gasto = {}
let credito = {}

//=============================================================

//============ GASTOS ==========
router.get('/ConsultaGastos',async (req,res) => {
    try
    {  
        filtros = {}
        filtros.motivoGastos = {}
        filtros.conta = {}
        filtros.Situacao = {}
        wheres = []

        let Gastos = await Gasto.getAll(); 
        let valorTotal = getCustoTotal(Gastos);
        let valorTotalPendente = await getGastoTotalPendente();  
        let valorTotalPendenteRecebimento = await getCreditoTotalPendente();   
        let  valorTotalEstimativa = (valorTotalPendenteRecebimento + parseFloat(global.user.saldo)) - valorTotalPendente
        let Motivos = await MotivoGastos.getAll();
        let Contas = await ContaBancaria.getAll();
       
        res.render('carteira_view/inicialGastos',{Gastos,valorTotal,Motivos,Contas,filtros,valorTotalPendente,valorTotalPendenteRecebimento,valorTotalEstimativa});
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro})
    } 
});

router.post('/ClickGastos',async (req,res) => {
    try
    {     
        let Gastos = []       
        let Motivos = await MotivoGastos.getAll();
        let Contas = await ContaBancaria.getAll();
        wheres = []

        if(req.body.EDI)
        {
            let [id,valor] = req.body.EDI.split('|');
            return res.render('carteira_view/editarGasto',{id,valor})
        }

        if(req.body.PESQUISAR)
        {
            if (req.body.motivoGastos) 
            {
                [filtros.motivoGastos.id,filtros.motivoGastos.descricao] = req.body.motivoGastos.split('|');
                wheres.push(`motivo = ${filtros.motivoGastos.id}`);               
            }

            if (req.body.formaPagamento) 
            {
                filtros.formaPagamento = req.body.formaPagamento;
                wheres.push(`formaPagamento = '${filtros.formaPagamento}'`);               
            }

            if (req.body.conta) 
            {
                [filtros.conta.id,filtros.conta.descricao] = req.body.conta.split('|');
                wheres.push(`contaBancaria = ${filtros.conta.id}`);               
            }

            if (req.body.Situacao) 
            {
                [filtros.Situacao.id,filtros.Situacao.descricao] = req.body.Situacao.split('|');
                wheres.push(`situacao = ${filtros.Situacao.id}`);               
            }

            if (req.body.dataFim) 
            {
                filtros.dataFim = req.body.dataFim;
                wheres.push(`dt_vencimento <= '${req.body.dataFim}'`);
            }

             if (req.body.dataIni) 
            {
                filtros.dataIni = req.body.dataIni;
                wheres.push(`dt_vencimento >= '${req.body.dataIni}'`);
            }
            
            //======================================
            Gastos = await Gasto.getAll_Filtros(Func.AnalisaFiltros(wheres)); 
            let valorTotal = getCustoTotal(Gastos);  
            let valorTotalPendente =  await getGastoTotalPendente(); 
            let valorTotalPendenteRecebimento = await getCreditoTotalPendente();  
            let  valorTotalEstimativa = (valorTotalPendenteRecebimento + parseFloat(global.user.saldo)) - valorTotalPendente 
            return res.render('carteira_view/inicialGastos',{Gastos,valorTotal,Motivos,Contas,filtros,valorTotalPendente,valorTotalPendenteRecebimento,valorTotalEstimativa});           
        }        
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro});
    } 
});

router.get('/RegistrarGastos',async (req,res) => {
    try
    { 
        let Motivos = await MotivoGastos.getAll();
        let Contas = await ContaBancaria.getAll();
      
        res.render('carteira_view/registrarGastos',{Motivos,Contas});        
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro})
    } 
});

router.post('/CofirmarRegistroGastos',async (req,res) => {
    try
    { 
        let situacao = 1;//PENDENTE
        let inAnoTodo = false;       
        let dataRegistro = null;
        let qtParcelas = 0;
        let inValorBruto = false;  
        let inFatura = false;      

        if(!req.body.valor)
        {
            return res.render('feed',{erro:'Informe o valor'})
        }

        if(!req.body.motivoGastos)
        {
            return res.render('feed',{erro:'Informe o motivo'}) 
        }

        if(!req.body.dtVencimento)
        {
            return res.render('feed',{erro:'Informe a data de vencimento'}) 
        }

        if(!req.body.formaPagamento)
        {
            return res.render('feed',{erro:'Informe a forma de pagamento'}) 
        }

        if(!req.body.conta)
        {
            return res.render('feed',{erro:'Informe a conta'}) 
        }

        if(req.body.pago)
        {
           situacao = 3;//PAGO
           dataRegistro = new Date();
           dataRegistro = DLL.ConverterData(DLL.formataData(dataRegistro))
           await Credito.DiminuiSaldo(req.body.valor);
        }

        if(req.body.fimAno)
        {
            inAnoTodo =  true;
        }

        if(req.body.fatura)
        {
            inFatura = true;
        }

        if(req.body.parcelado)//PARCELADO
        {
            if(!req.body.qtParcelas)
            {
                return res.render('feed',{erro:'Informe a quantidade de parcelas'}) 
            }

            if(!req.body.tpValor)
            {
                return res.render('feed',{erro:'Selecione um tipo de valor'}) 
            }

            qtParcelas = req.body.qtParcelas;

            if(req.body.tpValor == "B")
            {
                inValorBruto = true;
            }

            await Gasto.GravarParcelado(req.body.valor,dataRegistro,req.body.dtVencimento,req.body.formaPagamento,
            req.body.motivoGastos,situacao,req.body.conta,qtParcelas,inValorBruto,inFatura)
                    
        }
        else if(req.body.orcamento)//ORCAMENTO
        {
            await Gasto.GravarOrcamento(req.body.valor,req.body.dtVencimento,req.body.formaPagamento,
            req.body.motivoGastos,req.body.conta,inAnoTodo)  
        } 
        else//NORMAL
        {
            await Gasto.Gravar(req.body.valor,dataRegistro,req.body.dtVencimento,req.body.formaPagamento,
            req.body.motivoGastos,situacao,req.body.conta,inAnoTodo,inFatura)  
        }     

        return res.render('carteira_view/feedGastos',{status:'success',txt:'Gasto gravado com sucesso!'})  
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro})
    } 
});

//PAGAR - CONSUMIR - DELETAR ORCAMENTO - ADD  FATURA
router.post('/PagarGasto',async (req,res) => {
    try
    { 
        if(req.body.CONF_ADD_FATURA)
        {
            await Fatura.AddGasto(idGasto);
            res.redirect('/Carteira/ConsultaGastos'); 
        }  

        if(req.body.ADD_FATURA)
        {
            idGasto = req.body.ADD_FATURA; 
            return res.render('fatura_view/feedAdd') 
        }  

        if(req.body.PAGAR)
        {
            idGasto = req.body.PAGAR;
            gasto = await Gasto.getGastoID(idGasto);

            return res.render('carteira_view/feedDellGastos') 
        }  

        if(req.body.CONSUMIR)
        {
            idGasto = req.body.CONSUMIR;
            gasto = await Gasto.getGastoID(idGasto);

            return res.render('carteira_view/consumirGastos',{gasto}) 
        } 

        if(req.body.CONFIRMADO)
        {
            await Gasto.Pagar(idGasto,gasto.valor);
            res.redirect('/Carteira/ConsultaGastos');
        } 

        if(req.body.CONF_CONSUMO)
        {
            if(!req.body.valor)
            {
                return res.render('feed',{erro:'Informe o valor'})
            }

            if(!req.body.dataConsumo)
            {
                return res.render('feed',{erro:'Informe a data do consumo'})
            }

            await Gasto.Consumir(gasto,req.body.valor,req.body.dataConsumo);
            res.redirect('/Carteira/ConsultaGastos');
        } 

        if(req.body.DEL)
        {
            idGasto = req.body.DEL;
            return res.render('carteira_view/feedDellOrcamento') 
        }  

        if(req.body.CONF_DELL_ORC)
        {
            await Gasto.DelOrcamento(idGasto);
            res.redirect('/Carteira/ConsultaGastos'); 
        } 
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro})
    } 
});

//======= SALDO USUARIO ===========
router.get('/DefinirSaldoUsuario',async (req,res) => {
    try
    { 
        return res.render('carteira_view/definirSaldo')
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro})
    } 
});

router.post('/AlterarSaldo',async (req,res) => {
    try
    { 
        if(req.body.saldo)
        {
            await Credito.AtualizaSaldo(req.body.saldo);
            return res.render('carteira_view/feedSaldo',{status:'success',txt:'Saldo atualizado!'}) 
        }
        else
        {
            return res.render('feed',{erro:'Informe o novo saldo'})
        }
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro})
    } 
});

router.post('/ConfirmaEdicaoGasto',async (req,res) => {
    try
    { 
        if(req.body.CONFIRMADO)
        {
            if(!req.body.valor)
            {
                return res.render('feed',{erro:'Informe o valor'}) 
            }

            let [id,] = req.body.CONFIRMADO.split('|'); 
            let valor =  req.body.valor  

            await Gasto.EditarValor(id,valor);
            res.redirect('/Carteira/ConsultaGastos');
        } 
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro})
    } 
});

//============ CREDITOS ==========
router.get('/ConsultaCreditos',async (req,res) => {
    try
    {  
        filtros = {}
        filtros.origemCredito = {}
        filtros.conta = {}
        filtros.Situacao = {}
        wheres = []

        let Creditos = await Credito.getAll(); 
        let valorTotal = getCustoTotal(Creditos);
        let valorTotalPendenteRecebimento = await getCreditoTotalPendente();
        let valorTotalPendente = await getGastoTotalPendente();    
        let  valorTotalEstimativa = (valorTotalPendenteRecebimento + parseFloat(global.user.saldo)) - valorTotalPendente
        let Origens = await Origem.getAll();
        let Contas = await ContaBancaria.getAll();       
       
        res.render('carteira_view/inicialCreditos',{Creditos,valorTotal,Origens,Contas,filtros,valorTotalPendente,valorTotalPendenteRecebimento,valorTotalEstimativa});
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro})
    } 
});

router.post('/ClickCreditos',async (req,res) => {
    try
    {     
        let Creditos = []       
        let Origens = await Origem.getAll();
        let Contas = await ContaBancaria.getAll();
        wheres = []

        if(req.body.EDI)
        {
            let [id,valor] = req.body.EDI.split('|');
            return res.render('carteira_view/editarCredito',{id,valor})
        }

        if(req.body.PESQUISAR)
        {
            if (req.body.origemCredito) 
            {
                [filtros.origemCredito.id,filtros.origemCredito.descricao] = req.body.origemCredito.split('|');
                wheres.push(`origemCredito = ${filtros.origemCredito.id}`);               
            }

            if (req.body.conta) 
            {
                [filtros.conta.id,filtros.conta.descricao] = req.body.conta.split('|');
                wheres.push(`contaBancaria = ${filtros.conta.id}`);               
            }

            if (req.body.Situacao) 
            {
                [filtros.Situacao.id,filtros.Situacao.descricao] = req.body.Situacao.split('|');
                wheres.push(`situacao = ${filtros.Situacao.id}`);               
            }

            if (req.body.dataFim) 
            {
                filtros.dataFim = req.body.dataFim;
                wheres.push(`dt_previsao <= '${req.body.dataFim}'`);
            }

             if (req.body.dataIni) 
            {
                filtros.dataIni = req.body.dataIni;
                wheres.push(`dt_previsao >= '${req.body.dataIni}'`);
            }
            
            //======================================
            Creditos = await Credito.getAll_Filtros(Func.AnalisaFiltros(wheres)); 
            
            let valorTotal = getCustoTotal(Creditos);  
            let valorTotalPendenteRecebimento = await getCreditoTotalPendente();
            let valorTotalPendente = await getGastoTotalPendente(); 
            let  valorTotalEstimativa = (valorTotalPendenteRecebimento + parseFloat(global.user.saldo)) - valorTotalPendente     
            return res.render('carteira_view/inicialCreditos',{Creditos,valorTotal,Origens,Contas,filtros,valorTotalPendente,valorTotalPendenteRecebimento,valorTotalEstimativa});
        } 
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro});
    } 
});

router.get('/RegistrarCreditos',async (req,res) => {
    try
    { 
        let Origens = await Origem.getAll();
        let Contas = await ContaBancaria.getAll();
      
        res.render('carteira_view/registrarCreditos',{Origens,Contas});        
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro})
    } 
});

router.post('/CofirmarRegistroCreditos',async (req,res) => {
    try
    { 
        let situacao = 1;//PENDENTE
        let inAnoTodo = false;
        let dataRecebimento = null;

        if(!req.body.valor)
        {
            return res.render('feed',{erro:'Informe o valor'}) 
        }

        if(!req.body.origemCreditos)
        {
            return res.render('feed',{erro:'Informe a Origem dos Creditos'}) 
        }

        if(!req.body.dtPrevisao)
        {
            return res.render('feed',{erro:'Informe a data de Previsao'}) 
        }

        if(!req.body.conta)
        {
            return res.render('feed',{erro:'Informe a conta'}) 
        }

        if(req.body.recebido)
        {
           situacao = 2;//RECEBIDO
           dataRecebimento = new Date();
           dataRecebimento = DLL.ConverterData(DLL.formataData(dataRecebimento))
           await Credito.AumentaSaldo(req.body.valor);
        }

        if(req.body.fimAno)
        {
            inAnoTodo =  true;
        }

       await Credito.Gravar(req.body.valor,dataRecebimento,req.body.dtPrevisao,
        req.body.origemCreditos,situacao,req.body.conta,inAnoTodo)

        return res.render('carteira_view/feedCreditos',{status:'success',txt:'Recebimento gravado com sucesso!'})  

    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro})
    } 
});

router.post('/ReceberCredito',async (req,res) => {
    try
    { 
        if(req.body.RECEBER)
        {
            idCredito = req.body.RECEBER;
            credito = await Credito.getCreditoID(idCredito);

            return res.render('carteira_view/feedDellCreditos') 
        }  

        if(req.body.CONFIRMADO)
        {
            await Credito.Receber(idCredito,credito.valor);
            res.redirect('/Carteira/ConsultaCreditos');
        } 
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro})
    } 
});

router.post('/ConfirmaEdicaoCredito',async (req,res) => {
    try
    { 
        if(req.body.CONFIRMADO)
        {
            if(!req.body.valor)
            {
                return res.render('feed',{erro:'Informe o valor'}) 
            }

            let [id,] = req.body.CONFIRMADO.split('|'); 
            let valor =  req.body.valor  

            await Credito.EditarValor(id,valor);
            res.redirect('/Carteira/ConsultaCreditos');
        } 
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro})
    } 
});

//========================== LOCAL PROC ====================
function getCustoTotal(lista) 
{
    let resultado = 0;
   
    for (const prod of lista) 
    {
        resultado += parseFloat(prod.valor)              
    }

    return resultado; 
}

async function getGastoTotalPendente() 
{
    let Gastos = await Gasto.getAll();
    let resultado = 0;
   
    for (const prod of Gastos) 
    {
        if(prod.situacao != 'PAGO')
        {
            resultado += parseFloat(prod.valor)   
        }       
    }

    return resultado; 
}

async function getCreditoTotalPendente() 
{
    let Creditos = await Credito.getAll();
    let resultado = 0;
   
    for (const prod of Creditos) 
    {
        if(prod.situacao != 'RECEBIDO')
        {
            resultado += parseFloat(prod.valor)   
        }       
    }

    return resultado; 
}

module.exports = router;