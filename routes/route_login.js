const express = require('express');
const bodyparser = require('body-parser');

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
        const connection = await mysql.createConnection(       
        {
            host:'ns847.hostgator.com.br', 
            user:'tornei65_jeanadm',
            password:'PpOoIi876@',
            database:'tornei65_financeiro'
        });
      
        let sql =  `SELECT id,nome,login,senha,saldo FROM Usuario WHERE login = ? AND senha = ?`
        let values = [req.body.login,req.body.senha]
        const [rows] = await connection.query(sql,values);

       if(rows[0])
       {
            global.user.id = rows[0].id; 
            global.user.nome = rows[0].nome; 
            global.user.saldo = rows[0].saldo; 
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

module.exports = router;