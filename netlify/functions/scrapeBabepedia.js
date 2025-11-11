const axios = require('axios');
const cheerio = require('cheerio');

// --- COLOQUE A SUA API KEY DO SCRAPINGBEE AQUI ---
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
        
        // --- MISSÃO DE RECONHECIMENTO: Imprimir o HTML final que recebemos ---
        console.log("--- INÍCIO DO HTML FINAL RECEBIDO (DO SCRAPINGBEE) ---");
        console.log(html);
        console.log("--- FIM DO HTML FINAL RECEBIDO (DO SCRAPINGBEE) ---");

        // O resto do código vai tentar extrair e provavelmente falhar,
        // mas o importante é o log que gerámos acima.
        const $ = cheerio.load(html);
        const actorData = {};

        const imageUrl = $('#profimg picture img').attr('src');
        if (imageUrl) actorData.mainImageUrl = `https://www.babepedia.com${imageUrl}`;

        $('div.col-sm-6').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text.startsWith('Born:')) actorData.birthDate = "ENCONTRADO";
            else if (text.startsWith('Nationality:')) actorData.nation = "ENCONTRADO";
        });
        
        return { statusCode: 200, body: JSON.stringify(actorData) };

    } catch (error) {
        console.error("ERRO DETALHADO (ScrapingBee):", error.response ? error.response.data : error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: `Falha ao obter dados para "${name}".` }) 
        };
    }
};
