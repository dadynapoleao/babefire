const axios = require('axios');
const cheerio = require('cheerio');

const BROWSERLESS_API_KEY = '2TOmpeyz8SObBMse465d63aa39c8019b41c0a273ab1461c29';

exports.handler = async function(event, context) {
    const { name } = event.queryStringParameters;
    if (!name) return { statusCode: 400, body: JSON.stringify({ error: 'O nome é obrigatório.' }) };

    const targetUrl = `https://www.babepedia.com/babe/${name}`;
    const browserlessUrl = `https://production-sfo.browserless.io/content?token=${BROWSERLESS_API_KEY}`;

    try {
        const response = await axios.post(browserlessUrl, {
            url: targetUrl,
            gotoOptions: {
                waitUntil: 'networkidle2',
                timeout: 30000
            }
        }, { timeout: 45000 });

        const html = response.data;
        
        // --- MISSÃO DE RECONHECIMENTO: Imprimir o HTML final ---
        console.log("--- INÍCIO DO HTML FINAL RECEBIDO (PÓS-CLOUDFLARE) ---");
        console.log(html);
        console.log("--- FIM DO HTML FINAL RECEBIDO (PÓS-CLOUDFLARE) ---");

        const $ = cheerio.load(html);
        const actorData = {};

        const imageUrl = $('#profimg picture img').attr('src');
        if (imageUrl) actorData.mainImageUrl = `https://www.babepedia.com${imageUrl}`;

        $('div.col-sm-6').each((i, elem) => {
            const text = $(elem).text().trim();
            if (text.startsWith('Born:')) {
                actorData.birthDate = "ENCONTRADO"; // Apenas para teste
            } else if (text.startsWith('Nationality:')) {
                actorData.nation = "ENCONTRADO"; // Apenas para teste
            }
        });

        console.log("RESULTADO DA TENTATIVA DE SCRAPING:", JSON.stringify(actorData));
        
        return { statusCode: 200, body: JSON.stringify(actorData) };

    } catch (error) {
        console.error("ERRO DETALHADO DENTRO DA FUNÇÃO:", error.response ? error.response.data : error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: `Falha ao obter dados para "${name}".`
            }) 
        };
    }
};
