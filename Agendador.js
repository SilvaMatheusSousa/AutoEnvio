// ==UserScript==
// @name         Agendador Silva
// @description  Agendador de comandos em massa pra tribalwars
// @version      4.0.0
// @author       Silva
// @include      https://**&screen=place*
// @include      https://**&screen=map*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tribalwars.com.br
// @require      http://cdnjs.cloudflare.com/ajax/libs/jquery-cookie/1.4.1/jquery.cookie.min.js
// @grant        none
// ==/UserScript==

// Modularização: funções reutilizáveis
function formatarHorario(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const horas = String(data.getHours()).padStart(2, '0');
    const minutos = String(data.getMinutes()).padStart(2, '0');
    const segundos = String(data.getSeconds()).padStart(2, '0');
    const milissegundos = String(data.getMilliseconds()).padStart(3, '0');
    return `${ano}-${mes}-${dia}T${horas}:${minutos}:${segundos}.${milissegundos}`;
}

function mostrarMensagem(msg, tipo = "info") {
    const msgBox = document.createElement("div");
    msgBox.textContent = msg;
    msgBox.className = `alert-${tipo}`;
    msgBox.style = "background:#f4e6c4; border:1px solid #7d510f; padding:5px; margin:5px;";
    document.getElementById('contentContainer')?.prepend(msgBox);
    setTimeout(() => msgBox.remove(), 5000);
}

//============================= Sincronização com servidor ===============================================
function getServerTimestamp() {
    const timeEl = document.getElementById("serverTime");
    if (!timeEl) return getServerTimestamp();
    const timeStr = timeEl.textContent.trim(); // formato "13:45:02"
    const dateStr = new Date().toISOString().split("T")[0]; // formato "2025-04-22"
    const serverDateTime = new Date(`${dateStr}T${timeStr}Z`);
    return serverDateTime.getTime();
}

//================================================== Agendador comandos ==========================================================================
let commands = document.getElementById('command_actions');
let confirm = document.getElementById('place_confirm_units');

const { game_data } = window;

const hasArcher = game_data.units.includes("archer");

{
    if (commands) {
        let AgendarM = `<div id="divScriptRodando">
    <table id="avisoScript" width="100%" style="margin-bottom: 5px;"><tbody><tr><td><table class="content-border" width="100%" cellspacing="0"><tbody><tr><td style="background-color: rgb(193,162,100); background-image:
    url(https://dsbr.innogamescdn.com/asset/7fe7ab60/graphic/screen/tableheader_bg3.png); background-repeat: repeat-x;"><table class="main" width="100%"><tbody><tr><td style="text-align: center; width: 100%;"><h1 style="margin-bottom: 0px;">
    AGENDADOR </h1></td><td style="text-align: right;"><div style="background-color: white; height: 1.2em; width: 1.5em; padding: 2px;"><img id="tocaSom" style="cursor:pointer;" alt="loud_sound" class="emoji"
    src="https://media.innogamescdn.com/TribalWars/emoji/1f50a.png"><audio id="audioElement" preload="auto" autoplay volume="10" loop><source src="https://cdn.freesound.org/previews/448/448713_4473224-lq.mp3" type="audio/mpeg">
    Seu navegador não suporta o elemento de áudio.</audio></div></td></tr></tbody></table></td></tr></tbody></table></td></tr></tbody></table></div>
    `;
        // Captura a referência para a tabela de destino
        const Agendart = document.getElementById('contentContainer');
        // Adiciona a nova div antes da divBorda
        Agendart.insertAdjacentHTML('beforebegin', AgendarM);

        let $InfoTimeTrops = `<div id="command_tempo_alvo" class="clearfix vis " style="width: 890px; border: 1px solid #7d510f; margin: 0px 5px 15px 5px;"><h4>Tempo de Tropas até Destino:</h4><table class="vis" style="border-collapse:separate; border-spacing: 3px; table-layout: fixed; width: 100%;"><tbody><tr><th style="width: 10px"><a href="#" class="unit_link" data-unit="spear"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_spear.png" data-title="Lanceiro"></a></th><th style="width: 10px"><a href="#" class="unit_link" data-unit="sword"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_sword.png" data-title="Espadachim"></a></th><th style="width: 10px"><a href="#" class="unit_link" data-unit="axe"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_axe.png" data-title="Bárbaro"></a></th><th style="width: 10px"><a href="#" class="unit_link" data-unit="archer"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_archer.png" data-title="Arqueiro"></a></th><th style="width: 10px"><a href="#" class="unit_link" data-unit="spy"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_spy.png" data-title="Explorador"></a></th><th style="width: 10px"><a href="#" class="unit_link" data-unit="light"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_light.png" data-title="Cavalaria leve"></a></th><th style="width: 10px"><a href="#" class="unit_link" data-unit="marcher"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_marcher.png" data-title="Arqueiro a Cavalo"></a></th><th style="width: 10px"><a href="#" class="unit_link" data-unit="heavy"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_heavy.png" data-title="Cavalaria pesada"></a></th><th style="width: 10px"><a href="#" class="unit_link" data-unit="ram"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_ram.png" data-title="Aríete"></a></th><th style="width: 10px"><a href="#" class="unit_link" data-unit="catapult"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_catapult.png" data-title="Catapulta"></a></th><th style="width: 10px"><a href="#" class="unit_link" data-unit="knight"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_knight.png" data-title="Paladino"></a></th><th style="width: 10px"><a href="#" class="unit_link" data-unit="snob"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_snob.png" data-title="Nobre"></a></th></tr><tr class="units-row"><td style="width: 10px" id="spear" class="nowrap unit-item unit-item-spear"></td><td style="width: 10px" id="sword" class="nowrap unit-item unit-item-sword"></td><td style="width: 10px" id="axe" class="nowrap unit-item unit-item-axe"></td><td style="width: 10px" id="archer" class="nowrap unit-item unit-item-archer"></td><td style="width: 10px" id="spy" class="nowrap unit-item unit-item-spy"></td><td style="width: 10px" id="light" class="nowrap unit-item unit-item-light"></td><td style="width: 10px" id="marcher" class="nowrap unit-item unit-item-archer"></td><td style="width: 10px" id="heavy" class="nowrap unit-item unit-item-heavy"></td><td style="width: 10px" id="ram" class="nowrap unit-item unit-item-ram"></td><td style="width: 10px" id="catapult" class="nowrap unit-item unit-item-catapult"></td><td style="width: 10px" id="knight" class="nowrap unit-item unit-item-knight"></td><td style="width: 10px" id="snob" class="nowrap unit-item unit-item-snob"></td></tr></tbody></table></div>`;

        let $BtnCommand = `<div id="command_actions" class="target-select clearfix vis " style="margin: 0px; border: 0; border-top: 1px solid #7d510f;">
    <h4>Agendar:</h4><table class="vis" style="width: 100%"><tbody><tr><td colspan="8"><input type="datetime-local" id="CStime" step=".001" style="width: 190px"></td></tr><tr><td colspan="4">
    <span>Definir Horário: </span><div class="tooltipDiv"><img src="https://dsbr.innogamescdn.com/asset/1e2782a7/graphic/questionmark.png" width="13" height="13">
    <span class="tooltiptext">Este campo indica como o horário informado será utilizado como saída ou chegada em relação ao alvo.</span></div></td><td colspan="4"><select id="definirHorario" style="font-size: 9pt; width: 100%;">
    <option value="C">Chegada</option><option value="S">Saída</option></select></td></tr><tr><td colspan="4"><span>Modelo de NT: </span><div class="tooltipDiv">
    <img src="https://dsbr.innogamescdn.com/asset/1e2782a7/graphic/questionmark.png" width="13" height="13"><span class="tooltiptext">Este campo indica qual será o modo de envio de NT no seu comando, caso seja informato SEM NT, será enviado apenas as tropas do comando acima, caso seja informado qualquer questão alem desta será habilitado campos conforme opção para selecionar as tropas.</span>
    </div></td><td colspan="4"><select id="NTtype" style="font-size: 9pt; width: 100%;"><option value="0">SEM NT</option><option value="1">NT CANCEL</option><option value="2">NT 2</option><option value="3">NT 3</option>
    <option value="4">NT 4</option><option value="5">NT 5</option></select></td></tr><tr name="type_nt" style="display: none;"><td colspan="4"><span>Tipo de NT: </span><div class="tooltipDiv">
    <img src="https://dsbr.innogamescdn.com/asset/1e2782a7/graphic/questionmark.png" width="13" height="13"><span class="tooltiptext">Este campo indica qual se o comando de NT deve ser considerado como um NT Real ou um NT Fake.</span></div></td><td colspan="4">
    <select id="NTReal" style="font-size: 9pt;"><option value="R">Real</option><option value="F">Fake</option></select></td></tr><tr name="tab_nt" style="display: none;"><td colspan="4"><span>Tropas para NT: </span><div class="tooltipDiv">
    <img src="https://dsbr.innogamescdn.com/asset/1e2782a7/graphic/questionmark.png" width="13" height="13"><span class="tooltiptext">Este campo indica qual será o modo de envio de NT no seu comando, caso seja informato Unidades, todos os valores utilizados serão em unidades selecionadas para o comando, caso seja informado Percentual, todos os valores serão utilizados em percentuais das unidades existentes na aldeia.</span></div></td><td colspan="4">
    <select id="typeTropas" style="font-size: 9pt; width: 100%;"><option value="U">Unidades</option><option value="P">Percentual</option></select></td></tr><tr><td colspan="4"><span>Alvo das Catapultas: </span><div class="tooltipDiv">
    <img src="https://dsbr.innogamescdn.com/asset/1e2782a7/graphic/questionmark.png" width="13" height="13"><span class="tooltiptext">Este campo indica qual será o alvo das catapultas no comando.</span></div></td><td colspan="4">
    <select id="alvoCatapaSimples" style="font-size: 9pt;"><option value="padrao">Padrão</option><option value="main">Edifício principal</option><option value="barracks">Quartel</option><option value="stable">Estábulo</option>
    <option value="garage">Oficina</option><option value="watchtower">Torre de vigia</option><option value="snob">Academia</option><option value="smith">Ferreiro</option><option value="place">Praça de reunião</option>
    <option value="statue">Estátua</option><option value="market">Mercado</option><option value="wood">Bosque</option><option value="stone">Poço de argila</option><option value="iron">Mina de ferro</option><option value="farm">Fazenda</option>
    <option value="storage">Armazém</option><option value="wall">Muralha</option></select></td></tr><tr><td colspan="4"><span>Ataque Sequencial: </span><div class="tooltipDiv">
    <img src="https://dsbr.innogamescdn.com/asset/1e2782a7/graphic/questionmark.png" width="13" height="13"><span class="tooltiptext">Este campo indica se irá realizar uma sequencia de ataques com o mesmo comando, ou seja, o comando bate volta e ja é enviado novamente, caso seja informado algum valor neste campo será utilizado como um total de comandos a ser criado, ou seja, caso informe 3, serão criados um total de 3 comandos que irão bater no alvo retornar e ser enviados novamente.</span></div>
    </td><td colspan="4"><input id="qtdeAtaqueSequencial" value="0" style="width: 25px;" type="text"></td></tr></tbody></table>

    <h4 name="tab_nt2" style="border-top: 1px solid #7d510f; display: none;">Nobre 2:
    <div class="tooltipDiv"><img src="https://dsbr.innogamescdn.com/asset/1e2782a7/graphic/questionmark.png" width="13" height="13">
    <span class="tooltiptext">Esta seção irá indicar quantas tropas serão enviadas com o NT indicado.</span>
    </div></h4><table style="display: none;" name="tab_nt2"><tbody><tr><th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="spear"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_spear.png" data-title="Lanceiro"></a></th>
    <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="sword"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_sword.png" data-title="Espadachim"></a></th>
    <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="axe"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_axe.png" data-title="Bárbaro"></a></th>
    ${hasArcher ? '<th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="archer"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_archer.png" data-title="Arqueiro"></a></th>' : ""}
    <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="spy"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_spy.png" data-title="Explorador"></a></th>
    <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="knight"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_knight.png" data-title="Paladino"></a></th>
    </tr>
    <tr class="units-row"><td style="width: 10px" class="nowrap unit-item unit-item-spear">
    <input id="unit_input_spear_nt2" type="text" data-all-count="0" value="0" style="width: 25px;"></td>
    <td style="width: 10px" class="nowrap unit-item unit-item-sword"><input id="unit_input_sword_nt2" type="text" data-all-count="0" value="0" style="width: 25px;"></td>
    <td style="width: 10px" class="nowrap unit-item unit-item-axe"><input id="unit_input_axe_nt2" type="text" data-all-count="0" value="0" style="width: 25px;"></td>
    ${hasArcher ? '<td style="width: 10px" class="nowrap unit-item unit-item-archer"><input id="unit_input_archer_nt2" type="text" data-all-count="0" value="0" style="width: 25px;"></td>' : ""}
    <td style="width: 10px" class="nowrap unit-item unit-item-spy"><input id="unit_input_spy_nt2" type="text" data-all-count="0" value="0" style="width: 25px;"></td>
    <td style="width: 10px" class="nowrap unit-item unit-item-knight"><input id="unit_input_knight_nt2" type="text" data-all-count="0" value="0" style="width: 25px;"></td>
    </tr>
    <tr>
    <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="light"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_light.png" data-title="Cavalaria leve"></a></th>
    ${hasArcher ? '<th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="marcher"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_marcher.png" data-title="Arqueiro a Cavalo"></a></th>' : ""}
    <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="heavy"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_heavy.png" data-title="Cavalaria pesada"></a></th>
    <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="ram"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_ram.png" data-title="Ariete"></a></th>
    <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="catapult"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_catapult.png" data-title="Catapulta"></a></th>
    <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="snob"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_snob.png" data-title="Nobre"></a></th>
    </tr>
    <tr class="units-row"><td style="width: 10px" class="nowrap unit-item unit-item-light">
    <input id="unit_input_light_nt2" type="text" data-all-count="0" value="0" style="width: 25px;"></td><td style="width: 10px" class="nowrap unit-item unit-item-archer">
    ${hasArcher ? '<input id="unit_input_marcher_nt2" type="text" data-all-count="0" value="0" style="width: 25px;"></td><td style="width: 10px" class="nowrap unit-item unit-item-heavy">' : ""}
    <input id="unit_input_heavy_nt2" type="text" data-all-count="0" value="0" style="width: 25px;"></td><td style="width: 10px" class="nowrap unit-item unit-item-ram">
    <input id="unit_input_ram_nt2" type="text" data-all-count="0" value="0" style="width: 25px;"></td><td style="width: 10px" class="nowrap unit-item unit-item-catapult">
    <input id="unit_input_catapult_nt2" type="text" data-all-count="0" value="0" style="width: 25px;"></td><td style="width: 10px" class="nowrap unit-item unit-item-snob">
    <input id="unit_input_snob_nt2" type="text" data-all-count="0" value="0" style="width: 25px;"></td></tr></tbody></table>

    <h4 name="tab_nt3" style="display: none; border-top: 1px solid #7d510f;">
   Nobre 3:
   <div class="tooltipDiv"><img src="https://dsbr.innogamescdn.com/asset/1e2782a7/graphic/questionmark.png" width="13" height="13"><span class="tooltiptext">Esta seção irá indicar quantas tropas serão enviadas com o NT indicado.</span></div>
</h4>
    <table class="vis" style="width: 100%; display: none;" name="tab_nt3">
   <tbody>
      <tr>
         <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="spear"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_spear.png" data-title="Lanceiro"></a></th>
         <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="sword"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_sword.png" data-title="Espadachim"></a></th>
         <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="axe"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_axe.png" data-title="Bárbaro"></a></th>
         ${hasArcher ? '<th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="archer"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_archer.png" data-title="Arqueiro"></a></th>' : ""}
         <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="spy"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_spy.png" data-title="Explorador"></a></th>
         <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="knight"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_knight.png" data-title="Paladino"></a></th>
      </tr>
      <tr class="units-row">
         <td style="width: 10px" class="nowrap unit-item unit-item-spear">
            <input id="unit_input_spear_nt3" type="text" data-all-count="0" value="0" style="width: 25px;">
         </td>
         <td style="width: 10px" class="nowrap unit-item unit-item-sword">
            <input id="unit_input_sword_nt3" type="text" data-all-count="0" value="0" style="width: 25px;">
         </td>
         <td style="width: 10px" class="nowrap unit-item unit-item-axe">
            <input id="unit_input_axe_nt3" type="text" data-all-count="0" value="0" style="width: 25px;">
         </td>
         ${hasArcher ? '<td style="width: 10px" class="nowrap unit-item unit-item-archer"><input id="unit_input_archer_nt3" type="text" data-all-count="0" value="0" style="width: 25px;"></td>' : ""}
         <td style="width: 10px" class="nowrap unit-item unit-item-spy">
            <input id="unit_input_spy_nt3" type="text" data-all-count="0" value="0" style="width: 25px;">
         </td>
         <td style="width: 10px" class="nowrap unit-item unit-item-knight">
            <input id="unit_input_knight_nt3" type="text" data-all-count="0" value="0" style="width: 25px;">
         </td>
      </tr>
      <tr>
         <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="light"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_light.png" data-title="Cavalaria leve"></a></th>
         ${hasArcher ? '<th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="marcher"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_marcher.png" data-title="Arqueiro a Cavalo"></a></th>' : ""}
         <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="heavy"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_heavy.png" data-title="Cavalaria pesada"></a></th>
         <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="ram"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_ram.png" data-title="Ariete"></a></th>
         <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="catapult"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_catapult.png" data-title="Catapulta"></a></th>
         <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="snob"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_snob.png" data-title="Nobre"></a></th>
      </tr>
      <tr class="units-row">
         <td style="width: 10px" class="nowrap unit-item unit-item-light">
            <input id="unit_input_light_nt3" type="text" data-all-count="0" value="0" style="width: 25px;">
         </td>
         ${hasArcher ? '<td style="width: 10px" class="nowrap unit-item unit-item-archer"><input id="unit_input_marcher_nt3" type="text" data-all-count="0" value="0" style="width: 25px;"></td>' : ""}
         <td style="width: 10px" class="nowrap unit-item unit-item-heavy">
            <input id="unit_input_heavy_nt3" type="text" data-all-count="0" value="0" style="width: 25px;">
         </td>
         <td style="width: 10px" class="nowrap unit-item unit-item-ram">
            <input id="unit_input_ram_nt3" type="text" data-all-count="0" value="0" style="width: 25px;">
         </td>
         <td style="width: 10px" class="nowrap unit-item unit-item-catapult">
            <input id="unit_input_catapult_nt3" type="text" data-all-count="0" value="0" style="width: 25px;">
         </td>
         <td style="width: 10px" class="nowrap unit-item unit-item-snob">
            <input id="unit_input_snob_nt3" type="text" data-all-count="0" value="0" style="width: 25px;">
         </td>
      </tr>
   </tbody>
</table>

    <h4 name="tab_nt4" style="display: none; border-top: 1px solid #7d510f;">
       Nobre 4:
       <div class="tooltipDiv"><img src="https://dsbr.innogamescdn.com/asset/1e2782a7/graphic/questionmark.png" width="13" height="13"><span class="tooltiptext">Esta seção irá indicar quantas tropas serão enviadas com o NT indicado.</span></div>
    </h4>
    <table class="vis" style="width: 100%; display: none;" name="tab_nt4">
       <tbody>
          <tr>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="spear"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_spear.png" data-title="Lanceiro"></a></th>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="sword"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_sword.png" data-title="Espadachim"></a></th>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="axe"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_axe.png" data-title="Bárbaro"></a></th>
             ${hasArcher ? '<th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="archer"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_archer.png" data-title="Arqueiro"></a></th>' : ""}
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="spy"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_spy.png" data-title="Explorador"></a></th>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="knight"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_knight.png" data-title="Paladino"></a></th>
          </tr>
          <tr class="units-row">
             <td style="width: 10px" class="nowrap unit-item unit-item-spear">
                <input id="unit_input_spear_nt4" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             <td style="width: 10px" class="nowrap unit-item unit-item-sword">
                <input id="unit_input_sword_nt4" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             <td style="width: 10px" class="nowrap unit-item unit-item-axe">
                <input id="unit_input_axe_nt4" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             ${hasArcher ? '<td style="width: 10px" class="nowrap unit-item unit-item-archer"><input id="unit_input_archer_nt4" type="text" data-all-count="0" value="0" style="width: 25px;"></td>' : ""}
             <td style="width: 10px" class="nowrap unit-item unit-item-spy">
                <input id="unit_input_spy_nt4" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             <td style="width: 10px" class="nowrap unit-item unit-item-knight">
                <input id="unit_input_knight_nt4" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
          </tr>
          <tr>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="light"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_light.png" data-title="Cavalaria leve"></a></th>
             ${hasArcher ? '<th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="marcher"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_marcher.png" data-title="Arqueiro a Cavalo"></a></th>' : ""}
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="heavy"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_heavy.png" data-title="Cavalaria pesada"></a></th>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="ram"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_ram.png" data-title="Ariete"></a></th>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="catapult"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_catapult.png" data-title="Catapulta"></a></th>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="snob"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_snob.png" data-title="Nobre"></a></th>
          </tr>
          <tr class="units-row">
             <td style="width: 10px" class="nowrap unit-item unit-item-light">
                <input id="unit_input_light_nt4" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             ${hasArcher ? '<td style="width: 10px" class="nowrap unit-item unit-item-archer"><input id="unit_input_marcher_nt4" type="text" data-all-count="0" value="0" style="width: 25px;"></td>' : ""}
             <td style="width: 10px" class="nowrap unit-item unit-item-heavy">
                <input id="unit_input_heavy_nt4" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             <td style="width: 10px" class="nowrap unit-item unit-item-ram">
                <input id="unit_input_ram_nt4" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             <td style="width: 10px" class="nowrap unit-item unit-item-catapult">
                <input id="unit_input_catapult_nt4" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             <td style="width: 10px" class="nowrap unit-item unit-item-snob">
                <input id="unit_input_snob_nt4" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
          </tr>
       </tbody>
    </table>

    <h4 name="tab_nt5" style="display: none; border-top: 1px solid #7d510f;">
       Nobre 5:
       <div class="tooltipDiv"><img src="https://dsbr.innogamescdn.com/asset/1e2782a7/graphic/questionmark.png" width="13" height="13"><span class="tooltiptext">Esta seção irá indicar quantas tropas serão enviadas com o NT indicado.</span></div>
    </h4>
    <table class="vis" style="width: 100%; display: none;" name="tab_nt5">
       <tbody>
          <tr>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="spear"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_spear.png" data-title="Lanceiro"></a></th>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="sword"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_sword.png" data-title="Espadachim"></a></th>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="axe"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_axe.png" data-title="Bárbaro"></a></th>
             ${hasArcher ? '<th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="archer"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_archer.png" data-title="Arqueiro"></a></th>' : ""}
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="spy"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_spy.png" data-title="Explorador"></a></th>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="knight"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_knight.png" data-title="Paladino"></a></th>
          </tr>
          <tr class="units-row">
             <td style="width: 10px" class="nowrap unit-item unit-item-spear">
                <input id="unit_input_spear_nt5" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             <td style="width: 10px" class="nowrap unit-item unit-item-sword">
                <input id="unit_input_sword_nt5" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             <td style="width: 10px" class="nowrap unit-item unit-item-axe">
                <input id="unit_input_axe_nt5" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             ${hasArcher ? '<td style="width: 10px" class="nowrap unit-item unit-item-archer"><input id="unit_input_archer_nt5" type="text" data-all-count="0" value="0" style="width: 25px;"></td>' : ""}
             <td style="width: 10px" class="nowrap unit-item unit-item-spy">
                <input id="unit_input_spy_nt5" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             <td style="width: 10px" class="nowrap unit-item unit-item-knight">
                <input id="unit_input_knight_nt5" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
          </tr>
          <tr>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="light"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_light.png" data-title="Cavalaria leve"></a></th>
             ${hasArcher ? '<th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="marcher"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_marcher.png" data-title="Arqueiro a Cavalo"></a></th>' : ""}
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="heavy"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_heavy.png" data-title="Cavalaria pesada"></a></th>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="ram"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_ram.png" data-title="Ariete"></a></th>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="catapult"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_catapult.png" data-title="Catapulta"></a></th>
             <th style="width: 10px"><a tabindex="-1" href="#" class="unit_link" data-unit="snob"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_snob.png" data-title="Nobre"></a></th>
          </tr>
          <tr class="units-row">
             <td style="width: 10px" class="nowrap unit-item unit-item-light">
                <input id="unit_input_light_nt5" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             ${hasArcher ? '<td style="width: 10px" class="nowrap unit-item unit-item-archer"><input id="unit_input_marcher_nt5" type="text" data-all-count="0" value="0" style="width: 25px;"></td>' : ""}
             <td style="width: 10px" class="nowrap unit-item unit-item-heavy">
                <input id="unit_input_heavy_nt5" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             <td style="width: 10px" class="nowrap unit-item unit-item-ram">
                <input id="unit_input_ram_nt5" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             <td style="width: 10px" class="nowrap unit-item unit-item-catapult">
                <input id="unit_input_catapult_nt5" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
             <td style="width: 10px" class="nowrap unit-item unit-item-snob">
                <input id="unit_input_snob_nt5" type="text" data-all-count="0" value="0" style="width: 25px;">
             </td>
          </tr>
       </tbody>
    </table>

    <h4 name="tab_ntCancel" style="display: none;">NT Cancel: <div class="tooltipDiv"><img src="https://dsbr.innogamescdn.com/asset/1e2782a7/graphic/questionmark.png" width="13" height="13">
    <span class="tooltiptext">Esta seção se destina ao envio de Nobres e cancelar este comando após 2 minutos do envio para que o inimigo dispare o alarme caso possua.</span></div></h4>
    <table class="vis" style="width: 100%; display: none;" name="tab_ntCancel"><tbody><tr><td colspan="10"><span>Nro comandos: </span> <div class="tooltipDiv">
    <img src="https://dsbr.innogamescdn.com/asset/1e2782a7/graphic/questionmark.png" width="13" height="13"><span class="tooltiptext">Este campo indica qual será o número de comandos criados sequencialmente para o cancelamento de Nobre.</span></div>
    <input id="nroCmd" value="0" style="width: 25px;" type="text"></td></tr></tbody></table><table class="vis" style="width: 100%">
    <tbody><tr><td colspan="10">
    <button type="button" id="agendarAtaque" class="attack btn btn-attack btn-target-action" >Ataque</button></td><td>
    <button type="button" id="agendarApoio" class="support btn btn-support btn-target-action" >Apoio</button></td><td></tr></tbody></table><table class="vis" style="width: 100%">
    <tbody>
    <div class="target-select clearfix vis " style="margin: 0px; border: 0; border-top: 1px solid #7d510f;"><h4>Agendar em Massa:</h4><tr><td colspan="10"><button class="btn am-form-element" id="OpenCommand" type="button" >Agendar</button>
    </td><td><button class="btn am-form-element" id="showComandos" type="button" >Comandos Agendados</button></td></tr></div>
    </tbody></table></div>
    <table class="vis" style="width: 100%"><tbody>
    <div class="target-select clearfix vis " style="margin: 0px; border: 0; border-top: 1px solid #7d510f;"><h4>Apagar em Massa:</h4>
    <tr>
    <td colspan="11"><button class="btn am-form-element" id="BTNApagarComandos" type="button"> Apagar Comandos Agendados </button>
    </td></tr></div>
    </table>
    </tbody>
    </div>
    <style>
    .tooltipDiv .tooltiptext {
        visibility: hidden;
        width: 200px;
        background-color: black;
        color: #fff;
        text-align: center;
        border-radius: 6px;
        padding: 5px;
        position: absolute;
        z-index: 1;
        top: 80%;
        left: 77%;
        transform: translateX(-10%);
        opacity: 0;
        transition: opacity 0.3s;
    }
     .tooltipDiv:hover .tooltiptext {
        visibility: visible;
        opacity: 1;
    }</style>`;
        let comag = `
    <div id="command_target_mass" class="target-select clearfix vis" style="width: 370px; margin: 0px; border: 0; border-top: 1px solid #7d510f;">
        <h4>Informações de Comandos Agendados:</h4>
        <table class="vis" style="border-collapse: separate; border-spacing: 3px; table-layout: fixed; width: 100%;">
            <tbody>
                <tr><td colspan="10"><span id="CmdAG"></span></td></tr>
                <tr><td colspan="10"><span id="CmdA"></span></td></tr>
                <tr><td colspan="10"><span id="CmdD"></span></td></tr>
                <tr><td colspan="10"><span id="CmdNT"></span></td></tr> <!-- Novo elemento para os NTs -->
            </tbody>
        </table>

 <div id="command_target_mass" class="target-select clearfix vis " style="width: 370; margin: 0px; border: 0; border-top: 1px solid #7d510f;"><h4>Próximo Comando Que será Enviado:</h4>
 <table class="vis" style="border-collapse: separate; border-spacing: 3px; table-layout: fixed; width: 100%;"><tbody><tr><th style="width: 15px">
 <a href="#" class="unit_link" data-unit="spear"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_spear.png" data-title="Lanceiro"></a></th>
 <th style="width: 15px"><a href="#" class="unit_link" data-unit="sword"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_sword.png" data-title="Espadachim"></a></th>
 <th style="width: 15px"><a href="#" class="unit_link" data-unit="axe"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_axe.png" data-title="Bárbaro"></a></th>
 ${hasArcher ? '<th style="width: 15px"><a href="#" class="unit_link" data-unit="archer"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_archer.png" data-title="Arqueiro"></a></th>' : ''}
 <th style="width: 15px"><a href="#" class="unit_link" data-unit="spy"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_spy.png" data-title="Explorador"></a></th>
 <th style="width: 15px"><a href="#" class="unit_link" data-unit="light"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_light.png" data-title="Cavalaria leve"></a></th>
 ${hasArcher ? '<th style="width: 15px"><a href="#" class="unit_link" data-unit="marcher"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_marcher.png" data-title="Arqueiro a Cavalo"></a></th>' : ''}
 <th style="width: 15px"><a href="#" class="unit_link" data-unit="heavy"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_heavy.png" data-title="Cavalaria pesada"></a></th>
 <th style="width: 15px"><a href="#" class="unit_link" data-unit="ram"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_ram.png" data-title="Aríete"></a></th>
 <th style="width: 15px"><a href="#" class="unit_link" data-unit="catapult"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_catapult.png" data-title="Catapulta"></a></th>
 <th style="width: 15px"><a href="#" class="unit_link" data-unit="knight"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_knight.png" data-title="Paladino"></a></th>
 <th style="width: 15px"><a href="#" class="unit_link" data-unit="snob"><img src="https://dsbr.innogamescdn.com/asset/0e187870/graphic/unit/unit_snob.png" data-title="Nobre"></a></th>
 </tr>
 <tr id="TropC" class="units-row"></tr><tr>
 <td id="color" colspan="2"><span id="icon"></span><span id="Tcmd"></span></td>
 <td colspan="5"><span title="0069 - Lissim (648|624) K66" class="icon header village"></span><span>Origem</span><input id="CFrom" value="648|624" readonly=""></td><td colspan="5"><span title="0569 | Lissim (713|486)" class="icon header village">
 </span><span>Destino</span><input id="CTo" value="713|486" readonly=""></td></tr><tr><td colspan="5">
 <span>Modelo NT: </span></td><td colspan="7"><span></span><select id="NTtypeABC" style="font-size: 9pt; width: 100%;"><option value="0">SEM NT</option><option value="1">NT CANCEL</option><option value="2">NT 2</option><option value="3">NT 3</option>
    <option value="4">NT 4</option><option value="5">NT 5</option></select></td></tr>
 <tr><td colspan="5"><span>Alvo das Catapultas: </span></td><td colspan="7"><select id="alvoCatC" style="font-size: 9pt;"><option value="padrao">Padrão</option><option value="main">Edifício principal</option><option value="barracks">Quartel</option><option value="stable">Estábulo</option>
    <option value="garage">Oficina</option><option value="watchtower">Torre de vigia</option><option value="snob">Academia</option><option value="smith">Ferreiro</option><option value="place">Praça de reunião</option>
    <option value="statue">Estátua</option><option value="market">Mercado</option><option value="wood">Bosque</option><option value="stone">Poço de argila</option><option value="iron">Mina de ferro</option><option value="farm">Fazenda</option>
    <option value="storage">Armazém</option><option value="wall">Muralha</option></select></td></tr><tr>
 <td colspan="6" style="padding-right: 20px;">
  <span>Horário Saida:</span>
  <input id="Hsaida" value="2024-09-30T00:00:00" type="datetime-local" readonly="">
</td>
<td> </td>
<td colspan="6">
  <span>Horário Chegada:</span>
  <input id="Hchegada" value="2024-10-01T21:45:45.141" type="datetime-local" readonly="">
</td>`;
        let activeWorldData = JSON.parse(localStorage.getItem('activeTW')) || {};
        let coordsToID = JSON.parse(localStorage.getItem(`coordsToID_${activeWorldData['world']}`)) || {};

        $(document).ready(function () {
            const change = document.getElementById('NTtype');
            change.addEventListener('change', function () {
                const nt1 = document.querySelector('h4[name="tab_ntCancel"]');
                const nt11 = document.querySelector('table[name="tab_ntCancel"]');
                const nt2 = document.querySelector('h4[name="tab_nt2"]');
                const nt22 = document.querySelector('table[name="tab_nt2"]');
                const nt3 = document.querySelector('h4[name="tab_nt3"]');
                const nt33 = document.querySelector('table[name="tab_nt3"]');
                const nt4 = document.querySelector('h4[name="tab_nt4"]');
                const nt44 = document.querySelector('table[name="tab_nt4"]');
                const nt5 = document.querySelector('h4[name="tab_nt5"]');
                const nt55 = document.querySelector('table[name="tab_nt5"]');

                // Verifica se os elementos existem antes de tentar alterar o display
                const elements = [nt1, nt11, nt2, nt22, nt3, nt33, nt4, nt44, nt5, nt55];

                // Oculta todos os elementos inicialmente
                elements.forEach(element => {
                    if (element) {
                        element.style.display = 'none';
                    }
                });

                // Exibe os elementos com base no valor selecionado
                if (this.value === '1') {
                    nt1.style.display = 'block';
                    nt11.style.display = 'block';
                } else if (this.value === '2') {
                    nt2.style.display = 'block';
                    nt22.style.display = 'block';
                } else if (this.value === '3') {
                    nt2.style.display = 'block';
                    nt22.style.display = 'block';
                    nt3.style.display = 'block';
                    nt33.style.display = 'block';
                } else if (this.value === '4') {
                    nt2.style.display = 'block';
                    nt22.style.display = 'block';
                    nt3.style.display = 'block';
                    nt33.style.display = 'block';
                    nt4.style.display = 'block';
                    nt44.style.display = 'block';
                } else if (this.value === '5') {
                    nt2.style.display = 'block';
                    nt22.style.display = 'block';
                    nt3.style.display = 'block';
                    nt33.style.display = 'block';
                    nt4.style.display = 'block';
                    nt44.style.display = 'block';
                    nt5.style.display = 'block';
                    nt55.style.display = 'block';
                }
            });

            // gerando data atual
            function convertToInput(date) {
                const ano = date.getFullYear();
                const mes = String(date.getMonth() + 1).padStart(2, '0');
                const dia = String(date.getDate()).padStart(2, '0');
                const horas = String(date.getHours()).padStart(2, '0');
                const minutos = String(date.getMinutes()).padStart(2, '0');
                const segundos = String(date.getSeconds()).padStart(2, '0');
                const milissegundos = String(date.getMilliseconds()).padStart(3, '0');
                return `${ano}-${mes}-${dia}T${horas}:${minutos}:${segundos}.${milissegundos}`;
            }

            document.getElementById('CStime').value = convertToInput(new Date());
            document.querySelectorAll('.unitsInput').forEach(input => {
                // Cria um checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.name = input.name; // O name será o mesmo do input
                // checkbox.id = `checkbox_${input.name}`; // Id único para cada checkbox

                // Adiciona o checkbox após o input
                input.parentNode.insertBefore(checkbox, input);
            });

            function calctemp() {
                const Infotimertrops = document.getElementById('command-data-form');
                const element = document.querySelector('.village-distance');
                const commandDiv = document.getElementById('command_tempo_alvo');
                if (element) {
                    // Seleciona a célula que contém as coordenadas
                    const coordinatesCell = document.getElementById('menu_row2');
                    // Obtém o texto da célula e usa uma expressão regular para extrair apenas as coordenadas
                    const coordinatesText = coordinatesCell.textContent.trim();
                    const coordinateorigem = coordinatesText.match(/\((\d+\|\d+)\)/);

                    // Seleciona o span com a classe 'village-name'
                    const villageNameSpan = document.querySelector('.village-name');
                    // Obtém o texto do span e usa uma expressão regular para extrair as coordenadas
                    const villageNameText = villageNameSpan.textContent.trim();
                    const coordinatedestine = villageNameText.match(/\((\d+\|\d+)\)/);

                    function calculateDistance(coordinateorigem, coordinatedestine) {
                        let x1, y1, x2, y2;
                        if (coordinateorigem) {
                            // Extrai as coordenadas
                            const Cfrom = coordinateorigem[1]; // '699|566'
                            [x1, y1] = Cfrom.split('|').map(Number); // Divide em x1 e y1 e converte para número
                            console.log(`x1: ${x1}, y1: ${y1}`); // Exibe os valores
                        }

                        if (coordinatedestine) {
                            // Extrai as coordenadas
                            const Cto = coordinatedestine[1]; // '699|566'
                            [x2, y2] = Cto.split('|').map(Number); // Divide em x2 e y2 e converte para número
                            console.log(`x2: ${x2}, y2: ${y2}`); // Exibe os valores
                        }

                        let deltaX = Math.abs(x1 - x2);
                        let deltaY = Math.abs(y1 - y2);
                        return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                    }

                    calculateDistance();
                    if (element && !commandDiv) {
                        function formatTime(unitTime) {
                            const totalSeconds = Math.floor(unitTime / 1000).toString().padStart(2, '0'); // Converte milissegundos para segundos
                            const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
                            const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
                            const seconds = (totalSeconds % 60).toString().padStart(2, '0');
                            ;

                            return `${hours}:${minutes}:${seconds}`; // Formata como string
                        }

                        const distance = calculateDistance(coordinateorigem, coordinatedestine);
                        // Oculta todas as células da tabela no início
                        $('<style>').text(`#command_tempo_alvo .units-row td, #command_tempo_alvo th {display: none;}`).appendTo('head');

                        function RequestUnits() {
                            return $.get('/interface.php?func=get_unit_info').then(function ($xml) {
                                let $units = {};
                                $($xml).find('config').children().each(function () {
                                    const unitName = this.tagName;
                                    const speed = Number($(this).find('speed').prop('textContent'));

                                    if (isNaN(speed)) return; // Ignora unidades inválidas

                                    const unitTime = distance * speed * 60000;
                                    const formattedTime = formatTime(unitTime);

                                    $units[unitName] = { speed, unitTime };

                                    // Exibe apenas os elementos correspondentes da unidade requisitada
                                    $('#command_tempo_alvo th a[data-unit="' + unitName + '"]').closest('th').css('display', 'table-cell');
                                    $('#command_tempo_alvo #' + unitName).text(formattedTime).css('display', 'table-cell');
                                });

                                return $units;
                            });
                        }

                        RequestUnits();

                        function extrairIdDaPagina() {
                            const url = window.location.href; // Obtém a URL da página atual
                            const villageNumber = url.split('&screen=')[0]; // Divide a URL e pega a parte antes do parâmetro "screen"
                            return villageNumber;
                        }

                        function RequestUnitsSelect() {
                            let x2, y2;
                            // Extrai as coordenadas
                            const Cto = coordinatedestine[1]; // '699|566'
                            [x2, y2] = Cto.split('|').map(Number);
                            const selectedUnits = [];
                            return $.get('/interface.php?func=get_unit_info').then(function ($xml) {
                                const units = {};
                                const unitsM = [
                                    'unit_input_spear',
                                    'unit_input_sword',
                                    'unit_input_axe',
                                    'unit_input_archer',
                                    'unit_input_spy',
                                    'unit_input_light',
                                    'unit_input_marcher',
                                    'unit_input_heavy',
                                    'unit_input_ram',
                                    'unit_input_catapult',
                                    'unit_input_knight',
                                    'unit_input_snob',
                                ];

                                unitsM.forEach(id => {
                                    const input = document.getElementById(id);
                                    if (!input) return; // se não existir, ignora
                                });

                                for (let i = 0; i < unitsM.length; i++) {
                                    const inputElement = document.getElementById(unitsM[i]);
                                    if (!inputElement) continue;
                                    const unitName = inputElement.name;
                                    const inputValue = inputElement.value || 0;

                                    const checkbox = document.querySelector(`input[type="checkbox"][name="${unitName}"]`);
                                    if (!unitName) continue;

                                    if (!checkbox?.checked) {
                                        selectedUnits.push({ unitName, inputValue });
                                    } else {
                                        selectedUnits.push({ unitName, inputValue: 'all' });
                                    }
                                }


                                console.log(selectedUnits)
                                // Processa o XML e calcula unitTime para as unidades
                                $($xml).find('config').children().each(function () {
                                    const unitName = this.tagName;
                                    const speed = Number($(this).find('speed').text());
                                    const unitTime = distance * speed * 60000;
                                    // Armazena o unitTime e a unidade, se ela estiver selecionada
                                    if (selectedUnits.some(unit => unit.unitName === unitName && unit.inputValue != 0)) {
                                        units[unitName] = {
                                            speed: speed,
                                            unitTime: unitTime
                                        };
                                    }
                                });
                                // Encontra a unidade com o maior unitTime
                                let maxUnitTime = -1;
                                let maxUnitName = '';
                                // Verifica as unidades selecionadas
                                for (const unit of selectedUnits) {
                                    const unitData = units[unit.unitName];
                                    if (unitData && unitData.unitTime > maxUnitTime) {
                                        maxUnitTime = unitData.unitTime;
                                        maxUnitName = unit.unitName;
                                    }
                                }
                                // Compara os tempos formatados e exibe os resultados
                                if (formatTime(maxUnitTime)) {
                                    const unitmaxx = formatTime(maxUnitTime)
                                    console.log('Unidade com maior tempo:', maxUnitName, 'Tempo:', unitmaxx);
                                    // Exibe o resultado na interface, se necessário
                                }
                                const villageNumber = extrairIdDaPagina();

                                let horario = document.getElementById('definirHorario').value || 'C';
                                if (!document.getElementById('CStime').value) {
                                    mostrarMensagem("Por favor, selecione um horário para agendamento.", "erro");
                                    return;
                                }
                                if (selectedUnits.length === 0) {
                                    mostrarMensagem("Selecione ao menos uma unidade para enviar.", "erro");
                                    return;
                                }

                                let nome;
                                let link = `${villageNumber}&screen=place&x=${x2}&y=${y2}`;
                                let Dsaida;
                                let Dchegada;
                                let CFrom = coordinateorigem[1];
                                let CTo = coordinatedestine[1];
                                let NtType = document.getElementById('NTtype').value;

                                let AlvCat = document.getElementById('alvoCatapaSimples').value;
                                if (!NtType) {
                                    NtType = 0;
                                }
                                if (!AlvCat) {
                                    AlvCat = 'padrao';
                                }
                                nome = localStorage.getItem('Nome');
                                let QtAtks = parseInt(document.getElementById('qtdeAtaqueSequencial').value) || 0;
                                if (QtAtks === 0) {
                                    QtAtks = 1;
                                }
                                let Ddsaida;
                                let Ddchegada;
                                if (horario === 'S') {
                                    const ssaida = document.getElementById('CStime').value;// Salva a data/hora se "Saída"
                                    Ddsaida = document.getElementById('CStime').value;
                                    const saida = new Date(ssaida);
                                    const timeToAdc = (maxUnitTime / 1000);
                                    saida.setSeconds(saida.getSeconds() + timeToAdc);
                                    const TForm = convertToInput(saida);
                                    Ddchegada = TForm;
                                } else if (horario === 'C') {
                                    // Obtém a data inserida no input
                                    const inputDate = document.getElementById('CStime').value;
                                    const arrivalTime = new Date(inputDate);
                                    const timeToSubtract = (maxUnitTime / 1000); // tempo a ser subtraído em milissegundos
                                    // Subtraindo os milissegundos
                                    arrivalTime.setSeconds(arrivalTime.getSeconds() - timeToSubtract);
                                    // Convertendo a data formatada após a subtração
                                    const formattedDate = convertToInput(arrivalTime);
                                    // Subtrai o tempo formatado
                                    Ddsaida = formattedDate; // Salva a data/hora ajustada para "Chegada"
                                    Ddchegada = inputDate;
                                }
                                const tdas = (maxUnitTime / 1000);
                                Dsaida = Ddsaida;
                                Dchegada = Ddchegada;
                                for (let xy = 0; xy < QtAtks; xy++) { // Altere 10 para o número de iterações desejado
                                    if (xy === 0) {
                                        Dsaida = Ddsaida;
                                        Dchegada = Ddchegada;
                                    } else {
                                        let temp = Ddchegada;
                                        const nsaida = new Date(temp);
                                        nsaida.setSeconds(nsaida.getSeconds() + tdas + 30);
                                        Dsaida = convertToInput(nsaida);
                                        Ddchegada = temp + tdas;
                                        const sssaida = new Date(Dsaida);
                                        sssaida.setSeconds(sssaida.getSeconds() + tdas);
                                        Ddchegada = convertToInput(sssaida);
                                        Dchegada = Ddchegada;
                                        console.log(`A: ${Dsaida}, B: ${Ddchegada}`);
                                    }

                                    let unitsNt = [];

                                    if (NtType !== '0') {
                                        for (let i = 2; i <= parseInt(NtType); i++) {
                                            const spearInput = document.querySelector(`#unit_input_spear_nt${i}`)
                                            const swordInput = document.querySelector(`#unit_input_sword_nt${i}`)
                                            const axeInput = document.querySelector(`#unit_input_axe_nt${i}`)
                                            const spyInput = document.querySelector(`#unit_input_spy_nt${i}`)
                                            const knightInput = document.querySelector(`#unit_input_knight_nt${i}`)
                                            const lightInput = document.querySelector(`#unit_input_light_nt${i}`)
                                            const heavyInput = document.querySelector(`#unit_input_heavy_nt${i}`)
                                            const ramInput = document.querySelector(`#unit_input_ram_nt${i}`)
                                            const catapultInput = document.querySelector(`#unit_input_catapult_nt${i}`)
                                            const snobInput = document.querySelector(`#unit_input_snob_nt${i}`)

                                            const units = {
                                                spear: spearInput?.value || 0,
                                                sword: swordInput?.value || 0,
                                                axe: axeInput?.value || 0,
                                                spy: spyInput?.value || 0,
                                                knight: knightInput?.value || 0,
                                                light: lightInput?.value || 0,
                                                heavy: heavyInput?.value || 0,
                                                ram: ramInput?.value || 0,
                                                catapult: catapultInput?.value || 0,
                                                snob: snobInput?.value || 0,
                                            }

                                            if (hasArcher) {
                                                const archerInput = document.querySelector(`#unit_input_archer_nt${i}`)
                                                const marcherInput = document.querySelector(`#unit_input_marcher_nt${i}`)

                                                units.archer = archerInput?.value || 0;
                                                units.marcher = marcherInput?.value || 0;
                                            }

                                            unitsNt.push(units);
                                        }
                                    }


                                    // Recupera os dados existentes do localStorage
                                    let savedModels = JSON.parse(localStorage.getItem('savedModels')) || [];
                                    let selectedData = {
                                        nome: localStorage.getItem('Nome'),
                                        CFrom,
                                        CTo,
                                        link,
                                        units: selectedUnits,
                                        Dsaida,
                                        Dchegada,
                                        NtType,
                                        unitsNt,
                                        AlvCat
                                    };
                                    // Adiciona o novo modelo
                                    // Salva de volta no localStorage
                                    savedModels.push(selectedData); // Adiciona apenas se o link for novo
                                    localStorage.setItem('savedModels', JSON.stringify(savedModels));
                                    // Ordena o array pela data de Dsaida
                                    savedModels.sort((a, b) => new Date(a.Dsaida) - new Date(b.Dsaida));
                                    console.log('Modelos organizados pela data de saída:', savedModels);

                                    mostrarMensagem("Comando agendado com sucesso!", "sucesso");
                                    // console.log(`Modelo salvo: ${JSON.stringify(savedModels, null, 2)}` );

                                }

                                return units;
                            })
                                .catch(function (error) {
                                    console.error('Erro ao obter informações das unidades:', error);
                                });
                        }

                        //criando  a função de comandos
                        function agendar() {
                            document.getElementById('agendarAtaque').addEventListener('click', function () {
                                const atk = 'Atak';
                                localStorage.setItem('Nome', atk);
                                RequestUnitsSelect();
                            });
                            document.getElementById('agendarApoio').addEventListener('click', function () {
                                const apoio = 'Apoio';
                                localStorage.setItem('Nome', apoio);
                                RequestUnitsSelect();
                            });
                        }

                        agendar();
                        Infotimertrops.insertAdjacentHTML('beforebegin', $InfoTimeTrops);
                    }
                } else if (!element && commandDiv) {
                    // Fecha a div, por exemplo, escondendo-a
                    commandDiv.remove();
                }
                setTimeout(function () {
                    calctemp()
                }, 1000);
            }

            calctemp();


        });

        function checkAndOpenLinks() {
            const savedModels = JSON.parse(localStorage.getItem('savedModels')) || [];
            // Ordena o array pela data de Dsaida
            if (savedModels.length > 2) {
                savedModels.sort((a, b) => new Date(b.Dsaida) - new Date(a.Dsaida));
                savedModels.sort((a, b) => new Date(a.Dsaida) - new Date(b.Dsaida));
            }
            if (savedModels.length > 0) {
                const targetElements = document.getElementsByClassName('target-select-links');
                if (!document.getElementById('command_target_mass')) {
                    targetElements[0].insertAdjacentHTML('afterend', comag);
                }
                const now = new Date();
                savedModels.forEach((model, index) => {
                    const modelTime = new Date(model.Dsaida);
                    const timeDiff = modelTime - now;
                    // Verifica se faltam 40 segundos e se o modelo ainda não foi aberto
                    if (timeDiff <= 1000 * 2 * 20 && !model.opened) {
                        model.opened = true; // Marca o modelo como aberto
                        localStorage.setItem('savedModels', JSON.stringify(savedModels));
                        // Abre o link em uma nova aba e salva a referência da janela
                        const win = window.open(model.link, '_blank');
                        // Envia uma mensagem para a nova janela para fechar após submit
                        if (win) {
                            win.addEventListener('load', function () {
                                // Tenta encontrar o botão de submit e adicionar o evento
                                try {
                                    const tryClose = () => {
                                        const btn = win.document.getElementById('troop_confirm_submit');
                                        if (btn) {
                                            btn.addEventListener('click', function () {
                                                setTimeout(() => {
                                                    win.close();
                                                }, 5000);
                                            });
                                        } else {
                                            // Tenta novamente após um pequeno delay
                                            setTimeout(tryClose, 500);
                                        }
                                    };
                                    tryClose();
                                } catch (e) {
                                    // fallback: fecha após 8s se não conseguir injetar
                                    setTimeout(() => {
                                        win.close();
                                    }, 8000);
                                }
                            });
                        }
                    } else if (model.opened) {
                        setTimeout(() => {
                            savedModels.splice(index, 1); // Remove o modelo da lista
                            localStorage.setItem('savedModels', JSON.stringify(savedModels)); // Atualiza o localStorage
                        }, 4000); // Espera 30 segundos antes de verificar
                    }
                });
            } else if (document.getElementById('command_target_mass') && savedModels.length <= 0) {
                document.getElementById('command_target_mass').remove();
            }
            //================ config para exibição info de comandos agendados ================================
            const row = document.getElementById('TropC');

            if (savedModels.length > 0 && savedModels[0]) {
                const firstModel = savedModels[0];

                // Preenche os dados da linha (TropC) com os nomes das unidades
                if (row.children.length === 0) {
                    firstModel.units.forEach(unit => {
                        const td = document.createElement('td');
                        td.style.width = '15px';
                        const unitName = unit.unitName || 'Unnamed';
                        td.textContent = unitName;
                        td.style.textAlign = 'left';
                        row.appendChild(td);
                    });
                }

                // Atualiza os valores das unidades na linha
                firstModel.units.forEach((unit, index) => {
                    const td = row.children[index];
                    td.textContent = unit.inputValue;
                });

                // Definir ícone e cor com base no tipo de comando
                updateCommandStyle(firstModel);

                // Preenche os dados nos inputs
                let nameTypeCommand = firstModel.NtType != '0' ? 'Nobre' : firstModel.nome;
                document.getElementById('Tcmd').textContent = savedModels[0].nome;
                document.getElementById('Hsaida').value = savedModels[0].Dsaida;
                document.getElementById('CFrom').value = savedModels[0].CFrom;
                document.getElementById('alvoCatC').value = savedModels[0].AlvCat;
                document.getElementById('NTtypeABC').value = savedModels[0].NtType;
                document.getElementById('CTo').value = savedModels[0].CTo;
                document.getElementById('Hchegada').value = savedModels[0].Dchegada;

                // Exibe o total de comandos agendados
                updateCommandCounts(savedModels);
            }

            // Função para atualizar o estilo e ícone com base no tipo de comando
            function updateCommandStyle(model) {
                const colorElement = document.getElementById('color');
                const iconElement = document.getElementById('icon');

                console.log(model.nome, model.NtType, model.nome === 'Atak' && model.NtType == '0');

                if (model.nome === 'Atak' && model.NtType == '0') {
                    // Ataque comum
                    colorElement.style.backgroundColor = 'rgba(255, 0, 0, 0.53)';
                    iconElement.innerHTML = '<a href="#" class="unit_link" data-unit="axe"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_axe.png" alt="Unit Image"></a>';
                } else if (model.NtType && model.NtType != '0') {
                    // Ataque NT
                    colorElement.style.backgroundColor = 'rgba(255, 197, 12, 0.85)';
                    iconElement.innerHTML = '<a href="#" class="unit_link" data-unit="snob"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_snob.png" alt="Unit Image"></a>';
                } else if (model.nome === 'Apoio') {
                    // Apoio
                    colorElement.style.backgroundColor = 'rgba(0, 0, 255, 0.53)';
                    iconElement.innerHTML = '<a href="#" class="unit_link" data-unit="sword"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_sword.png" alt="Unit Image"></a>';
                }
            }

            // Função para atualizar os totais de comandos agendados
            function updateCommandCounts(models) {
                const totalComandos = models.length;

                const totalAtaques = models.filter(model => model.nome === 'Atak').length;
                const totalApoios = models.filter(model => model.nome === 'Apoio').length;
                const totalNTs = models.filter(model => model.nome === 'Atak' && model.NtType && model.NtType != '0').length;

                // Exibe os totais no DOM
                document.getElementById('CmdAG').textContent = `Número de Comandos Agendados: ${totalComandos}`;
                document.getElementById('CmdA').textContent = `Número de Ataques Agendados: ${totalAtaques}`;
                document.getElementById('CmdD').textContent = `Número de Apoios Agendados: ${totalApoios}`;
                document.getElementById('CmdNT').textContent = `Número de NTs Agendados: ${totalNTs}`;
            }

            //=================================================================================================
            setTimeout(checkAndOpenLinks, 1000);
        }

        checkAndOpenLinks();

        function send() {
            const inputField = document.querySelector('.target-input-field');
            const savedModels = JSON.parse(localStorage.getItem('savedModels')) || [];
            if (window.opener && !window.opener.closed) {
                savedModels.forEach((model, index) => {
                    if (model.opened) {
                        model.units.forEach(unit => {
                            const inputName = unit.unitName;
                            const inputValue = unit.inputValue;
                            console.log(`Inserindo unidade: ${inputName}, Valor: ${inputValue}`);
                            // Insere o valor coletado na respectiva input
                            if (inputValue === 'all') {
                                const input = document.getElementById(`units_entry_all_${inputName}`);
                                input.click();
                            } else {
                                const input = document.getElementById(`unit_input_${inputName}`);
                                input.value = inputValue;
                            }
                        });
                        if (inputField.style.display === 'none') {
                            setTimeout(() => {
                                if (model.nome === 'Atak') {
                                    document.getElementById('target_attack').click();
                                } else {
                                    document.getElementById('target_support').click();
                                }
                            }, 2000);
                        }
                    }
                });

            }
        }

        send();
        setTimeout(() => {
            window.close();
        }, 3000);
        let btnComand = document.getElementById('target_support');
        btnComand.insertAdjacentHTML('afterend', $BtnCommand);

        function updateTable() {
            // Remove a tabela anterior, se existir
            const existing = document.getElementById("content_history_comands");
            if (existing) {
                existing.remove();
            }
            let Tabelagendados = `
            <div id="content_history_comands">
                    <table id="dataTable" class="vis overview_table" width="100%" style="border-spacing: 2px; border-collapse: separate; border: 1px solid #7d510f; border-top: 0px;">
                        <thead>
                            <tr>
                                <th colspan="2">Comando</th>
                                <th style="width: 60px; text-align:center;">Origem</th>
                                <th style="width: 60px; text-align:center;">Destino</th>
                                <th>Saída</th>
                                <th>Chegada</th>
                                <th style="text-align:center"><img src="https://dsbr.innogamescdn.com/asset/68480359/graphic/unit/unit_spear.png" data-title="Lanceiro"></th>
                                <th style="text-align:center"><img src="https://dsbr.innogamescdn.com/asset/68480359/graphic/unit/unit_sword.png" data-title="Espadachim"></th>
                                <th style="text-align:center"><img src="https://dsbr.innogamescdn.com/asset/68480359/graphic/unit/unit_axe.png" data-title="Bárbaro"></th>
                                ${hasArcher ? '<th style="text-align:center"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_archer.png" data-title="Arqueiro"></th>' : ''}
                                <th style="text-align:center"><img src="https://dsbr.innogamescdn.com/asset/68480359/graphic/unit/unit_spy.png" data-title="Explorador"></th>
                                <th style="text-align:center"><img src="https://dsbr.innogamescdn.com/asset/68480359/graphic/unit/unit_light.png" data-title="Cavalaria leve"></th>
                                ${hasArcher ? '<th style="text-align:center"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_marcher.png" data-title="Cavalaria Arqueira"></th>' : ''}
                                <th style="text-align:center"><img src="https://dsbr.innogamescdn.com/asset/68480359/graphic/unit/unit_heavy.png" data-title="Cavalaria pesada"></th>
                                <th style="text-align:center"><img src="https://dsbr.innogamescdn.com/asset/68480359/graphic/unit/unit_ram.png" data-title="Aríete"></th>
                                <th style="text-align:center"><img src="https://dsbr.innogamescdn.com/asset/68480359/graphic/unit/unit_catapult.png" data-title="Catapulta"></th>
                                <th style="text-align:center"><img src="https://dsbr.innogamescdn.com/asset/68480359/graphic/unit/unit_knight.png" data-title="Paladino"></th>
                                <th style="text-align:center"><img src="https://dsbr.innogamescdn.com/asset/68480359/graphic/unit/unit_snob.png" data-title="Nobre"></th>
                                <th style="text-align:center">Cancelar</th>
                                <th style="text-align:center">Editar</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- As linhas serão adicionadas aqui -->
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('contentContainer').insertAdjacentHTML('afterend', Tabelagendados);

            let savedModels = JSON.parse(localStorage.getItem('savedModels')) || [];
            let tableBody = document.querySelector("#dataTable tbody");
            tableBody.innerHTML = ''; // Limpa a tabela
            function carregar() {
                savedModels.forEach((model, index) => {
                    if (!model.opened) {
                        if (model.nome === 'Atak') {
                            let newRowHTML = `<tr class="nowrap">
            ${model?.NtType != '0'
                                    ? '<td style="background-color: rgba(255,197,12,0.85);"><a href="#" class="unit_link" data-unit="axe"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_snob.png" alt="Unit Image"></a></td>'
                                    : '<td style="background-color: rgba(255, 0, 0, 0.53);"><a href="#" class="unit_link" data-unit="axe"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_axe.png" alt="Unit Image"></a></td>'
                                }
            ${model?.NtType != '0'
                                    ? '<td style="background-color: rgba(255,197,12,0.85);"><span>Nobre</span></td>'
                                    : '<td style="background-color: rgba(255, 0, 0, 0.53);"><span>Ataque</span></td>'
                                }
            <td style="text-align:center"><span>${model.CFrom}</span></td>
            <td style="text-align:center"><span>${model.CTo}</span></td>
            <td><input id="Hsaidah-${index}" value="${model.Dsaida}" type="datetime-local" readonly style="width: 165px;"></td>
            <td><input id="Hdestinh-${index}" value="${model.Dchegada}" type="datetime-local" readonly style="width: 165px;"></td>`;

                            // Adicionando unidades
                            model.units.forEach(unit => {
                                newRowHTML += `<td style="text-align:center;"><input style="width: 25px;" id="unitValue-${index}-${unit.unitName}" value="${unit.inputValue || '0'}" readonly></td>`;
                            });

                            // Botões de excluir e editar com IDs específicos
                            newRowHTML += `
            <td style="text-align:center">
                <button type="button" class="deleteItem" data-index="${index}">
                    <img class="village-delete" alt="" src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic//delete.png">
                </button>
            </td>
            <td style="text-align:center">
                <button type="button" class="editButton" data-index="${index}" id="editButton-${index}">Editar</button>
                <button type="button" class="confirmedt" style="display: none;" id="confirmedt-${index}" data-index="${index}">Confirmar</button>
            </td>
        </tr>`;
                            tableBody.insertAdjacentHTML('beforeend', newRowHTML);
                        } else {
                            let newRowHTML = `<tr class="nowrap">
            <td style="background-color: rgba(0, 0, 255, 0.53);">
                <a href="#" class="unit_link" data-unit="sword">
                    <img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_sword.png" alt="Unit Image">
                </a>
            </td>
            <td style="background-color: rgba(0, 0, 255, 0.53);"><span>Apoio</span></td>
            <td style="text-align:center"><span>${model.CFrom}</span></td>
            <td style="text-align:center"><span>${model.CTo}</span></td>
            <td><input id="Hsaidah-${index}" value="${model.Dsaida}" type="datetime-local" readonly style="width: 165px;"></td>
            <td><input id="Hdestinh-${index}" value="${model.Dchegada}" type="datetime-local" readonly style="width: 165px;"></td>`;

                            // Adicionando unidades
                            model.units.forEach(unit => {
                                newRowHTML += `<td style="text-align:center;"><input style="width: 25px;" id="unitValue-${index}-${unit.unitName}" value="${unit.inputValue || '0'}" readonly></td>`;
                            });

                            // Botões de excluir e editar com IDs específicos
                            newRowHTML += `
            <td style="text-align:center">
                <button type="button" class="deleteItem" data-index="${index}">
                    <img class="village-delete" alt="" src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic//delete.png">
                </button>
            </td>
            <td style="text-align:center">
                <button type="button" class="editButton" data-index="${index}" id="editButton-${index}">Editar</button>
                <button type="button" class="confirmedt" style="display: none;" id="confirmedt-${index}" data-index="${index}">Confirmar</button>
            </td>
        </tr>`;

                            tableBody.insertAdjacentHTML('beforeend', newRowHTML);
                        }
                    }
                });
            }

            carregar();
            // Função para deletar item
            tableBody.addEventListener('click', function (event) {
                if (event.target.closest('.deleteItem')) {
                    const index = event.target.closest('.deleteItem').dataset.index;
                    savedModels.splice(index, 1); // Remove o item do array
                    localStorage.setItem('savedModels', JSON.stringify(savedModels)); // Atualiza o localStorage
                    tableBody.innerHTML = ''; // Limpa a tabela
                    // Recarrega as linhas da tabela
                    carregar();
                }
            });
            // Função para editar item
            tableBody.addEventListener('click', function (event) {
                if (event.target.closest('.editButton')) {
                    const index = event.target.closest('.editButton').dataset.index;
                    const inputs = document.querySelectorAll(`#dataTable input[id^='unitValue-${index}']`);

                    inputs.forEach(input => {
                        input.readOnly = false; // Torna os campos editáveis
                    });

                    event.target.style.display = 'none'; // Esconde o botão de editar
                    const confirmBtn = document.querySelector(`#confirmedt-${index}`);
                    confirmBtn.style.display = 'inline'; // Mostra o botão de confirmar
                }
            });
            // Função para confirmar edição
            tableBody.addEventListener('click', function (event) {
                if (event.target.closest('.confirmedt')) {
                    const index = event.target.closest('.confirmedt').dataset.index;
                    const inputs = document.querySelectorAll(`#dataTable input[id^='unitValue-${index}']`);

                    inputs.forEach((input, unitIndex) => {
                        savedModels[index].units[unitIndex].inputValue = input.value; // Atualiza o valor no array
                        input.readOnly = true; // Torna os campos não editáveis novamente
                    });

                    event.target.style.display = 'none'; // Esconde o botão de confirmar
                    const editBtn = document.querySelector(`#editButton-${index}`);
                    editBtn.style.display = 'inline'; // Mostra o botão de editar novamente
                    localStorage.setItem('savedModels', JSON.stringify(savedModels)); // Atualiza o localStorage
                }
            });

        }

        document.getElementById('OpenCommand').addEventListener('click', function () {
            if (!document.getElementById('content_mass_comands')) {
                openComand();
            }
        });
        document.getElementById('showComandos').addEventListener('click', function () {
            updateTable();
        });
        document.getElementById('BTNApagarComandos').addEventListener('click', function () {
            localStorage.removeItem('savedModels');
            UI.InfoMessage('Agendamentos Apagados com sucesso!');
        });

        function openComand() {
            let $Html10 = `<div id="content_mass_comands" class="vis"  style="width: 100%; border-collapse: margin: 5px; border: 0px"><h4>Agendamento em Massa</h4><tr><td>
    <div class="vis" style="margin: 5px;"><table class="vis" style="width: 100%; border-collapse: margin-top: 2px; border: 0px solid rgb(125, 81, 15);"><tbody> <tr><td class="nowrap">
    <a href="#" class="unit_link" data-unit="spear"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_spear.png" class="" data-title="Lanceiro"></a>
    <input id="unit_input_spear_massa" name="spear" type="checkbox" data-all-count="0" readonly=""></td><td class="nowrap">
    <a href="#" class="unit_link" data-unit="sword"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_sword.png" class="" data-title="Espadachim"></a>
    <input id="unit_input_sword_massa" name="sword" type="checkbox" data-all-count="0" readonly="">                        </td>                        <td class="nowrap">
    <a href="#" class="unit_link" data-unit="axe"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_axe.png" class="" data-title="Bárbaro"></a>
    <input id="unit_input_axe_massa" name="axe" type="checkbox" data-all-count="0" readonly="">                        </td>
    ${hasArcher ? '<td class="nowrap"><a href="#" class="unit_link" data-unit="archer"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_archer.png" class="" data-title="Arqueiro"></a><input id="unit_input_archer_massa" name="archer" type="checkbox" data-all-count="0" readonly=""></td>' : ''}
    <td class="nowrap">
    <a href="#" class="unit_link" data-unit="spy"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_spy.png" class="" data-title="Explorador"></a>
    <input id="unit_input_spy_massa" name="spy" type="checkbox" data-all-count="0" readonly="">					 </td>					 <td class="nowrap">
    <a href="#" class="unit_link" data-unit="light"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_light.png" class="" data-title="Cavalaria leve"></a>
    <input id="unit_input_light_massa" name="light" type="checkbox" data-all-count="0" readonly="">					 </td>
    ${hasArcher ? '<td class="nowrap"><a href="#" class="unit_link" data-unit="marcher"><img src="https://dsbr.innogamescdn.com/asset/c1748d3c/graphic/unit/unit_marcher.png" class="" data-title="Arqueiro a Cavalo"></a><input id="unit_input_marcher_massa" name="marcher" type="checkbox" data-all-count="0" readonly=""></td>' : ''}
    <td class="nowrap"><a href="#" class="unit_link" data-unit="heavy"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_heavy.png" class="" data-title="Cavalaria pesada"></a><input id="unit_input_heavy_massa" name="heavy" type="checkbox" data-all-count="0" readonly=""></td>
    <td class="nowrap"><a href="#" class="unit_link" data-unit="ram"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_ram.png" class="" data-title="Aríete"></a>
    <input id="unit_input_ram_massa" name="ram" type="checkbox" data-all-count="0" readonly="">                    </td>                    <td class="nowrap">
    <a href="#" class="unit_link" data-unit="catapult"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_catapult.png" class="" data-title="Catapulta"></a>
    <input id="unit_input_catapult_massa" name="catapult" type="checkbox" data-all-count="0" readonly="">                    </td>                    <td class="nowrap">
    <a href="#" class="unit_link" data-unit="knight"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_knight.png" class="" data-title="Paladino"></a>
    <input id="unit_input_knight_massa" name="knight" type="checkbox" data-all-count="0" readonly="">                    </td>                    <td class="nowrap">
    <a href="#" class="unit_link" data-unit="snob"><img src="https://dsbr.innogamescdn.com/asset/fd86cac8/graphic/unit/unit_snob.png" class="" data-title="Nobre"></a>
    <input id="unit_input_snob_massa" name="snob" type="checkbox" data-all-count="0" readonly=""></td></tr><tr>

    <td class="nowrap"><input id="unit_input_spear_massa_nro" name="spear" type="text" value="" data-all-count="0" style="width : 90%;"></td>
    <td class="nowrap"><input id="unit_input_sword_massa_nro" name="sword" type="text" value="" data-all-count="0" style="width : 90%;"></td>
    <td class="nowrap"><input id="unit_input_axe_massa_nro" name="axe" type="text" value="" data-all-count="0" style="width : 90%;"></td>
    ${hasArcher ? '<td class="nowrap"><input id="unit_input_archer_massa_nro" name="archer" type="text" value="" data-all-count="0" style="width : 90%;"></td>' : ''}
    <td class="nowrap"><input id="unit_input_spy_massa_nro" name="spy" type="text" value="" data-all-count="0" style="width : 90%;"></td>
    <td class="nowrap"><input id="unit_input_light_massa_nro" name="light" type="text" value="" data-all-count="0" style="width : 90%;"></td>
    ${hasArcher ? '<td class="nowrap"><input id="unit_input_marcher_massa_nro" name="marcher" type="text" value="" data-all-count="0" style="width : 90%;"></td>' : ''}
    <td class="nowrap"><input id="unit_input_heavy_massa_nro" name="heavy" type="text" value="" data-all-count="0" style="width : 90%;"></td>
    <td class="nowrap"><input id="unit_input_ram_massa_nro" name="ram" type="text" value="" data-all-count="0" style="width : 90%;"></td>
    <td class="nowrap"><input id="unit_input_catapult_massa_nro" name="catapult" type="text" value="" data-all-count="0" style="width : 90%;"></td>
    <td class="nowrap"><input id="unit_input_knight_massa_nro" name="knight" type="text" value="" data-all-count="0" style="width : 90%;"></td>
    <td class="nowrap"><input id="unit_input_snob_massa_nro" name="snob" type="text" value="" data-all-count="0" style="width : 90%;"></td>
    </tr>
    </tbody></table>
                            <tr>
                                <td colspan="12" style="display: flex; align-items: center; gap: 20px;">
                                    <div style="display: flex; align-items: center;">
                                        <span>Alvo das Catapultas: </span>
                                        <select id="alvoCatapaMassa" style="font-size: 9pt; margin-left: 5px;">
                                            <option value="padrao">Padrão</option>
                                            <option value="main">Edifício principal</option>
                                            <option value="barracks">Quartel</option>
                                            <option value="stable">Estábulo</option>
                                            <option value="garage">Oficina</option>
                                            <option value="watchtower">Torre de vigia</option>
                                            <option value="snob">Academia</option>
                                            <option value="smith">Ferreiro</option>
                                            <option value="place">Praça de reunião</option>
                                            <option value="statue">Estátua</option>
                                            <option value="market">Mercado</option>
                                            <option value="wood">Bosque</option>
                                            <option value="stone">Poço de argila</option>
                                            <option value="iron">Mina de ferro</option>
                                            <option value="farm">Fazenda</option>
                                            <option value="storage">Armazém</option>
                                            <option value="wall">Muralha</option>
                                        </select>
                                    </div></tr>
                                    <tr><div style="display: flex; align-items: center;">
                                        <span>Modelo de NT: </span>
                                        <div class="tooltipDiv" style="margin-left: 5px;">
                                            <select id="NTtypeABC" style="font-size: 9pt;">
                                                <option value="0">SEM NT</option>
                                                <option value="1">NT CANCEL</option>
                                                <option value="2">NT 2</option>
                                                <option value="3">NT 3</option>
                                                <option value="4">NT 4</option>
                                                <option value="5">NT 5</option>
                                            </select>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
                    </table>
                </div>
                <!-- Grupos, coordenadas e opções -->
                <div class="vis" style="margin: 5px;">
                    <div style="margin: 10px;">
                        <span>Grupo de Origem</span>
                        <span id="group" style="font-size: 9pt;"></span>
                        <button type="button" id="botaoGrupoBuscaCoordenada" class="support btn btn-target-action">Importar Coordenadas</button>
                        <br><br>
                        <span>Coordenadas Origem</span>
                        <textarea id="CoordenadasOrigem" rows="6" style="width: 99%;"></textarea>
                        <br>
                        <button type="button" id="botaoRemoveCoordenadaOrigemUtilizadas" class="support btn btn-target-action">Organizar e Remove Coordenadas Já Utilizadas</button>
                        <input id="NroOrigens" readonly="" style="float: right; width: 40px;">
                        <span style="float: right; margin-right: 5px;">Nro de Origem:</span>
                        <br><br>
                        <span>Nro de Origem por Destino:</span>
                        <input id="NroOrigensPorAlvo" style="width: 40px;">
                        <br><br>
                        <div style="margin-bottom: 5px;">
                            <span>Definição de Origens por Destinos: </span>
                            <select id="defOrigemDestino" style="font-size: 9pt;">
                                <option value="P">Priorizar Mais Próximas</option>
                                <option value="D">Priorizar Mais Distantes</option>
                            </select>
                        </div>
                        <br>
                        <span>Coordenadas Destino</span>
                        <textarea id="CoordenadasDestino" rows="6" style="width: 99%;"></textarea>
                        <button type="button" id="botaoRemoveCoordenadaDestinoUtilizadas" class="support btn btn-target-action">Organizar e Remove Coordenadas Já Utilizadas</button>
                        <input id="NroDestinos" readonly="" style="float: right; width: 40px;">
                        <span style="float: right; margin-right: 5px;">Nro de Destinos:</span>
                        <br><br>
                        <div style="margin-bottom: 5px;">
                            <span>Modalidade de Cadastro: </span>
                            <select id="ModEnvioMassa" style="font-size: 9pt;">
                                <option value="0">Programado</option>
                                <option value="1">Programação Aleatória</option>
                            </select>
                        </div>
                        <div>
                            <span name="envioProgramado">Horario de Chegada</span>
                            <input name="envioProgramado" type="datetime-local" id="CStimeMassa" step=".001">
                            <span name="envioProgramadoAleatorio" style="display: none;">Até </span>
                            <input name="envioProgramadoAleatorio" style="display: none;" type="datetime-local" id="CStimeMassaAte" step=".001">
                        </div>
                        <div>
                            <input type="checkbox" id="EnvioMesmoBN" name="EnvioMesmoBN"><label for="EnvioMesmoBN">Enviar Mesmo se Comando Bater no BN</label>
                        </div>
                        <div>
                            <input type="checkbox" id="EnvioMesmoSemTempo" name="EnvioMesmoSemTempo"><label for="EnvioMesmoSemTempo">Enviar Mesmo que Comando não chegue mais a Tempo</label>
                        </div>
                        <div>
                            <input type="checkbox" id="CadastroComErro" name="CadastroComErro"><label for="CadastroComErro">Agendar Comandos em Massa mesmo que algum Comando esteja com Problema</label>
                        </div>
                    </div>
                        <div style="margin-top: 10px;">
                        <button type="button" id="agendarEmMassaConfirmAtaque" class="attack btn btn-attack btn-target-action" style="margin-bottom:5px;">Confirmar Ataque Em Massa</button>
                        <button type="button" id="agendarEmMassaConfirmApoio" class="support btn btn-support btn-target-action" style="margin-bottom:5px;">Confirmar Apoio Em Massa</button>
                    </div>
                </div>
                <style>
                    .tooltipDiv .tooltiptext {
                        visibility: hidden;
                        width: 200px;
                        background-color: black;
                        color: #fff;
                        text-align: center;
                        border-radius: 6px;
                        padding: 5px;
                        position: absolute;
                        z-index: 1;
                        top: 100%;
                        left: 50%;
                        transform: translateX(-50%);
                        opacity: 0;
                        transition: opacity 0.3s;
                    }
                    .tooltipDiv:hover .tooltiptext {
                        visibility: visible;
                        opacity: 1;
                    }
                </style>
            </div>
            `;
            // Adiciona o HTML antes de cada elemento 'menu-item'
            document.getElementById('contentContainer').insertAdjacentHTML('afterend', $Html10);

            //organizando proprios grupos na area origem
            async function fetchVillageGroups() {
                try {
                    const villageGroups = await jQuery.get(
                        game_data.link_base_pure +
                        'groups&mode=overview&ajax=load_group_menu'
                    );
                    return villageGroups;
                } catch (error) {
                    UI.ErrorMessage('Error fetching village groups!');
                    return null; // Retorno padrão caso ocorra um erro
                }
            }

            async function renderGroupsFilter() {
                const groups = await fetchVillageGroups();
                if (!groups || !groups.result) {
                    return ''; // Retornar uma string vazia se não houver grupos válidos
                }

                let selected_Group = localStorage.getItem('selected_groupoo') || 0;
                selected_Group = parseInt(selected_Group); // Converter para número inteiro

                let groupsFilter = `
        <select id="raGroupsFilter1">`;

                for (const [_, group] of Object.entries(groups.result)) {
                    const { group_id, name } = group;
                    const isSelected = parseInt(group_id) === selected_Group ? 'selected' : '';
                    if (name !== undefined) {
                        groupsFilter += `<option value="${group_id}" ${isSelected}>${name}</option>`;
                    }
                }

                groupsFilter += `</select>`;

                return groupsFilter;
            }

// Função para atualizar a div com id "group"
async function updateGroupFilter() {
    const groupDiv = document.getElementById('group');
    if (!groupDiv) {
        console.error('Div "group" não encontrada.');
        return;
    }

    const groupsFilter = await renderGroupsFilter();
    if (!groupsFilter) {
        console.error('Erro ao renderizar o filtro de grupos.');
        return;
    }

    groupDiv.innerHTML = groupsFilter;
}

updateGroupFilter();

// carregar aldeias no textarea
function fetchAndSaveVillagesData(selected_Group) {
    const url = game_data.link_base_pure + 'groups&ajax=load_villages_from_group';
    const group_id = selected_Group;

    return new Promise((resolve, reject) => {
        jQuery.post({
            url: url,
            data: { group_id: group_id },
            success: function (response) {
                const parser = new DOMParser();
                const htmlDoc = parser.parseFromString(response.html, 'text/html');
                const tableRows = jQuery(htmlDoc).find('#group_table > tbody > tr').not(':eq(0)');

                let villagesList = [];

                tableRows.each(function (index) {
                    const villageId = parseInt(jQuery(this).find('td:eq(0) a').attr('data-village-id') ?? jQuery(this).find('td:eq(0) a').attr('href').match(/\d+/)[0]);
                    const villageName = jQuery(this).find('td:eq(0)').text().trim();
                    const villageCoords = jQuery(this).find('td:eq(1)').text().trim();

                    villagesList.push({ id: villageId, name: villageName, coords: villageCoords });
                });

                resolve(villagesList); // Resolve a promessa com a lista de aldeias
            },
            error: function (error) {
                console.error('Erro ao buscar dados das aldeias:', error);
                reject(error); // Rejeita a promessa em caso de erro
            }
        });
    });
}

document.getElementById('botaoGrupoBuscaCoordenada').addEventListener('click', function () {
    const selectedGroupValue = document.getElementById('raGroupsFilter1').value;
    fetchAndSaveVillagesData(selectedGroupValue)
        .then(villages => {
            const textarea = document.getElementById('CoordenadasOrigem');
            const coordsToIDOrigem = {};

            textarea.value = villages.map(v => {
                coordsToIDOrigem[v.coords] = v.id;  // salva coord → id
                return v.coords;
            }).join(' ');

            // Salva mapa no localStorage
            localStorage.setItem('coordenadasOrigem', JSON.stringify(coordsToIDOrigem));
            console.log('coordenadasOrigem salvas:', coordsToIDOrigem);

            const totalC = villages.length;
            document.getElementById('NroOrigens').value = totalC;
        })
        .catch(error => {
            console.error('Erro ao processar as aldeias:', error);
        });
});

// organizando coordenadas coladas na area origem
document.getElementById('botaoRemoveCoordenadaOrigemUtilizadas').addEventListener('click', function () {
    const inputText = document.getElementById('CoordenadasOrigem').value;
    const savedModels = JSON.parse(localStorage.getItem('savedModels')) || []; // Recupera os modelos salvos do localStorage

    // Regex para encontrar os pares no formato 123|456
    const regex = /\b(\d{3})\|(\d{3})\b/g;
    const matches = [];
    let match;

    // Loop para encontrar todas as coordenadas no input
    while ((match = regex.exec(inputText)) !== null) {
        matches.push(`${match[1]}|${match[2]}`);
    }

    // Extração das coordenadas em CTo e CFrom dos itens do localStorage
    const savedCoordinates = [];
    savedModels.forEach(model => {
        if (model.CTo) {
            savedCoordinates.push(model.CTo);
        }
        if (model.CFrom) {
            savedCoordinates.push(model.CFrom);
        }
    });

    // Filtrar coordenadas que não estão nas coordenadas salvas
    const filteredMatches = matches.filter(coord => !savedCoordinates.includes(coord));

    // Atualizar o campo de texto com as coordenadas restantes
    const outputText = filteredMatches.join(' ');
    document.getElementById('CoordenadasOrigem').value = outputText;

    // Atualizar o total de coordenadas restantes
    const totalC = filteredMatches.length;
    document.getElementById('NroOrigens').value = totalC;
});

document.getElementById('botaoRemoveCoordenadaDestinoUtilizadas').addEventListener('click', async function () {
    const inputText = document.getElementById('CoordenadasDestino').value;

    // Regex para encontrar os pares no formato 123|456
    const regex = /\b(\d{3})\|(\d{3})\b/g;
    const matches = [];
    let match;

    // Loop para encontrar todas as coordenadas no input
    while ((match = regex.exec(inputText)) !== null) {
        matches.push(`${match[1]}|${match[2]}`);
    }

    // Extração das coordenadas em CTo e CFrom dos itens do localStorage
    const savedModels = JSON.parse(localStorage.getItem('savedModels')) || [];
    const savedCoordinates = [];
    savedModels.forEach(model => {
        if (model.CTo) savedCoordinates.push(model.CTo);
        if (model.CFrom) savedCoordinates.push(model.CFrom);
    });

    // Filtrar coordenadas que não estão nas coordenadas salvas
    const filteredMatches = matches.filter(coord => !savedCoordinates.includes(coord));

    // Atualizar o campo de texto com as coordenadas restantes
    const outputText = filteredMatches.join(' ');
    document.getElementById('CoordenadasDestino').value = outputText;

    // Atualizar o total de coordenadas restantes
    document.getElementById('NroDestinos').value = filteredMatches.length;

    // Criar objeto coord => id para as coordenadas destino, buscando no /map/village.txt se necessário
    const destinoMap = {};
    for (const coord of filteredMatches) {
        let id = null;
        // Procura no savedModels
        const model = savedModels.find(m => m.CTo === coord || m.CFrom === coord);
        if (model && model.link) {
            const match = model.link.match(/target=(\d+)/);
            if (match) {
                id = match[1];
            }
        }
        if (!id) {
            // Busca no /map/village.txt
            const [x, y] = coord.split('|');
            try {
                const response = await fetch(`/map/village.txt`, { cache: "no-store" });
                const text = await response.text();
                const villages = text.split('\n').map(line => line.split(','));
                const villageData = villages.find(v => v[2] === x && v[3] === y);
                id = villageData ? villageData[0] : null;
                if (!id) alert('Coordenadas inválidas: ' + coord);
            } catch (e) {
                alert('Erro ao buscar dados da vila');
                id = null;
            }
        }
        destinoMap[coord] = id;
    }

    // Salva no localStorage
    localStorage.setItem('coordenadasDestino', JSON.stringify(destinoMap));
    console.log('coordenadasDestino salvas no localStorage:', destinoMap);
});

            // displays nones
            document.getElementById('ModEnvioMassa').addEventListener('change', function () {
                const spanAleatorio = document.querySelector('span[name="envioProgramadoAleatorio"]');
                const inputAleatorio = document.querySelector('input[name="envioProgramadoAleatorio"]');

                if (this.value === '1') {
                    spanAleatorio.style.display = 'inline';
                    inputAleatorio.style.display = 'inline';
                } else {
                    spanAleatorio.style.display = 'none';
                    inputAleatorio.style.display = 'none';
                }
            });

            // match calc
            function distanceM(coordinateOrigem, coordinatedestine) {
                let [x1, y1] = coordinateOrigem.split('|').map(Number);
                let [x2, y2] = coordinatedestine.split('|').map(Number);
                const deltaX = Math.abs(x1 - x2);
                const deltaY = Math.abs(y1 - y2);
                return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            }

            function RequestUnitsM() {

                const fromValues = document.getElementById("CoordenadasOrigem").value.trim().split(" ");
                const toValues = document.getElementById("CoordenadasDestino").value.trim().split(" ");
                const limit = parseInt(document.getElementById("NroOrigensPorAlvo").value) || 1;
                let xx = 0;

                function gerar(coordinateOrigem, coordinatedestine, distance) {
                    const selectedUnits = [];
                    return $.get('/interface.php?func=get_unit_info').then(function ($xml) {
                        const units = {};
                        const unitsMassa = [
                            'unit_input_spear_massa_nro',
                            'unit_input_sword_massa_nro',
                            'unit_input_axe_massa_nro',
                            'unit_input_archer_massa_nro',
                            'unit_input_spy_massa_nro',
                            'unit_input_light_massa_nro',
                            'unit_input_marcher_massa_nro',
                            'unit_input_heavy_massa_nro',
                            'unit_input_ram_massa_nro',
                            'unit_input_catapult_massa_nro',
                            'unit_input_knight_massa_nro',
                            'unit_input_snob_massa_nro',
                        ];

                        for (let i = 0; i < unitsMassa.length; i++) {
                            const inputElement = document.getElementById(unitsMassa[i]);
                            if (!inputElement) continue;
                            const unitName = inputElement.name;
                            const inputValue = inputElement.value || 0;
                            const checkbox = document.getElementById(`unit_input_${unitName}_massa`);

                            if (!unitName || !checkbox) continue;

                            if (!checkbox.checked) {
                                selectedUnits.push({ unitName, inputValue });
                            } else {
                                selectedUnits.push({ unitName, inputValue: 'all' });
                            }
                        }

                        // Processa o XML e calcula unitTime para as unidades
                        $($xml).find('config').children().each(function () {
                            const unitName = this.tagName;
                            const speed = Number($(this).find('speed').text());
                            const unitTime = distance * speed * 60000;

                            // Armazena o unitTime e a unidade, se ela estiver selecionada
                            if (selectedUnits.some(unit => unit.unitName === unitName && unit.inputValue != 0)) {
                                units[unitName] = {
                                    speed: speed,
                                    unitTime: unitTime
                                };
                            }
                        });

                        // Encontra a unidade com o maior unitTime
                        let maxUnitTime = -1;
                        let maxUnitName = '';

                        function convertToInput(date) {
                            const ano = date.getFullYear();
                            const mes = String(date.getMonth() + 1).padStart(2, '0');
                            const dia = String(date.getDate()).padStart(2, '0');
                            const horas = String(date.getHours()).padStart(2, '0');
                            const minutos = String(date.getMinutes()).padStart(2, '0');
                            const segundos = String(date.getSeconds()).padStart(2, '0');
                            const milissegundos = String(date.getMilliseconds()).padStart(3, '0');
                            return `${ano}-${mes}-${dia}T${horas}:${minutos}:${segundos}.${milissegundos}`;
                        }

                        function formatTime(unitTime) {
                            const totalSeconds = Math.floor(unitTime / 1000).toString().padStart(2, '0'); // Converte milissegundos para segundos
                            const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
                            const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
                            const seconds = (totalSeconds % 60).toString().padStart(2, '0');

                            return `${hours}:${minutes}:${seconds}`; // Formata como string
                        }

                        // monta o link do agendamento em massa
                        // Busca os mapas de coordenadas para id
                        let coordsToIDOrigem = JSON.parse(localStorage.getItem('coordenadasOrigem')) || {};
                        let coordsToIDDestino = JSON.parse(localStorage.getItem('coordenadasDestino')) || {};
                        let origemId = coordsToIDOrigem[coordinateOrigem];
                        let destinoId = coordsToIDDestino[coordinatedestine];

                        // fallback: se não achar no mapa, tenta buscar no localStorage geral
                        if (!origemId) {
                            let coordsToID = JSON.parse(localStorage.getItem(`coordsToID_${game_data.world}`)) || {};
                            origemId = coordsToID[coordinateOrigem];
                        }
                        if (!destinoId) {
                            let coordsToID = JSON.parse(localStorage.getItem(`coordsToID_${game_data.world}`)) || {};
                            destinoId = coordsToID[coordinatedestine];
                        }

                        // monta o link no formato do exemplo
                        let link = `https://${game_data.world}.tribalwars.com.br/game.php?village=${origemId}&screen=place&target=${destinoId}`;


                        // Verifica as unidades selecionadas
                        for (const unit of selectedUnits) {
                            const unitData = units[unit.unitName];
                            if (unitData && unitData.unitTime > maxUnitTime) {
                                maxUnitTime = unitData.unitTime;
                                maxUnitName = unit.unitName;
                            }
                        }

                        let nome = localStorage.getItem('Nome');
                        let Dsaida;
                        let Dchegada = document.getElementById('CStimeMassa').value;
                        let DchegadaF = document.getElementById('CStimeMassaAte').value;
                        let CFrom = coordinateOrigem;
                        let CTo = coordinatedestine;
                        let AlvCat = document.getElementById('alvoCatapaMassa').value || 'padrao';
                        let NtType = localStorage.getItem('NtType') || '0'; // Usa o valor salvo corretamente

                        // Verifica se é NT válido (pode adaptar conforme seus critérios)
                        let isNT = false;
                        if (nome === 'Atak' && NtType !== '0' && NtType.trim().toLowerCase() !== 'sem nt') {
                            isNT = true;
                            console.log('Comando NT detectado');
                        } else {
                            console.log('Comando sem NT');
                        }

                        // Obtém a data inserida no input
                        const inputDate = Dchegada;
                        const arrivalTime = new Date(inputDate);
                        const timeToSubtract = (maxUnitTime / 1000); // tempo a ser subtraído em milissegundos
                        // Subtraindo os milissegundos
                        arrivalTime.setSeconds(arrivalTime.getSeconds() - timeToSubtract);
                        // Convertendo a data formatada após a subtração
                        const formattedDate = convertToInput(arrivalTime);
                        // Subtrai o tempo formatado
                        Dsaida = formattedDate;
                        const CSaida = new Date(Dsaida)
                        console.log('DSaida: ', CSaida);
                        if (CSaida > new Date()) {
                            // Recupera os dados existentes do localStorage
                            let savedModels = JSON.parse(localStorage.getItem('savedModels')) || [];
                            let selectedData = {

                                nome: localStorage.getItem('Nome'),
                                CFrom,
                                CTo,
                                link,
                                units: selectedUnits,
                                Dsaida,
                                Dchegada,
                                NtType,
                                AlvCat,
                                type: localStorage.getItem('tipoAgendamento') || 'attack'
                                // <- ESSA LINHA
                            };
                            // Aqui você trata o tipo
                            if (selectedData.NtType === '0') {
                                console.log("SEM NT");
                            } else {
                                console.log("Com NT (NT CANCEL ou NT 2 a 5)");
                            }
                            // Adiciona o novo modelo
                            // Salva de volta no localStorage
                            savedModels.push(selectedData); // Adiciona apenas se o link for novo
                            localStorage.setItem('savedModels', JSON.stringify(savedModels));
                            // Ordena o array pela data de Dsaida
                            savedModels.sort((a, b) => new Date(a.Dsaida) - new Date(b.Dsaida));
                            console.log('Modelos organizados pela data de saída:', savedModels);

                            mostrarMensagem("Comando agendado com sucesso!", "sucesso");
                            // console.log(`Modelo salvo: ${JSON.stringify(savedModels, null, 2)}` );

                        } else {
                            console.log('Não agendado, sem tempo para enviar')
                        }
                        return units;
                    })
                        .catch(function (error) {
                            console.error('Erro ao obter informações das unidades:', error);
                        });
                }

                for (let cf = 0; cf < toValues.length; cf++) {

                    let coordinatedestine = toValues[cf];

                    for (let ct = 0; ct < limit; ct++) {
                        let coordinateOrigem = fromValues[xx];
                        const distance = distanceM(coordinateOrigem, coordinatedestine);
                        xx++;
                        gerar(coordinateOrigem, coordinatedestine, distance);
                    }
                }

            }

            document.getElementById('agendarEmMassaConfirmAtaque').addEventListener('click', function () {
                localStorage.setItem('Nome', 'Atak');
                const ntType = document.getElementById('NTtypeABC')?.value || '0';
                localStorage.setItem('NtType', ntType);
                localStorage.setItem('tipoAgendamento', ntType !== '0' ? 'nt' : 'attack');
                RequestUnitsM();
            });
            document.getElementById('agendarEmMassaConfirmApoio').addEventListener('click', function () {
                localStorage.setItem('Nome', 'Apoio');
                localStorage.setItem('tipoAgendamento', 'support'); // <- AQUI
                RequestUnitsM();
            });

        }
    }

    if (confirm) {
        const rows = document.querySelectorAll('table.vis tr'); // Seleciona todas as linhas da tabela
        const x = 6; // Número de linhas acima (nesse caso, queremos inserir após a terceira linha)
        const targetRow = rows[x]; // Seleciona a linha desejada (3ª linha)
        const newRow = document.createElement('tr');
        newRow.innerHTML = '<td>Chegada:</td><td colspan="10"><input type="datetime-local" id="CSchegada" step=".001"><button type="button" id="CSbuttonC" class="btn">Confirmar</button></td>'; // Adicione o conteúdo desejado
        targetRow.insertAdjacentElement('afterend', newRow); // Insere a nova linha após a linha alvo

        console.log('Rows', rows, x, targetRow)

        let ntType = 0;
        let unitsNt = [];

        if (window.opener && !window.opener.closed) {
            const savedModels = JSON.parse(localStorage.getItem('savedModels')) || [];

            console.log('SavedModels', savedModels);

            const now = new Date();
            const ChegadaH = savedModels[0].Dchegada;
            const targetCata = savedModels[0].AlvCat;
            ntType = savedModels[0].NtType;
            unitsNt = savedModels[0].unitsNt;

            document.getElementById('CSchegada').value = ChegadaH;
            if (targetCata != 'padrao') {
                document.getElementsByName("building")[0].value = targetCata;
            }
            setTimeout(function () {
                document.getElementById('CSbuttonC').click();
            }, 3000);
        } else {
            function convertToInput(date) {
                const ano = date.getFullYear();
                const mes = String(date.getMonth() + 1).padStart(2, '0');
                const dia = String(date.getDate()).padStart(2, '0');
                const horas = String(date.getHours()).padStart(2, '0');
                const minutos = String(date.getMinutes()).padStart(2, '0');
                const segundos = String(date.getSeconds()).padStart(2, '0');
                const milissegundos = String(date.getMilliseconds()).padStart(3, '0');
                return `${ano}-${mes}-${dia}T${horas}:${minutos}:${segundos}.${milissegundos}`;
            }

            let tt = new Date();
            document.getElementById('CSchegada').value = convertToInput(tt);
        }

        if (ntType !== '0') {
            const btnTrainAtack = document.querySelector("#troop_confirm_train");

            for (let i = 2; i <= ntType; i++) {
                btnTrainAtack.click();
            }


            for (let i = 2; i <= ntType; i++) {
                let spearInput = document.querySelector(`input[name='train[${i}][spear]']`)
                let swordInput = document.querySelector(`input[name='train[${i}][sword]']`)
                let axeInput = document.querySelector(`input[name='train[${i}][axe]']`)
                let spyInput = document.querySelector(`input[name='train[${i}][spy]']`)
                let knightInput = document.querySelector(`input[name='train[${i}][knight]']`)
                let lightInput = document.querySelector(`input[name='train[${i}][light]']`)
                let heavyInput = document.querySelector(`input[name='train[${i}][heavy]']`)
                let ramInput = document.querySelector(`input[name='train[${i}][ram]']`)
                let catapultInput = document.querySelector(`input[name='train[${i}][catapult]']`)
                let snobInput = document.querySelector(`input[name='train[${i}][snob]']`)

                if (hasArcher) {
                    let archerInput = document.querySelector(`input[name='train[${i}][archer]']`)
                    let marcherInput = document.querySelector(`input[name='train[${i}][marcher]']`)

                    archerInput.value = unitsNt[i - 2]?.archer ?? 0;
                    marcherInput.value = unitsNt[i - 2]?.marcher ?? 0;
                }
                spearInput.value = unitsNt[i - 2]?.spear ?? 0;
                swordInput.value = unitsNt[i - 2]?.sword ?? 0;
                axeInput.value = unitsNt[i - 2]?.axe ?? 0;
                spyInput.value = unitsNt[i - 2]?.spy ?? 0;
                knightInput.value = unitsNt[i - 2]?.knight ?? 0;
                lightInput.value = unitsNt[i - 2]?.light ?? 0;
                heavyInput.value = unitsNt[i - 2]?.heavy ?? 0;
                ramInput.value = unitsNt[i - 2]?.ram ?? 0;
                catapultInput.value = unitsNt[i - 2]?.catapult ?? 0;
                snobInput.value = unitsNt[i - 2]?.snob ?? 0;
            }
        }


        document.getElementById('CSbuttonC').addEventListener('click', function () {
            // Seleciona o span que contém a informação da data
            const spanElement = document.querySelector('.relative_time');
            const relativeTime = spanElement.innerText.trim();
            let arrivalDate;

            if (relativeTime.startsWith("hoje")) {
                const timePart = relativeTime.split(" às ")[1];
                const [hours, minutes, seconds] = timePart.split(":").map(Number);
                const now = new Date();
                arrivalDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, seconds);
            } else if (relativeTime.startsWith("amanhã")) {
                const timePart = relativeTime.split(" às ")[1];
                const [hours, minutes, seconds] = timePart.split(":").map(Number);
                const now = new Date();
                arrivalDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, hours, minutes, seconds);
            } else {
                const datePart = relativeTime.replace("em ", "").split(" às ")[0];
                const timePart = relativeTime.split(" às ")[1];
                const [day, month] = datePart.split(".").map(Number);
                const [hours, minutes, seconds] = timePart.split(":").map(Number);
                const now = new Date();
                arrivalDate = new Date(now.getFullYear(), month - 1, day, hours, minutes, seconds);
            }

            const arrivalInput = document.getElementById('CSchegada').value;
            const SFuture = new Date(arrivalInput);

            // Calcula a diferença inicial em milissegundos
            let msDiff = SFuture - arrivalDate;
            msDiff = (msDiff - 1000);
            console.log('Contagem inicial (ms):', msDiff);

            // Função para calcular o ping (latência) e aplicar o multiplicador de Timing Offset
            function measurePing(callback, timingOffsetMultiplier = 1) {
                const startTime = getServerTimestamp(); // Registra o tempo de início da requisição

                // Faz uma requisição simples à própria página
                fetch(window.location.href)
                    .then(() => {
                        const ping = getServerTimestamp() - startTime; // Calcula o tempo de resposta (ping)

                        // Aplica o Timing Offset Multiplier ao ping
                        const adjustedPing = ping * timingOffsetMultiplier;

                        // Chama o callback com o ping ajustado
                        callback(adjustedPing);
                    })
                    .catch(() => {
                        // Em caso de erro, chama o callback com 0 de ping
                        callback(0);
                    });
            }

            // Exemplo de uso com o Timing Offset Multiplier
            measurePing((adjustedPing) => {
                console.log(`Ping ajustado (com multiplicador): ${adjustedPing}ms`);
            }, 0.1); // Aplica um multiplicador de 0.1 (aproximadamente 1.67%. a mais no ping)

            if (msDiff > 0) {
                // Desativa os botões enquanto aguarda
                document.getElementById('CSbuttonC').disabled = true;
                document.getElementById('troop_confirm_submit').disabled = true;
                setTimeout(function () {
                    document.getElementById('troop_confirm_submit').disabled = false;
                    document.getElementById('troop_confirm_submit').click();
                    console.log('foi');
                    return;
                }, msDiff);

                // Captura o tempo inicial de agendamento
                const start = performance.now();

                setTimeout(function () {
                    // Calcula o tempo decorrido e ajusta a execução
                    const elapsed = performance.now() - start;
                    const adjustedMsDiff = msDiff - elapsed;
                    console.log('Tempo decorrido no setTimeout (ms):', elapsed);
                    console.log('Ajuste final (ms):', adjustedMsDiff);

                    if (adjustedMsDiff > 0) {
                        setTimeout(() => {
                            document.getElementById('troop_confirm_submit').disabled = false;
                            document.getElementById('troop_confirm_submit').click();
                            console.log('Comando executado com ajuste fino!');
                        }, adjustedMsDiff);
                    } else {
                        document.getElementById('troop_confirm_submit').disabled = false;
                        document.getElementById('troop_confirm_submit').click();
                        console.error('Erro: Tempo insuficiente após ajuste!');
                    }
                }, msDiff);
            } else {

                // Executa imediatamente caso o tempo já tenha passado
                document.getElementById('troop_confirm_submit').disabled = false;
                document.getElementById('troop_confirm_submit').click();
            }
        });

    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

//======================================================Map===================================================================
(function () {
    if (window.location.href.includes('screen=map')) {
        let savedModels = JSON.parse(localStorage.getItem('savedModels')) || [];

        let destinationCounts = {};
        let originCounts = {};

        // === Função para identificar o tipo de comando ===
        function getCommandType(model) {
            const nome = (model.nome || '').trim().toLowerCase();
            const isSupport = nome === 'apoio';
            const isAttack = nome === 'atak';
            const isNobleAttack = isAttack && model.NtType && model.NtType !== '0';

            if (isSupport) return 'apoio';
            if (isNobleAttack) return 'nt';
            if (isAttack) return 'ataque';

            return 'outro';
        }


        // === Processamento dos modelos salvos ===
        savedModels.forEach((model) => {
            const keyDest = model.CTo;
            const keyOrig = model.CFrom;
            const type = getCommandType(model); // Chama a função para identificar o tipo de comando

            // Inicializa as contagens caso ainda não existam
            if (!destinationCounts[keyDest]) destinationCounts[keyDest] = { axe: 0, spear: 0, snob: 0 };
            if (!originCounts[keyOrig]) originCounts[keyOrig] = { axe: 0, spear: 0, snob: 0 };

            // Incrementa as contagens com base no tipo do comando
            switch (type) {
                case 'apoio':
                    destinationCounts[keyDest].spear++;
                    originCounts[keyOrig].spear++;
                    break;
                case 'nt': // Ataque com nobre
                    destinationCounts[keyDest].snob++;  // Conta como "snob" (nobre)
                    originCounts[keyOrig].snob++;  // Conta como "snob" (nobre)
                    break;
                case 'ataque': // Ataque normal
                    destinationCounts[keyDest].axe++;
                    originCounts[keyOrig].axe++;
                    break;
            }
        });

        // === Funções de desenho no mapa ===
        let mapOverlay = TWMap;
        if (!mapOverlay.mapHandler._spawnSector) {
            mapOverlay.mapHandler._spawnSector = mapOverlay.mapHandler.spawnSector;
        }

        function drawSquare(ctx, x, y, size, fillColor, strokeColor = '#000') {
            const halfSize = size / 2;
            ctx.beginPath();
            ctx.fillStyle = fillColor;
            ctx.strokeStyle = strokeColor;
            ctx.rect(x - halfSize, y - halfSize, size, size);
            ctx.fill();
            ctx.stroke();
            ctx.closePath();
        }

        function drawIconsAndNumbers(ctx, x, y, icons, numbers, styles) {
            const iconSpacing = 20;
            const iconSize = 15;
            const textSize = 10;

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            icons.forEach((icon, index) => {
                const iconX = x - (icons.length - 1) * iconSpacing / 2 + index * iconSpacing;
                const iconY = y + 20;
                const style = styles[index];

                if (style.backgroundColor) {
                    ctx.fillStyle = style.backgroundColor;
                    ctx.fillRect(iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
                }

                if (style.backgroundImage) {
                    const img = new Image();
                    img.onload = () => {
                        ctx.drawImage(img, iconX - iconSize / 2, iconY - iconSize / 2, iconSize, iconSize);
                    };
                    img.src = style.backgroundImage;
                }

                ctx.font = `${textSize}px Arial`;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(numbers[index], iconX, iconY + iconSize);
            });
        }

        function drawMapTowers(canvas, sector) {
            const ctx = canvas.getContext('2d');
            ctx.lineWidth = 2;

            // Desenhando as contagens de destino
            Object.entries(destinationCounts).forEach(([village, counts]) => {
                const [villageX, villageY] = village.split('|').map(Number);
                const wt_pixel = mapOverlay.map.pixelByCoord(villageX, villageY);
                const st_pixel = mapOverlay.map.pixelByCoord(sector.x, sector.y);
                const x = (wt_pixel[0] - st_pixel[0]) + mapOverlay.tileSize[0] / 2;
                const y = (wt_pixel[1] - st_pixel[1]) + mapOverlay.tileSize[1] / 2;
                localStorage.setItem('CTo', village); // Salva a coordenada de destino
                localStorage.setItem('CFrom', sector.x + '|' + sector.y); // Salva a coordenada de origem

                // Desenha o fundo (um quadrado leve)
                drawSquare(ctx, x, y, 0.17 * TWMap.map.scale[0] * 5, 'rgba(255, 0, 0, 0.2)'); //'rgba(100, 0, 255, 0.2)');

                // Desenha os ícones e números, incluindo o ataque com nobre (NT)
                drawIconsAndNumbers(ctx, x, y, ['Icon1', 'Icon2', 'Icon3'], [counts.axe, counts.spear, counts.snob], [
                    { backgroundColor: 'rgb(255, 0, 0)', backgroundImage: '/graphic/unit_map/axe.png' },
                    { backgroundColor: 'rgb(0, 255, 0)', backgroundImage: '/graphic/unit_map/spear.png' },
                    { backgroundColor: 'rgb(0, 254, 254)', backgroundImage: '/graphic/unit_map/snob.png' }  // Ícone para ataque com nobre
                ]);
            });

            // Desenhando as contagens de origem
            Object.entries(originCounts).forEach(([village, counts]) => {
                const [villageX, villageY] = village.split('|').map(Number);
                const wt_pixel = mapOverlay.map.pixelByCoord(villageX, villageY);
                const st_pixel = mapOverlay.map.pixelByCoord(sector.x, sector.y);
                const x = (wt_pixel[0] - st_pixel[0]) + mapOverlay.tileSize[0] / 2;
                const y = (wt_pixel[1] - st_pixel[1]) + mapOverlay.tileSize[1] / 2;

                // Desenha o fundo (um quadrado leve)
                drawSquare(ctx, x, y, 0.17 * TWMap.map.scale[0] * 5, 'rgba(0, 0, 255, 0.2)');

                // Desenha os ícones e números, incluindo o ataque com nobre (NT)
                drawIconsAndNumbers(ctx, x, y, ['Icon1', 'Icon2', 'Icon3'], [counts.axe, counts.spear, counts.snob], [
                    { backgroundColor: 'rgb(255, 0, 0)', backgroundImage: '/graphic/unit_map/axe.png' },
                    { backgroundColor: 'rgb(0, 255, 0)', backgroundImage: '/graphic/unit_map/spear.png' },
                    { backgroundColor: 'rgb(0, 254, 254)', backgroundImage: '/graphic/unit_map/snob.png' }  // Ícone para ataque com nobre
                ]);
            });
        }

        // Função modificada para adicionar as sobreposições no mapa
        mapOverlay.mapHandler.spawnSector = function (data, sector) {
            mapOverlay.mapHandler._spawnSector(data, sector);

            const beginX = sector.x - data.x;
            const endX = beginX + mapOverlay.mapSubSectorSize;
            const beginY = sector.y - data.y;
            const endY = beginY + mapOverlay.mapSubSectorSize;

            Object.keys(data.tiles).forEach((x) => {
                x = parseInt(x, 10);
                if (x < beginX || x >= endX) return;

                Object.keys(data.tiles[x]).forEach((y) => {
                    y = parseInt(y, 10);
                    if (y < beginY || y >= endY) return;

                    const v = mapOverlay.villages[(data.x + x) * 1000 + (data.y + y)];
                    if (v) {
                        let el = document.getElementById(`mapOverlay_canvas_${sector.x}_${sector.y}`);
                        if (!el) {
                            const canvas = document.createElement('canvas');
                            canvas.style.position = 'absolute';
                            canvas.width = mapOverlay.map.scale[0] * mapOverlay.map.sectorSize;
                            canvas.height = mapOverlay.map.scale[1] * mapOverlay.map.sectorSize;
                            canvas.style.zIndex = 10;
                            canvas.className = 'mapOverlay_map_canvas';
                            canvas.id = `mapOverlay_canvas_${sector.x}_${sector.y}`;

                            sector.appendElement(canvas, 0, 0);
                            drawMapTowers(canvas, sector);
                        }
                    }
                });
            });
        };
        mapOverlay.reload();
    }
})();


//==================================================== Script audio ==============================================================================

(function () {
    if (window.location.href.includes('screen=audio')) {
        const audio = document.querySelector('audio');
        if (audio) {
            audio.volume = 0.1; // Define o volume para 10%
            console.log('Volume do áudio ajustado para 10%');
        } else {
            console.error('Elemento de áudio não encontrado na página.');
        }
    }
})();
