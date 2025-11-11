const axios = require('axios');
const cheerio = require('cheerio');

const BROWSERLESS_API_KEY = '2TOmpeyz8SObBMse465d63aa39c8019b41c0a273ab1461c29';

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
        
        // Verifica se a estrutura da resposta está correta
        if (!response.data || !response.data.data || !response.data.data[0] || !response.data.data[0].results || !response.data.data[0].results[0]) {
             console.error("ERRO: A estrutura da resposta do Browserless mudou ou está vazia.");
             console.log("Resposta completa do Browserless:", JSON.stringify(response.data, null, 2));
             return { statusCode: 500, body: JSON.stringify({ error: "Resposta inválida do serviço de scraping." }) };
        }
        
        const html = response.data.data[0].results[0].html;

        // --- LINHA MAIS IMPORTANTE DESTA DEPURAÇÃO ---
        // Imprime o HTML completo que o scraper está a receber.
        console.log("--- INÍCIO DO HTML RECEBIDO ---");
        console.log(html);
        console.log("--- FIM DO HTML RECEBIDO ---");

        const $ = cheerio.load(html);
        const actorData = {};

        // A lógica de scraping fica aqui por enquanto, para vermos se produz algum erro
        const imageUrl = $('#profimg picture img').attr('src');
        if (imageUrl) actorData.mainImageUrl = `https://www.babepedia.com${imageUrl}`;

        // Tentativa de extrair dados com a lógica anterior, para ver o que acontece
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

        // Imprime o que foi extraído (provavelmente um objeto vazio)
        console.log("DADOS FINAIS EXTRAÍDOS:", JSON.stringify(actorData));
        
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
