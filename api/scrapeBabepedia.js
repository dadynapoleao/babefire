// /api/scrapeBabepedia.js
import axios from 'axios';
import * as cheerio from 'cheerio';

// Função auxiliar para formatar a data para o padrão AAAA-MM-DD
function formatDate(dateString) {
  if (!dateString) return null;
  // Remove texto extra como " (age 30)"
  const cleanString = dateString.split('(')[0].trim();
  if (cleanString) {
    try {
      const date = new Date(cleanString);
      // Converte para o formato AAAA-MM-DD
      return date.toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  }
  return null;
}

// A função principal que a Vercel executa
export default async function handler(req, res) {
  // Configuração de CORS para permitir pedidos do seu site
  res.setHeader('Access-Control-Allow-Origin', 'https://dadynapoleao.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Resposta ao pedido de verificação OPTIONS do navegador
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'O parâmetro "name" é obrigatório.' });
    }

    // Usamos um proxy para evitar sermos bloqueados por IP (erro 403)
    const targetUrl = `https://www.babepedia.com/babe/${name}`;
    const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
      'Referer': 'https://www.google.com/',
    };

    const response = await axios.get(url, { headers });
    const html = response.data;
    const $ = cheerio.load(html);

    // --- LÓGICA DE EXTRAÇÃO DE DADOS (SCRAPING) ---
    const bioContainer = $('#biography');
    
    // Procura por um parágrafo que começa com "Born:", extrai o texto e limpa-o
    const birthDateText = bioContainer.find('p:contains("Born:")').text().replace('Born:', '').trim();
    
    // Procura por um link dentro de um parágrafo que começa com "Nationality:"
    const nationText = bioContainer.find('p:contains("Nationality:") a').text().trim();

    // Procura pela imagem de perfil
    const imageUrl = $('#profim').attr('src');

    // Monta o objeto final com os dados
    const scrapedData = {
      birthDate: formatDate(birthDateText),
      nation: nationText || null,
      mainImageUrl: imageUrl || null,
    };

    // --- RESPOSTA FINAL ---
    // Envia os dados extraídos no formato JSON, como o front-end espera
    res.status(200).json(scrapedData);

  } catch (error) {
    console.error('ERRO NA API DE SCRAPING:', error.message);
    res.status(500).json({ error: 'Falha ao obter os dados do ator.' });
  }
}
