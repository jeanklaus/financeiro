const express = require('express');
const bodyparser = require('body-parser');
const Fatura = require('../services/s_fatura')
const MotivoGastos = require('../services/s_motivoGastos')
const ContaBancaria = require('../services/s_contaBancaria')
const Func = require('../public/funcoes');

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
        let dataSelect = ""

        let Faturas = await Fatura.getAll();

        res.render('fatura_view/inicial',{dataSelect,Faturas,Motivos,Contas,filtros,itemsFatura : []});
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
        let dataSelect = ""
        let itemsFatura = []

        wheres.push(`f.usuario = ${global.user.id}`);

        if(req.body.mes)
        {
            dataSelect = req.body.mes
            let [ano,mes] = dataSelect.split('-')            
            wheres.push(`mes = ${mes}`);
            wheres.push(`ano = ${ano}`);
        }

        if(req.body.DETALHES)
        {
           let [id,mes,ano] = req.body.DETALHES.split('|')
           itemsFatura = await Fatura.getItemsFatura(id);

            if(mes < 10)
            {
                mes = `0${mes}`
            }

           dataSelect = `${ano}-${mes}`
           wheres.push(`mes = ${mes}`);
           wheres.push(`ano = ${ano}`);
        }

        if (req.body.conta) {
            let [idconta,descricao] = req.body.conta.split('|')
            filtros.conta.id = idconta;
            filtros.conta.descricao = descricao;
            wheres.push(`conta = ${idconta}`);
        }
      
        if(req.body.DEL_ITEM)
        {
            let [fatura,gasto] = req.body.DEL_ITEM.split('|')
            await Fatura.RemoverItem(fatura,gasto);
            return res.redirect('/Fatura')
        }

        if(req.body.PAGAR)
        {
            let fatura =  req.body.PAGAR
            await Fatura.Pagar(fatura);
            return res.render('fatura_view/feed',{status:'success',txt:`Fatura Paga!`});
        }
    
        let Faturas = await Fatura.getAllFiltros(Func.AnalisaFiltros(wheres)) 

        return res.render('fatura_view/inicial',{dataSelect,Faturas,Motivos,Contas,filtros,itemsFatura});
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro});
    } 
});

module.exports = router;