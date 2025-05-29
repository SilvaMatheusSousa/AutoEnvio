// ==UserScript==
// @name         Agendador de Comandos Tribal Wars com IDs
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  Adiciona uma tabela editável para agendar comandos no Tribal Wars com IDs de origem e destino
// @author       Seu Nome
// @match        https://*.tribalwars.com.br/game.php?village=*&screen=overview_villages&mode=commands
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // Configurações iniciais
    const hasArcher = document.querySelector('a[href*="archer"]') !== null;
    const units = ['spear', 'sword', 'axe', 'spy', 'light', 'heavy', 'ram', 'catapult', 'knight', 'snob'];
    if (hasArcher) {
        units.splice(3, 0, 'archer');
        units.splice(6, 0, 'marcher');
    }

    // Templates para unidades
    const templates = {
        all: {
            spear: 'all',
            sword: 'all',
            axe: 'all',
            spy: 'all',
            light: 'all',
            heavy: 'all',
            ram: 'all',
            catapult: 'all',
            knight: 'all',
            snob: 'all'
        }
    };

    if (hasArcher) {
        templates.all.archer = 'all';
        templates.all.marcher = 'all';
    }

    // Funções auxiliares
    function getUnitName(unit) {
        const names = {
            spear: 'Lanceiro',
            sword: 'Espadachim',
            axe: 'Bárbaro',
            archer: 'Arqueiro',
            spy: 'Explorador',
            light: 'Cavalaria leve',
            marcher: 'Arqueiro a Cavalo',
            heavy: 'Cavalaria pesada',
            ram: 'Ariete',
            catapult: 'Catapulta',
            knight: 'Paladino',
            snob: 'Nobre'
        };
        return names[unit] || unit;
    }

    function generateCommandUrl(sourceVillageId, targetVillageId, commandType, unitsData) {
        const unitParams = [];
        
        units.forEach(unit => {
            const value = unitsData[unit] || '0';
            if (value && value !== '0') {
                unitParams.push(`${unit}=${value}`);
            }
        });

        if (unitParams.length === 0) {
            for (const unit in templates.all) {
                unitParams.push(`${unit}=all`);
            }
        }

        return `/game.php?village=${sourceVillageId}&screen=place&target=${targetVillageId}&${unitParams.join('&')}&type=${commandType.toLowerCase()}`;
    }

    function calculateLaunchTime(arrivalDate, sourceCoords, targetCoords) {
        const arrival = new Date(arrivalDate);
        const [x1, y1] = sourceCoords.split('|').map(Number);
        const [x2, y2] = targetCoords.split('|').map(Number);
        const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        // Tempo estimado de viagem (simplificado)
        const travelTimeMinutes = distance * 2;
        const launchTime = new Date(arrival.getTime() - travelTimeMinutes * 60000);
        
        return launchTime.toISOString().slice(0, 16);
    }

    // Funções de UI
    function generateUnitCheckboxes() {
        return units.map(unit => `
            <th>
                <a href="#" class="unit_link" data-unit="${unit}">
                    <img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_${unit}.png" title="${getUnitName(unit)}">
                </a>
                <input type="checkbox" class="unit-checkbox" data-unit="${unit}" style="margin-left:4px;vertical-align:middle;">
            </th>
        `).join('');
    }

    function generateUnitInputs() {
        return units.map(unit => `
            <td>
                <input id="unit_input_${unit}" type="text" value="0" style="width: 25px;" data-all-count="0">
            </td>
        `).join('');
    }

    function generateUnitHeaders() {
        return units.map(unit => `
            <th style="text-align:center" width="40px">
                <div>
                    <a href="#" class="unit_link" data-unit="${unit}">
                        <img src="https://dsbr.innogamescdn.com/asset/a0d6e34a/graphic/unit/unit_${unit}.webp" data-title="${getUnitName(unit)}">
                    </a>
                </div>
            </th>
        `).join('');
    }

    function generateUnitCells(unitsData) {
        return units.map(unit => `
            <td style="text-align:center">${unitsData[unit] || '0'}</td>
        `).join('');
    }

    function createTable() {
        return `
            <table class="vis nowrap custom-table" style="width: 100%;">
                <thead>
                    <tr>
                        <th colspan="6"><span class="column-title" style="font-size:16px">🗓️ Agenda de Comandos <img src='https://dsbr.innogamescdn.com/asset/61bc21fc/graphic/events/encounter/icon_equip.png' /></span></th>
                    </tr>
                    <tr>
                        <th colspan="6" style="text-align: center;">Adicionar comando rapidamente</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="6">
                            <table class="vis" style="border-collapse: separate; border-spacing: 3px; table-layout: fixed; width: 100%;">
                                <tbody>
                                    <tr>
                                        ${generateUnitCheckboxes()}
                                    </tr>
                                    <tr class="units-row">
                                        ${generateUnitInputs()}
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <th style="text-align: center;">Origem (X|Y)</th>
                        <th style="text-align: center;">Destino (X|Y)</th>
                        <th style="text-align: center;">Hora de chegada</th>
                        <th style="text-align: center;">Tipo</th>
                        <th style="text-align: center;" colspan="2">Adicionar</th>
                    </tr>
                    <tr>
                        <td><input type="text" id="quickAddSource" style="width:70px" placeholder="555|555"></td>
                        <td><input type="text" id="quickAddTarget" style="width:70px" placeholder="555|555"></td>
                        <td><input type="datetime-local" id="quickAddDate" step="1"></td>
                        <td>
                            <select id="quickAddCommandTypeSelection">
                                <option value="Attack">Ataque</option>
                                <option value="Support">Suporte</option>
                            </select>
                        </td>
                        <td colspan="2">
                            <button id="quickAddButton" class="btn">Adicionar</button>
                            <button id="toggleScheduledCommands" class="btn" title="Clique aqui para ver os comandos agendados">Visualizar</button>
                            <button id="clearAllCommands" class="btn" title="Limpar todos os comandos" style="margin-left:5px;">Limpar Tudo</button>
                        </td>
                    </tr>
                </tbody>
                <thead>
                    <tr id="scheduledHeader">
                        <th colspan="${units.length + 7}" style="text-align: center;">Comandos Agendados</th>
                    </tr>
                    <tr id="scheduledTableHead">
                        <th>Origem</th>
                        <th>Destino</th>
                        <th>Lançamento</th>
                        <th>Chegada</th>
                        <th>Tipo</th>
                        ${generateUnitHeaders()}
                        <th colspan="2">Ações</th>
                    </tr>
                </thead>
                <tbody id="scheduledCommands"></tbody>
            </table>
        `;
    }

    // Funções principais
    function insertTable() {
        const modemenuTable = document.querySelector('#overview_menu');

        if (modemenuTable && !document.querySelector('.vis.nowrap.custom-table')) {
            const newTableDiv = document.createElement('div');
            newTableDiv.classList.add('custom-table');
            newTableDiv.innerHTML = createTable();
            modemenuTable.insertAdjacentElement('afterend', newTableDiv);

            // Ocultar inicialmente a seção de comandos agendados
            document.getElementById('scheduledHeader').style.display = 'none';
            document.getElementById('scheduledTableHead').style.display = 'none';
            document.getElementById('scheduledCommands').style.display = 'none';

            addEventListeners();
            loadScheduledCommands();
        }
    }

    function addEventListeners() {
        // Adicionar comando rápido
        document.getElementById('quickAddButton').addEventListener('click', addQuickCommand);

        // Toggle visualização comandos agendados
        document.getElementById('toggleScheduledCommands').addEventListener('click', toggleScheduledCommandsView);

        // Limpar todos os comandos
        document.getElementById('clearAllCommands').addEventListener('click', clearAllCommands);

        // Eventos para checkboxes de unidades
        document.querySelectorAll('.unit-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const unit = this.dataset.unit;
                const input = document.getElementById(`unit_input_${unit}`);
                input.value = this.checked ? 'all' : '0';
            });
        });

        // Eventos para links de unidades
        document.querySelectorAll('.unit_link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const unit = this.dataset.unit;
                const input = document.getElementById(`unit_input_${unit}`);
                const checkbox = document.querySelector(`.unit-checkbox[data-unit="${unit}"]`);
                
                if (input.value === '0' || input.value === '') {
                    input.value = 'all';
                    if (checkbox) checkbox.checked = true;
                } else {
                    input.value = '0';
                    if (checkbox) checkbox.checked = false;
                }
            });
        });
    }

    async function addQuickCommand() {
        const source = document.getElementById('quickAddSource').value.trim();
        const target = document.getElementById('quickAddTarget').value.trim();
        const date = document.getElementById('quickAddDate').value;
        const type = document.getElementById('quickAddCommandTypeSelection').value;

        if (!source || !target || !date) {
            alert('Preencha todos os campos obrigatórios.');
            return;
        }

        if (!source.match(/^\d+\|\d+$/) || !target.match(/^\d+\|\d+$/)) {
            alert('Formato de coordenadas inválido. Use XXX|YYY.');
            return;
        }

        const [sourceVillageId, targetVillageId] = await Promise.all([
            getVillageIdByCoordinates(source),
            getVillageIdByCoordinates(target)
        ]);

        if (!sourceVillageId) {
            alert('Vila de origem não encontrada.');
            return;
        }

        if (!targetVillageId) {
            alert('Vila de destino não encontrada.');
            return;
        }

        const arrivalDate = new Date(date);
        if (arrivalDate < new Date()) {
            alert('A data/hora deve ser no futuro.');
            return;
        }

        // Coletar unidades selecionadas
        const selectedUnits = {};
        units.forEach(unit => {
            const input = document.getElementById(`unit_input_${unit}`);
            selectedUnits[unit] = input.value;
        });

        addScheduledCommand({
            sourceVillageId,
            targetVillageId,
            sourceCoords: source,
            targetCoords: target,
            arrivalDate: date,
            type,
            units: selectedUnits
        });

        // Limpar campos após adicionar
        document.getElementById('quickAddSource').value = '';
        document.getElementById('quickAddTarget').value = '';
    }

    function toggleScheduledCommandsView() {
        const header = document.getElementById('scheduledHeader');
        const tableHead = document.getElementById('scheduledTableHead');
        const body = document.getElementById('scheduledCommands');
        const btn = document.getElementById('toggleScheduledCommands');

        const isHidden = body.style.display === 'none';

        header.style.display = isHidden ? '' : 'none';
        tableHead.style.display = isHidden ? '' : 'none';
        body.style.display = isHidden ? '' : 'none';

        btn.textContent = isHidden ? 'Ocultar' : 'Visualizar';
        btn.title = isHidden ? 'Clique para ocultar comandos' : 'Clique aqui para ver os comandos agendados';
    }

    function clearAllCommands() {
        if (confirm('Tem certeza que deseja excluir TODOS os comandos agendados?')) {
            document.getElementById('scheduledCommands').innerHTML = '';
            GM_deleteValue('scheduledCommands');
        }
    }

    async function getVillageIdByCoordinates(coordinates) {
        const [x, y] = coordinates.split('|');
        try {
            const response = await fetch(`/map/village.txt`, { cache: "no-store" });
            const text = await response.text();
            const villages = text.split('\n').map(line => line.split(','));
            const villageData = villages.find(v => v[2] === x && v[3] === y);
            return villageData ? villageData[0] : null;
        } catch (e) {
            console.error('Erro ao buscar dados da vila:', e);
            return null;
        }
    }

    function addScheduledCommand(command) {
        const tableBody = document.getElementById('scheduledCommands');
        const newRow = document.createElement('tr');
        const commandUrl = generateCommandUrl(command.sourceVillageId, command.targetVillageId, command.type, command.units);

        newRow.innerHTML = `
            <td style="width: 40px;">
            <input type="text" value="${command.sourceCoords}" readonly>
            </td>
            <td style="width: 40px;">
            <input type="text" value="${command.targetCoords}" readonly></td>
            <td><input type="datetime-local" value="${calculateLaunchTime(command.arrivalDate, command.sourceCoords, command.targetCoords)}" readonly></td>
            <td><input type="datetime-local" value="${command.arrivalDate}" readonly></td>
            <td>
                <select disabled>
                    <option value="Attack" ${command.type === 'Attack' ? 'selected' : ''}>Ataque</option>
                    <option value="Support" ${command.type === 'Support' ? 'selected' : ''}>Suporte</option>
                </select>
            </td>
            ${generateUnitCells(command.units)}
            <td>
                <button class="editButton">Editar</button>
                <button class="deleteButton">Excluir</button>
                <a href="${window.location.origin}${commandUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-cmd-send" style="margin-left: 5px;">Enviar</a>
            </td>
        `;

        tableBody.appendChild(newRow);
        newRow.querySelector('.editButton').addEventListener('click', () => startEditingCommand(newRow, command));
        newRow.querySelector('.deleteButton').addEventListener('click', () => deleteCommand(newRow));
        
        saveCommandsToStorage();
    }

    function startEditingCommand(row, originalCommand) {
        const cells = row.querySelectorAll('td');
        const inputs = row.querySelectorAll('input, select');
        
        inputs.forEach(input => {
            input.readOnly = false;
            input.disabled = false;
        });
        
        const actionCell = cells[cells.length - 1];
        actionCell.innerHTML = `
            <button class="saveButton">Salvar</button>
            <button class="cancelButton">Cancelar</button>
        `;
        
        actionCell.querySelector('.saveButton').addEventListener('click', () => saveEditedCommand(row));
        actionCell.querySelector('.cancelButton').addEventListener('click', () => cancelEditing(row, originalCommand));
    }

    function saveEditedCommand(row) {
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach(input => {
            input.readOnly = true;
            input.disabled = true;
        });
        
        const actionCell = row.querySelector('td:last-child');
        actionCell.innerHTML = `
            <button class="editButton">Editar</button>
            <button class="deleteButton">Excluir</button>
            <a href="#" class="btn btn-cmd-send" style="margin-left: 5px;">Enviar</a>
        `;
        
        // Reatribuir eventos
        actionCell.querySelector('.editButton').addEventListener('click', () => startEditingCommand(row));
        actionCell.querySelector('.deleteButton').addEventListener('click', () => deleteCommand(row));
        
        saveCommandsToStorage();
    }

    function cancelEditing(row, originalCommand) {
        // Restaurar valores originais
        const cells = row.querySelectorAll('td');
        cells[0].innerHTML = `<input type="text" value="${originalCommand.sourceCoords}" readonly>`;
        cells[1].innerHTML = `<input type="text" value="${originalCommand.targetCoords}" readonly>`;
        cells[2].innerHTML = `<input type="text" value="${originalCommand.sourceVillageId}" readonly>`;
        cells[3].innerHTML = `<input type="text" value="${originalCommand.targetVillageId}" readonly>`;
        cells[4].innerHTML = `<input type="datetime-local" value="${calculateLaunchTime(originalCommand.arrivalDate, originalCommand.sourceCoords, originalCommand.targetCoords)}" readonly>`;
        cells[5].innerHTML = `<input type="datetime-local" value="${originalCommand.arrivalDate}" readonly>`;
        cells[6].innerHTML = `
            <select disabled>
                <option value="Attack" ${originalCommand.type === 'Attack' ? 'selected' : ''}>Ataque</option>
                <option value="Support" ${originalCommand.type === 'Support' ? 'selected' : ''}>Suporte</option>
            </select>
        `;
        
        // Restaurar unidades
        const unitCells = cells.slice(7, 7 + units.length);
        units.forEach((unit, index) => {
            unitCells[index].innerHTML = originalCommand.units[unit] || '0';
        });
        
        // Restaurar ações
        cells[cells.length - 1].innerHTML = `
            <button class="editButton">Editar</button>
            <button class="deleteButton">Excluir</button>
            <a href="#" class="btn btn-cmd-send" style="margin-left: 5px;">Enviar</a>
        `;
        
        // Reatribuir eventos
        cells[cells.length - 1].querySelector('.editButton').addEventListener('click', () => startEditingCommand(row, originalCommand));
        cells[cells.length - 1].querySelector('.deleteButton').addEventListener('click', () => deleteCommand(row));
    }

    function deleteCommand(row) {
        if (confirm('Tem certeza que deseja excluir este comando?')) {
            row.remove();
            saveCommandsToStorage();
        }
    }

    function saveCommandsToStorage() {
        const commands = [];
        document.querySelectorAll('#scheduledCommands tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length > 0) {
                const unitsData = {};
                const unitCells = cells.slice(7, 7 + units.length);
                units.forEach((unit, index) => {
                    unitsData[unit] = unitCells[index].textContent;
                });

                commands.push({
                    sourceVillageId: cells[2].querySelector('input').value,
                    targetVillageId: cells[3].querySelector('input').value,
                    sourceCoords: cells[0].querySelector('input').value,
                    targetCoords: cells[1].querySelector('input').value,
                    arrivalDate: cells[5].querySelector('input').value,
                    type: cells[6].querySelector('select').value,
                    units: unitsData
                });
            }
        });
        GM_setValue('scheduledCommands', JSON.stringify(commands));
    }

    function loadScheduledCommands() {
        const savedCommands = GM_getValue('scheduledCommands');
        if (savedCommands) {
            try {
                const commands = JSON.parse(savedCommands);
                commands.forEach(cmd => {
                    addScheduledCommand(cmd);
                });
            } catch (e) {
                console.error('Erro ao carregar comandos salvos:', e);
            }
        }
    }

    // Inicialização
    insertTable();

    // Verificação periódica de comandos pendentes
    setInterval(() => {
        const now = new Date();
        document.querySelectorAll('#scheduledCommands tr').forEach(row => {
            const arrivalDate = new Date(row.querySelector('td:nth-child(6) input').value);
            const diffMinutes = (arrivalDate - now) / (1000 * 60);
            
            if (diffMinutes > 0 && diffMinutes < 5) {
                // Comando deve ser enviado em breve
                row.style.backgroundColor = '#fff3cd';
            } else if (diffMinutes <= 0) {
                // Comando deve ser enviado agora
                const sendButton = row.querySelector('.btn-cmd-send');
                if (sendButton) {
                    sendButton.click();
                    row.style.backgroundColor = '#d4edda';
                }
            }
        });
    }, 60000); // Verifica a cada minuto
})();
