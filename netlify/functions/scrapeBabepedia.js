const axios = require('axios');
const cheerio = require('cheerio');

const BROWSERLESS_API_KEY = 'SUA_CHAVE_DE_API_AQUI'; 

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
        return { statusCode: 500, body: JSON.stringify({ error: `Falha ao obter dados para "${name}".` }) };
    }
};
