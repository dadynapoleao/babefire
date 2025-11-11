import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

// Função auxiliar para formatar a data
function formatDate(dateString) {
  if (!dateString) return null;
  const cleanString = dateString.split('(')[0].trim();
  if (cleanString) {
    try {
      return new Date(cleanString).toISOString().split('T')[0];
    } catch (e) {
      return null;
    }
  }
  return null;
}

// A função principal que a Vercel executa
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://dadynapoleao.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let browser = null;

  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'O parâmetro "name" é obrigatório.' });
    }

    // Configura e lança o navegador
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    
    // Simula um navegador real
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');

    const targetUrl = `https://www.babepedia.com/babe/${name}`;
    
    // Navega para a página e espera que a rede fique inativa (sinal de que tudo carregou)
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });
    
    // Extrai os dados da página renderizada
    const scrapedData = await page.evaluate(() => {
      // Esta função corre dentro do contexto do navegador
      const infoContainer = document.querySelector('#babe-info');
      if (!infoContainer) return { birthDate: null, nation: null, mainImageUrl: null };

      let birthDate = null;
      let nation = null;
      
      // Procura pelos 'td' para encontrar os dados
      const tableCells = infoContainer.querySelectorAll('td');
      for (let i = 0; i < tableCells.length; i++) {
        const cell = tableCells[i];
        if (cell.textContent.includes('Born') && tableCells[i + 1]) {
          birthDate = tableCells[i + 1].textContent.trim();
        }
        if (cell.textContent.includes('Nationality') && tableCells[i + 1]) {
          nation = tableCells[i + 1].textContent.trim();
        }
      }

      const imageElement = document.querySelector('#profpic img');
      const imageUrl = imageElement ? imageElement.getAttribute('src') : null;

      return {
        birthDate: birthDate, // A formatação será feita depois
        nation: nation,
        mainImageUrl: imageUrl,
      };
    });

    // Fecha o navegador
    await browser.close();

    // Formata os dados depois de os ter extraído
    const finalData = {
      birthDate: formatDate(scrapedData.birthDate),
      nation: scrapedData.nation,
      mainImageUrl: scrapedData.mainImageUrl ? `https://www.babepedia.com${scrapedData.mainImageUrl}` : null,
    };
    
    res.status(200).json(finalData);

  } catch (error) {
    if (browser) await browser.close();
    console.error('ERRO NA API DE SCRAPING:', error.message);
    res.status(500).json({ error: 'Falha ao obter os dados do ator.' });
  }
}
