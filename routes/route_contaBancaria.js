const express = require('express');
const bodyparser = require('body-parser');
const Conta = require('../services/s_contaBancaria')

const router = express.Router();
router.use(bodyparser.urlencoded({ extended: false }));

//=============================================================

router.get('/',async (req,res) => {
    try
    {  
        let Contas = await Conta.getAll()  
        res.render('contaBancaria_view/inicial',{Contas});
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
        if(req.body.ADD)
        {
            res.render("contaBancaria_view/adicionar")
        }

        if(req.body.EDI)
        {
            let [id,nome] = req.body.EDI.split('|')
            res.render("contaBancaria_view/editar",{id,nome})
        }

        if(req.body.CONFIRMAR_ADD)
        {
           if(req.body.nome)
           {
             let result = await Conta.Gravar(req.body.nome.toUpperCase())             
             if(result.affectedRows > 0)
             {
                res.render('contaBancaria_view/feed',{status:'success',txt:'Conta gravada com sucesso!'})
                return;
             } 
             else
             {
                throw("Ocorreu um erro ao tentar gravar Conta")
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
                      
             let result = await Conta.Update(id,nome)             
             if(result.affectedRows > 0)
             {
                res.render('contaBancaria_view/feed',{status:'success',txt:'Conta alterada com sucesso!'})
                return;
             } 
             else
             {
                throw("Ocorreu um erro ao tentar alterar a Conta")
             }            
           }
           else
           {
                throw("O campo de descrição não pode estar vazio")                
           }          
        }
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro});
    } 
});

module.exports = router;