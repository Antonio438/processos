// Importa os módulos necessários
const express = require('express');
const path = require('path');

// Inicializa o aplicativo Express
const app = express();

// Define a porta. É MUITO IMPORTANTE usar process.env.PORT para o Render
const PORT = process.env.PORT || 3000;

// ROTA PRINCIPAL: Servir o arquivo index.html (seu front-end)
// Quando alguém acessar a URL raiz ('/'), este código será executado.
app.get('/', (req, res) => {
  // Envia o arquivo 'index.html' que está no mesmo diretório
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ROTA DA API: Servir o arquivo processos.json
// Quando o front-end fizer uma requisição para '/api/processos', este código será executado.
app.get('/api/processos', (req, res) => {
  // Envia o arquivo 'processos.json' que está no mesmo diretório
  res.sendFile(path.join(__dirname, 'processos.json'), (err) => {
    if (err) {
      // Se houver um erro (ex: arquivo não encontrado), envia uma resposta de erro
      console.error('Erro ao enviar o arquivo JSON:', err);
      res.status(404).json({ error: "Arquivo de dados não encontrado." });
    }
  });
});

// Inicia o servidor para escutar as requisições na porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
