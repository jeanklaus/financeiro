
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
  let campo = document.getElementById("qtParcelas"); 
  let checkbox = document.getElementById("parcelado"); 

  if (checkbox.checked) 
  {
    campo.hidden = false;  
  }
  else
  {
    campo.hidden = true;  
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

function buscaProdTabela(input, tbl, indiceColl) {
  var filter, table, tr, td, i;

  filter = input.value.toUpperCase();
  table = document.getElementById(tbl);

  tr = table.getElementsByTagName("tr");

  for (i = 0; i < tr.length; i++) {
    td = tr[i].getElementsByTagName("td")[indiceColl];

    if (td) {
      txtValue = td.textContent || td.innerText;

      if (txtValue.toUpperCase().indexOf(filter) > -1) {
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

module.exports = { formataData, ConverterData,AnalisaFiltros,getPedacoData }