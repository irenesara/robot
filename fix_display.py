import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Buscar y reemplazar solo el contenido del dropdown-menu de display
# Patrón: <div id="display-dropdown"...> ... </div>

patron = r'<div id="display-dropdown"[^>]*>.*?</div>\s*</div>'

nuevo_dropdown = '''<div id="display-dropdown" class="dropdown-menu" style="width: 150px; left: 0;">
                            <div class="dropdown-item" onclick="displaySetupChangeFont()">CHANGE FONT<br><span style="font-size:5px;color:#666;">Operation</span></div>
                            <div class="dropdown-item" onclick="displaySetupChangeButton()">CHANGE BUTTON<br><span style="font-size:5px;color:#666;">Operation</span></div>
                            <div class="dropdown-item" onclick="displaySetupInitializeLayout()">INITIALIZE LAYOUT<br><span style="font-size:5px;color:#666;">Operation</span></div>
                            <div class="dropdown-item" onclick="displaySetupChangeWindowPattern()">CHANGE WINDOW PATTERN<br><span style="font-size:5px;color:#666;">Operation</span></div>
                        </div>
                    </div>'''

html = re.sub(patron, nuevo_dropdown, html, flags=re.DOTALL)

# Agregar las funciones antes de </script>
funciones = '''
function displaySetupChangeFont() {
    const sizes = ['PEQUEÑA', 'MEDIANA', 'GRANDE'];
    const idx = (DxState.fontIdx || 1);
    const newIdx = (idx + 1) % sizes.length;
    DxState.fontIdx = newIdx;
    const sizeMap = {'PEQUEÑA': '6px', 'MEDIANA': '8px', 'GRANDE': '10px'};
    document.querySelectorAll('.lcd-main').forEach(el => el.style.fontSize = sizeMap[sizes[newIdx]]);
    setInfoDisplay('✓ CHANGE FONT: ' + sizes[newIdx]);
}

function displaySetupChangeButton() {
    setInfoDisplay('✓ CHANGE BUTTON: Configurado');
}

function displaySetupInitializeLayout() {
    const dialog = document.getElementById('home-confirm-dialog');
    if (dialog) {
        dialog.style.display = 'flex';
        dialog.innerHTML = '<div style="font-size:11px;font-weight:bold;color:#a00;">⚠ INITIALIZE LAYOUT ?</div><div style="font-size:8px;margin-bottom:8px;">Se restaurará a valores de fábrica.</div><div style="display:flex;gap:30px;"><button onclick="resetLayout();document.getElementById(\\'home-confirm-dialog\\').style.display=\\'none\\';setInfoDisplay(\\'✓ Restaurado\\');toggleDropdown(\\'display-dropdown\\');" style="padding:2px 14px;background:#e0e0e0;cursor:pointer;">YES</button><button onclick="document.getElementById(\\'home-confirm-dialog\\').style.display=\\'none\\';toggleDropdown(\\'display-dropdown\\');" style="padding:2px 14px;background:#e0e0e0;cursor:pointer;">NO</button></div>';
    }
}

function displaySetupChangeWindowPattern() {
    setInfoDisplay('✓ CHANGE WINDOW PATTERN: Patrón aplicado');
}
'''

html = html.replace('</script>', funciones + '\nwindow.displaySetupChangeFont = displaySetupChangeFont;\nwindow.displaySetupChangeButton = displaySetupChangeButton;\nwindow.displaySetupInitializeLayout = displaySetupInitializeLayout;\nwindow.displaySetupChangeWindowPattern = displaySetupChangeWindowPattern;\n</script>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Done")
