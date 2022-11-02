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


//=============================================================== PAINEL =========================================================================
router.get('/ConsultaGastosResumoAnual', async (req, res) => {
    try {

        filtros = {}
        filtros.motivoGastos = {}
        filtros.conta = {}
        filtros.Situacao = {}
        filtros.origemCredito = {}

        let Origens = await Origem.getAll();
        let Contas = await ContaBancaria.getAll();    
        let ListaCreditos = await Credito.getAll(); 
        let ListaGastos = await Gasto.getAll();   

        let data = new Date()
        let anoSelect = DLL.getPedacoData(DLL.ConverterData(DLL.formataData(data)), 'ANO');
        let valorTotalPendente = await getGastoTotalPendente(anoSelect);
        let valorTotalPendenteRecebimento = await getCreditoTotalPendente(anoSelect);
        let valorTotalEstimativa = (valorTotalPendenteRecebimento + parseFloat(global.user.saldo)) - valorTotalPendente

        //GASTOS
        let Gastos = await Gasto.getResumoAno();
        let valorTotal = getCustoTotal(Gastos);
        let resumo = await montarResumoAnual(Gastos, anoSelect);
        let totais = getTotalMesResumoAnual(resumo, anoSelect);
     
        //CREDITOS
        let Creditos = await Credito.getResumoAno();
        
        let resumoCredi = await montarResumoAnualCredi(Creditos, anoSelect);
        let totaisCredi = getTotalMesResumoAnual(resumoCredi, anoSelect); 
        
        let liquido = await getValorLiquidoMes(anoSelect);
    
        res.render('carteira_view/consultaGastosAnual', {
            totaisCredi, resumoCredi, totais, anoSelect, resumo,
            valorTotal, valorTotalPendente, valorTotalPendenteRecebimento, 
            valorTotalEstimativa,filtros,Origens,Contas,ListaCreditos,ListaGastos,liquido
       });
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

router.post('/ConsultandoGastosResumoAnual', async (req, res) => {
    try {

        filtros = {}
        filtros.motivoGastos = {}
        filtros.conta = {}
        filtros.Situacao = {}
        filtros.origemCredito = {}

        let Origens = await Origem.getAll();
        let Contas = await ContaBancaria.getAll();
        let ListaCreditos = await Credito.getAll();
        let ListaGastos = await Gasto.getAll();  

        let data = new Date()
        let anoSelect = DLL.getPedacoData(DLL.ConverterData(DLL.formataData(data)), 'ANO');

        if (req.body.ano) {
            anoSelect = req.body.ano;
        }

        let valorTotalPendente = await getGastoTotalPendente(anoSelect);
        let valorTotalPendenteRecebimento = await getCreditoTotalPendente(anoSelect);
        let valorTotalEstimativa = (valorTotalPendenteRecebimento + parseFloat(global.user.saldo)) - valorTotalPendente

        //GASTOS
        let Gastos = await Gasto.getResumoAno();
        let valorTotal = getCustoTotal(Gastos);
        let resumo = await montarResumoAnual(Gastos, anoSelect);
        let totais = getTotalMesResumoAnual(resumo, anoSelect);

        //CREDITOS
        let Creditos = await Credito.getResumoAno();

        let resumoCredi = await montarResumoAnualCredi(Creditos, anoSelect);
        let totaisCredi = getTotalMesResumoAnual(resumoCredi, anoSelect);

        let liquido = await getValorLiquidoMes(anoSelect);

        res.render('carteira_view/consultaGastosAnual', {
            totaisCredi, resumoCredi, totais, anoSelect, resumo,
            valorTotal, valorTotalPendente, valorTotalPendenteRecebimento, valorTotalEstimativa,
            filtros,Origens,Contas,ListaCreditos,ListaGastos,liquido
        });
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

//=============================================================== GASTOS =========================================================================
router.get('/ConsultaGastos', async (req, res) => {
    try {
        filtros = {}
        filtros.motivoGastos = {}
        filtros.conta = {}
        filtros.Situacao = {}
        wheres = []

        let Gastos = await Gasto.getAll();
        let valorTotal = getCustoTotal(Gastos);
        let valorTotalPendente = await getGastoTotalPendente();
        let valorTotalPendenteRecebimento = await getCreditoTotalPendente();
        let valorTotalEstimativa = (valorTotalPendenteRecebimento + parseFloat(global.user.saldo)) - valorTotalPendente
        let Motivos = await MotivoGastos.getAll();
        let Contas = await ContaBancaria.getAll();

        res.render('carteira_view/inicialGastos', { Gastos, valorTotal, Motivos, Contas, filtros, valorTotalPendente, valorTotalPendenteRecebimento, valorTotalEstimativa });
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

router.post('/ClickGastos', async (req, res) => {
    try {
        let Gastos = []
        let Motivos = await MotivoGastos.getAll();
        let Contas = await ContaBancaria.getAll();
        wheres = []

        if (req.body.EDI) {
            if (req.body.valor && req.body.id) {
                let valor = req.body.valor;
                let id = req.body.id;
                await Gasto.EditarValor(id, valor);
            }
        }

        if (req.body.DEL) {
            if (req.body.id) {
                let id = req.body.id
                await Gasto.Dell(id)
            }
        }

        if (req.body.PESQUISAR) {
            if (req.body.motivoGastos) {
                [filtros.motivoGastos.id, filtros.motivoGastos.descricao] = req.body.motivoGastos.split('|');
                wheres.push(`motivo = ${filtros.motivoGastos.id}`);
            }

            if (req.body.formaPagamento) {
                filtros.formaPagamento = req.body.formaPagamento;
                wheres.push(`formaPagamento = '${filtros.formaPagamento}'`);
            }

            if (req.body.conta) {
                [filtros.conta.id, filtros.conta.descricao] = req.body.conta.split('|');
                wheres.push(`contaBancaria = ${filtros.conta.id}`);
            }

            if (req.body.Situacao) {
                [filtros.Situacao.id, filtros.Situacao.descricao] = req.body.Situacao.split('|');
                wheres.push(`situacao = ${filtros.Situacao.id}`);
            }

            if (req.body.dataFim) {
                filtros.dataFim = req.body.dataFim;
                wheres.push(`dt_vencimento <= '${req.body.dataFim}'`);
            }

            if (req.body.dataIni) {
                filtros.dataIni = req.body.dataIni;
                wheres.push(`dt_vencimento >= '${req.body.dataIni}'`);
            }

            //======================================
            Gastos = await Gasto.getAll_Filtros(Func.AnalisaFiltros(wheres));
            let valorTotal = getCustoTotal(Gastos);
            let valorTotalPendente = await getGastoTotalPendente();
            let valorTotalPendenteRecebimento = await getCreditoTotalPendente();
            let valorTotalEstimativa = (valorTotalPendenteRecebimento + parseFloat(global.user.saldo)) - valorTotalPendente
            return res.render('carteira_view/inicialGastos', { Gastos, valorTotal, Motivos, Contas, filtros, valorTotalPendente, valorTotalPendenteRecebimento, valorTotalEstimativa });
        }

        if(filtros.motivoGastos.descricao)
        {
            return res.redirect(`ClickGastos${filtros.motivoGastos.descricao}`)
        }
        else
        {
            return res.redirect('ConsultaGastosResumoAnual')
        }
        
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro });
    }
});

router.get('/ClickGastos:motivo', async (req, res) => {
    try {
        filtros = {}
        filtros.motivoGastos = {}
        filtros.conta = {}
        filtros.Situacao = {}

        let Gastos = []
        let Motivos = await MotivoGastos.getAll();
        let Contas = await ContaBancaria.getAll();
        wheres = []

        let motivo = req.params.motivo
        let idMotivo = await MotivoGastos.getID(motivo);

        if (motivo) {
            filtros.motivoGastos.id = idMotivo
            filtros.motivoGastos.descricao = motivo
            wheres.push(`motivo = ${filtros.motivoGastos.id}`);
        }

        //======================================
        Gastos = await Gasto.getAll_Filtros(Func.AnalisaFiltros(wheres));
        let valorTotal = getCustoTotal(Gastos);
        let valorTotalPendente = await getGastoTotalPendente();
        let valorTotalPendenteRecebimento = await getCreditoTotalPendente();
        let valorTotalEstimativa = (valorTotalPendenteRecebimento + parseFloat(global.user.saldo)) - valorTotalPendente
        return res.render('carteira_view/inicialGastos', { Gastos, valorTotal, Motivos, Contas, filtros, valorTotalPendente, valorTotalPendenteRecebimento, valorTotalEstimativa });

    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro });
    }
});

router.get('/RegistrarGastos:lista', async (req, res) => {
    try {
        filtros = {}
        filtros.motivoGastos = {}
        let Motivos = await MotivoGastos.getAll();
        let Contas = await ContaBancaria.getAll();

        if (req.params.lista) {
            let [motivo, mes, ano] = req.params.lista.split('|')
            let idMotivo = await MotivoGastos.getID(motivo);

            filtros.motivoGastos.id = idMotivo
            filtros.motivoGastos.descricao = motivo

            res.render('carteira_view/registrarGastos', { Motivos, Contas, filtros, mes, ano });
        }
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

router.post('/CofirmarRegistroGastos', async (req, res) => {
    try {
        let situacao = 1;//PENDENTE
        let inAnoTodo = false;
        let dataRegistro = null;
        let qtParcelas = 0;
        let inValorBruto = false;
        let inFatura = false;

        if (!req.body.valor) {
            return res.render('feed', { erro: 'Informe o valor' })
        }

        if (!req.body.motivoGastos) {
            return res.render('feed', { erro: 'Informe o motivo' })
        }

        if (!req.body.dtVencimento) {
            return res.render('feed', { erro: 'Informe a data de vencimento' })
        }

        if (!req.body.formaPagamento) {
            return res.render('feed', { erro: 'Informe a forma de pagamento' })
        }

        if (!req.body.conta) {
            return res.render('feed', { erro: 'Informe a conta' })
        }

        if (req.body.pago) {
            situacao = 3;//PAGO
            dataRegistro = new Date();
            dataRegistro = DLL.ConverterData(DLL.formataData(dataRegistro))
            await Credito.DiminuiSaldo(req.body.valor);
        }

        if (req.body.fimAno) {
            inAnoTodo = true;
        }

        if (req.body.fatura) {
            inFatura = true;
        }

        if (req.body.parcelado)//PARCELADO
        {
            if (!req.body.qtParcelas) {
                return res.render('feed', { erro: 'Informe a quantidade de parcelas' })
            }

            if (!req.body.tpValor) {
                return res.render('feed', { erro: 'Selecione um tipo de valor' })
            }

            qtParcelas = req.body.qtParcelas;

            if (req.body.tpValor == "B") {
                inValorBruto = true;
            }

            await Gasto.GravarParcelado(req.body.valor, dataRegistro, req.body.dtVencimento, req.body.formaPagamento,
                req.body.motivoGastos, situacao, req.body.conta, qtParcelas, inValorBruto, inFatura)

        }
        else if (req.body.orcamento)//ORCAMENTO
        {
            await Gasto.GravarOrcamento(req.body.valor, req.body.dtVencimento, req.body.formaPagamento,
                req.body.motivoGastos, req.body.conta, inAnoTodo)
        }
        else//NORMAL
        {
            await Gasto.Gravar(req.body.valor, dataRegistro, req.body.dtVencimento, req.body.formaPagamento,
            req.body.motivoGastos, situacao, req.body.conta, inAnoTodo, inFatura)
        }

        return res.redirect('ConsultaGastosResumoAnual')
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

//PAGAR - CONSUMIR - DELETAR ORCAMENTO - ADD  FATURA
router.post('/PagarGasto', async (req, res) => {
    try {
        if (req.body.CONF_ADD_FATURA) {
            await Fatura.AddGasto(idGasto);
            return res.redirect('ConsultaGastosResumoAnual')
        }

        if (req.body.ADD_FATURA) {
            idGasto = req.body.ADD_FATURA;
            return res.render('fatura_view/feedAdd')
        }

        if (req.body.PAGAR)
        {
            idGasto = req.body.PAGAR;
            gasto = await Gasto.getGastoID(idGasto);
            await Gasto.Pagar(idGasto, gasto.valor);
            return res.redirect('ConsultaGastosResumoAnual')
        }

        if (req.body.CONSUMIR) 
        {
            idGasto = req.body.idRegistroOrcGasto;
            gasto = await Gasto.getGastoID(idGasto);

            await Gasto.Consumir(gasto, req.body.valor, req.body.dataConsumo);
            return res.redirect('ConsultaGastosResumoAnual')
        }

        if (req.body.DEL) {
            idGasto = req.body.DEL;
            return res.render('carteira_view/feedDellOrcamento')
        }

        if (req.body.CONF_DELL_ORC) {
            await Gasto.DelOrcamento(idGasto);
            res.redirect('/Carteira/ConsultaGastos');
        }
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

router.post('/ConfirmaEdicaoGasto', async (req, res) => {
    try {
        if (req.body.CONFIRMADO) {
            if (!req.body.valor) {
                return res.render('feed', { erro: 'Informe o valor' })
            }

            let [id,] = req.body.CONFIRMADO.split('|');
            let valor = req.body.valor

            await Gasto.EditarValor(id, valor);
            res.redirect('/Carteira/ConsultaGastosResumoAnual');
        }
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

//===================================================================== SALDO USUARIO ==============================================================
router.get('/DefinirSaldoUsuario', async (req, res) => {
    try {
        return res.render('carteira_view/definirSaldo')
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

router.post('/AlterarSaldo', async (req, res) => {
    try {
        if (req.body.saldo) {
            await Credito.AtualizaSaldo(req.body.saldo);
            return res.redirect('ConsultaGastosResumoAnual')
        }
        else {
            return res.render('feed', { erro: 'Informe o novo saldo' })
        }
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

//======================================================================== CREDITOS ===============================================================
router.get('/ConsultaCreditos', async (req, res) => {
    try {
        filtros = {}
        filtros.origemCredito = {}
        filtros.conta = {}
        filtros.Situacao = {}
        wheres = []

        let Creditos = await Credito.getAll();
        let valorTotal = getCustoTotal(Creditos);
        let valorTotalPendenteRecebimento = await getCreditoTotalPendente();
        let valorTotalPendente = await getGastoTotalPendente();
        let valorTotalEstimativa = (valorTotalPendenteRecebimento + parseFloat(global.user.saldo)) - valorTotalPendente
        let Origens = await Origem.getAll();
        let Contas = await ContaBancaria.getAll();

        res.render('carteira_view/inicialCreditos', { Creditos, valorTotal, Origens, Contas, filtros, valorTotalPendente, valorTotalPendenteRecebimento, valorTotalEstimativa });
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

router.post('/ClickCreditos', async (req, res) => {
    try {
        let Creditos = []
        let Origens = await Origem.getAll();
        let Contas = await ContaBancaria.getAll();
        wheres = []

        if (req.body.EDI) {
            if (req.body.valor && req.body.id) {
                let valor = req.body.valor;
                let id = req.body.id;
                await Credito.EditarValor(id, valor);
            }
        }

        if (req.body.DEL) {
            if (req.body.id) {
                let id = req.body.id
                await Credito.Dell(id)
            }
        }

        if (req.body.PESQUISAR) {
            if (req.body.origemCredito) {
                [filtros.origemCredito.id, filtros.origemCredito.descricao] = req.body.origemCredito.split('|');
                wheres.push(`origemCredito = ${filtros.origemCredito.id}`);
            }

            if (req.body.conta) {
                [filtros.conta.id, filtros.conta.descricao] = req.body.conta.split('|');
                wheres.push(`contaBancaria = ${filtros.conta.id}`);
            }

            if (req.body.Situacao) {
                [filtros.Situacao.id, filtros.Situacao.descricao] = req.body.Situacao.split('|');
                wheres.push(`situacao = ${filtros.Situacao.id}`);
            }

            if (req.body.dataFim) {
                filtros.dataFim = req.body.dataFim;
                wheres.push(`dt_previsao <= '${req.body.dataFim}'`);
            }

            if (req.body.dataIni) {
                filtros.dataIni = req.body.dataIni;
                wheres.push(`dt_previsao >= '${req.body.dataIni}'`);
            }

            //======================================
            Creditos = await Credito.getAll_Filtros(Func.AnalisaFiltros(wheres));

            let valorTotal = getCustoTotal(Creditos);
            let valorTotalPendenteRecebimento = await getCreditoTotalPendente();
            let valorTotalPendente = await getGastoTotalPendente();
            let valorTotalEstimativa = (valorTotalPendenteRecebimento + parseFloat(global.user.saldo)) - valorTotalPendente
            return res.render('carteira_view/inicialCreditos', { Creditos, valorTotal, Origens, Contas, filtros, valorTotalPendente, valorTotalPendenteRecebimento, valorTotalEstimativa });
        }


        if(filtros.origemCredito.descricao)
        {
            return res.redirect(`ClickCreditos${filtros.origemCredito.descricao}`)
        }
        else
        {
            return res.redirect('ConsultaGastosResumoAnual')
        }
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro });
    }
});

router.get('/ClickCreditos:motivo', async (req, res) => {
    try {
        filtros = {}
        filtros.origemCredito = {}
        filtros.conta = {}
        filtros.Situacao = {}
        let Creditos = []
        let Origens = await Origem.getAll();
        let Contas = await ContaBancaria.getAll();
        wheres = []


        let motivo = req.params.motivo
        let id = await Origem.getID(motivo)

        if (motivo) {
            filtros.origemCredito.id = id
            filtros.origemCredito.descricao = motivo
            wheres.push(`origemCredito = ${filtros.origemCredito.id}`);
        }

        //======================================
        Creditos = await Credito.getAll_Filtros(Func.AnalisaFiltros(wheres));

        let valorTotal = getCustoTotal(Creditos);
        let valorTotalPendenteRecebimento = await getCreditoTotalPendente();
        let valorTotalPendente = await getGastoTotalPendente();
        let valorTotalEstimativa = (valorTotalPendenteRecebimento + parseFloat(global.user.saldo)) - valorTotalPendente
        return res.render('carteira_view/inicialCreditos', { Creditos, valorTotal, Origens, Contas, filtros, valorTotalPendente, valorTotalPendenteRecebimento, valorTotalEstimativa });

    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro });
    }
});

router.get('/RegistrarCreditos:lista', async (req, res) => {
    try {
        filtros = {}
        filtros.origemCredito = {}

        let Origens = await Origem.getAll();
        let Contas = await ContaBancaria.getAll();

        if (req.params.lista) {
            let [motivo, mes, ano] = req.params.lista.split('|')
            let idMotivo = await Origem.getID(motivo);

            filtros.origemCredito.id = idMotivo
            filtros.origemCredito.descricao = motivo

            res.render('carteira_view/registrarCreditos', { Origens, Contas, filtros, mes, ano });
        }
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

router.post('/CofirmarRegistroCreditos', async (req, res) => {
    try {
        let situacao = 1;//PENDENTE
        let inAnoTodo = false;
        let dataRecebimento = null;
        let qtParcelas = 0;
        let inValorBruto = false;
       
        if (!req.body.valor) {
            return res.render('feed', { erro: 'Informe o valor' })
        }

        if (!req.body.origemCreditos) {
            return res.render('feed', { erro: 'Informe a Origem dos Creditos' })
        }

        if (!req.body.dtPrevisao) {
            return res.render('feed', { erro: 'Informe a data de Previsao' })
        }

        if (!req.body.conta) {
            return res.render('feed', { erro: 'Informe a conta' })
        }

        if (req.body.recebido) {
            situacao = 2;//RECEBIDO
            dataRecebimento = new Date();
            dataRecebimento = DLL.ConverterData(DLL.formataData(dataRecebimento))
            await Credito.AumentaSaldo(req.body.valor);
        }

        if (req.body.fimAno) {
            inAnoTodo = true;
        }

        if (req.body.parcelado)//PARCELADO
        {
            if (!req.body.qtParcelas) {
                return res.render('feed', { erro: 'Informe a quantidade de parcelas' })
            }

            if (!req.body.tpValor) {
                return res.render('feed', { erro: 'Selecione um tipo de valor' })
            }

            qtParcelas = req.body.qtParcelas;

            if (req.body.tpValor == "B") {
                inValorBruto = true;
            }

            await Credito.GravarParcelado(req.body.valor, dataRecebimento, req.body.dtPrevisao,
                req.body.origemCreditos, situacao, req.body.conta, qtParcelas, inValorBruto)

        }
        else//NORMAL
        {
            await Credito.Gravar(req.body.valor, dataRecebimento, req.body.dtPrevisao,
                req.body.origemCreditos, situacao, req.body.conta, inAnoTodo)
        }

        return res.redirect('ConsultaGastosResumoAnual')

    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

router.post('/ReceberCredito', async (req, res) => {
    try {

        if (req.body.RECEBER) {
            idCredito = req.body.RECEBER;
            credito = await Credito.getCreditoID(idCredito);

            return res.render('carteira_view/feedDellCreditos')
        }

        if (req.body.CONFIRMADO) {
            await Credito.Receber(idCredito, credito.valor);
            res.redirect('/Carteira/ConsultaGastosResumoAnual');
        }
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

router.post('/ConfirmaEdicaoCredito', async (req, res) => {
    try {
        if (req.body.CONFIRMADO) {
            if (!req.body.valor) {
                return res.render('feed', { erro: 'Informe o valor' })
            }

            let [id,] = req.body.CONFIRMADO.split('|');
            let valor = req.body.valor

            await Credito.EditarValor(id, valor);
            res.redirect('/Carteira/ConsultaCreditos');
        }
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

//======================================================================== LOCAL PROC =============================================================
function getCustoTotal(lista) {
    let resultado = 0;

    for (const prod of lista) {
        resultado += parseFloat(prod.valor)
    }

    return resultado;
}

async function getGastoTotalPendente(ano) {
    let Gastos = await Gasto.getAll();
    let resultado = 0;
   
    for (const prod of Gastos) {       
        let anoGasto =  DLL.getPedacoData(DLL.ConverterData(prod.dt_vencimento),"ANO")

        if (prod.situacao != 'PAGO' && anoGasto == ano) {
          
            resultado += parseFloat(prod.valor)
        }
    }

    return resultado;
}

async function getCreditoTotalPendente(ano) {
    let Creditos = await Credito.getAll();
    let resultado = 0;

    for (const prod of Creditos) {

        let anoCredi =  DLL.getPedacoData(DLL.ConverterData(prod.dt_previsao),"ANO")

        if (prod.situacao != 'RECEBIDO' && anoCredi == ano) {
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
            obj.id = await MotivoGastos.getID(m.descricao)
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
   
    for (const m of Motivos) {
        for (const g of creditos) {
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
            obj.id = await Origem.getID(m.descricao)
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
    for (const l of lista) {
        if (l.motivo == motivo) {
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

async function getValorLiquidoMes(ano)
{
    let liquido = {}

    let data = new Date()
    let mesRef = DLL.getPedacoData(DLL.ConverterData(DLL.formataData(data)), 'MES');   
    liquido.mesRef = parseInt(mesRef)

    let saldo = parseFloat(global.user.saldo);

    liquido.mes = []

    for(let i = 1; i <= 12;i++)
    {
        liquido.mes[i] = 'FECHADO'
    }

    for(let i = (mesRef -2); i <= 12;i++)
    {
        let subTotal = (saldo + await getCreditoTotalPendenteMes(i,ano)) - await getGastoTotalPendenteMes(i,ano)   
        saldo = subTotal;
        liquido.mes[i] = saldo;
    }
  
   return liquido
}

async function getGastoTotalPendenteMes(mes,ano) {
    let Gastos = await Gasto.getAll();
    let resultado = 0;
   
    for (const prod of Gastos) {  

        if (prod.situacao != 'PAGO' && prod.ano == ano && prod.mes == mes) {
          
            resultado += parseFloat(prod.valor)
        }
    }

    return resultado;
}

async function getCreditoTotalPendenteMes(mes,ano) {
    let Creditos = await Credito.getAll();
    let resultado = 0;

    for (const prod of Creditos) {

        if (prod.situacao != 'RECEBIDO' && prod.ano == ano && prod.mes == mes) {
            resultado += parseFloat(prod.valor)
        }
    }

    return resultado;
}

module.exports = router;