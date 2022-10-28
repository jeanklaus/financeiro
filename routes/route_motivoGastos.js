const express = require('express');
const bodyparser = require('body-parser');
const Motivo = require('../services/s_motivoGastos')

const router = express.Router();
router.use(bodyparser.urlencoded({ extended: false }));

//=============================================================

router.get('/',async (req,res) => {
    try
    {  
        let Motivos = await Motivo.getAll()  
        res.render('motivoGastos_view/inicial',{Motivos});
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
        if(req.body.CONF_DEL)
        {
            if(req.body.GASTO)
            {                
                let gasto = req.body.GASTO
                let id = await Motivo.getID(gasto)
                await Motivo.Del(id);
                res.redirect('/Carteira/ConsultaGastosResumoAnual')
                return;
            }
        }

        if(req.body.EDI)
        {
            let [id,nome] = req.body.EDI.split('|')
            res.render("motivoGastos_view/editar",{id,nome})
        }

        if(req.body.CONFIRMAR_ADD)
        {
           if(req.body.nome)
           {
             let result = await Motivo.Gravar(req.body.nome.toUpperCase())             
             if(result.affectedRows > 0)
             {
                res.redirect('/Carteira/ConsultaGastosResumoAnual')
                return;
             } 
             else
             {
                throw("Ocorreu um erro ao tentar gravar")
             }            
           }
           else
           {
                throw("O campo de descrição não pode estar vazio")                
           }          
        }

        if(req.body.CONFIRMAR_EDI)
        {
           if(req.body.nome)
           {
             let id = req.body.CONFIRMAR_EDI;
             let nome =  req.body.nome.toUpperCase()  
                      
             let result = await Motivo.Update(id,nome)             
             if(result.affectedRows > 0)
             {
                res.render('motivoGastos_view/feed',{status:'success',txt:'Registro alterado com sucesso!'})
                return;
             } 
             else
             {
                throw("Ocorreu um erro ao tentar alterar")
             }            
           }
           else
           {
                throw("O campo de descrição não pode estar vazio")                
           }          
        }

       return res.redirect('/Carteira/ConsultaGastosResumoAnual') 
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro});
    } 
});

router.get('/AbrirAdicao',async (req,res) => {
    try
    { 
        res.render("motivoGastos_view/adicionar");
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro});
    } 
});



module.exports = router;