import axios from 'axios';
import * as cheerio from 'cheerio';

// Função para formatar a data encontrada para o padrão AAAA-MM-DD
function formatDate(dateString) {
  // A string pode vir como "October 24, 1991 (age 32)"
  // Primeiro, removemos a parte da idade
  const cleanString = dateString.split('(')[0].trim();
  
  if (cleanString) {
    try {
      const date = new Date(cleanString);
      // toISOString() retorna "AAAA-MM-DDTHH:mm:ss.sssZ", pegamos apenas a primeira parte
      return date.toISOString().split('T')[0];
    } catch (e) {
      // Se a data for inválida, retorna null
      return null;
    }
  }
  return null;
}

// A função principal que a Vercel irá executar
export default async function handler(req, res) {
  
  // --- GESTÃO DE CORS (PERMISSÕES) ---
  // Permite que apenas o seu site no GitHub Pages aceda a esta API
  res.setHeader('Access-Control-Allow-Origin', 'https://dadynapoleao.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // O navegador faz um pedido "OPTIONS" para verificar a permissão antes do pedido real
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- LÓGICA PRINCIPAL DA API ---
  try {
    // Pega o nome do ator a partir do URL (ex: /api/scrapeBabepedia?name=Sara_Retali)
    const { name } = req.query;

    // Se nenhum nome for fornecido, retorna um erro
    if (!name) {
      return res.status(400).json({ error: 'O parâmetro "name" é obrigatório.' });
    }

    const url = `https://www.babepedia.com/babe/${name}`;

    // É crucial simular um navegador para não ser bloqueado
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
    };

    // Faz o pedido HTTP para a página do Babepedia
    const response = await axios.get(url, { headers });
    const html = response.data;

    // Carrega o HTML no Cheerio para podermos fazer a extração dos dados
    const $ = cheerio.load(html);

    // --- EXTRAÇÃO DOS DADOS (SCRAPING) ---

    // Encontra o texto da data de nascimento
    const birthDateText = $('#biography .row:contains("Born") .col-md-8').text().trim();
    
    // Encontra o texto da nacionalidade
    const nationText = $('#biography .row:contains("Nationality") .col-md-8 a').text().trim();

    // Encontra o URL da imagem de perfil principal
    const imageUrl = $('#profim').attr('src');

    // Monta o objeto com os dados encontrados
    const scrapedData = {
      birthDate: formatDate(birthDateText), // Formata a data para AAAA-MM-DD
      nation: nationText || null, // Se não encontrar, envia null
      mainImageUrl: imageUrl || null, // Se não encontrar, envia null
    };

    // Envia a resposta com sucesso (status 200) e os dados em formato JSON
    res.status(200).json(scrapedData);

  } catch (error) {
    // Se ocorrer qualquer erro no bloco "try", ele será capturado aqui
    // Isto é útil para ver os erros nos logs da Vercel
    console.error('ERRO NA API DE SCRAPING:', error.message);
    
    // Envia uma resposta de erro para o front-end
    res.status(500).json({ error: 'Falha ao obter os dados do ator.' });
  }
}
