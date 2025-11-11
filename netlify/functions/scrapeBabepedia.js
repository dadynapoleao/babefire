const axios = require('axios');
const cheerio = require('cheerio');

const BROWSERLESS_API_KEY = '2TOmpeyz8SObBMse465d63aa39c8019b41c0a273ab1461c29';

exports.handler = async function(event, context) {
    const { name } = event.queryStringParameters;
    if (!name) return { statusCode: 400, body: JSON.stringify({ error: 'O nome é obrigatório.' }) };

    const targetUrl = `https://www.babepedia.com/babe/${name}`;
    
    // --- MUDANÇA CRÍTICA AQUI: Usar o endpoint /content ---
    const browserlessUrl = `https://production-sfo.browserless.io/content?token=${BROWSERLESS_API_KEY}`;

    try {
        // --- MUDANÇA CRÍTICA AQUI: O corpo do pedido é mais simples ---
        const response = await axios.post(browserlessUrl, {
            url: targetUrl,
            // Adiciona uma espera para garantir que o JavaScript da Cloudflare executa
            waitFor: 5000 // 5 segundos
        }, { timeout: 30000 }); // Aumenta o timeout para dar tempo ao browserless de carregar

        // --- MUDANÇA CRÍTICA AQUI: A resposta HTML vem diretamente ---
        const html = response.data;
        const $ = cheerio.load(html);
        const actorData = {};

        // --- LÓGICA DE SCRAPING (mantida da tentativa anterior) ---
        const imageUrl = $('#profimg picture img').attr('src');
        if (imageUrl) actorData.mainImageUrl = `https://www.babepedia.com${imageUrl}`;

        // Procura por todos os elementos de texto na biografia
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
        
        // Se depois de tudo, o objeto estiver vazio, pode ser que a página não exista
        if (Object.keys(actorData).length === 0) {
            console.log("Nenhum dado extraído. A página pode não existir ou o layout mudou novamente.");
        }

        return { statusCode: 200, body: JSON.stringify(actorData) };

    } catch (error) {
        console.error("ERRO DETALHADO DENTRO DA FUNÇÃO:", error.response ? error.response.data : error.message);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: `Falha ao obter dados para "${name}". Verifique o log da função na Netlify.` 
            }) 
        };
    }
};
