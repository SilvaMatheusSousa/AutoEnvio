// ==UserScript==
// @name         Agendador Gold Silva
// @version      5.1
// @description  Agenda comandos, calcula envio, tenta enviar automaticamente (com ressalvas), armazena tropas e permite edição.
// @author       Silva
// @include      https://**screen=memo*
// @include      https://**screen=place*
// @include      https://**screen=map*
// @include      https://**screen=place*
// @include      https://**screen=place&try=confirm*
// @require      https://code.jquery.com/jquery-2.2.4.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @run-at       document-end
// ==/UserScript==

(function () {
  'use strict';

  // --- Configurações Globais ---
  const SCRIPT_PREFIX = 'twScheduler_';
  const VILLAGE_DATA_URL = '/map/village.txt';
  const SAVE_DEBOUNCE_MS = 500;
  const COMMAND_SOON_MINUTES = 5;
  const MAX_TIMEOUT_DELAY = 2147483647;


  // --- GM_* Fallbacks for Local Testing ---
  if (typeof GM_getValue !== 'function') {
    window.GM_getValue = function (key, def) {
      const val = localStorage.getItem(key);
      try {
        return val !== null ? JSON.parse(val) : def;
      } catch {
        return def;
      }
    };
  }
  if (typeof GM_setValue !== 'function') {
    window.GM_setValue = function (key, value) {
      localStorage.setItem(
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
      );
    };
  }
  if (typeof GM_deleteValue !== 'function') {
    window.GM_deleteValue = function (key) {
      localStorage.removeItem(key);
    };
  }
  if (typeof GM_notification !== 'function') {
    window.GM_notification = function (obj) {
      if (obj && obj.text) alert(obj.text);
    };
  }
  if (typeof GM_xmlhttpRequest !== 'function') {
    window.GM_xmlhttpRequest = function (details) {
      fetch(details.url)
        .then((response) => response.text())
        .then(
          (text) =>
            details.onload &&
            details.onload({ status: 200, responseText: text }),
        )
        .catch((error) => details.onerror && details.onerror(error));
    };
  }

  function safeExecute(
    func,
    errorMessage = 'Erro durante execução',
    fallback = null,
  ) {
    try {
      return func();
    } catch (e) {
      console.error(errorMessage, e);
      return fallback;
    }
  }

  // Velocidades base das unidades
  let UNIT_SPEEDS = {
    spear: 18,
    sword: 22,
    axe: 18,
    archer: 18,
    spy: 9,
    light: 10,
    marcher: 10,
    heavy: 11,
    ram: 30,
    catapult: 30,
    knight: 10,
    snob: 35,
  };

  // Função para buscar a configuração do mundo via fetch
  async function getWorldConfiguration() {
    const response = await fetch('/interface.php?func=get_config');
    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'application/xml');
    return xml;
  }

  // Função para ajustar velocidades com base na configuração do mundo
  async function adjustUnitSpeedsByWorldConfig() {
    console.log('Iniciando ajuste de velocidades das unidades...');

    const configXml = await getWorldConfiguration();

    const speed = parseFloat(configXml.querySelector('config > speed')?.textContent || '1');
    const unitSpeed = parseFloat(configXml.querySelector('config > unit_speed')?.textContent || '1');

    console.log(`Velocidades do mundo: speed=${speed}, unit_speed=${unitSpeed}`);

    Object.keys(UNIT_SPEEDS).forEach(unit => {
      const adjusted = UNIT_SPEEDS[unit] / (speed * unitSpeed);
      UNIT_SPEEDS[unit] = Math.max(1, Math.round(adjusted * 100) / 100);
    });

    console.log('Velocidades ajustadas:', UNIT_SPEEDS);
  }

  // Executa o ajuste
  adjustUnitSpeedsByWorldConfig();


  // --- Estilos CSS ---
  const style = document.createElement('style');
  style.textContent = `
    /* Container Principal */
    .tw-command-scheduler {
        background: #f8f5ee;
        border: 1px solid #c4b9a3;
        border-radius: 6px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        margin: 15px 0;
        padding: 15px;
        font-family: 'Trebuchet MS', Arial, sans-serif;
        color: #5b3c11;
    }

    /* Cabeçalho */
    .tw-header {
        display: flex;
        align-items: center;
        padding-bottom: 12px;
        margin-bottom: 15px;
        border-bottom: 2px solid #d8cfbf;
    }
    .tw-title {
        font-size: 18px;
        font-weight: bold;
        color: #7a5c21;
        margin-left: 10px;
    }
    .tw-icon {
        width: 16px;
        height: 16px;
    }

    /* Seções */
    .tw-section {
        background: #f0e9dd;
        border: 1px solid #d0c7b7;
        border-radius: 5px;
        padding: 15px;
        margin-bottom: 15px;
    }
    .tw-section-title {
        font-weight: bold;
        color: #7a5c21;
        margin-bottom: 12px;
        font-size: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
    }

    /* Tabelas */
    .tw-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 1px;
        margin: 10px 0;
    }
    .tw-table th {
        background: linear-gradient(to bottom, #e0d5c3, #c9b79b);
        color: #5b3c11;
        padding: 8px;
        text-align: center;
        font-weight: bold;
        font-size: 12px;
        border: 1px solid #a3a3a3;
    }
    .tw-table td {
        background: #fffcf5;
        padding: 4px 5px;
        text-align: center;
        border: 1px solid #d0c7b7;
        vertical-align: middle;
    }

    /* Inputs e Selects */
    .tw-input, .tw-select, .tw-textarea {
        width: 95%;
        border: 1px solid #a3a3a3;
        border-radius: 3px;
        background: #fff;
        font-size: 12px;
        transition: all 0.2s;
        box-sizing: border-box;
    }
    .tw-input, .tw-textarea {
        text-align: center;
    }
    .tw-textarea {
        min-height: 80px;
        text-align: left;
        resize: vertical;
    }
    .tw-input:focus, .tw-select:focus, .tw-textarea:focus {
        border-color: #7a9c59;
        box-shadow: 0 0 4px rgba(122,156,89,0.4);
        outline: none;
    }
    .tw-input[readonly] {
        background-color: #f0f0f0;
        cursor: not-allowed;
    }
    .tw-input-edit {
        background-color: #fff !important;
        cursor: text !important;
    }
    .tw-table td .tw-input, .tw-table td .tw-select {
        width: 100%
        padding: 2px;
    }
    .tw-table td .tw-unit-input-edit {
         width: 50px !important;
         padding: 2px;
    }

    /* Botões */
    .tw-btn {
        padding: 4px 6px;
        background: linear-gradient(to bottom, #7a9c59, #5d7e3e);
        color: white;
        border: 1px solid #4a632b;
        border-radius: 4px;
        cursor: pointer;
        margin: 0 4px;
        font-size: 12px;
        text-shadow: 0 -1px 0 rgba(0,0,0,0.2);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        transition: all 0.2s;
        white-space: nowrap;
    }
    .tw-btn:hover {
        background: linear-gradient(to bottom, #8aac69, #6d8e4e);
        transform: translateY(-1px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.15);
    }
    .tw-btn:disabled {
        background: #cccccc;
        border-color: #aaaaaa;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
    .tw-btn-send {
        background: linear-gradient(to bottom, #5b8fc9, #3a6ea5);
        border-color: #2a5d95;
    }
    .tw-btn-send:hover:not(:disabled) {
        background: linear-gradient(to bottom, #6b9fd9, #4a7eb5);
    }
    .tw-btn-danger {
        background: linear-gradient(to bottom, #c95b5b, #a53a3a);
        border-color: #952a2a;
    }
    .tw-btn-danger:hover:not(:disabled) {
        background: linear-gradient(to bottom, #d96b6b, #b54a4a);
    }
    .tw-btn-edit {
        background: linear-gradient(to bottom, #f0ad4e, #d6902b);
        border-color: #c78220;
    }
    .tw-btn-edit:hover:not(:disabled) {
        background: linear-gradient(to bottom, #f5bc70, #e09c35);
    }

    /* Ícones de Unidade */
    .tw-unit-icon {
        width: 18px;
        height: 18px;
        vertical-align: middle;
        margin: 0 3px;
        transition: transform 0.2s;
    }
    .tw-unit-icon:hover {
        transform: scale(1.1);
    }
    .tw-checkbox {
        cursor: pointer;
        vertical-align: middle;
        margin-left: 5px;
    }
    .tw-unit-input {
        width: 60px !important;
        background: #fff8e8;
    }

    /* Destaques de Comando */
    .tw-command-soon {
        background: #fff8e0 !important;
        animation: pulseWarning 2s infinite;
    }
    .tw-command-now {
        background: #e0f0d8 !important;
        animation: pulseSuccess 1s infinite;
    }
    .tw-command-sent {
        background: #e9e9e9 !important;
        opacity: 0.7;
    }
    @keyframes pulseWarning {
        0%, 100% { background-color: #fff8e0; }
        50% { background-color: #ffe0b0; }
    }
    @keyframes pulseSuccess {
        0%, 100% { background-color: #e0f0d8; }
        50% { background-color: #c0e0b0; }
    }

    /* Toggle de Comandos */
    .tw-toggle {
        display: none;
    }
    .tw-toggle:checked ~ .tw-commands {
        display: table-row-group;
    }
    .tw-toggle-label {
        cursor: pointer;
        display: inline-block;
        padding: 7px 14px;
        background: linear-gradient(to bottom, #e0d5c3, #c9b79b);
        border-radius: 4px;
        font-weight: bold;
        color: #5b3c11;
        margin-bottom: 10px;
        transition: all 0.2s;
    }
    .tw-toggle-label:hover {
        background: linear-gradient(to bottom, #e8ddd3, #d1bfa3);
    }

    /* Célula de Ações */
    .tw-actions-cell {
        display: flex;
        gap: 4px;
        align-items: center;
        justify-content: center;
        flex-wrap: nowrap;
    }

    /* Agendamento em Massa */
    .tw-mass-scheduler-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 15px;
    }
    .tw-mass-scheduler-grid > div {
        display: flex;
        flex-direction: column;
    }
    .tw-mass-scheduler-grid label {
        font-weight: bold;
        margin-bottom: 5px;
        font-size: 13px;
    }
    .tw-mass-preview-container {
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid #d0c7b7;
        margin-top: 10px;
        background: #fffcf5;
        scrollbar-width: thin;
        scrollbar-color: #c4b9a3 #f0e9dd;
    }
    .tw-mass-preview-container::-webkit-scrollbar {
        width: 8px;
        height: 8px;
    }
    .tw-mass-preview-container::-webkit-scrollbar-track {
        background: #f0e9dd;
        border-radius: 4px;
    }
    .tw-mass-preview-container::-webkit-scrollbar-thumb {
        background-color: #c4b9a3;
        border-radius: 4px;
    }
    .tw-mass-preview-container::-webkit-scrollbar-thumb:hover {
        background-color: #a39b89;
    }
    .tw-mass-preview-container table {
        font-size: 11px;
    }
    .tw-mass-preview-container th {
        font-size: 11px;
        padding: 5px;
    }
    .tw-mass-preview-container td {
        padding: 3px;
    }
    .tw-mass-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 15px;
    }
    #massScheduleStatus {
        font-style: italic;
        color: #7a5c21;
        margin-top: 5px;
        min-height: 1.2em;
    }

    /* Contadores de Comandos */
    #commandCounters {
        display: flex;
        gap: 15px;
        margin-top: 10px;
        font-size: 13px;
        padding: 8px;
        background: #f0e9dd;
        border-radius: 4px;
        border: 1px solid #d0c7b7;
    }
    #commandCounters div {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    #commandCounters strong {
        color: #5b3c11;
    }
    `;
  document.head.appendChild(style);

  // --- Configuração Inicial ---
  let UNITS = [
    'spear',
    'sword',
    'axe',
    'spy',
    'light',
    'heavy',
    'ram',
    'catapult',
    'knight',
    'snob',
  ];

  // Detecta presença de arqueiros e arqueiros a cavalo pela tabela de unidades ou configuração do jogo
  function hasUnit(unit) {
    if (document.querySelector(`img[src*="unit_${unit}.png"]`)) return true;
    if (
      typeof game_data !== 'undefined' &&
      game_data.units &&
      Array.isArray(game_data.units)
    ) {
      return game_data.units.includes(unit);
    }
    return false;
  }

  const HAS_ARCHER = hasUnit('archer');
  const HAS_MARCHER = hasUnit('marcher');

  if (HAS_ARCHER) {
    UNITS.splice(3, 0, 'archer');
  }
  if (HAS_MARCHER) {
    const marcherIndex = HAS_ARCHER ? 7 : 6;
    UNITS.splice(marcherIndex, 0, 'marcher');
  }

  const UNIT_NAMES = {
    spear: 'Lanceiro',
    sword: 'Espadachim',
    axe: 'Bárbaro',
    archer: 'Arqueiro',
    spy: 'Explorador',
    light: 'Cavalaria leve',
    marcher: 'Arqueiro a Cavalo',
    heavy: 'Cavalaria pesada',
    ram: 'Aríete',
    catapult: 'Catapulta',
    knight: 'Paladino',
    snob: 'Nobre',
  };

  // Opções para selects (reutilizável)
  const CATAPULT_TARGET_OPTIONS = [
    { value: 'padrao', text: 'Padrão' },
    { value: 'main', text: 'Edifício principal' },
    { value: 'barracks', text: 'Quartel' },
    { value: 'stable', text: 'Estábulo' },
    { value: 'garage', text: 'Oficina' },
    { value: 'watchtower', text: 'Torre de vigia' },
    { value: 'snob', text: 'Academia' },
    { value: 'smith', text: 'Ferreiro' },
    { value: 'place', text: 'Praça de reunião' },
    { value: 'statue', text: 'Estátua' },
    { value: 'market', text: 'Mercado' },
    { value: 'wood', text: 'Bosque' },
    { value: 'stone', text: 'Poço de argila' },
    { value: 'iron', text: 'Mina de ferro' },
    { value: 'farm', text: 'Fazenda' },
    { value: 'storage', text: 'Armazém' },
    { value: 'wall', text: 'Muralha' },
  ];

  // Mapeamento para compatibilidade com AgendadorSilva (valor numérico)
  const NT_TYPE_MAP_TO_SILVA = {
    NONE: 0,
    NT2: 2,
    NT3: 3,
    NT4: 4,
    NT5: 5,
    NT_FORTE: 6 // Novo valor para NT Forte
  };

  const NT_TYPE_MAP_FROM_SILVA = {
    0: 'NONE',
    1: 'CANCEL',
    2: 'NT2',
    3: 'NT3',
    4: 'NT4',
    5: 'NT5',
    6: 'NT_FORTE' // Novo valor para NT Forte
  };

  const NT_TYPE_OPTIONS_INTERNAL = [
    { value: 'NONE', text: 'Nenhum' },
    { value: 'NT2', text: 'NT2' },
    { value: 'NT3', text: 'NT3' },
    { value: 'NT4', text: 'NT4' },
    { value: 'NT5', text: 'NT5' },
    { value: 'NT_FORTE', text: '1º cmd NT FORTE' } // Nova opção
  ];

  const COMMAND_TYPE_OPTIONS = [
    { value: 'Attack', text: 'Ataque' },
    { value: 'Support', text: 'Apoio' }
  ];

  // --- Funções Auxiliares ---
  function getUnitName(unit) {
    return UNIT_NAMES[unit] || unit;
  }

  function generateCommandUrl(
    sourceVillageId,
    targetVillageId,
    commandType,
    unitsData,
    catapultTarget = 'padrao',
  ) {
    const unitParams = UNITS.filter(
      (unit) => unitsData[unit] && unitsData[unit] > 0,
    )
      .map((unit) => `${unit}=${unitsData[unit]}`)
      .join('&');
    let url = `/game.php?village=${sourceVillageId}&screen=place&target=${targetVillageId}`;
    url += commandType === 'Support' ? '&support=1' : '&attack=1';
    if (unitParams) url += `&${unitParams}`;
    const catapultUrlValue =
      catapultTarget && catapultTarget !== 'padrao' ? catapultTarget : '';
    if (commandType === 'Attack' && catapultUrlValue)
      url += `&building=${catapultUrlValue}`;
    return url;
  }

  function getServerTimeMs() {
    const serverTimeElem = document.getElementById('serverTime');
    const serverMsElem = document.getElementById('server_ms');
    if (serverTimeElem && serverMsElem) {
      try {
        const now = new Date();
        const [h, m, s] = serverTimeElem.textContent
          .trim()
          .split(':')
          .map(Number);
        const ms = Number(serverMsElem.textContent.trim());
        now.setHours(h, m, s, ms);
        return now.getTime();
      } catch (error) {
        console.error('Erro ao parsear horário do servidor:', error);
      }
    }

    if (typeof window.game_data === 'object' && window.game_data.date) {
      try {
        const dateStr = window.game_data.date.replace(' ', 'T');
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.getTime();
        }
      } catch (e) {
        /* Ignora */
      }
    }

    const serverDateElem = document.getElementById('serverDate');
    if (serverDateElem) {
      try {
        const dateParts = serverDateElem.textContent.trim().split('/');
        if (dateParts.length === 3 && serverTimeElem) {
          const [day, month, year] = dateParts.map(Number);
          const [h, m, s] = serverTimeElem.textContent
            .trim()
            .split(':')
            .map(Number);
          const ms = serverMsElem ? Number(serverMsElem.textContent.trim()) : 0;
          const date = new Date(year, month - 1, day, h, m, s, ms);
          return date.getTime();
        }
      } catch (e) {
        /* Ignora */
      }
    }

    console.warn(
      'Elementos de horário do servidor não encontrados, usando horário local.',
    );
    return Date.now();
  }

  function calculateLaunchDetails(
    arrivalTimestamp,
    sourceCoords,
    targetCoords,
    unitsData,
    afflictionPercent = 0
  ) {
    try {
      if (isNaN(arrivalTimestamp)) {
        console.error('Timestamp de chegada inválido:', arrivalTimestamp);
        return null;
      }

      const [x1, y1] = sourceCoords.split('|').map(Number);
      const [x2, y2] = targetCoords.split('|').map(Number);
      if ([x1, y1, x2, y2].some((coord) => isNaN(coord))) {
        console.error('Coordenadas inválidas:', sourceCoords, targetCoords);
        return null;
      }

      const distance = Math.hypot(x2 - x1, y2 - y1);
      let slowestUnitSpeedMinutesPerField = 0;
      let hasValidUnits = false;

      for (const unit in unitsData) {
        const quantity = unitsData[unit];
        const isAll = typeof quantity === 'string' && quantity.toLowerCase() === 'all';
        const isPositiveNumber = typeof quantity === 'number' && quantity > 0;

        if ((isAll || isPositiveNumber) && UNIT_SPEEDS.hasOwnProperty(unit)) {
          hasValidUnits = true;
          const speed = UNIT_SPEEDS[unit];
          if (speed > slowestUnitSpeedMinutesPerField) {
            slowestUnitSpeedMinutesPerField = speed;
          }
        }
      }

      if (!hasValidUnits) {
        console.warn('Nenhuma unidade válida encontrada. Usando fallback.');
        slowestUnitSpeedMinutesPerField = 30;  // Valor de fallback
      }

      if (afflictionPercent > 0) {
        const reductionFactor = 1 - Math.min(100, Math.max(0, afflictionPercent)) / 100;
        slowestUnitSpeedMinutesPerField *= reductionFactor;
      }

      const durationMs = Math.round(distance * slowestUnitSpeedMinutesPerField * 60000);
      const estimatedLaunchMs = arrivalTimestamp - durationMs;
      const serverClientDiffMs = getServerTimeMs() - Date.now();  // Diferença de tempo entre servidor e cliente
      const launchTimestamp = estimatedLaunchMs - serverClientDiffMs;

      return { launchTimestamp, durationMs };
    } catch (error) {
      console.error('Erro ao calcular detalhes de lançamento:', error);
      return null;
    }
  }

  function parseDateTimeStringToTimestamp(dateTimeStr) {
    try {
      if (dateTimeStr && dateTimeStr.length === 16) dateTimeStr += ':00.000';
      else if (dateTimeStr && dateTimeStr.length === 19) dateTimeStr += '.000';

      const date = new Date(dateTimeStr);
      return isNaN(date.getTime()) ? null : date.getTime();
    } catch (e) {
      return null;
    }
  }

  function formatTimestampToDateTimeString(timestamp) {
    if (timestamp === null || isNaN(timestamp)) return '';
    try {
      const date = new Date(timestamp);
      const pad = (n) => n.toString().padStart(2, '0');
      const padMs = (n) => n.toString().padStart(3, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${padMs(date.getMilliseconds())}`;
    } catch (e) {
      return '';
    }
  }

  function formatTimestampForDisplay(timestamp) {
    if (timestamp === null || isNaN(timestamp)) return 'Inválido';
    try {
      return new Date(timestamp).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch {
      return 'Inválido';
    }
  }

  async function getVillageIdByCoordinates(coordinates) {
    const [targetX, targetY] = coordinates.split('|');
    if (!targetX || !targetY) return null;
    try {
      if (!window.villageIdCache) window.villageIdCache = {};
      if (window.villageIdCache[coordinates])
        return window.villageIdCache[coordinates];

      return new Promise((resolve) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: VILLAGE_DATA_URL,
          onload: function (response) {
            if (response.status >= 200 && response.status < 300) {
              const lines = response.responseText.split('\n');
              for (const line of lines) {
                const parts = line.split(',');
                if (parts.length >= 4) {
                  const [id, , x, y] = parts;
                  if (x === targetX && y === targetY) {
                    window.villageIdCache[coordinates] = id;
                    resolve(id);
                    return;
                  }
                }
              }
              console.warn(`Aldeia não encontrada: ${coordinates}`);
              resolve(null);
            } else {
              console.error(
                `Erro ${response.status} ao buscar ${VILLAGE_DATA_URL}`,
              );
              resolve(null);
            }
          },
          onerror: function (error) {
            console.error(`Erro de rede ao buscar ${VILLAGE_DATA_URL}:`, error);
            resolve(null);
          },
        });
      });
    } catch (e) {
      console.error('Erro em getVillageIdByCoordinates:', e);
      return null;
    }
  }

  // --- Componentes da Interface (UI) ---
  function createUnitControlsHTML() {
    return `
        <div class="tw-section">
  <div class="tw-section-title">
    <img src="/graphic//buildings/barracks.png" class="tw-icon" alt="Ícone Unidades">Configuração de Unidades (Padrão para Novos Comandos)</div>
  <table class="tw-table">
    <thead>
      <tr>${UNITS.map(
      (unit) => `
        <th>
          <a href="#" class="tw-unit-link" data-unit="${unit}" title="Selecionar/Limpar ${getUnitName(unit)}">
            <img src="/graphic/unit/unit_${unit}.png" class="tw-unit-icon" alt="${getUnitName(unit)}">
          </a>
          <input type="checkbox" class="tw-unit-checkbox" data-unit="${unit}" title="Enviar todas as unidades de ${getUnitName(unit)}">
          <span class="units-entry-all" data-unit="${unit}" id="units_entry_all_${unit}">
          </span>
        </th>`,
    ).join('')}</tr>
    </thead>
    <tbody>
      <tr>${UNITS.map(
      (unit) => `
        <td>
          <input id="unit_input_${unit}" type="text" value="0" class="tw-input tw-unit-input" data-unit="${unit}" placeholder="Nº">
        </td>`,
    ).join('')}</tr>
    </tbody>
  </table>
  <small>Clique no ícone ou marque a caixa para enviar todas as unidades daquele tipo. Digite um número específico para enviar uma quantidade exata.</small>
</div>
        `;
  }

  function createCommandFormHTML() {
    const catapultOptionsHTML = CATAPULT_TARGET_OPTIONS.map(
      (opt) => `<option value="${opt.value}">${opt.text}</option>`,
    ).join('');
    const ntOptionsHTML = NT_TYPE_OPTIONS_INTERNAL.map(
      (opt) => `<option value="${opt.value}">${opt.text}</option>`,
    ).join('');
    const typeOptionsHTML = COMMAND_TYPE_OPTIONS.map(
      (opt) => `<option value="${opt.value}">${opt.text}</option>`,
    ).join('');

    return `
        <div class="tw-section">
  <div class="tw-section-title">📆 Agendar Novo Comando (Individual)</div>
  <table class="tw-table">
    <thead>
      <tr>
        <th>Origem</th>
        <th>Destino</th>
        <th>Hora de Chegada</th>
        <th>Tipo</th>
        <th>NT</th>
        <th id="catapultHeader">Alvo Catapulta</th>
        <th id="afflictionHeader">Aflição</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <input type="text" id="quickAddSourceCoords" class="tw-input" placeholder="555|555" required>
        </td>
        <td>
          <input type="text" id="quickAddTargetCoords" class="tw-input" placeholder="666|666" required>
        </td>
        <td>
          <input type="datetime-local" id="quickAddArrivalDateTime" class="tw-input" required step=".001">
        </td>
        <td>
          <select id="quickAddCommandType" class="tw-select">${typeOptionsHTML}</select>
        </td>
        <td>
          <select id="quickAddNtType" class="tw-select">${ntOptionsHTML}</select>
        </td>
        <td id="catapultCell">
          <select id="quickAddCatapultTarget" class="tw-select">${catapultOptionsHTML}</select>
        </td>
        <td id="afflictionCell">
          <input type="number" id="quickAddAffliction" class="tw-input" min="0" max="100" step="1" value="0" placeholder="0">
        </td>
        <td>
          <button id="quickAddButton" class="tw-btn">Adicionar</button>
        </td>
      </tr>
    </tbody>
  </table>
  <small>As unidades configuradas acima serão usadas. A hora de envio será calculada com base na unidade mais lenta.
    <br>
    <b>Se "Apoio", informe o percentual de Aflição para acelerar o envio.</b>
  </small>
</div>
        `;
  }

  function createMassSchedulerHTML() {
    const catapultOptionsHTML = CATAPULT_TARGET_OPTIONS.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('');
    const ntOptionsHTML = NT_TYPE_OPTIONS_INTERNAL.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('');
    const typeOptionsHTML = COMMAND_TYPE_OPTIONS.map(opt => `<option value="${opt.value}">${opt.text}</option>`).join('');

    return `
        <div class="tw-section">
            <div class="tw-section-title">
            📆 Agendamento em Massa
            </div>
            <div class="tw-mass-scheduler-grid">
  <div style="display: flex; flex-direction: column;">
    <div style="display: flex; align-items: center; gap: 8px;">

      <!-- "Origem:" + seletor -->
      <label for="groupSelector" style="display: flex; align-items: center; gap: 8px; margin-bottom: 5px;">
        Origem:
        <span id="groupSelectorContainer" style="max-width: 150px; display: inline-block; width: 100%;">
          ${createGroupSelectorHTML()}
        </span>
      </label>

      <!-- Botão Atualizar -->
      <button id="refreshGroupsBtn" class="tw-btn" style="padding: 2px 5px; font-size: 11px;">
        Atualizar
      </button>
</div>
            <div>
            <textarea id="massSourceCoords" class="tw-textarea" placeholder="555|555\n555|556\n..."></textarea>
            </div>
            </div>
            <div>
            <label for="massTargetCoords">Coordenadas de Destino (uma por linha):</label>
            <textarea id="massTargetCoords" class="tw-textarea" placeholder="666|666\n666|667\n..."></textarea>
            </div>
            </div>
            <table class="tw-table">
            <thead>
            <tr>
            <th>Hora de Chegada</th>
            <th>Tipo</th>
            <th>NT</th>
            <th>Alvo Catapulta</th>
            <th>Origens por Destino</th>
            </tr>
            </thead>
            <tbody>
            <tr>
            <td><input type="datetime-local" id="massArrivalDateTime" class="tw-input" required step=".001"></td>
            <td><select id="massCommandType" class="tw-select">${typeOptionsHTML}</select></td>
            <td><select id="massNtType" class="tw-select">${ntOptionsHTML}</select></td>
            <td><select id="massCatapultTarget" class="tw-select">${catapultOptionsHTML}</select></td>
            <td><input type="number" id="massOriginsPerTarget" class="tw-input" value="1" min="1" style="width: 60px;"></td>
            </tr>
            </tbody>
            </table>
            <small>As unidades da seção "Configuração de Unidades" serão usadas para todos os comandos. Comandos duplicados ou com envio no passado serão ignorados.</small>

            <div class="tw-mass-actions">
             <div id="massScheduleStatus"></div>
             <button id="massCalculatePreview" class="tw-btn">Calcular Prévia</button>
             <button id="massAddCommands" class="tw-btn" style="display: none;">Agendar Lote</button>
            </div>

            <div id="massSchedulePreviewContainer" class="tw-mass-preview-container" style="display: none;">
             <table class="tw-table">
             <thead>
             <tr><th>Origem</th><th>Destino</th><th>Envio</th><th>Chegada</th><th>Status</th></tr>
             </thead>
             <tbody id="massSchedulePreviewBody"></tbody>
             </table>
            </div>
        </div>
        `;
  }

  (function () {
    function loadGroups() {
      fetch('/game.php?screen=groups&ajax=load_group_menu')
        .then(response => response.json())
        .then(data => {
          let groups = [];
          if (data && data.result) {
            groups = data.result;
          } else if (Array.isArray(data)) {
            groups = data;
          }
          let groupSelectorHTML = '<select id="groupSelector"><option value="">Selecione um grupo</option>';
          groups.forEach(group => {
            groupSelectorHTML += '<option value="' + group.group_id + '">' + group.name + '</option>';
          });
          groupSelectorHTML += '</select>';
          document.getElementById('groupSelectorContainer').innerHTML = groupSelectorHTML;

          // Carregar o grupo previamente selecionado do localStorage, se houver
          const savedGroupId = localStorage.getItem('selectedGroupId');
          if (savedGroupId) {
            document.getElementById('groupSelector').value = savedGroupId;
            fetchGroupVillages(savedGroupId);
          }

          document.getElementById("groupSelector").addEventListener("change", (e) => {
            const selectedGroupId = e.target.value;
            localStorage.setItem('selectedGroupId', selectedGroupId);
            if (selectedGroupId) {
              fetchGroupVillages(selectedGroupId);
            }
          });
        })
        .catch(error => console.error('Erro ao carregar grupos:', error));
    }

    function fetchGroupVillages(groupId) {
      fetch('/game.php?screen=overview_villages&mode=groups&group=' + groupId + '&ajax=fetch_group_villages')
        .then(response => response.json())
        .then(data => {
          let coords = [];
          if (data && data.villages) {
            coords = data.villages.map(v => v.coord || (v.x + "|" + v.y));
          } else if (Array.isArray(data)) {
            coords = data.map(v => v.coord || (v.x + "|" + v.y));
          }
          if (coords.length) {
            document.getElementById('massSourceCoords').value = coords.join('\n');
          } else {
            document.getElementById('massSourceCoords').value = '';
          }
        })
        .catch(error => {
          console.error('Erro ao buscar aldeias do grupo:', error);
          document.getElementById('massSourceCoords').value = '';
        });
    }

    setTimeout(loadGroups, 200);
  })();

  function createGroupSelectorHTML() {
    return `<select id="groupSelector"><option value="">Selecione um grupo</option></select>`;
  }

  function createScheduledCommandsHTML() {
    return `
        <div class="tw-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div class="tw-section-title" style="margin-bottom: 0;">
                   📋 Comandos Agendados
                </div>
                <div>
                    <label id="toggleLabel" for="toggleCommands" class="tw-toggle-label">Mostrar Comandos</label>
                    <button id="clearAllCommands" class="tw-btn tw-btn-danger">Limpar Tudo</button>
                </div>
            </div>
            <input type="checkbox" id="toggleCommands" class="tw-toggle">
            <div id="commandCounters" style="display: flex; gap: 15px; margin-top: 10px; font-size: 13px;">
                <div><strong>Ataques:</strong> <span id="attackCount">0</span></div>
                <div><strong>Apoios:</strong> <span id="supportCount">0</span></div>
                <div><strong>NTs:</strong> <span id="ntCount">0</span></div>
                <div><strong>NTs Fortes:</strong> <span id="ntForteCount">0</span></div>
            </div>
            <table class="tw-table tw-commands" style="display: none;">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Origem</th>
                        <th>Destino</th>
                        <th>Envio</th>
                        <th>Chegada</th>
                        ${UNITS.map((unit) => `<th><img src="/graphic/unit/unit_${unit}.png" class="tw-unit-icon" title="${getUnitName(unit)}" alt="${getUnitName(unit)}"></th>`).join('')}
                        <th>NT</th>
                        <th>Alvo Cat.</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="scheduledCommandsBody">
                    <!-- Linhas de comando serão inseridas aqui -->
                </tbody>
            </table>
        </div>
        `;
  }

  function createMainContainer() {
    const container = document.createElement('div');
    container.className = 'tw-command-scheduler';
    container.innerHTML = `
            <div class="tw-header">
                <img src="/graphic//buildings/place.png" class="tw-icon" alt="Ícone Agendador">
                <span class="tw-title">Agendador de Comandos</span>
            </div>
            <div style="background: #fff8e0; border: 1px solid #e0c8a0; padding: 8px; margin-bottom: 15px; border-radius: 4px; font-size: 12px; color: #a07c40;">
                <strong>Atenção:</strong> O envio automático depende da aba do jogo estar aberta e ativa. A precisão exata do milissegundo não é garantida devido a limitações do navegador e do ambiente.
            </div>
            ${createUnitControlsHTML()}
            ${createCommandFormHTML()}
            ${createMassSchedulerHTML()}
            ${createScheduledCommandsHTML()}
        `;
    return container;
  }

  // --- Lógica Principal e Manipulação de Eventos ---

  let commandUpdateTimeout = null;
  let scheduledCommandsList = [];
  let massPreviewCommands = [];
  let commandTimeouts = {};

function saveCommandsToStorage() {
    clearTimeout(commandUpdateTimeout);
    commandUpdateTimeout = setTimeout(() => {
        try {
            const commandsToSave = scheduledCommandsList.map((cmd) => {
                const troopsToSave = {}; // Renomeado para evitar confusão com 'troopsNumeric'

                for (const unit in cmd.tropas) {
                    // Verifica se o valor é a string 'all'
                    if (cmd.tropas[unit] === 'all') {
                        troopsToSave[unit] = 'all'; // Salva como 'all' string
                    } else {
                        // Caso contrário, tenta parsear como número (e usa 0 se for inválido)
                        troopsToSave[unit] = parseInt(cmd.tropas[unit], 10) || 0;
                    }
                }
                const { timeoutId, ...cmdToSave } = cmd;
                return { ...cmdToSave, tropas: troopsToSave }; // Usa troopsToSave aqui
            });
            GM_setValue(
                SCRIPT_PREFIX + 'scheduledCommands',
                JSON.stringify(commandsToSave),
            );
            console.log(
                `${commandsToSave.length} comandos salvos (formato compatível).`,
            );
            updateCommandCounters();
        } catch (e) {
            console.error('Erro ao salvar comandos:', e);
            alert('Erro ao salvar comandos. Verifique o console.');
        }
    }, SAVE_DEBOUNCE_MS);
}
  function updateCommandCounters() {
    const attacks = scheduledCommandsList.filter(cmd =>
      cmd.tipo === 'Attack' && (!cmd.tropas.snob || cmd.tropas.snob === 0) && (cmd.nt === 0 || cmd.nt === undefined)
    ).length;

    const supports = scheduledCommandsList.filter(cmd =>
      cmd.tipo === 'Support'
    ).length;

    const nts = scheduledCommandsList.filter(cmd =>
      cmd.tipo === 'Attack' && cmd.nt > 0 && cmd.nt < 6
    ).length;

    const ntFortes = scheduledCommandsList.filter(cmd =>
      cmd.tipo === 'Attack' && cmd.nt === 6
    ).length;

    document.getElementById('attackCount').textContent = attacks;
    document.getElementById('supportCount').textContent = supports;
    document.getElementById('ntCount').textContent = nts;
    document.getElementById('ntForteCount').textContent = ntFortes;
  }

  function loadScheduledCommands() {
    let savedJson = GM_getValue(SCRIPT_PREFIX + 'scheduledCommands', '[]');
    if (typeof savedJson !== 'string') {
      savedJson = JSON.stringify(savedJson);
    }
    try {
      const loadedCommands = JSON.parse(savedJson);
      scheduledCommandsList = [];
      commandTimeouts = {};

      const tableBody = document.getElementById('scheduledCommandsBody');
      tableBody.innerHTML = '';

      loadedCommands.forEach((cmd) => {
        scheduledCommandsList.push(cmd);
        const newRow = tableBody.insertRow();
        newRow.dataset.commandId = cmd.id;
        renderCommandRow(cmd.id);
        scheduleCommandSend(cmd.id);
      });
      console.log(
        `${scheduledCommandsList.length} comandos carregados e re-agendados (se aplicável).`,
      );
      updateCommandCounters();
    } catch (e) {
      console.error('Erro ao carregar/parsear comandos:', e);
      scheduledCommandsList = [];
      commandTimeouts = {};
      GM_setValue(SCRIPT_PREFIX + 'scheduledCommands', '[]');
      alert('Erro ao carregar comandos. Armazenamento limpo.');
      updateCommandCounters();
    }
  }

  function scheduleCommandSend(commandId) {
    const command = scheduledCommandsList.find((cmd) => cmd.id === commandId);
    if (!command || command.status === 'enviado' || command.status === 'erro')
      return;

    clearScheduledSend(commandId);

    const BUFFER_BEFORE_SEND_MS = 15000;
    const delay = command.saida - getServerTimeMs() - BUFFER_BEFORE_SEND_MS;

    if (delay > 0 && delay < MAX_TIMEOUT_DELAY) {
      console.log(
        `Agendando abertura antecipada (40s) para: ${command.origemCoord} -> ${command.destinoCoord} em ${delay}ms.`,
      );
      const timeoutId = setTimeout(() => {
        handleSendCommand(commandId, true);
      }, delay);
      commandTimeouts[commandId] = timeoutId;
    } else if (delay <= 0) {
      console.log(
        `Comando ${command.origemCoord} -> ${command.destinoCoord} já deveria ter sido iniciado (mesmo com buffer de 40s).`,
      );
    } else {
      console.warn(
        `Delay muito longo para setTimeout (${delay}ms) para comando ${commandId}. Não agendado.`,
      );
    }
  }

  function clearScheduledSend(commandId) {
    if (commandTimeouts[commandId]) {
      clearTimeout(commandTimeouts[commandId]);
      delete commandTimeouts[commandId];
      console.log(`Timeout cancelado para comando ${commandId}`);
    }
  }

  async function addCommandToScheduler(commandData, save = false) {

    const origemDuplicada = scheduledCommandsList.some(cmd =>
      cmd.origemCoord === commandData.origemCoord /* &&
        cmd.destinoCoord === commandData.destinoCoord &&
        cmd.chegada === commandData.chegada*/
    );

    if (origemDuplicada) {
      console.warn(`Comando duplicado ignorado: ${commandData.origemCoord} -> ${commandData.destinoCoord}`);
      return false;
    }
    if (!commandData.origemID) {
      commandData.origemID = await getVillageIdByCoordinates(
        commandData.origemCoord,
      );
    }
    if (!commandData.destinoID) {
      commandData.destinoID = await getVillageIdByCoordinates(
        commandData.destinoCoord,
      );
    }
    if (!commandData.origemID || !commandData.destinoID) {
      console.error(
        `Não foi possível encontrar os IDs das aldeias para ${commandData.origemCoord} -> ${commandData.destinoCoord}. Comando não adicionado.`,
      );
      return false;
    }

    if (commandData.saida === null || commandData.duracao === null) {
      const launchDetails = calculateLaunchDetails(
        commandData.chegada,
        commandData.origemCoord,
        commandData.destinoCoord,
        commandData.tropas,
      );
      if (!launchDetails) {
        console.error(
          `Erro ao calcular horário de envio para ${commandData.origemCoord} -> ${commandData.destinoCoord}. Comando não adicionado.`,
        );
        return false;
      }
      commandData.saida = launchDetails.launchTimestamp;
      commandData.duracao = launchDetails.durationMs;
    }

    scheduledCommandsList.push(commandData);

    const tableBody = document.getElementById('scheduledCommandsBody');
    if (tableBody) {
      const newRow = tableBody.insertRow();
      newRow.dataset.commandId = commandData.id;
      renderCommandRow(commandData.id);
      scheduleCommandSend(commandData.id);
    } else {
      console.error(
        '#scheduledCommandsBody não encontrado ao adicionar comando',
      );
    }

    if (save) {
      saveCommandsToStorage();
    } else {
      updateCommandCounters();
    }
    return true;
  }

  function removeCommand(commandId) {
    clearScheduledSend(commandId);
    const initialLength = scheduledCommandsList.length;
    scheduledCommandsList = scheduledCommandsList.filter(
      (cmd) => cmd.id !== commandId,
    );
    const rowToRemove = document.querySelector(
      `#scheduledCommandsBody tr[data-command-id="${commandId}"]`,
    );
    if (rowToRemove) rowToRemove.remove();
    if (scheduledCommandsList.length < initialLength) {
      saveCommandsToStorage();
      updateCommandCounters();
    }
  }

  function renderCommandRow(commandId) {
    const command = scheduledCommandsList.find((cmd) => cmd.id === commandId);
    const row = document.querySelector(
      `#scheduledCommandsBody tr[data-command-id="${commandId}"]`,
    );

    if (!command || !row) {
      console.error(
        `Comando ou linha não encontrado para renderizar: ID ${commandId}`,
      );
      if (row) row.remove();
      return;
    }

    row.innerHTML = '';
    row.className = '';
    row.classList.remove(
      'tw-command-soon',
      'tw-command-now',
      'tw-command-sent',
    );

    let typeCellStyle = '';
    const isNobleAttack =
      command.tipo === 'Attack' &&
      command.tropas.snob &&
      command.tropas.snob > 0;
    const isNtAttack =
      command.tipo === 'Attack' && command.nt && command.nt !== 0;
    let typeText = command.tipo === 'Attack' ? 'Ataque' : 'Apoio';
    const ntText = command.nt === 6 ? 'NT FORTE' :
      NT_TYPE_MAP_FROM_SILVA[command.nt] || 'NONE';

    if (isNobleAttack) {
      typeText = 'Ataque (Nobre)';
      typeCellStyle = 'background: #ffeb99; color: #665d3d; font-weight: bold;';
    } else if (isNtAttack && command.nt === 6) {
      typeText = 'Ataque (NT FORTE)';
      typeCellStyle = 'background: #ff9999; color: #660000; font-weight: bold;';
    } else if (isNtAttack && ntText !== 'CANCEL') {
      typeText = `Ataque (${ntText})`;
      typeCellStyle = 'background: #ffcc99; color: #664422; font-weight: bold;';
    } else if (isNtAttack && ntText === 'CANCEL') {
      typeText = `Ataque (Cancela NT)`;
      typeCellStyle = 'background: #f2dede; color: #a94442;';
    } else if (command.tipo === 'Attack') {
      typeCellStyle = 'background: #f2dede; color: #a94442;';
    } else {
      typeCellStyle = 'background: #d9edf7; color: #31708f;';
    }

    row.insertCell().outerHTML = `<td style="${typeCellStyle}">${typeText}</td>`;
    row.insertCell().textContent = command.origemCoord;
    row.insertCell().textContent = command.destinoCoord;
    row.insertCell().textContent = formatTimestampForDisplay(command.saida);
    row.insertCell().textContent = formatTimestampForDisplay(command.chegada);
    UNITS.forEach((unit) => {
      row.insertCell().textContent = command.tropas[unit] || '0';
    });
    row.insertCell().textContent = ntText !== 'NONE' ? ntText : '-';
    row.insertCell().textContent =
      command.alvoCatapulta !== 'padrao'
        ? CATAPULT_TARGET_OPTIONS.find((o) => o.value === command.alvoCatapulta)
          ?.text || command.alvoCatapulta
        : '-';

    const actionsCell = row.insertCell();
    actionsCell.className = 'tw-actions-cell';
    const isSentOrError =
      command.status === 'enviado' || command.status === 'erro';
    actionsCell.innerHTML = `
            <button class="tw-btn tw-btn-send send-command-btn" title="Abrir tela de envio com tropas preenchidas" ${isSentOrError ? 'disabled' : ''}>Enviar</button>
            <button class="tw-btn tw-btn-edit edit-command-btn" title="Editar este comando" ${isSentOrError ? 'disabled' : ''}>Editar</button>
            <button class="tw-btn tw-btn-danger delete-command-btn" title="Excluir este comando">Excluir</button>
        `;

    actionsCell
      .querySelector('.send-command-btn')
      .addEventListener('click', () => handleSendCommand(commandId, false));
    actionsCell
      .querySelector('.edit-command-btn')
      .addEventListener('click', () => startEditingCommand(commandId));
    actionsCell
      .querySelector('.delete-command-btn')
      .addEventListener('click', () => handleDeleteCommand(commandId));

    if (isSentOrError) {
      row.classList.add('tw-command-sent');
    } else {
      updateCommandRowHighlight(row);
    }
  }

  function startEditingCommand(commandId) {
    const command = scheduledCommandsList.find((cmd) => cmd.id === commandId);
    const row = document.querySelector(
      `#scheduledCommandsBody tr[data-command-id="${commandId}"]`,
    );
    if (
      !command ||
      !row ||
      command.status === 'enviado' ||
      command.status === 'erro'
    )
      return;

    clearScheduledSend(commandId);

    row.dataset.originalCommandData = JSON.stringify(command);
    const cells = row.cells;

    const createSelectHTML = (options, selectedValue) =>
      options
        .map(
          (opt) =>
            `<option value="${opt.value}" ${opt.value === selectedValue ? 'selected' : ''}>${opt.text}</option>`,
        )
        .join('');

    cells[0].innerHTML = `<select class="tw-select tw-input-edit">${createSelectHTML(COMMAND_TYPE_OPTIONS, command.tipo)}</select>`;
    cells[1].innerHTML = `<input type="text" class="tw-input tw-input-edit" value="${command.origemCoord}" placeholder="XXX|YYY">`;
    cells[2].innerHTML = `<input type="text" class="tw-input tw-input-edit" value="${command.destinoCoord}" placeholder="XXX|YYY">`;
    cells[3].textContent = 'Será recalculado';
    const arrivalForInput = formatTimestampToDateTimeString(
      command.chegada,
    ).substring(0, 16);
    cells[4].innerHTML = `<input type="datetime-local" class="tw-input tw-input-edit" value="${arrivalForInput}" step="1">`;

    UNITS.forEach((unit, index) => {
      cells[5 + index].innerHTML =
        `<input type="text" class="tw-input tw-unit-input-edit" value="${command.tropas[unit] || '0'}" placeholder="Nº">`;
    });

    const currentNtTypeInternal = command.nt === 6 ? 'NT_FORTE' :
      NT_TYPE_MAP_FROM_SILVA[command.nt] || 'NONE';
    cells[5 + UNITS.length].innerHTML =
      `<select class="tw-select tw-input-edit">${createSelectHTML(NT_TYPE_OPTIONS_INTERNAL, currentNtTypeInternal)}</select>`;
    cells[5 + UNITS.length + 1].innerHTML =
      `<select class="tw-select tw-input-edit">${createSelectHTML(CATAPULT_TARGET_OPTIONS, command.alvoCatapulta)}</select>`;

    const actionsCellIndex = 5 + UNITS.length + 2;
    cells[actionsCellIndex].innerHTML = `
            <button class="tw-btn save-edit-btn" title="Salvar alterações">Salvar</button>
            <button class="tw-btn cancel-edit-btn" title="Cancelar edição">Cancelar</button>
        `;

    cells[actionsCellIndex].querySelector('.save-edit-btn').addEventListener('click', () => saveEditedCommand(commandId));
    cells[actionsCellIndex].querySelector('.cancel-edit-btn').addEventListener('click', () => cancelEditingCommand(commandId));
  }

  async function saveEditedCommand(commandId) {
    const commandIndex = scheduledCommandsList.findIndex(
      (cmd) => cmd.id === commandId,
    );
    const row = document.querySelector(
      `#scheduledCommandsBody tr[data-command-id="${commandId}"]`,
    );
    if (commandIndex === -1 || !row) return;

    const cells = row.cells;
    const originalCommand = scheduledCommandsList[commandIndex];
    const updatedCommandData = {
      id: originalCommand.id,
      status: 'agendado',
      tipoHorario: 'C',
      ntReal: null,
      tipoTropas: null,
      qtdeAtaqueSequencial: 0,
      tropasNT: null,
    };

    try {
      updatedCommandData.tipo = cells[0].querySelector('select').value;
      updatedCommandData.origemCoord = cells[1]
        .querySelector('input')
        .value.trim();
      updatedCommandData.destinoCoord = cells[2]
        .querySelector('input')
        .value.trim();
      const arrivalDateTimeStr = cells[4].querySelector('input').value;

      const updatedUnits = {};
      let hasUnits = false;
      let invalidUnit = false;

      UNITS.forEach((unit, index) => {
        const input = cells[5 + index].querySelector('input');
        const valueStr = input ? input.value.trim().toLowerCase() : '';

        if (valueStr === 'all') {
          updatedUnits[unit] = 'all';
          hasUnits = true;
        } else if (valueStr && valueStr !== '0') {
          const valueInt = parseInt(valueStr, 10);
          if (!isNaN(valueInt) && valueInt >= 0) {
            updatedUnits[unit] = valueInt;
            if (valueInt > 0) hasUnits = true;
          } else {
            alert(`Valor inválido para ${getUnitName(unit)}: '${valueStr}'. Use números >= 0 ou 'all'.`);
            input?.focus();
            invalidUnit = true;
          }
        } else {
          updatedUnits[unit] = 0;
        }
      });

      if (invalidUnit) return;
      if (!hasUnits) {
        alert('Nenhuma unidade com quantidade > 0 foi definida.');
        return;
      }
      updatedCommandData.tropas = updatedUnits;

      const ntTypeInternal =
        cells[5 + UNITS.length].querySelector('select').value;
      updatedCommandData.nt = NT_TYPE_MAP_TO_SILVA[ntTypeInternal] || 0;
      updatedCommandData.alvoCatapulta =
        cells[5 + UNITS.length + 1].querySelector('select').value;

      if (!updatedCommandData.origemCoord.match(/^\d+\|\d+$/)) {
        alert('Formato inválido para Origem.');
        return;
      }
      if (!updatedCommandData.destinoCoord.match(/^\d+\|\d+$/)) {
        alert('Formato inválido para Destino.');
        return;
      }

      let arrivalTimestamp = safeExecute(
        () => parseDateTimeStringToTimestamp(arrivalDateTimeStr),
        'Erro ao converter data/hora de chegada',
        null,
      );

      if (arrivalTimestamp === null || arrivalTimestamp < Date.now()) {
        alert('Data/Hora de Chegada inválida ou no passado.');
        return;
      }
      updatedCommandData.chegada = arrivalTimestamp;

      if (updatedCommandData.origemCoord !== originalCommand.origemCoord) {
        updatedCommandData.origemID = await getVillageIdByCoordinates(
          updatedCommandData.origemCoord,
        );
      } else {
        updatedCommandData.origemID = originalCommand.origemID;
      }
      if (updatedCommandData.destinoCoord !== originalCommand.destinoCoord) {
        updatedCommandData.destinoID = await getVillageIdByCoordinates(
          updatedCommandData.destinoCoord,
        );
      } else {
        updatedCommandData.destinoID = originalCommand.destinoID;
      }
      if (!updatedCommandData.origemID || !updatedCommandData.destinoID) {
        alert(
          'Não foi possível encontrar os IDs das aldeias atualizadas. Verifique as coordenadas.',
        );
        return;
      }

      const launchDetails = calculateLaunchDetails(
        updatedCommandData.chegada,
        updatedCommandData.origemCoord,
        updatedCommandData.destinoCoord,
        updatedCommandData.tropas,
      );
      if (!launchDetails) {
        alert('Erro ao recalcular horário de envio. Verifique os dados.');
        return;
      }
      updatedCommandData.saida = launchDetails.launchTimestamp;
      updatedCommandData.duracao = launchDetails.durationMs;

      scheduledCommandsList[commandIndex] = updatedCommandData;
      saveCommandsToStorage();
      renderCommandRow(commandId);
      scheduleCommandSend(commandId);
    } catch (error) {
      console.error('Erro ao salvar edição:', error);
      alert('Erro ao coletar dados editados. Verifique os campos.');
      renderCommandRow(commandId);
      scheduleCommandSend(commandId);
    }
  }

  function cancelEditingCommand(commandId) {
    renderCommandRow(commandId);
    scheduleCommandSend(commandId);
  }

  async function handleSendCommand(commandId, isAutoSend = false) {
    const commandIndex = scheduledCommandsList.findIndex(
      (cmd) => cmd.id === commandId,
    );
    if (commandIndex === -1) {
      console.warn(
        `Tentativa de enviar comando ${commandId} que não existe mais.`,
      );
      clearScheduledSend(commandId);
      return;
    }
    const cmdToSend = scheduledCommandsList[commandIndex];

    if (cmdToSend.status === 'enviado' || cmdToSend.status === 'erro') {
      console.log(
        `Comando ${commandId} já foi processado (status: ${cmdToSend.status}).`,
      );
      clearScheduledSend(commandId);
      return;
    }

    clearScheduledSend(commandId);

    console.log(
      `${isAutoSend ? 'Auto-envio' : 'Envio manual'} disparado para:`,
      cmdToSend,
    );

    const sourceId = cmdToSend.origemID;
    const targetId = cmdToSend.destinoID;
    const troopData = cmdToSend.tropas;
    const commandType = cmdToSend.tipo;
    const catapultTarget = cmdToSend.alvoCatapulta;
    const ntType = cmdToSend.nt;
    const isNtForte = ntType === 6; // NT_FORTE mapeado para 6
    const ntCount = isNtForte ? 4 : ntType; // NT Forte = 4 linhas (1 forte + 3 fracas)

    if (sourceId && targetId) {
      try {
        const url = generateCommandUrl(
          sourceId,
          targetId,
          commandType,
          {},
          catapultTarget,
        );
        console.log('Abrindo URL de envio:', url);

        // Abre a janela de confirmação
        const win = window.open(url, '_blank', 'width=1000,height=600');

        // Calibra a latência primeiro
        calibrateLatency(5, () => {
          console.log('Latência calibrada:', estimatedLatency);

          // Agora inicia o monitoramento da página, já com a latência calibrada
          monitorConfirmationPage(win, cmdToSend, timeUntilSend);
        });

        const timeUntilSend = cmdToSend.saida - getServerTimeMs();

        const monitorWindow = setInterval(() => {
          try {
            if (win.closed) {
              clearInterval(monitorWindow);
              return;
            }

            const doc = win.document;
            if (!doc || !doc.body) return;

            // Preenche as tropas primeiro
            let allTroopsFilled = true;

            Object.keys(troopData).forEach((unit) => {
              const input = doc.querySelector(`input[name="${unit}"]`);
              if (input) {
                let value = troopData[unit];
                if (value === 'all') {
                  value = input.getAttribute('data-all-count') ||
                    input.getAttribute('data-max-value') || '';
                }

                // Ajusta a quantidade baseado no tipo de NT
                if (ntType > 0) {
                  if (isNtForte) {
                    // NT Forte: 61% na primeira linha
                    value = Math.round(value * 0.61);
                  } else {
                    // NT normal: divide igualmente
                    value = Math.round(value / ntCount);
                  }
                }

                input.value = value;
              } else {
                allTroopsFilled = false;
              }
            });

            if (!allTroopsFilled) return;

            const buttonToClick =
              commandType === 'Attack'
                ? doc.getElementById('target_attack')
                : doc.getElementById('target_support');

            if (buttonToClick) {
              clearInterval(monitorWindow);

              setTimeout(() => {
                try {
                  buttonToClick.click();
                  console.log(`Botão ${commandType} clicado com sucesso`);

                  // Monitora a página de confirmação com tratamento especial para NT
                  calibrateLatency(3, () => {
                    monitorConfirmationPage(win, cmdToSend, timeUntilSend);
                  });

                  cmdToSend.status = 'enviado';
                  saveCommandsToStorage();
                  renderCommandRow(commandId);
                  updateCommandCounters();
                } catch (e) {
                  console.error('Erro ao clicar no botão:', e);
                  cmdToSend.status = 'erro';
                  saveCommandsToStorage();
                  renderCommandRow(commandId);
                  updateCommandCounters();
                }
              }, 100);
            }
          } catch (e) {
            console.error('Erro no monitoramento da janela:', e);
            clearInterval(monitorWindow);
            cmdToSend.status = 'erro';
            saveCommandsToStorage();
            renderCommandRow(commandId);
            updateCommandCounters();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(monitorWindow);
          if (cmdToSend.status !== 'enviado') {
            cmdToSend.status = 'erro';
            saveCommandsToStorage();
            renderCommandRow(commandId);
            updateCommandCounters();
          }
        }, 10000);
      } catch (error) {
        console.error('Erro ao enviar comando:', error);
        cmdToSend.status = 'erro';
        saveCommandsToStorage();
        renderCommandRow(commandId);
        updateCommandCounters();
        alert(`Erro ao enviar comando: ${error.message}`);
      }
    } else {
      alert(
        `Erro: IDs das aldeias não encontrados para o comando ${commandId}.`,
      );
      cmdToSend.status = 'erro';
      saveCommandsToStorage();
      renderCommandRow(commandId);
      updateCommandCounters();
    }
  }

  // 🔧 Variável global para armazenar a latência estimada
  let estimatedLatency = 0;

  function calibrateLatency(pings = 3, done) {
    let total = 0;
    let count = 0;

    function doPing() {
      const start = performance.now();
      fetch('/game.php', { cache: 'no-store' })
        .then(() => {
          const end = performance.now();
          total += (end - start) / 2; // Divide por 2 para ida e volta
          count++;

          if (count < pings) {
            setTimeout(doPing, 50); // Faz o próximo ping após 50ms
          } else {
            estimatedLatency = total / pings;
            console.log(`📶 Latência calibrada: ${estimatedLatency.toFixed(2)}ms`);
            if (typeof done === 'function') done();
          }
        })
        .catch(() => {
          estimatedLatency = 0;
          console.warn('⚠️ Falha ao medir latência. Usando 0ms.');
          if (typeof done === 'function') done();
        });
    }

    doPing(); // Inicia o processo de ping
  }

  /**
   * 🕒 Monitora a janela de confirmação e envia tropas no momento exato
   */
 function monitorConfirmationPage(win, cmdToSend, timeUntilSend) {
    const confirmationMonitor = setInterval(() => {
        try {
            if (win.closed) {
                clearInterval(confirmationMonitor);
                return;
            }

            const doc = win.document;
            if (!doc || !doc.body) return;

            const confirmButton = doc.getElementById('troop_confirm_submit');
            const trainButton = doc.getElementById('troop_confirm_train');

            // Verifica se já inserimos a interface
            if (confirmButton && !doc.getElementById('CSbuttonC')) {
                clearInterval(confirmationMonitor);

                // 🔹 Inserir campo com data/hora de chegada
                const rows = doc.querySelectorAll('table.vis tr');
                const insertAfter = rows[6] || rows[rows.length - 1]; // fallback
                const newRow = doc.createElement('tr');

                const chegada = new Date(cmdToSend.chegada);
function toLocalDateTimeInputString(date) {
    const pad = n => n.toString().padStart(2, '0');
    const ms = date.getMilliseconds().toString().padStart(3, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${ms}`;
}
const iso = toLocalDateTimeInputString(chegada);

newRow.innerHTML = `
    <td><strong>Chegada:</strong></td>
    <td colspan="10">
        <input type="datetime-local" id="quickAddArrivalDateTime" step=".001" value="${iso}">
        <button type="button" id="CSbuttonC" class="btn">Confirmar</button>
    </td>
`;

                insertAfter.insertAdjacentElement('afterend', newRow);

                // 🔹 Evento do botão "Confirmar"
                doc.getElementById('CSbuttonC').addEventListener('click', () => {
                    const arrivalInput = doc.getElementById('quickAddArrivalDateTime').value;
                    const arrivalDate = new Date(arrivalInput);
                    const ntType = cmdToSend.nt;
                    const isNtForte = ntType === 6;
                    const ntCount = isNtForte ? 4 : ntType;

                    // 🔹 Preencher NT se necessário
                    if (ntCount > 0 && trainButton) {
                        for (let i = 0; i < ntCount - 1; i++) {
                            trainButton.click();
                        }

                        setTimeout(() => {
                            const rows = doc.querySelectorAll('#place_confirm_units .units_row');
                            rows.forEach((row, idx) => {
                                if (idx === 0) return; // primeira linha já está preenchida
                                Object.keys(cmdToSend.tropas).forEach(unit => {
                                    const input = row.querySelector(`input[name="${unit}"]`);
                                    if (input) {
                                        let val = cmdToSend.tropas[unit];
                                        if (val === 'all') {
                                            val = parseInt(input.getAttribute('data-all-count') || input.getAttribute('data-max-value') || '0');
                                        }
                                        const ajustado = isNtForte
                                            ? Math.round(val * 0.13)
                                            : Math.round(val / ntCount);
                                        input.value = ajustado;
                                    }
                                });
                            });
                        }, 100);
                    }

                    // 🔹 Medir latência e calcular tempo restante
                    measurePing((adjustedPing) => {
                        const msDiff = arrivalDate.getTime() - getServerTimeMs() - adjustedPing;
                        console.log(`⌛ Esperando ${msDiff.toFixed(1)}ms (ping ajustado: ${adjustedPing}ms)`);

                        if (msDiff > 0) {
                            setTimeout(() => {
                                confirmButton.click();
                                console.log('✅ Comando enviado com precisão!');
                                setTimeout(() => win.close(), 3000);
                            }, msDiff);
                        } else {
                            console.warn('⚠️ Tempo ultrapassado. Enviando imediatamente.');
                            confirmButton.click();
                            setTimeout(() => win.close(), 3000);
                        }
                    }, 0.1);
                });
            }
        } catch (e) {
            console.error("❌ Erro no monitoramento:", e);
            clearInterval(confirmationMonitor);
        }
    }, timeUntilSend > 1000 ? 100 : 10);
}


  function handleDeleteCommand(commandId) {
    const command = scheduledCommandsList.find((cmd) => cmd.id === commandId);
    if (!command) return;
    if (
      confirm(
        `Tem certeza que deseja excluir o comando de ${command.origemCoord} para ${command.destinoCoord}?`,
      )
    ) {
      removeCommand(commandId);
    }
  }

  function updateCommandRowHighlight(row) {
    row.classList.remove('tw-command-soon', 'tw-command-now');
    const commandId = row.dataset.commandId;
    const commandData = scheduledCommandsList.find(
      (cmd) => cmd.id === commandId,
    );
    if (
      !commandData ||
      !commandData.chegada ||
      commandData.status === 'enviado' ||
      commandData.status === 'erro'
    )
      return;
    try {
      const diffMinutes = (commandData.chegada - Date.now()) / 60000;
      if (diffMinutes <= 0) row.classList.add('tw-command-now');
      else if (diffMinutes < COMMAND_SOON_MINUTES)
        row.classList.add('tw-command-soon');
    } catch (e) {
      console.error('Erro ao atualizar destaque:', e);
    }
  }

  async function handleAddQuickCommand() {
    const sourceCoordsInput = document.getElementById('quickAddSourceCoords');
    const targetCoordsInput = document.getElementById('quickAddTargetCoords');
    const arrivalDateTimeInput = document.getElementById(
      'quickAddArrivalDateTime',
    );
    const commandTypeSelect = document.getElementById('quickAddCommandType');
    const ntTypeSelect = document.getElementById('quickAddNtType');
    const catapultTargetSelect = document.getElementById(
      'quickAddCatapultTarget',
    );

    const sourceCoords = sourceCoordsInput.value.trim();
    const targetCoords = targetCoordsInput.value.trim();
    let arrivalDateTimeStr = arrivalDateTimeInput.value;
    const commandType = commandTypeSelect.value;
    const ntTypeInternal = ntTypeSelect.value;
    const catapultTarget = catapultTargetSelect.value;

    if (!sourceCoords || !targetCoords || !arrivalDateTimeStr) {
      alert('Preencha Origem, Destino e Hora de Chegada.');
      return false;
    }
    if (!sourceCoords.match(/^\d+\|\d+$/)) {
      alert('Formato inválido para Origem.');
      sourceCoordsInput.focus();
      return false;
    }
    if (!targetCoords.match(/^\d+\|\d+$/)) {
      alert('Formato inválido para Destino.');
      targetCoordsInput.focus();
      return false;
    }

    let arrivalTimestamp = parseDateTimeStringToTimestamp(arrivalDateTimeStr);
    if (arrivalTimestamp === null || arrivalTimestamp < Date.now()) {
      alert('Data/Hora de Chegada inválida ou no passado.');
      arrivalDateTimeInput.focus();
      return false;
    }

    const selectedUnits = {};
    let hasUnits = false;
    let invalidUnit = false;
    UNITS.forEach((unit) => {
      const input = document.getElementById(`unit_input_${unit}`);
      const valueStr = input.value.trim();
      const checkbox = document.querySelector(
        `.tw-unit-checkbox[data-unit="${unit}"]`,
      );

      if (checkbox?.checked || valueStr.toLowerCase() === 'all') {
        selectedUnits[unit] = 'all';
        hasUnits = true;
      } else if (valueStr && valueStr !== '0') {
        const valueInt = parseInt(valueStr, 10);
        if (!isNaN(valueInt) && valueInt >= 0) {
          selectedUnits[unit] = valueInt;
          if (valueInt > 0) hasUnits = true;
        } else {
          alert(
            `Valor inválido para ${getUnitName(unit)}: '${valueStr}'. Use apenas números inteiros >= 0 ou 'all'.`,
          );
          input.focus();
          invalidUnit = true;
        }
      } else {
        selectedUnits[unit] = 0;
      }
    });
    if (invalidUnit) return false;
    if (!hasUnits) {
      alert('Nenhuma unidade com quantidade > 0 selecionada.');
      return false;
    }

    const newCommandData = {
      id:
        SCRIPT_PREFIX + Date.now() + Math.random().toString(16).substring(2, 8),
      origemCoord: sourceCoords,
      destinoCoord: targetCoords,
      origemID: null,
      destinoID: null,
      chegada: arrivalTimestamp,
      saida: null,
      duracao: null,
      tipo: commandType,
      tropas: selectedUnits,
      nt: NT_TYPE_MAP_TO_SILVA[ntTypeInternal] || 0,
      alvoCatapulta: catapultTarget,
      status: 'agendado',
      tipoHorario: 'C',
      ntReal: null,
      tipoTropas: null,
      qtdeAtaqueSequencial: 0,
      tropasNT: null,
    };

    const success = await addCommandToScheduler(newCommandData, true);
    if (success) {
      console.log(
        'Novo comando adicionado e agendado (formato compatível):',
        newCommandData,
      );
    }
    return success;
  }

  function handleClearAllCommands() {
    if (confirm('ATENÇÃO! Excluir TODOS os comandos agendados?')) {
      Object.keys(commandTimeouts).forEach(clearScheduledSend);

      scheduledCommandsList = [];
      document.getElementById('scheduledCommandsBody').innerHTML = '';
      GM_setValue(SCRIPT_PREFIX + 'scheduledCommands', '[]');
      updateCommandCounters();
      console.log('Todos os comandos foram limpos.');
    }
  }

  // --- Funções para Agendamento em Massa ---

  async function handleCalculateMassPreview() {
    const sourceCoordsText = document
      .getElementById('massSourceCoords')
      .value.trim();
    const targetCoordsText = document
      .getElementById('massTargetCoords')
      .value.trim();
    const arrivalDateTimeStr = document.getElementById(
      'massArrivalDateTime',
    ).value;
    const commandType = document.getElementById('massCommandType').value;
    const ntTypeInternal = document.getElementById('massNtType').value;
    const catapultTarget = document.getElementById('massCatapultTarget').value;
    const originsPerTargetInput = document.getElementById(
      'massOriginsPerTarget',
    );
    const previewBody = document.getElementById('massSchedulePreviewBody');
    const previewContainer = document.getElementById(
      'massSchedulePreviewContainer',
    );
    const addButton = document.getElementById('massAddCommands');
    const statusDiv = document.getElementById('massScheduleStatus');
    const calculateButton = document.getElementById('massCalculatePreview');
    const afflictionInput = document.getElementById('massAffliction');
    let afflictionPercent = 0;
    if (afflictionInput) {
      afflictionPercent = parseInt(afflictionInput.value, 10) || 0;
    }

    previewBody.innerHTML = '';
    previewContainer.style.display = 'none';
    addButton.style.display = 'none';
    massPreviewCommands = [];
    statusDiv.textContent = 'Calculando...';
    calculateButton.disabled = true;

    const sourceCoordsList = sourceCoordsText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.match(/^\d+\|\d+$/));
    const targetCoordsList = targetCoordsText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.match(/^\d+\|\d+$/));
    const originsPerTarget = parseInt(originsPerTargetInput.value, 10);

    if (sourceCoordsList.length === 0) {
      alert('Nenhuma coordenada de origem válida encontrada.');
      statusDiv.textContent = 'Erro: Origens inválidas.';
      calculateButton.disabled = false;
      return;
    }
    if (targetCoordsList.length === 0) {
      alert('Nenhuma coordenada de destino válida encontrada.');
      statusDiv.textContent = 'Erro: Destinos inválidos.';
      calculateButton.disabled = false;
      return;
    }
    if (isNaN(originsPerTarget) || originsPerTarget < 1) {
      alert('Número de origens por destino inválido (deve ser >= 1).');
      originsPerTargetInput.focus();
      statusDiv.textContent = 'Erro: Distribuição inválida.';
      calculateButton.disabled = false;
      return;
    }

    const arrivalTimestamp = parseDateTimeStringToTimestamp(arrivalDateTimeStr);
    if (arrivalTimestamp === null || arrivalTimestamp < Date.now()) {
      alert('Data/Hora de Chegada inválida ou no passado.');
      document.getElementById('massArrivalDateTime').focus();
      statusDiv.textContent = 'Erro: Hora de chegada inválida.';
      calculateButton.disabled = false;
      return;
    }

    const standardUnits = {};
    let hasUnits = false;
    let invalidUnit = false;
    UNITS.forEach((unit) => {
      const input = document.getElementById(`unit_input_${unit}`);
      const checkbox = document.querySelector(
        `.tw-unit-checkbox[data-unit="${unit}"]`,
      );
      let valueStr = input ? input.value.trim().toLowerCase() : '';
      let valueInt = parseInt(valueStr, 10);

      // 1. Prioridade: Checkbox marcada ou input com 'all'?
      if (checkbox?.checked || valueStr === 'all') {
        standardUnits[unit] = 'all';
        hasUnits = true;
      }
      // 2. Senão: É um número válido e positivo?
      else if (!isNaN(valueInt) && valueInt > 0) {
        standardUnits[unit] = valueInt;
        hasUnits = true;
      }
      // 3. Senão: É um número inválido (mas não 'all')?
      else if (valueStr && valueStr !== '0') {
        alert(
          `Valor inválido na Configuração de Unidades para ${getUnitName(unit)}: '${input.value}'. Use apenas números > 0 ou marque a caixa 'todas'.`,
        );
        input?.focus();
        invalidUnit = true;
        standardUnits[unit] = 0; // Define como 0 para evitar erros posteriores
      }
      // 4. Senão (vazio ou '0'):
      else {
        standardUnits[unit] = 0;
      }
    });
    if (invalidUnit) {
      statusDiv.textContent = 'Erro: Unidades padrão inválidas.';
      calculateButton.disabled = false;
      return;
    }
    if (!hasUnits) {
      alert(
        'Nenhuma unidade com quantidade > 0 definida na Configuração de Unidades.',
      );
      statusDiv.textContent = 'Erro: Nenhuma unidade padrão definida.';
      calculateButton.disabled = false;
      return;
    }

    const potentialCommands = [];
    const usedOrigins = new Set();
    let originIndex = 0;

    for (const targetCoord of targetCoordsList) {
      let assignedOrigins = 0;
      let attempts = 0;
      while (
        assignedOrigins < originsPerTarget &&
        attempts < sourceCoordsList.length * 2
      ) {
        const sourceCoord =
          sourceCoordsList[originIndex % sourceCoordsList.length];
        originIndex++;
        attempts++;

        const isDuplicate = scheduledCommandsList.some(
          (existingCmd) =>
            existingCmd.origemCoord === sourceCoord &&
            existingCmd.destinoCoord === targetCoord &&
            existingCmd.chegada === arrivalTimestamp &&
            JSON.stringify(existingCmd.tropas) ===
            JSON.stringify(standardUnits),
        );

        if (isDuplicate) {
          console.log(
            `Comando duplicado ignorado: ${sourceCoord} -> ${targetCoord}`,
          );
          continue;
        }

        const isPreviewDuplicate = potentialCommands.some(
          (previewCmd) =>
            previewCmd.origemCoord === sourceCoord &&
            previewCmd.destinoCoord === targetCoord,
        );
        if (isPreviewDuplicate) {
          console.log(
            `Comando duplicado na prévia ignorado: ${sourceCoord} -> ${targetCoord}`,
          );
          continue;
        }

        const launchDetails = calculateLaunchDetails(
          arrivalTimestamp,
          sourceCoord,
          targetCoord,
          standardUnits,
        );

        if (launchDetails && launchDetails.launchTimestamp > Date.now()) {
          potentialCommands.push({
            origemCoord: sourceCoord,
            destinoCoord: targetCoord,
            chegada: arrivalTimestamp,
            saida: launchDetails.launchTimestamp,
            tipo: commandType,
            tropas: standardUnits,
            nt: NT_TYPE_MAP_TO_SILVA[ntTypeInternal] || 0,
            alvoCatapulta: catapultTarget,
            statusPreview: 'Válido',
          });
          assignedOrigins++;
        } else {
          potentialCommands.push({
            origemCoord: sourceCoord,
            destinoCoord: targetCoord,
            chegada: arrivalTimestamp,
            saida: launchDetails ? launchDetails.launchTimestamp : null,
            tipo: commandType,
            tropas: standardUnits,
            nt: NT_TYPE_MAP_TO_SILVA[ntTypeInternal] || 0,
            alvoCatapulta: catapultTarget,
            statusPreview: launchDetails ? 'Envio no passado' : 'Erro cálculo',
          });
          console.log(
            `Comando inválido (envio passado/erro): ${sourceCoord} -> ${targetCoord}`,
          );
        }
      }
      if (assignedOrigins < originsPerTarget) {
        console.warn(
          `Não foi possível atribuir ${originsPerTarget} origens válidas para ${targetCoord}. Atribuídas: ${assignedOrigins}`,
        );
      }
    }

    massPreviewCommands = [];
    let validCount = 0;
    potentialCommands.forEach((cmd) => {
      const row = previewBody.insertRow();
      row.insertCell().textContent = cmd.origemCoord;
      row.insertCell().textContent = cmd.destinoCoord;
      row.insertCell().textContent = formatTimestampForDisplay(cmd.saida);
      row.insertCell().textContent = formatTimestampForDisplay(cmd.chegada);
      const statusCell = row.insertCell();
      statusCell.textContent = cmd.statusPreview;
      if (cmd.statusPreview === 'Válido') {
        row.style.backgroundColor = '#e0f0d8';
        massPreviewCommands.push(cmd);
        validCount++;
      } else {
        row.style.backgroundColor = '#f2dede';
        statusCell.style.color = '#a94442';
      }
    });

    previewContainer.style.display = 'block';
    if (validCount > 0) {
      addButton.style.display = 'inline-block';
      statusDiv.textContent = `${validCount} comandos válidos prontos para agendar. ${potentialCommands.length - validCount} inválidos/duplicados ignorados.`;
    } else {
      addButton.style.display = 'none';
      statusDiv.textContent = `Nenhum comando válido gerado. ${potentialCommands.length} inválidos/duplicados ignorados.`;
    }
    calculateButton.disabled = false;
  }

  async function handleAddMassCommands() {
    const addButton = document.getElementById('massAddCommands');
    const statusDiv = document.getElementById('massScheduleStatus');
    const previewContainer = document.getElementById(
      'massSchedulePreviewContainer',
    );
    const previewBody = document.getElementById('massSchedulePreviewBody');

    if (massPreviewCommands.length === 0) {
      alert('Nenhum comando válido na prévia para agendar.');
      return;
    }

    addButton.disabled = true;
    statusDiv.textContent = `Agendando ${massPreviewCommands.length} comandos...`;

    let addedCount = 0;
    let failedCount = 0;

    const addPromises = massPreviewCommands.map((previewCmd) => {
      const newCommandData = {
        id:
          SCRIPT_PREFIX +
          Date.now() +
          Math.random().toString(16).substring(2, 8),
        origemCoord: previewCmd.origemCoord,
        destinoCoord: previewCmd.destinoCoord,
        origemID: null,
        destinoID: null,
        chegada: previewCmd.chegada,
        saida: previewCmd.saida,
        duracao: null,
        tipo: previewCmd.tipo,
        tropas: previewCmd.tropas,
        nt: previewCmd.nt,
        alvoCatapulta: previewCmd.alvoCatapulta,
        status: 'agendado',
        tipoHorario: 'C',
        ntReal: null,
        tipoTropas: null,
        qtdeAtaqueSequencial: 0,
        tropasNT: null,
      };
      return addCommandToScheduler(newCommandData, false);
    });

    const results = await Promise.all(addPromises);
    addedCount = results.filter((success) => success).length;
    failedCount = results.length - addedCount;

    if (addedCount > 0) {
      saveCommandsToStorage();
    }

    statusDiv.textContent = `Agendamento em massa concluído: ${addedCount} adicionados, ${failedCount} falharam (ver console).`;
    massPreviewCommands = [];
    addButton.disabled = false;
    addButton.style.display = 'none';
    previewBody.innerHTML = '';
    previewContainer.style.display = 'none';
  }


  // --- Funções para Carregamento de Grupos ---

  function loadGroups() {
    const statusDiv = document.getElementById('massScheduleStatus');
    if (statusDiv) statusDiv.textContent = 'Carregando grupos...';

    // Usando a mesma URL do exemplo
    jQuery.get(game_data.link_base_pure + 'groups&mode=overview&ajax=load_group_menu')
      .done(function (data) {
        let groups = [];
        if (data && data.result) {
          groups = data.result;
        } else if (Array.isArray(data)) {
          groups = data;
        }

        const groupSelectorContainer = document.getElementById('groupSelectorContainer');
        if (groupSelectorContainer) {
          let groupSelectorHTML = '<select id="groupSelector" class="tw-select"><option value="">Selecione um grupo</option>';

          groups.forEach(group => {
            if (group.name !== undefined) {
              groupSelectorHTML += `<option value="${group.group_id}">${group.name}</option>`;
            }
          });

          groupSelectorHTML += '</select>';
          groupSelectorContainer.innerHTML = groupSelectorHTML;

          // Carrega o grupo salvo
          const savedGroupId = localStorage.getItem('selectedGroupId');
          if (savedGroupId) {
            const selector = groupSelectorContainer.querySelector('#groupSelector');
            if (selector) {
              selector.value = savedGroupId;
              if (savedGroupId) fetchGroupVillages(savedGroupId);
            }
          }

          // Adiciona o event listener para mudança de grupo
          const selector = groupSelectorContainer.querySelector('#groupSelector');
          if (selector) {
            selector.addEventListener('change', (e) => {
              const selectedGroupId = e.target.value;
              localStorage.setItem('selectedGroupId', selectedGroupId);
              if (selectedGroupId) {
                fetchGroupVillages(selectedGroupId);
              } else {
                const massSourceCoords = document.getElementById('massSourceCoords');
                if (massSourceCoords) massSourceCoords.value = '';
              }
            });
          }
        }

        if (statusDiv) statusDiv.textContent = 'Grupos carregados com sucesso';
      })
      .fail(function (error) {
        console.error('Erro ao carregar grupos:', error);
        if (statusDiv) statusDiv.textContent = 'Erro ao carregar grupos';
      });
  }


  function fetchGroupVillages(groupId) {
    const statusDiv = document.getElementById('massScheduleStatus');
    const massSourceCoords = document.getElementById('massSourceCoords');

    if (!massSourceCoords) {
      console.error('Elemento textarea #massSourceCoords não encontrado.');
      if (statusDiv) statusDiv.textContent = 'Erro interno: Campo de coordenadas não encontrado.';
      return;
    }

    if (!groupId) {
      massSourceCoords.value = '';
      if (statusDiv) statusDiv.textContent = 'Selecione um grupo para carregar as aldeias.';
      return;
    }

    if (statusDiv) statusDiv.textContent = `Carregando aldeias do grupo ${groupId}...`;
    massSourceCoords.value = '';

    // Usando a mesma URL do exemplo
    const url = game_data.link_base_pure + 'groups&ajax=load_villages_from_group';

    jQuery.post({
      url: url,
      data: { group_id: groupId },
      success: function (response) {
        try {
          const parser = new DOMParser();
          const htmlDoc = parser.parseFromString(response.html, 'text/html');
          const tableRows = jQuery(htmlDoc).find('#group_table > tbody > tr').not(':eq(0)');

          let villagesList = [];

          tableRows.each(function () {
            const villageCoords = jQuery(this).find('td:eq(1)').text().trim();
            if (villageCoords) {
              villagesList.push(villageCoords);
            }
          });

          if (villagesList.length > 0) {
            massSourceCoords.value = villagesList.join('\n');
            if (statusDiv) statusDiv.textContent = `${villagesList.length} aldeias carregadas do grupo.`;
          } else {
            massSourceCoords.value = '';
            if (statusDiv) statusDiv.textContent = 'O grupo selecionado não contém aldeias ou não foi possível carregar as coordenadas.';
          }
        } catch (e) {
          console.error('Erro ao processar resposta:', e);
          massSourceCoords.value = '';
          if (statusDiv) statusDiv.textContent = 'Erro ao processar as aldeias do grupo.';
        }
      },
      error: function (xhr, status, error) {
        console.error('Erro ao buscar aldeias:', error);
        massSourceCoords.value = '';
        if (statusDiv) statusDiv.textContent = `Erro ao carregar aldeias: ${error}`;
      }
    });
  }

  function setupEventListeners() {
    const container = document.querySelector('.tw-command-scheduler');
    if (!container) return;


    container.addEventListener('change', (event) => {
      if (event.target.matches('.tw-unit-checkbox')) {
        const unit = event.target.dataset.unit;
        const input = container.querySelector(`#unit_input_${unit}`);
        if (!input) {
          console.warn(`Input para unidade '${unit}' não encontrado.`);
          return;
        }

        let maxValue = null;
        const allEntry = document.getElementById(`units_entry_all_${unit}`);
        if (allEntry) {
          const match = allEntry.textContent.match(/\((\d+)\)/);
          if (match) {
            maxValue = match[1];
          }
        }
        if (!maxValue || isNaN(maxValue)) {
          maxValue =
            input.getAttribute('data-all-count') ||
            input.getAttribute('data-max-value') ||
            'all';
        }

        if (event.target.checked) {
          input.value = maxValue;
        } else {
          input.value = '0';
        }

        const inputChangeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(inputChangeEvent);
      } else if (event.target.matches('#toggleCommands')) {
        const label = container.querySelector('#toggleLabel');
        const table = container.querySelector('.tw-commands');
        if (label && table) {
          table.style.display = event.target.checked ? '' : 'none';
          label.textContent = event.target.checked
            ? 'Ocultar Comandos'
            : 'Mostrar Comandos';
        }
      } else if (
        event.target.matches('#quickAddCommandType') ||
        event.target.matches('#massCommandType')
      ) {
        const catapultCell = event.target.matches('#quickAddCommandType')
          ? container.querySelector('#catapultCell')
          : container.querySelector('#massCatapultTarget').closest('td');
        if (catapultCell) {
          catapultCell.style.visibility =
            event.target.value === 'Attack' ? 'visible' : 'hidden';
        }
      }
    });

    container.addEventListener('click', (event) => {
      const link = event.target.closest('.tw-unit-link');
      if (link) {
        event.preventDefault();
        const unit = link.dataset.unit;
        const input = container.querySelector(`#unit_input_${unit}`);
        const checkbox = container.querySelector(
          `.tw-unit-checkbox[data-unit="${unit}"]`,
        );
        if (input) {
          input.value = input.value === '0' || input.value === '' ? '1' : '0';
          if (checkbox) checkbox.checked = input.value !== '0';
        }
        return;
      }
      if (event.target.matches('#quickAddButton')) {
        handleAddQuickCommand();
        return;
      }
      if (event.target.matches('#clearAllCommands')) {
        handleClearAllCommands();
        return;
      }
      if (event.target.matches('#massCalculatePreview')) {
        handleCalculateMassPreview();
        return;
      }
      if (event.target.matches('#massAddCommands')) {
        handleAddMassCommands();
        return;
      }
      if (event.target.matches('#refreshGroupsBtn')) {
        loadGroups();
        return;
      }
    });

    const toggleCheckbox = container.querySelector('#toggleCommands');
    const commandsTable = container.querySelector('.tw-commands');
    const toggleLabel = container.querySelector('#toggleLabel');
    if (toggleCheckbox && commandsTable && toggleLabel) {
      commandsTable.style.display = toggleCheckbox.checked ? '' : 'none';
      toggleLabel.textContent = toggleCheckbox.checked
        ? 'Ocultar Comandos'
        : 'Mostrar Comandos';
    }
    const quickCommandTypeSelect = container.querySelector(
      '#quickAddCommandType',
    );
    const quickCatapultTargetSelect = container.querySelector(
      '#quickAddCatapultTarget',
    );
    if (quickCommandTypeSelect && quickCatapultTargetSelect) {
      quickCatapultTargetSelect.closest('td').style.visibility =
        quickCommandTypeSelect.value === 'Attack' ? 'visible' : 'hidden';
    }
    const massCommandTypeSelect = container.querySelector('#massCommandType');
    const massCatapultTargetSelect = container.querySelector(
      '#massCatapultTarget',
    );
    if (massCommandTypeSelect && massCatapultTargetSelect) {
      massCatapultTargetSelect.closest('td').style.visibility =
        massCommandTypeSelect.value === 'Attack' ? 'visible' : 'hidden';
    }
  }

  function insertUI() {
    const targetElement = document.querySelector('#tab-bar');
    if (targetElement && !document.querySelector('.tw-command-scheduler')) {
      const container = createMainContainer();
      targetElement.insertAdjacentElement('afterend', container);
      console.log('Interface do Agendador (v5.1 - Auto Envio) inserida.');
      return true;
    } else {
      if (!targetElement)

        if (document.querySelector('.tw-command-scheduler'))
          console.warn('Interface já existe.');
      return false;
    }
  }

  // --- Inicialização e Loop de Verificação ---

  function initialize() {
    console.log(`Inicializando Agendador de Comandos v5.1 (Auto Envio)...`);
    if (insertUI()) {
      setupEventListeners();
      loadScheduledCommands();
      setInterval(() => {
        document
          .querySelectorAll('#scheduledCommandsBody tr[data-command-id]')
          .forEach((row) => {
            if (!row.querySelector('.save-edit-btn')) {
              updateCommandRowHighlight(row);
            }
          });
      }, 100);
      console.log('Agendador (v5.1) inicializado com sucesso.');
    } else {
      console.error('Falha ao inserir interface do agendador.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
})();
