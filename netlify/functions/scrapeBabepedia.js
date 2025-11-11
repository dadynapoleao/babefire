// Ficheiro: /netlify/functions/scrapeBabepedia.js (VERSÃO FINAL E CORRIGIDA)

const axios = require('axios');
const cheerio = require('cheerio');

// --- VERIFIQUE SE A SUA API KEY DO SCRAPINGBEE ESTÁ AQUI ---
const SCRAPINGBEE_API_KEY = '2TOmpeyz8SObBMse465d63aa39c8019b41c0a273ab1461c29'; 

exports.handler = async function(event, context) {
    const { name } = event.queryStringParameters;
    if (!name) return { statusCode: 400, body: JSON.stringify({ error: 'O nome é obrigatório.' }) };

    const targetUrl = `https://www.babepedia.com/babe/${name}`;
    const scrapingBeeUrl = 'https://app.scrapingbee.com/api/v1/';

    try {
        const response = await axios.get(scrapingBeeUrl, {
            params: {
                'api_key': SCRAPINGBEE_API_KEY,
                'url': targetUrl,
                'render_js': 'true',
                'premium_proxy': 'true',
                'wait_for': '#profimg' 
            },
            timeout: 60000
        });

        const html = response.data;
        const $ = cheerio.load(html);
        const actorData = {};

        // --- LÓGICA DE SCRAPING FINAL E CORRIGIDA ---

        // 1. Extrair a imagem principal
        const imageUrl = $('#profimg picture img').attr('src') || $('#profimg img').attr('src');
        if (imageUrl) {
            actorData.mainImageUrl = `https://www.babepedia.com${imageUrl}`;
        }

        // 2. Extrair os dados da biografia
        // Percorre todas as divs com a classe 'info-item' dentro do bloco de informação pessoal
        $('#personal-info-block .info-grid .info-item').each((i, elem) => {
            // Pega o texto do rótulo (ex: "Born:") e o texto do valor
            const label = $(elem).find('span.label').text().trim().toLowerCase();
            const value = $(elem).find('span.value').text().trim();
            
            if (label.includes('born')) {
                // Se o rótulo for "born", extrai a data
                const dateMatch = value.match(/(\w+\s\d{1,2}),\s(\d{4})/);
                if (dateMatch) {
                    actorData.birthDate = new Date(dateMatch[0]).toISOString().split('T')[0];
                }
            } else if (label.includes('nationality')) {
                // Se o rótulo for "nationality", extrai o nome do país
                 actorData.nation = $(elem).find('span.value').text().replace(/\(.*\)/g, '').trim();
            }
        });
        
        return { statusCode: 200, body: JSON.stringify(actorData) };

    } catch (error) {
        console.error("ERRO DETALHADO (ScrapingBee):", error.response ? error.response.data : error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: `Falha ao obter dados para "${name}".`
            }) 
        };
    }
};
