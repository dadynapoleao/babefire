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

        // 1. Extrair a imagem principal (Já estava a funcionar)
        const imageUrl = $('#profimg picture img').attr('src') || $('#profimg img').attr('src');
        if (imageUrl) {
            actorData.mainImageUrl = `https://www.babepedia.com${imageUrl}`;
        }

        // 2. Extrair os dados da biografia
        $('#personal-info-block .info-grid .info-item').each((i, elem) => {
            const label = $(elem).find('span.label').text().trim().toLowerCase();
            
            if (label.includes('born')) {
                const valueText = $(elem).find('span.value').text().trim();
                
                // --- CORREÇÃO CRÍTICA AQUI ---
                // Regex para capturar as partes da data: dia, mês, ano
                const dateParts = valueText.match(/(\d{1,2}).*?of (\w+) (\d{4})/);
                
                if (dateParts && dateParts.length === 4) {
                    // dateParts será: ["18th of December 1988", "18", "December", "1988"]
                    const day = dateParts[1];
                    const month = dateParts[2];
                    const year = dateParts[3];
                    
                    // Monta uma string segura que new Date() entende: "December 18, 1988"
                    const safeDateString = `${month} ${day}, ${year}`;
                    
                    // Converte para o formato YYYY-MM-DD
                    actorData.birthDate = new Date(safeDateString).toISOString().split('T')[0];
                }
            } else if (label.includes('birthplace')) {
                // Lógica da nacionalidade (já estava correta)
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
