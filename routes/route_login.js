const express = require('express');
const bodyparser = require('body-parser');
const Usuario = require('../services/s_usuario')
const DLL = require('../public/DLL');

const router = express.Router();
router.use(bodyparser.urlencoded({ extended: true }));

//=============================================================

router.post('/',async (req,res) => {
    try
    {
        global.user = {}
        global.logado = false;  
        global.conectado = false;  

        const mysql = require("mysql2/promise"); 
            
        const connection = mysql.createPool({
            host:'ns847.hostgator.com.br', 
            user:'tornei65_jeanadm',
            database: 'tornei65_financeiro',
            password:'PpOoIi876@',
            waitForConnections: true,
            connectionLimit: 20,
            queueLimit: 0
          });
      
        let sql =  `SELECT id,nome,login,senha,saldo,dt_validade,email FROM Usuario WHERE login = ? AND senha = ?`
        let values = [req.body.login,req.body.senha]
        const [rows] = await connection.query(sql,values);

       if(rows[0])
       {
            global.user.id = rows[0].id; 
            global.user.nome = rows[0].nome; 
            global.user.saldo = rows[0].saldo; 
            global.user.validade = rows[0].dt_validade;
            global.user.email = rows[0].email;

            let data = new Date()
            
            if(data > global.user.validade)
            {
                global.user.inVencido = true
            }
            else
            { 
                global.user.inVencido = false
            }

            global.user.validade = DLL.formataData(global.user.validade)
            global.logado = true;  
            global.conectado = false;
            res.redirect('/Menu');
       }
       else
       {
            return res.send("USUARIO OU SENHA INCORRETO");
       }
    }
    catch(erro)
    {       
        global.conectado = false;
        global.user = {}
        global.logado = false;
       res.render('feed',{erro})
    }  
});

router.post('/CadastroUsuario',async (req,res) => {
    try
    {
      if(req.body.CADASTRAR)
      {
        if(req.body.senha != req.body.confirmaSenha)
        {
           let erro = "Senhas digitadas sao diferentes"
           return res.render('feed',{erro})
        }

        await Usuario.Cadastrar(req.body.nome,req.body.usuario,req.body.senha,req.body.email);
        return res.render('feedUsuario')
      }
    }
    catch(erro)
    {       
        global.conectado = false;
        global.user = {}
        global.logado = false;
       res.render('feed',{erro})
    }  
});

module.exports = router;