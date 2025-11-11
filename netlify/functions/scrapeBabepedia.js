const axios = require('axios');
const cheerio = require('cheerio');

const BROWSERLESS_API_KEY = '2TOmpeyz8SObBMse465d63aa39c8019b41c0a273ab1461c29';

// Função auxiliar para extrair texto depois de um rótulo
function getTextAfterLabel($, label) {
    // Encontra o elemento que contém o texto do rótulo (ex: "Born:")
    // e depois pega o texto do nó seguinte a ele, que é o valor.
    const element = $(`div.col-sm-6:contains("${label}")`);
    if (element.length) {
        // Limpa o rótulo do texto completo para obter apenas o valor
        return element.text().replace(label, '').trim();
    }
    return null;
}

exports.handler = async function(event, context) {
    const { name } = event.queryStringParameters;
    if (!name) return { statusCode: 400, body: JSON.stringify({ error: 'O nome é obrigatório.' }) };

    const targetUrl = `https://www.babepedia.com/babe/${name}`;
    const browserlessUrl = `https://production-sfo.browserless.io/scrape?token=${BROWSERLESS_API_KEY}`;

    try {
        const response = await axios.post(browserlessUrl, {
            url: targetUrl,
            elements: [{ selector: 'body' }]
        });
        const html = response.data.data[0].results[0].html;
        const $ = cheerio.load(html);
        const actorData = {};

        // --- LÓGICA DA IMAGEM (permanece a mesma, está a funcionar bem) ---
        const imageUrl = $('#profimg picture img').attr('src') || $('div.profile-pic img').attr('src');
        if (imageUrl) actorData.mainImageUrl = `https://www.babepedia.com${imageUrl}`;
        
        // --- NOVA LÓGICA PARA EXTRAIR DADOS DA BIOGRAFIA ---
        // A biografia agora está em divs com a classe 'col-sm-6'
        const bornText = getTextAfterLabel($, 'Born:');
        if (bornText) {
            const dateMatch = bornText.match(/(\w+\s\d{1,2}),\s(\d{4})/);
            if (dateMatch) {
                actorData.birthDate = new Date(dateMatch[0]).toISOString().split('T')[0];
            }
        }

        const nationalityText = getTextAfterLabel($, 'Nationality:');
        if (nationalityText) {
            // Extrai apenas o nome do país, removendo o "(American)" se existir
            actorData.nation = nationalityText.split('(')[0].trim();
        }
        
        return { statusCode: 200, body: JSON.stringify(actorData) };

    } catch (error) {
        console.error("ERRO DETALHADO DENTRO DA FUNÇÃO:", error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ 
                error: `Falha ao obter dados para "${name}". Verifique o log da função na Netlify.` 
            }) 
        };
    }
};
