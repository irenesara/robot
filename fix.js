const fs = require('fs');

let content = fs.readFileSync('index.html', 'utf-8');

const oldMenu = `<div class="dropdown-item" onclick="setFontSize('small')">FONT SIZE SMALL</div>
                            <div class="dropdown-item" onclick="setFontSize('medium')">FONT SIZE MEDIUM</div>
                            <div class="dropdown-item" onclick="setFontSize('large')">FONT SIZE LARGE</div>
                            <div class="dropdown-item" onclick="toggleRobotInfo()">HIDE ROBOT INFO</div>
                            <div class="dropdown-item" onclick="toggleLcdBrightness()">LCD BRIGHT: 100%</div>
                            <div class="dropdown-item" onclick="resetLayout()">RESET LAYOUT</div>`;

const newMenu = `<div class="dropdown-item" onclick="displaySetupChangeFont()">CHANGE FONT<br><span style="font-size:5px;color:#666;">Operation</span></div>
                            <div class="dropdown-item" onclick="displaySetupChangeButton()">CHANGE BUTTON<br><span style="font-size:5px;color:#666;">Operation</span></div>
                            <div class="dropdown-item" onclick="displaySetupInitializeLayout()">INITIALIZE LAYOUT<br><span style="font-size:5px;color:#666;">Operation</span></div>
                            <div class="dropdown-item" onclick="displaySetupChangeWindowPattern()">CHANGE WINDOW PATTERN<br><span style="font-size:5px;color:#666;">Operation</span></div>`;

content = content.replace(oldMenu, newMenu);

const insertPos = content.indexOf('function setFontSize(level) {');

const newFunctions = `function displaySetupChangeFont() {
    const sizes = ['PEQUEÑA', 'MEDIANA', 'GRANDE'];
    const currentIdx = (DxState.fontIdx || 1);
    const newIdx = (currentIdx + 1) % sizes.length;
    DxState.fontIdx = newIdx;
    const newSize = sizes[newIdx];
    const sizeMap = { 'PEQUEÑA': '6px', 'MEDIANA': '8px', 'GRANDE': '10px' };
    document.querySelectorAll('.lcd-main').forEach(el => el.style.fontSize = sizeMap[newSize]);
    setInfoDisplay(\`✓ CHANGE FONT: \${newSize}\`);
}

function displaySetupChangeButton() {
    setInfoDisplay('✓ CHANGE BUTTON: Botones configurados');
}

function displaySetupInitializeLayout() {
    const dialog = document.getElementById('home-confirm-dialog');
    if (!dialog) return;
    dialog.style.display = 'flex';
    dialog.innerHTML = \`
        <div style="font-size: 11px; font-weight: bold; margin-bottom: 12px; color: #a00;">⚠ INITIALIZE LAYOUT ?</div>
        <div style="font-size: 8px; color: #000; margin-bottom: 8px; text-align: center; line-height: 1.3;">
            <div>Se restaurará la configuración de pantalla</div>
            <div>a valores de fábrica.</div>
            <div style="font-size: 6px; color: #666; margin-top: 4px;">Las personalizaciones se PERDERÁN.</div>
        </div>
        <div style="display: flex; gap: 30px;">
            <button onclick="resetLayout();document.getElementById('home-confirm-dialog').style.display='none';setInfoDisplay('✓ INITIALIZE LAYOUT: Restaurado');toggleDropdown('display-dropdown');" style="padding: 2px 14px; border: 1px solid #000; background: #e0e0e0; font-family: 'Courier New', Courier, monospace; font-weight: bold; cursor: pointer; font-size: 10px; box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 #aaa;">YES</button>
            <button onclick="document.getElementById('home-confirm-dialog').style.display='none';toggleDropdown('display-dropdown');" style="padding: 2px 14px; border: 1px solid #000; background: #e0e0e0; font-family: 'Courier New', Courier, monospace; font-weight: bold; cursor: pointer; font-size: 10px; box-shadow: inset 1px 1px 0 #fff, inset -1px -1px 0 #aaa; outline: 1px dotted #000; outline-offset: -2px;">NO</button>
        </div>
    \`;
}

function displaySetupChangeWindowPattern() {
    setInfoDisplay('✓ CHANGE WINDOW PATTERN: Patrón aplicado');
}

`;

if (insertPos !== -1) {
    content = content.substring(0, insertPos) + newFunctions + content.substring(insertPos);
}

const scopeInsert = content.indexOf('window.setFontSize = setFontSize;');
if (scopeInsert !== -1) {
    const scopeNew = 'window.displaySetupChangeFont = displaySetupChangeFont;\nwindow.displaySetupChangeButton = displaySetupChangeButton;\nwindow.displaySetupInitializeLayout = displaySetupInitializeLayout;\nwindow.displaySetupChangeWindowPattern = displaySetupChangeWindowPattern;\nwindow.setFontSize = setFontSize;';
    content = content.substring(0, scopeInsert) + scopeNew + content.substring(scopeInsert + 'window.setFontSize = setFontSize;'.length);
}

fs.writeFileSync('index.html', content, 'utf-8');
console.log('OK');
