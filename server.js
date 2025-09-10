const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
// --- CONFIGURAÇÕES DO SERVIDOR ---
const PORT = 3000;
const HOST = '0.0.0.0'; 
const DADOS_FILE = path.join(__dirname, 'dados.json');

// --- Middlewares ---
// Habilita CORS para permitir que o frontend acesse a API
app.use(cors());
// Habilita o parsing de JSON no corpo das requisições
app.use(express.json());

// --- Servir arquivos estáticos (HTML, CSS, etc.) ---
// Permite que o servidor encontre e envie o arquivo Pesquisa.html
app.use(express.static(__dirname));

// --- Funções Auxiliares para Manipulação de Dados ---
async function lerDados() {
  try {
    const dados = await fs.readFile(DADOS_FILE, 'utf-8');
    return JSON.parse(dados);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // Se o arquivo não existe, cria um com uma lista vazia
      await escreverDados({ processes: [] });
      return { processes: [] };
    }
    throw error;
  }
}

async function escreverDados(dados) {
  await fs.writeFile(DADOS_FILE, JSON.stringify(dados, null, 2), 'utf-8');
}

// --- Rotas da API (Endpoints) ---

// [GET] /processes - Listar todos os processos
app.get('/processes', async (req, res) => {
  try {
    const dados = await lerDados();
    res.status(200).json(dados.processes || []);
  } catch (error) {
    console.error('Erro em GET /processes:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao ler dados.' });
  }
});

// [POST] /processes - Adicionar um novo processo
app.post('/processes', async (req, res) => {
  try {
    const novoProcesso = req.body;
    const dados = await lerDados();
    
    // Gera um ID hexadecimal único
    let novoId;
    do {
      novoId = crypto.randomBytes(2).toString('hex');
    } while (dados.processes.some(p => p.id === novoId));

    novoProcesso.id = novoId;
    dados.processes.push(novoProcesso);
    await escreverDados(dados);
    
    res.status(201).json(novoProcesso);
  } catch (error) {
    console.error('Erro em POST /processes:', error);
    res.status(500).json({ error: 'Erro interno no servidor ao salvar dados.' });
  }
});

// [PUT] /processes/:id - Atualizar um processo existente
app.put('/processes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;
    const dados = await lerDados();
    
    const index = dados.processes.findIndex(p => p.id === id);

    if (index !== -1) {
      dados.processes[index] = { ...dadosAtualizados, id };
      await escreverDados(dados);
      res.status(200).json(dados.processes[index]);
    } else {
      res.status(404).json({ error: 'Processo não encontrado.' });
    }
  } catch (error) {
    console.error(`Erro em PUT /processes/${req.params.id}:`, error);
    res.status(500).json({ error: 'Erro interno no servidor ao atualizar dados.' });
  }
});

// [DELETE] /processes/:id - Excluir um processo
app.delete('/processes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const dados = await lerDados();
    const tamanhoOriginal = dados.processes.length;

    dados.processes = dados.processes.filter(p => p.id !== id);

    if (dados.processes.length < tamanhoOriginal) {
      await escreverDados(dados);
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Processo não encontrado.' });
    }
  } catch (error) {
    console.error(`Erro em DELETE /processes/${req.params.id}:`, error);
    res.status(500).json({ error: 'Erro interno no servidor ao excluir dados.' });
  }
});

// --- Iniciar o Servidor ---
app.listen(PORT, HOST, () => {
  console.log(`Servidor Node.js rodando na porta ${PORT} e acessível na sua rede.`);
  console.log('Para acessar, use o IP da sua máquina. Ex: http://SEU_IP_LOCAL:3000/Pesquisa.html');
  console.log('Pressione CTRL+C para parar o servidor.');
});