const axios = require('axios');
const cheerio = require('cheerio');

// --- VERIFIQUE SE A SUA API KEY DO SCRAPINGBEE ESTÁ AQUI ---
const SCRAPINGBEE_API_KEY = '7K1NTEJ9B2W24NWKURGISDG9YDIA4P8ROJAJE3Z3WF1Z5GLRB0ACVN3749HM8QVXOIK1WUG8K67HPICV'; 

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

        // --- LÓGICA DE SCRAPING FINALÍSSIMA ---

        // 1. Extrair a imagem principal (Já estava a funcionar)
        const imageUrl = $('#profimg picture img').attr('src') || $('#profimg img').attr('src');
        if (imageUrl) {
            actorData.mainImageUrl = `https://www.babepedia.com${imageUrl}`;
        }

        // 2. Extrair os dados da biografia (LÓGICA CORRIGIDA)
        $('#personal-info-block .info-grid .info-item').each((i, elem) => {
            const label = $(elem).find('span.label').text().trim().toLowerCase();
            
            if (label.includes('born')) {
                const valueText = $(elem).find('span.value').text().trim();
                // Tenta extrair a data do texto (ex: "Sunday 18th of December 1988")
                const dateMatch = valueText.match(/(\d{1,2})th of (\w+) (\d{4})|(\w+\s\d{1,2},?\s\d{4})/);
                if (dateMatch) {
                    // Limpa o "th", "st", "nd", "rd" para o new Date() funcionar bem
                    const cleanDateString = dateMatch[0].replace(/(st|nd|rd|th)/, '');
                    actorData.birthDate = new Date(cleanDateString).toISOString().split('T')[0];
                }
            } else if (label.includes('birthplace')) {
                // CORREÇÃO: A nacionalidade está no campo "birthplace"
                // Pega o texto do último link '<a>', que é o país.
                const country = $(elem).find('span.value a').last().text().trim();
                if (country) {
                    actorData.nation = country;
                }
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
