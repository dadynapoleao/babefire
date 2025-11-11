export default async function handler(req, res) {
  // --- INÍCIO DO CÓDIGO CORS ---
  // Define que o seu site pode aceder a esta API.
  // Para mais segurança, substitua '*' pelo URL do seu site: 'https://dadynapoleao.github.io'
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  
  // Define os métodos HTTP permitidos
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  // Define os cabeçalhos permitidos
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');

  // O navegador envia um pedido "OPTIONS" antes do "GET" para verificar a permissão.
  // Se for esse o caso, apenas respondemos com sucesso.
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  // --- FIM DO CÓDIGO CORS ---

  // --- O SEU CÓDIGO EXISTENTE VAI AQUI ---
  // É uma boa prática envolver o seu código num bloco try...catch
  try {
    const { name } = req.query;

    // ... a sua lógica de scraping continua aqui ...
    
    // Exemplo de resposta de sucesso
    const scrapedData = { /* dados que você obteve */ };
    res.status(200).json(scrapedData);

  } catch (error) {
    // Se ocorrer um erro, envie uma resposta de erro clara
    console.error("Erro na API de scraping:", error); // Isto aparecerá nos logs da Vercel
    res.status(500).json({ error: 'Ocorreu um erro ao processar o seu pedido.' });
  }
}
