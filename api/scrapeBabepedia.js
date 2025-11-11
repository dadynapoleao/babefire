// /api/scrapeBabepedia.js
import axios from 'axios';
import * as cheerio from 'cheerio';

function formatDate(dateString) {
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

    // --- A ALTERAÇÃO CRUCIAL ESTÁ AQUI ---
    const targetUrl = `https://www.babepedia.com/babe/${name}`;
    // Usamos um proxy para mascarar o nosso IP da Vercel
    const url = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;

    const headers = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    };

    const response = await axios.get(url, { headers });
    const html = response.data;

    const $ = cheerio.load(html);

    const birthDateText = $('#biography .row:contains("Born") .col-md-8').text().trim();
    const nationText = $('#biography .row:contains("Nationality") .col-md-8 a').text().trim();
    const imageUrl = $('#profim').attr('src');

    const scrapedData = {
      birthDate: formatDate(birthDateText),
      nation: nationText || null,
      mainImageUrl: imageUrl || null,
    };

    res.status(200).json(scrapedData);

  } catch (error) {
    console.error('ERRO NA API DE SCRAPING:', error.message);
    if (error.response) {
      console.error('STATUS DO ERRO:', error.response.status);
      // ... (o resto do código de erro)
    }
    res.status(500).json({ error: 'Falha ao obter os dados do ator.' });
  }
}
