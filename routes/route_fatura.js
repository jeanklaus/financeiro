const express = require('express');
const bodyparser = require('body-parser');
const Fatura = require('../services/s_fatura')
const MotivoGastos = require('../services/s_motivoGastos')
const ContaBancaria = require('../services/s_contaBancaria')
const DLL = require('../public/DLL');

const router = express.Router();
router.use(bodyparser.urlencoded({ extended: false }));

//=============================================================

router.get('/',async (req,res) => {
    try    
    {  
        filtros = {}
        filtros.conta = {}
        wheres = []

        let Motivos = await MotivoGastos.getAll();
        let Contas = await ContaBancaria.getAll();
        let GastosFatura = []

        let data = new Date();
        let mes = DLL.getPedacoData(DLL.ConverterData(DLL.formataData(data)),'MES')
        let ano = DLL.getPedacoData(DLL.ConverterData(DLL.formataData(data)),'ANO')
        let dataInicial = `${ano}-${mes}`

        res.render('fatura_view/inicial',{dataInicial,GastosFatura,Motivos,Contas,filtros});
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro});
    } 
});

//atualizar - pagar
router.post('/Atualizar',async (req,res) => {
    try    
    {  
        filtros = {}
        filtros.conta = {}
        wheres = []

        let Motivos = await MotivoGastos.getAll();
        let Contas = await ContaBancaria.getAll();

        let data = new Date();
        let mes = DLL.getPedacoData(DLL.ConverterData(DLL.formataData(data)),'MES')
        let ano = DLL.getPedacoData(DLL.ConverterData(DLL.formataData(data)),'ANO')
        let dataInicial = `${ano}-${mes}`

        if(req.body.mes)
        {
            dataInicial = req.body.mes
        }

        if(!req.body.conta)
        {
            return res.render('feed', { erro: 'Informe a conta' })
        }
        else
        {
            let [idconta,descricao] = req.body.conta.split('|')
            filtros.conta.id = idconta;
            filtros.conta.descricao = descricao;
        }
       
        let GastosFatura = await Fatura.get(filtros.conta.id,dataInicial) 
      
        if(req.body.DEL)
        {
            let id = req.body.DEL;
            await Fatura.Remover(id);
            return res.redirect('/Fatura')
        }

        if(req.body.PAGAR)
        {
            await Fatura.Pagar(GastosFatura);
            return res.render('fatura_view/feed',{status:'success',txt:'Fatura Paga!'});
        }

        return res.render('fatura_view/inicial',{dataInicial,GastosFatura,Motivos,Contas,filtros});
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro});
    } 
});

module.exports = router;