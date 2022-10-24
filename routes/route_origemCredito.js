const express = require('express');
const bodyparser = require('body-parser');
const Origem = require('../services/s_origemCredito')

const router = express.Router();
router.use(bodyparser.urlencoded({ extended: false }));

//=============================================================

router.get('/',async (req,res) => {
    try
    {  
        let Origens = await Origem.getAll()  
        res.render('origemCredito_view/inicial',{Origens});
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
        if(req.body.DEL)
        {
            let credito = req.body.DEL
            let id = await Origem.getID(credito)
            return res.render("origemCredito_view/excluir",{credito,id})
        }

        if(req.body.CONF_DEL)
        {
            let id = req.body.CONF_DEL
            await Origem.Del(id);
            res.render('origemCredito_view/feed',{status:'success',txt:'Excluido com secesso!'})
            return;
        }


        if(req.body.ADD)
        {
            return res.render("origemCredito_view/adicionar")
        }

        if(req.body.EDI)
        {
            let [id,nome] = req.body.EDI.split('|')
            res.render("origemCredito_view/editar",{id,nome})
        }

        if(req.body.CONFIRMAR_ADD)
        {
           if(req.body.nome)
           {
             let result = await Origem.Gravar(req.body.nome.toUpperCase())             
             if(result.affectedRows > 0)
             {
                res.render('origemCredito_view/feed',{status:'success',txt:'Registro gravado com sucesso!'})
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
                      
             let result = await Origem.Update(id,nome)             
             if(result.affectedRows > 0)
             {
                res.render('origemCredito_view/feed',{status:'success',txt:'Registro alterado com sucesso!'})
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
        res.render("origemCredito_view/adicionar")        
    }
    catch(erro)
    {
        global.conectado = false;      
        res.render('feed',{erro});
    } 
});


module.exports = router;