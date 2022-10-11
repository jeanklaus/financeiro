const express = require('express');
const bodyparser = require('body-parser');
const Fatura = require('../services/s_fatura')
const MotivoGastos = require('../services/s_motivoGastos')
const ContaBancaria = require('../services/s_contaBancaria')

const router = express.Router();
router.use(bodyparser.urlencoded({ extended: false }));

//=============================================================

router.get('/',async (req,res) => {
    try    
    {  
        filtros = {}
        filtros.motivoGastos = {}
        filtros.conta = {}
        filtros.Situacao = {}
        wheres = []

        let Motivos = await MotivoGastos.getAll();
        let Contas = await ContaBancaria.getAll();


        let GastosFatura = await Fatura.getAll() 
        res.render('fatura_view/inicial',{GastosFatura,Motivos,Contas,filtros});
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro});
    } 
});

router.post('/Click',async (req,res) => {
    try
    {        
        if(req.body.PAGAR)
        {
            res.render("fatura_view/feedPagar")
        }

        if(req.body.CONFIRMAR)
        {
           await Fatura.Pagar();
           res.render('fatura_view/feed',{status:'success',txt:'Fatura Paga!'})
        }
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro});
    } 
});

module.exports = router;