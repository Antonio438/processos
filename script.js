// --- CONSTANTE GLOBAL PARA O ENDEREÇO DO SERVIDOR ---
const API_URL = 'https://processos-servidor-onrender-com.onrender.com';

// --- VARIÁVEIS GLOBAIS ---
let processToDeleteId = null; 

// --- EVENTOS INICIAIS ---
window.onload = () => {
    setupEventListeners();
    loadProcesses();
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
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('visible');
    }, 10);
}

function hideModal() {
    processToDeleteId = null;
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('visible');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (CRUD) ---
/**
 * @description Carrega os processos do servidor e os exibe na tabela.
 */
function loadProcesses() {
    fetch(`${API_URL}/processes`)
        .then(response => {
            if (!response.ok) throw new Error('A resposta da rede não foi bem-sucedida.');
            return response.json();
        })
        .then(processes => {
            processes.sort((a, b) => parseInt(a.pc) - parseInt(b.pc));
            
            const tableBody = document.getElementById("processTable").getElementsByTagName('tbody')[0];
            tableBody.innerHTML = ''; 

            processes.forEach(process => {
                const row = tableBody.insertRow();
                row.dataset.id = process.id;

                // Salva os dados originais na linha para a função de "Cancelar Edição"
                row.dataset.originalData = JSON.stringify(process);

                // Adiciona as novas classes para estilização e define contenteditable como false por padrão
                row.innerHTML = `
                    <td class="numeric-cell" contenteditable="false" data-field="pc">${process.pc || ''}</td>
                    <td class="fornecedor-cell" contenteditable="false" data-field="fornecedor">${process.fornecedor || ''}</td>
                    <td contenteditable="false" data-field="modalidade">${process.modalidade || ''}</td>
                    <td class="numeric-cell" contenteditable="false" data-field="numMod">${process.numMod || ''}</td>
                    <td contenteditable="false" data-field="info">${process.info || ''}</td>
                    <td class="actions-cell"></td>
                `;
                
                // Adiciona os botões de ação dinamicamente
                renderActionButtons(row, 'default');
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

/**
 * @description Adiciona um novo processo ao servidor.
 */
function addProcess() {
    // ... (função sem alterações)
    const pc = document.getElementById('newProcessPC').value.trim();
    const fornecedor = document.getElementById('newProcessFornecedor').value.trim().toUpperCase();
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

/**
 * @description Exclui um processo do servidor.
 */
function deleteProcess() {
    // ... (função sem alterações)
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


/**
 * @description Atualiza um processo no servidor.
 * @param {HTMLTableRowElement} row - A linha da tabela que foi modificada.
 */
function updateProcess(row) {
    const id = row.dataset.id;
    const cells = row.querySelectorAll('td[data-field]');
    
    const updatedProcess = {
        pc:         cells[0].textContent,
        // Garante que o fornecedor seja salvo em MAIÚSCULO
        fornecedor: cells[1].textContent.toUpperCase(),
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
        // Atualiza os dados originais e sai do modo de edição
        row.dataset.originalData = JSON.stringify(data);
        toggleEditMode(row, false);
    })
    .catch(error => {
        console.error('Erro ao atualizar processo:', error);
        alert('Ocorreu um erro ao salvar as alterações.');
        cancelEdit(row); // Restaura os dados originais em caso de erro
    });
}

// --- NOVAS FUNÇÕES PARA O MODO DE EDIÇÃO ---

/**
 * @description Alterna o modo de edição para uma linha da tabela.
 * @param {HTMLTableRowElement} row - A linha para ativar/desativar a edição.
 * @param {boolean} isEditing - True para ativar, false para desativar.
 */
function toggleEditMode(row, isEditing) {
    row.classList.toggle('editing-row', isEditing);
    const cells = row.querySelectorAll('td[data-field]');
    cells.forEach(cell => {
        cell.contentEditable = isEditing;
    });

    if (isEditing) {
        cells[0].focus(); // Foca na primeira célula ao entrar em modo de edição
        renderActionButtons(row, 'editing');
    } else {
        renderActionButtons(row, 'default');
    }
}

/**
 * @description Restaura os dados originais de uma linha e sai do modo de edição.
 * @param {HTMLTableRowElement} row - A linha a ser restaurada.
 */
function cancelEdit(row) {
    const originalData = JSON.parse(row.dataset.originalData);
    const cells = row.querySelectorAll('td[data-field]');

    cells.forEach(cell => {
        const field = cell.dataset.field;
        cell.textContent = originalData[field] || '';
    });

    toggleEditMode(row, false);
}

/**
 * @description Renderiza os botões de ação (Editar/Excluir ou Salvar/Cancelar).
 * @param {HTMLTableRowElement} row - A linha onde os botões serão inseridos.
 * @param {'default' | 'editing'} mode - O modo atual da linha.
 */
function renderActionButtons(row, mode) {
    const actionsCell = row.querySelector('.actions-cell');
    actionsCell.innerHTML = ''; // Limpa botões existentes

    if (mode === 'default') {
        // Ícone de Lápis (Editar)
        const editBtn = document.createElement('button');
        editBtn.className = 'icon-button edit-btn';
        editBtn.title = 'Editar';
        editBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/></svg>`;
        editBtn.onclick = () => toggleEditMode(row, true);

        // Ícone de Lixeira (Excluir)
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-button delete-btn';
        deleteBtn.title = 'Excluir';
        deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/><path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/></svg>`;
        deleteBtn.onclick = () => showDeleteModal(row.dataset.id);

        actionsCell.append(editBtn, deleteBtn);
    } else {
        // Ícone de Check (Salvar)
        const saveBtn = document.createElement('button');
        saveBtn.className = 'icon-button save-btn';
        saveBtn.title = 'Salvar';
        saveBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022z"/></svg>`;
        saveBtn.onclick = () => updateProcess(row);

        // Ícone de X (Cancelar)
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'icon-button cancel-btn';
        cancelBtn.title = 'Cancelar';
        cancelBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>`;
        cancelBtn.onclick = () => cancelEdit(row);

        actionsCell.append(saveBtn, cancelBtn);
    }
}


// --- FUNÇÃO DE UTILIDADE ---
function filterTable() {
    // ... (função sem alterações)
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
