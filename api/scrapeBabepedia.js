import axios from 'axios';
import * as cheerio from 'cheerio';

// Função auxiliar para formatar a data para o padrão AAAA-MM-DD
function formatDate(dateString) {
  if (!dateString) return null;
  const cleanString = dateString.split('(')[0].trim();
  if (cleanString) {
    try {
      const date = new Date(cleanString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  }
  return null;
}

// A função principal que a Vercel executa
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://dadynapoleao.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'O parâmetro "name" é obrigatório.' });
    }

    const targetUrl = `https://www.babepedia.com/babe/${name}`;
    const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      'Referer': 'https://www.google.com/',
    };

    const response = await axios.get(url, { headers });
    const html = response.data;
    const $ = cheerio.load(html);

    // --- SELETORES FINAIS E CORRIGIDOS ---
    // A informação está agora dentro do <div id="babe-info">
    const infoContainer = $('#babe-info');

    // Procuramos o <td> que vem depois do <td> com o texto "Born"
    const birthDateText = infoContainer.find('td:contains("Born")').next('td').text().trim();
    
    // Procuramos o <td> que vem depois do <td> com o texto "Nationality"
    const nationText = infoContainer.find('td:contains("Nationality")').next('td').text().trim();

    // A imagem de perfil está dentro de um <div id="profpic">
    const imageUrl = $('#profpic img').attr('src');
    
    const scrapedData = {
      birthDate: formatDate(birthDateText),
      nation: nationText || null,
      mainImageUrl: imageUrl ? `https://www.babepedia.com${imageUrl}` : null, // Adiciona o domínio base ao URL da imagem
    };

    res.status(200).json(scrapedData);

  } catch (error) {
    console.error('ERRO NA API DE SCRAPING:', error.message);
    res.status(500).json({ error: 'Falha ao obter os dados do ator.' });
  }
}
