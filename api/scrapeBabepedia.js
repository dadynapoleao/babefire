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
  // Configuração de CORS para permitir pedidos do seu site
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

    // --- SELETORES ATUALIZADOS (A PARTE MAIS IMPORTANTE) ---
    // Esta nova abordagem é mais flexível. Ela procura por um elemento que contém o texto "Born"
    // e depois pega o conteúdo do elemento seguinte, que geralmente é o valor.
    // Isto funciona para tabelas (th/td) e listas de definição (dt/dd).

    // Procura pela secção de biografia
    const bioContainer = $('#biography');

    // Extrai a data de nascimento
    const birthDateText = bioContainer.find('p:contains("Born:")').text().replace('Born:', '').trim();

    // Extrai a nacionalidade
    const nationText = bioContainer.find('p:contains("Nationality:") a').text().trim();

    // Extrai a imagem de perfil
    const imageUrl = $('#profim').attr('src');


    // Monta o objeto final com os dados
    const scrapedData = {
      birthDate: formatDate(birthDateText),
      nation: nationText || null,
      mainImageUrl: imageUrl || null,
    };

    // Resposta de sucesso com os dados encontrados
    res.status(200).json(scrapedData);

  } catch (error) {
    console.error('ERRO NA API DE SCRAPING:', error.message);
    if (error.response) {
      console.error('STATUS DO ERRO:', error.response.status);
      if (error.response.status === 404) {
        return res.status(404).json({ message: 'Ator não encontrado.' });
      }
      if (error.response.status === 403) {
        return res.status(403).json({ message: 'Acesso bloqueado pelo site de destino.' });
      }
    }
    res.status(500).json({ error: 'Falha ao obter os dados do ator.' });
  }
}
