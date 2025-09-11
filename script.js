// --- CONSTANTE GLOBAL PARA O ENDEREÇO DO SERVIDOR ---
// O endereço é dinâmico e funciona em qualquer máquina da rede.
const API_URL = 'https://processos-servidor-onrender-com.onrender.com';

// --- VARIÁVEIS GLOBAIS ---
let processToDeleteId = null; // Armazena o ID do processo a ser excluído.

// --- EVENTOS INICIAIS ---
window.onload = () => {
    setupEventListeners(); // Configura todos os eventos da página.
    loadProcesses();      // Carrega os processos do servidor.
};

/**
 * @description Centraliza a configuração de todos os listeners de eventos.
 */
function setupEventListeners() {
    document.getElementById('addProcessButton').addEventListener('click', addProcess);
    document.getElementById('search').addEventListener('input', filterTable);
    document.getElementById('resetButton').addEventListener('click', () => {
        document.getElementById('search').value = '';
        filterTable();
    });
    document.getElementById('confirmDelete').addEventListener('click', deleteProcess);
    document.getElementById('cancelDelete').addEventListener('click', hideModal);
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('deleteModal');
        if (event.target == modal) {
            hideModal();
        }
    });
}

// --- FUNÇÕES DO MODAL DE CONFIRMAÇÃO ---
function showDeleteModal(processId) {
    processToDeleteId = processId;
    document.getElementById('deleteModal').style.display = 'block';
}

function hideModal() {
    processToDeleteId = null;
    document.getElementById('deleteModal').style.display = 'none';
}

// --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (CRUD) ---
function loadProcesses() {
    fetch(`${API_URL}/processes`)
        .then(response => {
            if (!response.ok) {
                throw new Error('A resposta da rede não foi bem-sucedida. Verifique a conexão com o servidor.');
            }
            return response.json();
        })
        .then(processes => {
            processes.sort((a, b) => parseInt(a.pc) - parseInt(b.pc));
            const tableBody = document.getElementById("processTable").getElementsByTagName('tbody')[0];
            tableBody.innerHTML = ''; 

            processes.forEach(process => {
                const row = tableBody.insertRow();
                row.dataset.id = process.id;

                row.innerHTML = `
                    <td contenteditable="true" data-field="pc">${process.pc || ''}</td>
                    <td contenteditable="true" data-field="fornecedor">${process.fornecedor || ''}</td>
                    <td contenteditable="true" data-field="modalidade">${process.modalidade || ''}</td>
                    <td contenteditable="true" data-field="numMod">${process.numMod || ''}</td>
                    <td contenteditable="true" data-field="info">${process.info || ''}</td>
                    <td><button class="deleteButton">Excluir</button></td>
                `;

                row.querySelectorAll('td[contenteditable="true"]').forEach(cell => {
                    cell.addEventListener('blur', () => updateProcess(row));
                });

                row.querySelector('.deleteButton').addEventListener('click', () => {
                    showDeleteModal(process.id);
                });
            });
            filterTable();
        })
        .catch(error => {
            console.error('Erro ao carregar os processos:', error);
            const noResults = document.getElementById("noResults");
            noResults.textContent = 'Erro ao carregar dados. Verifique se o servidor está rodando.';
            noResults.style.display = 'block';
        });
}

function addProcess() {
    const pc = document.getElementById('newProcessPC').value.trim();
    const fornecedor = document.getElementById('newProcessFornecedor').value.trim();
    const modalidade = document.getElementById('newProcessModalidade').value.trim();
    const numMod = document.getElementById('newProcessNumMod').value.trim();
    const info = document.getElementById('newProcessInfo').value.trim();

    if (!pc) {
        alert('Por favor, preencha pelo menos o campo P.C.');
        return;
    }

    const newProcess = { pc, fornecedor, modalidade, numMod, info };

    fetch(`${API_URL}/processes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProcess),
    })
    .then(response => {
        if (!response.ok) throw new Error('Falha ao adicionar o processo.');
        return response.json();
    })
    .then(() => {
        document.getElementById('newProcessPC').value = '';
        document.getElementById('newProcessFornecedor').value = '';
        document.getElementById('newProcessModalidade').value = '';
        document.getElementById('newProcessNumMod').value = '';
        document.getElementById('newProcessInfo').value = '';
        loadProcesses();
    })
    .catch(error => {
        console.error('Erro ao adicionar processo:', error);
        alert('Ocorreu um erro ao tentar adicionar o processo.');
    });
}

function deleteProcess() {
    if (!processToDeleteId) return;

    fetch(`${API_URL}/processes/${processToDeleteId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (!response.ok) throw new Error('Falha ao excluir o processo.');
        hideModal();
        loadProcesses();
    })
    .catch(error => {
        console.error('Erro ao excluir processo:', error);
        alert('Ocorreu um erro ao tentar excluir o processo.');
        hideModal();
    });
}

function updateProcess(row) {
    const id = row.dataset.id;
    const cells = row.querySelectorAll('td[contenteditable="true"]');
    
    const updatedProcess = {
        pc:         cells[0].textContent,
        fornecedor: cells[1].textContent,
        modalidade: cells[2].textContent,
        numMod:     cells[3].textContent,
        info:       cells[4].textContent
    };

    fetch(`${API_URL}/processes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProcess)
    })
    .then(response => {
        if (!response.ok) throw new Error('Falha ao atualizar o processo.');
        return response.json();
    })
    .then(data => {
        console.log('Processo atualizado com sucesso:', data);
    })
    .catch(error => {
        console.error('Erro ao atualizar processo:', error);
        alert('Ocorreu um erro ao salvar as alterações. A página será recarregada para garantir a consistência dos dados.');
        loadProcesses();
    });
}

// --- FUNÇÃO DE UTILIDADE ---
function filterTable() {
    const filterText = document.getElementById('search').value.toLowerCase();
    const tableBody = document.getElementById('processTable').getElementsByTagName('tbody')[0];
    const rows = tableBody.getElementsByTagName('tr');
    const noResultsDiv = document.getElementById('noResults');
    let visibleRowCount = 0;

    for (const row of rows) {
        if (row.textContent.toLowerCase().includes(filterText)) {
            row.style.display = '';
            visibleRowCount++;
        } else {
            row.style.display = 'none';
        }
    }

    noResultsDiv.style.display = visibleRowCount === 0 && rows.length > 0 ? 'block' : 'none';
}
