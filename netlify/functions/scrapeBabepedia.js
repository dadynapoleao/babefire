const axios = require('axios');
const cheerio = require('cheerio');

// --- TROQUE PELA SUA API KEY DO SCRAPINGBEE ---
const SCRAPINGBEE_API_KEY = '7K1NTEJ9B2W24NWKURGISDG9YDIA4P8ROJAJE3Z3WF1Z5GLRB0ACVN3749HM8QVXOIK1WUG8K67HPICV'; 

exports.handler = async function(event, context) {
    const { name } = event.queryStringParameters;
    if (!name) return { statusCode: 400, body: JSON.stringify({ error: 'O nome é obrigatório.' }) };

    const targetUrl = `https://www.babepedia.com/babe/${name}`;
    
    // Constrói o URL da API do ScrapingBee
    const scrapingBeeUrl = 'https://app.scrapingbee.com/api/v1/';

    try {
        const response = await axios.get(scrapingBeeUrl, {
            params: {
                'api_key': SCRAPINGBEE_API_KEY,
                'url': targetUrl,
                'render_js': 'true', // Diz ao ScrapingBee para executar o JavaScript
                'premium_proxy': 'true', // Usa proxies melhores que têm mais chance de não serem bloqueados
                'wait_for': '#profimg' // Espera até que um elemento chave da página (a imagem do perfil) apareça
            },
            timeout: 60000 // Aumenta o timeout para 60 segundos, pois estes processos podem demorar
        });

        const html = response.data; // ScrapingBee retorna o HTML diretamente
        const $ = cheerio.load(html);
        const actorData = {};

        // --- LÓGICA DE SCRAPING (a mesma que já tínhamos) ---
        const imageUrl = $('#profimg picture img').attr('src');
        if (imageUrl) {
            actorData.mainImageUrl = `https://www.babepedia.com${imageUrl}`;
        }

        $('div.col-sm-6').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text.startsWith('Born:')) {
                const bornText = text.replace('Born:', '').trim();
                const dateMatch = bornText.match(/(\w+\s\d{1,2}),\s(\d{4})/);
                if (dateMatch) {
                    actorData.birthDate = new Date(dateMatch[0]).toISOString().split('T')[0];
                }
            } else if (text.startsWith('Nationality:')) {
                const nationalityText = text.replace('Nationality:', '').trim();
                actorData.nation = nationalityText.split('(')[0].trim();
            }
        });
        
        return { statusCode: 200, body: JSON.stringify(actorData) };

    } catch (error) {
        console.error("ERRO DETALHADO DENTRO DA FUNÇÃO (ScrapingBee):", error.response ? error.response.data : error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: `Falha ao obter dados para "${name}".`
            }) 
        };
    }
};
