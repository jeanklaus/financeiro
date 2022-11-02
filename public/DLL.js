
const Origem = require('../services/s_origemCredito')
const MotivoGastos = require('../services/s_motivoGastos')

function checkName(nome,ids = []) {
  
  let checkbox = document.getElementById(nome); 
  let inputs = []

  ids.forEach(id => {
    inputs.push(document.getElementById(id));
  });

  verificaCheckParcela();

  if (checkbox.checked) {
    inputs.forEach(input => {
      input.hidden = true;
    });
  }
  else {
    inputs.forEach(input => {
      input.hidden = false;
    });
  }
}

function verificaCheckParcela()
{
  let campoQtParcela = document.getElementById("qtParcelas"); 
  let divTpValor = document.getElementById("divTpValor"); 
  let checkbox = document.getElementById("parcelado");  

  if (checkbox.checked) 
  {
    divTpValor.hidden = false;  
    campoQtParcela.hidden = false;  
  }
  else
  {
    divTpValor.hidden = true; 
    campoQtParcela.hidden = true;   
  }
}

function check(ids = []) {
  let checkbox = document.getElementById("checkbox"); 
  let inputs = []

  ids.forEach(id => {
    inputs.push(document.getElementById(id));
  });

  if (checkbox.checked) {
    inputs.forEach(input => {
      input.hidden = true;
    });
  }
  else {
    inputs.forEach(input => {
      input.hidden = false;
    });
  }
}

function getValor(tbValor, tabela, idColl) {
  let soma = 0;
  let total = 0;

  let table = document.getElementById(tabela);
  let tr = table.getElementsByTagName("tr");

  for (let i = 0; i < tr.length; i++) {
    let collvalor = tr[i].getElementsByTagName("td")[idColl];

    if (collvalor) {
      soma = collvalor.textContent || collvalor.innerText;
      total += parseFloat(soma);
    }
  }
  document.getElementById(tbValor).innerHTML = `R$ ${total.toFixed(2)}`;
}

function formataData(d) {
  let data = new Date(d);
  let dia = data.getDate()
  let mes = data.getMonth() + 1

  if (mes < 10) {
    mes = `0${mes}`
  }

  if (dia < 10) {
    dia = `0${dia}`
  }

  let ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function ConverterData(d) {
  let data = d.split('/');
  return `${data[2]}-${data[1]}-${data[0]}`;
}

function LoadDataHoje() {
  let data = new Date();
  document.getElementById("data").value = ConverterData(formataData(data));
}

function LoadAnoAtual() {
  let data = new Date();
  document.getElementById("data").value = getPedacoData(ConverterData(formataData(data)),'ANO');
}

function setDescGastoDell(obj) { 
 let input =  document.getElementById("DescGastoDell");
 input.value = obj.value;
}

function setDescCreditoDell(obj) { 
  let input =  document.getElementById("DescCreditoDell");
  input.value = obj.value;
 }

 function setIdDell(obj,campoId) { 
  let input =  document.getElementById(campoId);
  input.value = obj.value;
 }

 function setValorEdi(obj,campoId,campoValor) { 
  let inputValor =  document.getElementById(campoValor);
  let inputId =  document.getElementById(campoId);
  
  let [id,valor] = obj.value.split('|'); 
  inputValor.value = valor;
  inputId.value = id;
 }

 function setValorConsumo(obj,campoId,campoValor,campoData) { 
  let inputId =  document.getElementById(campoId);
  let inputValor =  document.getElementById(campoValor);
  let inputData =  document.getElementById(campoData);

  let [id,valor] = obj.value.split('|'); 

  inputId.value = id;
  inputValor.value = valor;

  let data = new Date();
  inputData.value = ConverterData(formataData(data))
 }

function FiltroTabela(campoMotivo,campoMes, tbl, indiceCollMotivo,indiceCollMes) 
{
  let table, tr, tdMotivo,tbMes, i;

  let filtroMotivo =  document.getElementById(campoMotivo).value.toUpperCase();
  let filtroMes =  document.getElementById(campoMes).value.toUpperCase();

  table = document.getElementById(tbl);
  tr = table.getElementsByTagName("tr");

  for (i = 0; i < tr.length; i++) {
    tdMotivo = tr[i].getElementsByTagName("td")[indiceCollMotivo];
    tbMes = tr[i].getElementsByTagName("td")[indiceCollMes];

    if (tdMotivo || tbMes) 
    {
      let txtValueMotivo = tdMotivo.textContent || tdMotivo.innerText;
      let txtValueMes    = tbMes.textContent || tbMes.innerText;

      if (filtroMotivo == txtValueMotivo && filtroMes == txtValueMes) {
        tr[i].style.display = "";
      }
      else {
        tr[i].style.display = "none";
      }
    }
  }
}

const Esta = (prod,lista) => {
  let i = 0;
  
  for (let p of lista) {
      if (p.id == prod.id) 
      {   
          return [true, i];
      }
      i++;
  }

  return [false, ""]
}

function AnalisaFiltros(filtros) 
{
  let where = "";

  if (filtros.length > 0) 
  {
      if (filtros.length > 1) 
      {
          for (let i = 0; i < filtros.length; i++) 
          {
              where += `${filtros[i]} `

              if (i < (filtros.length - 1)) 
              {
                  where += "AND "
              }
          }

          return where
      }
      else 
      {
          return filtros[0];
      }
  }
  else 
  {
      return "1"
  }
}

function VerificaTP(obj)
{
  if(obj.value == 'AVISTA')
  {
    document.getElementById('div_aprazo').hidden = true;
  }
  else if(obj.value == 'APRAZO')
  {
    document.getElementById('div_aprazo').hidden = false;
  }
}

function getPedacoData(data,qual)//yyyy-mm-dd
{
  let [ano,mes,dia] = data.split('-');

  if(qual == "DIA")
  {
    return dia;
  }
  else if(qual == "MES")
  {
    return mes;
  }
  else
  {
    return ano;
  }
}

function setDadosJanelaCredito(obj) { 

  let inputTitulo =  document.getElementById("TituloJanelaCredi");
  let inputData =  document.getElementById("campoDataCredito");
  let inputMotivo =  document.getElementById("campoOrigemCredito");  
  let inputFiltroMotivoEdicao =  document.getElementById("nmMotivoCredito");  
  let inputMesRegistroCredito =  document.getElementById("mesRegistroCredito");  

  let [id,motivo,mes,ano] = obj.value.split('|') 
  
  inputTitulo.textContent = `${motivo} - ${mes}/${ano}`
  inputMotivo.value = `${id}|${motivo}` 
  inputData.value = `${ano}-${mes}-01`
  inputFiltroMotivoEdicao.value = motivo
  inputMesRegistroCredito.value = parseInt(mes)
  inputFiltroMotivoEdicao.onchange();
  inputFiltroMotivoEdicao.onchange();
}

function setDadosJanelaGasto(obj) { 

  let inputTitulo =  document.getElementById("TituloJanelaGasto");
  let inputData =  document.getElementById("campoDataGasto");
  let inputMotivo =  document.getElementById("campoMotivoGasto");  
  let inputFiltroMotivoEdicao =  document.getElementById("nmMotivoGasto");
  let inputMesRegistroGasto =  document.getElementById("mesRegistroGasto");

  let [id,motivo,mes,ano] = obj.value.split('|') 

  inputTitulo.textContent = `${motivo} - ${mes}/${ano}`
  inputMotivo.value = `${id}|${motivo}` 
  inputData.value = `${ano}-${mes}-01`
  inputFiltroMotivoEdicao.value = motivo
  inputMesRegistroGasto.value = parseInt(mes)
  inputFiltroMotivoEdicao.onchange();
  inputMesRegistroGasto.onchange();
}

module.exports = { formataData, ConverterData,AnalisaFiltros,getPedacoData }