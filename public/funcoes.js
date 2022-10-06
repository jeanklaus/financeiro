
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

function getCustoTotal(lista) 
{
    let resultado = 0;
  
    if (lista.length > 0) 
    {
        if(lista[0].custo)
        {
            for (const prod of lista) 
            {
                resultado += prod.custo;
            }
        }
        else if(lista[0].investimento)
        {
            for (const prod of lista) 
            {
                resultado += prod.investimento;
            }
        }       
        else
        {
            for (const prod of lista) 
            {
                resultado += prod.valorTotal;
            } 
        }
    }
    
    return resultado; 
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

module.exports = {getCustoTotal,AnalisaFiltros,Esta}