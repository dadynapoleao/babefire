// Ficheiro: /netlify/functions/scrapeBabepedia.js (VERSÃO FINAL CORRIGIDA)

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
            // --- CORREÇÃO IMPORTANTE AQUI ---
            // A opção 'waitFor' deve estar dentro de um objeto 'gotoOptions'
            gotoOptions: {
                waitUntil: 'networkidle2', // Espera até que a rede esteja "calma", um bom sinal de que a página carregou
                timeout: 30000 // Timeout de 30 segundos para a navegação
            }
        }, { timeout: 45000 }); // Aumenta o timeout geral do axios para 45 segundos

        const html = response.data;
        const $ = cheerio.load(html);
        const actorData = {};

        // Lógica de scraping (mantém-se)
        const imageUrl = $('#profimg picture img').attr('src');
        if (imageUrl) actorData.mainImageUrl = `https://www.babepedia.com${imageUrl}`;

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
        
        if (Object.keys(actorData).length === 0) {
            console.log("Nenhum dado extraído. Verifique o HTML no log se o problema persistir.");
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
