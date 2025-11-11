import axios from 'axios';
import * as cheerio from 'cheerio';

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

    // --- MODO DE DEPURAÇÃO ATIVADO ---
    // Envia o HTML bruto de volta como texto simples.
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(html);
    // --- FIM DO MODO DE DEPURAÇÃO ---

  } catch (error) {
    res.status(500).json({ error: 'Falha ao obter os dados do ator.', details: error.message });
  }
}
