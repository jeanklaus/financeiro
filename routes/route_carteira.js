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
const LocalProc = require('../public/localProcCarteira');
const Tag = require('../services/s_tag')
const ControleValidade = require('../services/s_controleValidade')

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

//GENERICO USADO QUANDO QUISER - sem lugar certo
let mes = 0
let ano = 0
let conta = 0;
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
        let anoSelect = data.getFullYear()

        //GASTOS
        let Gastos = await Gasto.getResumoAno();
        let valorTotal = LocalProc.getCustoTotal(Gastos);
        let resumo = await LocalProc.montarResumoAnual(Gastos, anoSelect,ListaGastos);
        let totais = LocalProc.getTotalMesResumoAnual(resumo, anoSelect);
     
        //CREDITOS
        let Creditos = await Credito.getResumoAno();        
        let resumoCredi =  await LocalProc.montarResumoAnualCredi(Creditos, anoSelect,ListaCreditos);
        let totaisCredi = LocalProc.getTotalMesResumoAnual(resumoCredi, anoSelect); 
        
        let liquidez = await LocalProc.getValorLiquidoMes(anoSelect,ListaCreditos,ListaGastos);
       
        res.render('carteira_view/consultaGastosAnual', {
            totaisCredi, resumoCredi, totais, anoSelect, resumo,
            valorTotal,filtros,Origens,Contas,ListaCreditos,ListaGastos,liquidez
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
        let anoSelect = data.getFullYear();

        if (req.body.ano) {
            anoSelect = req.body.ano;
        }

        //GASTOS
        let Gastos = await Gasto.getResumoAno();
        let valorTotal = LocalProc.getCustoTotal(Gastos);
        let resumo = await LocalProc.montarResumoAnual(Gastos, anoSelect,ListaGastos);
        let totais = LocalProc.getTotalMesResumoAnual(resumo, anoSelect);

        //CREDITOS
        let Creditos = await Credito.getResumoAno();

        let resumoCredi =  await LocalProc.montarResumoAnualCredi(Creditos, anoSelect,ListaCreditos);
        let totaisCredi = LocalProc.getTotalMesResumoAnual(resumoCredi, anoSelect);

        let liquidez = await LocalProc.getValorLiquidoMes(anoSelect,ListaCreditos,ListaGastos);

        res.render('carteira_view/consultaGastosAnual', {
            totaisCredi, resumoCredi, totais, anoSelect, resumo,
            valorTotal,filtros,Origens,Contas,ListaCreditos,ListaGastos,liquidez
        });
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

router.get('/ConsultandoGastosResumoAnual:ano', async (req, res) => {
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
        let anoSelect = data.getFullYear();

        if (req.params.ano) {
            anoSelect = req.params.ano;
        }

        //GASTOS
        let Gastos = await Gasto.getResumoAno();
        let valorTotal = LocalProc.getCustoTotal(Gastos);
        let resumo = await LocalProc.montarResumoAnual(Gastos, anoSelect,ListaGastos);
        let totais = LocalProc.getTotalMesResumoAnual(resumo, anoSelect);

        //CREDITOS
        let Creditos = await Credito.getResumoAno();

        let resumoCredi =  await LocalProc.montarResumoAnualCredi(Creditos, anoSelect,ListaCreditos);
        let totaisCredi = LocalProc.getTotalMesResumoAnual(resumoCredi, anoSelect);

        let liquidez = await LocalProc.getValorLiquidoMes(anoSelect,ListaCreditos,ListaGastos);

        res.render('carteira_view/consultaGastosAnual', {
            totaisCredi, resumoCredi, totais, anoSelect, resumo,
            valorTotal,filtros,Origens,Contas,ListaCreditos,ListaGastos,liquidez
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
        let valorTotal = LocalProc.getCustoTotal(Gastos);
        let Motivos = await MotivoGastos.getAll();
        let Contas = await ContaBancaria.getAll();

        res.render('carteira_view/inicialGastos', { Gastos, valorTotal, Motivos, Contas, filtros });
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
        let inReflash = false
        wheres = []

        if (req.body.EDI) {
            if (req.body.valor && req.body.id) {
                let valor = req.body.valor;
                let id = req.body.id;
                await Gasto.EditarValor(id, valor,req.body.inAnoTodo);

               if(!req.body.ano)
               {
                    inReflash = true
               }
               else
               {
                    let ano =  req.body.ano
                    return res.redirect(`ConsultandoGastosResumoAnual${ano}`)
               }
            }
        }

        if (req.body.DEL) {
            if (req.body.id) {
                let id = req.body.id
                await Gasto.Dell(id)
                let ano =  req.body.ano
                return res.redirect(`ConsultandoGastosResumoAnual${ano}`)
            }
        }

        if (req.body.PESQUISAR || inReflash) {
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
            let valorTotal = LocalProc.getCustoTotal(Gastos);
            return res.render('carteira_view/inicialGastos', { Gastos, valorTotal, Motivos, Contas, filtros });
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
        let valorTotal = LocalProc.getCustoTotal(Gastos);
        return res.render('carteira_view/inicialGastos', { Gastos, valorTotal, Motivos, Contas, filtros });

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
        let tag = null;
       
        if (req.body.tag) {
          tag = req.body.tag.trim()
        }

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
        else
        {
            if(req.body.formaPagamento == "CREDITO")
            {
                inFatura = true;
            }
        }

        if (!req.body.conta) {
            return res.render('feed', { erro: 'Informe a conta' })
        }

        if (req.body.pago) {
            situacao = 3;//PAGO
            dataRegistro = new Date();
            dataRegistro = DLL.ConverterData(DLL.formataData(dataRegistro))
        }

        if (req.body.pagoDesconta) {
            situacao = 3;//PAGO
            dataRegistro = new Date();
            dataRegistro = DLL.ConverterData(DLL.formataData(dataRegistro))
            await Credito.DiminuiSaldo(req.body.valor);
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

            await Gasto.GravarParcelado(req.body.valor, dataRegistro, req.body.dtVencimento, req.body.formaPagamento,
                req.body.motivoGastos, situacao, req.body.conta, qtParcelas, inValorBruto, inFatura,tag)

        }
        else if (req.body.orcamento)//ORCAMENTO
        {
            await Gasto.GravarOrcamento(req.body.valor, req.body.dtVencimento, req.body.formaPagamento,
                req.body.motivoGastos, req.body.conta, inAnoTodo,tag)
        }
        else//NORMAL
        {
            await Gasto.Gravar(req.body.valor, dataRegistro, req.body.dtVencimento, req.body.formaPagamento,
            req.body.motivoGastos, situacao, req.body.conta, inAnoTodo, inFatura,tag)
        }

        let ano =   DLL.getPedacoData(req.body.dtVencimento,"ANO");
        return res.redirect(`ConsultandoGastosResumoAnual${ano}`)
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

//PAGAR - CONSUMIR - DELETAR ORCAMENTO - ADD  FATURA
router.post('/PagarGasto', async (req, res) => {
    try {
       
        if (req.body.CONF_ADD_FATURA) 
        {
            await Fatura.AddGasto(idGasto,mes,ano,conta);
            return res.redirect('ConsultaGastosResumoAnual')
        }

        if (req.body.ADD_FATURA) {
            [idGasto,mes,ano,conta] = req.body.ADD_FATURA.split('|');
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
            let inZerar = false;

            if(req.body.inZerar)
            {
                inZerar = true
            }

            idGasto = req.body.idRegistroOrcGasto;
            gasto = await Gasto.getGastoID(idGasto);
            
            await Gasto.Consumir(gasto, req.body.valor, req.body.dataConsumo,inZerar,req.body.inFatura,req.body.inPaga);
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

//======================================================================== CREDITOS ===============================================================
router.get('/ConsultaCreditos', async (req, res) => {
    try {
        filtros = {}
        filtros.origemCredito = {}
        filtros.conta = {}
        filtros.Situacao = {}
        wheres = []

        let Creditos = await Credito.getAll();
        let valorTotal = LocalProc.getCustoTotal(Creditos);       
        let Origens = await Origem.getAll();
        let Contas = await ContaBancaria.getAll();       

        res.render('carteira_view/inicialCreditos', { Creditos, valorTotal, Origens, Contas, filtros });
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
        let inReflash = false
        wheres = []

        if (req.body.EDI) {
            if (req.body.valor && req.body.id) {
                let valor = req.body.valor;
                let id = req.body.id;
                await Credito.EditarValor(id, valor,req.body.inAnoTodo);

                if(req.body.ano == 0)
                {
                    inReflash = true;
                }
                else
                {
                    let ano =  req.body.ano
                    return res.redirect(`ConsultandoGastosResumoAnual${ano}`)
                }
            }
        }

        if (req.body.DEL) {
            if (req.body.id) {
                let id = req.body.id
                await Credito.Dell(id)
                let ano =  req.body.ano
                return res.redirect(`ConsultandoGastosResumoAnual${ano}`)
            }
        }

        if (req.body.PESQUISAR || inReflash) {
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
            let valorTotal = LocalProc.getCustoTotal(Creditos);
          
            return res.render('carteira_view/inicialCreditos', { Creditos, valorTotal, Origens, Contas, filtros });
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

        let valorTotal = LocalProc.getCustoTotal(Creditos);
       
        return res.render('carteira_view/inicialCreditos', { Creditos, valorTotal, Origens, Contas, filtros });

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
        let tag = null;
       
        if (req.body.tag) {
          tag = req.body.tag.trim()
        }

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

        if (req.body.recebidoSimbolico) {
            situacao = 2;//RECEBIDO
            dataRecebimento = new Date();
            dataRecebimento = DLL.ConverterData(DLL.formataData(dataRecebimento))
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
                req.body.origemCreditos, situacao, req.body.conta, qtParcelas, inValorBruto,tag)

        }
        else if (req.body.orcamento)//ORCAMENTO
        {
            await Credito.GravarOrcamento(req.body.valor, req.body.dtPrevisao,
            req.body.origemCreditos, req.body.conta, inAnoTodo,tag)
        }
        else//NORMAL
        {
            await Credito.Gravar(req.body.valor, dataRecebimento, req.body.dtPrevisao,
                req.body.origemCreditos, situacao, req.body.conta, inAnoTodo,tag)
        }

        let ano =   DLL.getPedacoData(req.body.dtPrevisao,"ANO");
        return res.redirect(`ConsultandoGastosResumoAnual${ano}`)

    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro })
    }
});

router.post('/ReceberCredito', async (req, res) => {
    try {

        if (req.body.CONSUMIR) 
        {
            let inZerar = false;

            if(req.body.inZerar)
            {
                inZerar = true
            }

            idCredito = req.body.idRegistroOrcCredito;
            credito = await Credito.getCreditoID(idCredito);
            
            await Credito.Consumir(credito, req.body.valor, req.body.dataConsumo,inZerar,req.body.inRecebida);
            return res.redirect('ConsultaGastosResumoAnual')
        }

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

//======================================================================== TAG ===============================================================
router.post('/ClickTag', async (req, res) => {
    try {

        if (req.body.DEL) 
        {
          await Tag.Del(req.body.id,req.body.tp)       
        }

        if (req.body.ADD) 
        {
            await Tag.Add(req.body.id,req.body.descricao,req.body.tp)     
        }
        
        return res.redirect('ConsultaGastosResumoAnual')
        
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro });
    }
});

//======================================================================== EVENTO MERCADO PAGO ===============================================================
router.post('/Evento_1', async (req, res) => {
    try {

        await ControleValidade.gerarLog(1);
        return 0
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro });
    }
});

router.post('/Evento_2', async (req, res) => {
    try {

      await ControleValidade.gerarLog(2);
      return 0
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro });
    }
});

router.post('/Evento_3', async (req, res) => {
    try {

        await ControleValidade.gerarLog(3);
        return 0
    }
    catch (erro) {
        global.conectado = false;
        res.render('feed', { erro });
    }
});

module.exports = router;