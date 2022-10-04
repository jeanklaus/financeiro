const express = require('express');
const app = express();
const route_contaBancaria = require('./routes/route_contaBancaria');
const route_motivoGastos = require('./routes/route_motivoGastos');
const route_login = require('./routes/route_login');

//CONFIGURAÇÃO
app.set('view engine','ejs');
app.use(express.static('public'));

//LOGIN - PAGINA INICIAL
app.get('/', (req,res) => {
    try
    {
        global.user = {}
        global.connection = false;
        global.logado = false;
        global.conectado = false;
        res.render('login');
    }
    catch(erro)   
    {  
        global.connection = false;
        global.conectado = false;       
        res.render(feed,{erro});
    }  
});

//MENU PRINCIPAL
app.get('/Menu', async (req,res) => {
   try
    {
        let avisos = []

        if(global.logado)
        {
           res.render('home',{avisos});
        }
        else
        {
            res.render('login');
        }
    }
    catch(erro)
    {  
        res.redirect('/');
    }  
});

//ROTAS
app.use('/ContaBancaria',route_contaBancaria);
app.use('/MotivoGastos',route_motivoGastos);
app.use('/Login',route_login );

app.listen(process.env.PORT || 3000,() => {
    console.log('Rodando...');
});