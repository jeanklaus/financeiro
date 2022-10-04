let dll = require('../public/DLL');

const DesmontaData = data => 
{
  let novadata = data.split('-');
  return `${novadata[0]}${novadata[1]}${novadata[2]}`;
}

const MontarData = data => 
{
  let ano = data.substring(0,4);
  let mes = data.substring(4,6);
  let dia = data.substring(6,8);
  return `${dia}/${mes}/${ano}`
}

function porCustoMaior(aplicacao)
{
  aplicacao.sort((a, b) => b.valorTotal - a.valorTotal)
  return aplicacao;
}

function porCustoMenor(aplicacao)
{
  aplicacao.sort((a, b) => a.valorTotal - b.valorTotal)
  return aplicacao;
}

function porModalidade_AZ(aplicacao)
{
    function compara(a, b)
    {
        let a_maiuscula = a.modalidade.toUpperCase()
        let b_maiuscula = b.modalidade.toUpperCase()
        
        if(a_maiuscula < b_maiuscula)
            return -1;
        if(a_maiuscula > b_maiuscula)
            return 1;
        return 0;
    }

    aplicacao.sort(compara)
    return aplicacao
}

function porModalidade_ZA(aplicacao)
{
    function compara(a, b)
    {
        let a_maiuscula = a.modalidade.toUpperCase()
        let b_maiuscula = b.modalidade.toUpperCase()
        
        if(a_maiuscula > b_maiuscula)
            return -1;
        if(a_maiuscula < b_maiuscula)
            return 1;
        return 0;
    }

    aplicacao.sort(compara)
    return aplicacao
}

function porData_Mm(aplicacao)
{ 
  //DESMONTO
  aplicacao = aplicacao.map(apli => {
    apli.data = DesmontaData(dll.ConverterData(apli.data));
    return apli;
  });

  //ordeno
  aplicacao.sort((a, b) => b.data - a.data)

   //MONTO
   aplicacao = aplicacao.map(apli => {
    apli.data = MontarData(apli.data);
    return apli;
  });

  return aplicacao
}

function porData_mM(aplicacao)
{ 
  //DESMONTO
  aplicacao = aplicacao.map(apli => {
      apli.data = DesmontaData(dll.ConverterData(apli.data));
      return apli;
  });

  //ORDENO
  aplicacao.sort((a, b) => a.data - b.data)

  //MONTO
  aplicacao = aplicacao.map(apli => {
    apli.data = MontarData(apli.data);
    return apli;
  });

  return aplicacao
}


module.exports = {porCustoMaior,porCustoMenor,porModalidade_AZ,porModalidade_ZA,porData_Mm,porData_mM}