// Ficheiro: /netlify/functions/scrapeBabepedia.js

const axios = require('axios');
const cheerio = require('cheerio');

const BROWSERLESS_API_KEY = '2TOmpeyz8SObBMse465d63aa39c8019b41c0a273ab1461c29'; // Verifique se a sua chave ainda está correta

exports.handler = async function(event, context) {
    const { name } = event.queryStringParameters;
    if (!name) return { statusCode: 400, body: JSON.stringify({ error: 'O nome é obrigatório.' }) };

    const targetUrl = `https://www.babepedia.com/babe/${name}`;
    const browserlessUrl = `https://chrome.browserless.io/scrape?token=${BROWSERLESS_API_KEY}`;

    try {
        const response = await axios.post(browserlessUrl, {
            url: targetUrl,
            elements: [{ selector: 'body' }]
        });
        const html = response.data.data[0].results[0].html;
        const $ = cheerio.load(html);
        const actorData = {};

        const imageUrl = $('#profimg picture img').attr('src') || $('div.profile-pic img').attr('src');
        if (imageUrl) actorData.mainImageUrl = `https://www.babepedia.com${imageUrl}`;
        
        $('#biographytable tr').each((i, row) => {
            const key = $(row).find('th').text().trim().toLowerCase();
            const value = $(row).find('td').text().trim();
            if (key.includes('born')) {
                const dateMatch = value.match(/(\w+\s\d{1,2}),\s(\d{4})/);
                if (dateMatch) actorData.birthDate = new Date(dateMatch[0]).toISOString().split('T')[0];
            } else if (key.includes('nationality')) {
                actorData.nation = value;
            }
        });
        
        return { statusCode: 200, body: JSON.stringify(actorData) };

    } catch (error) {
        // --- ADIÇÃO CRÍTICA AQUI ---
        // Força a impressão do erro detalhado no log da Netlify
        console.error("ERRO DETALHADO DENTRO DA FUNÇÃO:", error);
        
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: `Falha ao obter dados para "${name}". Verifique o log da função na Netlify.` 
            }) 
        };
    }
};
