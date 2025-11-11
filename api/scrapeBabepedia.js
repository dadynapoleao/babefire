import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

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

    // --- CÓDIGO DE INICIALIZAÇÃO CORRIGIDO ---
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath, // CORREÇÃO: Removidos os parênteses ()
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36');
    
    const targetUrl = `https://www.babepedia.com/babe/${name}`;
    await page.goto(targetUrl, { waitUntil: 'networkidle0' });
    
    const scrapedData = await page.evaluate(() => {
      const infoContainer = document.querySelector('#babe-info');
      if (!infoContainer) return { birthDate: null, nation: null, mainImageUrl: null };

      let birthDate = null;
      let nation = null;
      
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

      return { birthDate, nation, mainImageUrl: imageUrl };
    });

    await browser.close();

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
