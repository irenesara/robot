/**
 * DX-200 Robot Simulator - UI Handlers
 */

    RobotState, DxState, robotJobs, wgravSelectedIdx, wgravCompleted,
    isShiftPressed, isInterlockPressed, isServoOn, keyPosition, keyPositions, keyRotations,
    gripperAngle, gripper2Angle, saveJobsLocally
} from './state.js';
import { highlightJoint } from './robot3d.js';
import { renderJob, renderList } from './jobManager.js';

function setView(viewName) {
    DxState.view = viewName;
    document.querySelectorAll('.lcd-sidebar-btn').forEach(b => b.classList.remove('active'));
    let baseView = viewName.startsWith('ROBOT') ? 'ROBOT' : viewName;
    if (baseView === 'SECURITY') baseView = 'SYSINFO';

    const btn = document.getElementById('btn-view-' + baseView.toLowerCase());
    if (btn) btn.classList.add('active');

    const screens = ['job-screen', 'robot-menu-screen', 'robot-screen', 'list-screen',
        'security-screen', 'home-position-screen', 'system-info-menu-screen',
        'tool-screen', 'wgrav-screen', 'arc-screen'];
    screens.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const viewMap = {
        'JOB': ['job-screen', renderJob],
        'ROBOT': ['robot-menu-screen', null],
        'ROBOT-CURRENT': ['robot-screen', null],
        'LIST': ['list-screen', renderList],
        'SECURITY': ['security-screen', null],
        'HOME-POSITION': ['home-position-screen', null],
        'SYSTEM-INFO': ['system-info-menu-screen', null],
        'TOOL': ['tool-screen', null],
        'WGRAV': ['wgrav-screen', null],
        'ARC': ['arc-screen', null]
    };

    const mapping = viewMap[viewName];
    if (mapping) {
        const el = document.getElementById(mapping[0]);
        if (el) el.style.display = 'flex';
        if (mapping[1]) mapping[1]();
    }
}

function selectHomeAxis(element) {
    document.querySelectorAll('.hp-select').forEach(el => {
        el.classList.remove('active');
        el.textContent = '○';
    });
    element.classList.add('active');
    element.textContent = '◉';
    setInfoDisplay('✓ Eje seleccionado para Home');
}

function setSecurityMode(modeName, element) {
    document.querySelectorAll('.sec-mode').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');
    DxState.securityMode = modeName;
    document.getElementById('lcd-security').textContent = modeName.substring(0, 4);
    setInfoDisplay('✓ Nivel de seguridad: ' + modeName + ' MODE');
}

function selectWgravLine(idx) {
    if (DxState.view !== 'WGRAV') return;
    wgravSelectedIdx = idx;
    for (let i = 0; i < 5; i++) {
        const el = document.getElementById('wgrav-line-' + i);
        if (el) {
            if (i === idx) {
                el.classList.add('selected');
                el.style.background = '#0000aa';
                el.style.color = '#fff';
            } else {
                el.classList.remove('selected');
                el.style.background = '';
                el.style.color = '';
            }
        }
    }
}

function toggleShift(active) {
    if (active !== undefined && DxState.isShiftPressed === active) return;
    DxState.isShiftPressed = (active !== undefined) ? active : !DxState.isShiftPressed;
    setInfoDisplay(DxState.isShiftPressed ? '✓ SHIFT: BLOQUEADO (Activo)' : '✓ SHIFT: LIBERADO (Inactivo)');
    document.querySelectorAll('.kb-bot-btn').forEach(b => {
        if (b.textContent.trim() === 'SHIFT') b.style.background = DxState.isShiftPressed ? '#a0a0a0' : '';
    });
}

function toggleDeadman() {
    RobotState.deadman = !RobotState.deadman;
    const btn = document.getElementById('deadman-btn');
    if (RobotState.deadman) {
        btn.textContent = '✓ ACTIVO';
        btn.classList.add('active');
        setInfoDisplay('✓ Deadman ACTIVO');
    } else {
        btn.textContent = 'INACTIVO';
        btn.classList.remove('active');
        setInfoDisplay('⚠️ Deadman INACTIVO');
    }
}

function toggleServo() {
    const btn = document.getElementById('servo-btn');
    DxState.isServoOn = !DxState.isServoOn;
    if (DxState.isServoOn) {
        btn.style.background = '#0f0';
        btn.style.color = '#fff';
        btn.style.boxShadow = '0 0 10px #0f0';
        setInfoDisplay('✓ Servo activado (POWER ON)');
    } else {
        btn.style.background = '#ccc';
        btn.style.color = '#222';
        btn.style.boxShadow = 'none';
        setInfoDisplay('⚠ Servo desactivado');
    }
}

function setMode(mode) {
    RobotState.mode = mode.toUpperCase();
    document.getElementById('lcd-mode').textContent = RobotState.mode;
    setInfoDisplay(`Modo: ${RobotState.mode}`);
}

function setSpeed(speed) {
    RobotState.speed = speed;
    setInfoDisplay(`⚡ Velocidad: ${speed}%`);
}

function rotateKeySwitch() {
    keyPosition = (keyPosition + 1) % 3;
    updateKeySwitchDisplay();
    setInfoDisplay(`Llave: ${keyPositions[keyPosition]}`);
}

function toggleUsage() {
    DxState.isUsageOn = !DxState.isUsageOn;
    const indicator = document.getElementById('usage-status');
    const box = document.getElementById('usage-indicator');
    
    if (DxState.isUsageOn) {
        if (indicator) {
            indicator.textContent = 'ON';
            indicator.style.color = '#0f0';
            indicator.style.textShadow = '0 0 5px #0f0';
        }
        if (box) {
            box.style.borderColor = '#0f0';
            box.style.background = '#002200';
        }
        setInfoDisplay('✓ FUNCIÓN DE APLICACIÓN: ACTIVADA (USAGE ON)');
    } else {
        if (indicator) {
            indicator.textContent = 'OFF';
            indicator.style.color = '#aaa';
            indicator.style.textShadow = 'none';
        }
        if (box) {
            box.style.borderColor = '#777';
            box.style.background = '#555';
        }
        setInfoDisplay('✓ FUNCIÓN DE APLICACIÓN: DESACTIVADA (USAGE OFF)');
    }
}

function cycleMotionType() {
    if (!DxState.isInserting && !DxState.isModifying) {
        setInfoDisplay('⚠ Solo disponible en modo INSERT o MODIFY');
        return;
    }
    
    const types = ['MOVJ', 'MOVL', 'MOVC', 'IMOV'];
    let currentType = 'MOVJ';
    
    // Detect current type from buffer
    for (let t of types) {
        if (DxState.editingBuffer.startsWith(t)) {
            currentType = t;
            break;
        }
    }
    
    let nextIdx = (types.indexOf(currentType) + 1) % types.length;
    let nextType = types[nextIdx];
    
    // Logic to preserve speed parameters
    if (nextType === 'MOVJ') {
        DxState.editingBuffer = `MOVJ VJ=${RobotState.speed}.00`;
    } else if (nextType === 'MOVL') {
        DxState.editingBuffer = `MOVL V=${RobotState.speed * 20}.0`;
    } else if (nextType === 'MOVC') {
        DxState.editingBuffer = `MOVC V=${RobotState.speed * 10}.0`;
    } else {
        DxState.editingBuffer = `IMOV V=${RobotState.speed * 10}.0`;
    }
    
    setInfoDisplay(`✓ Tipo de movimiento: ${nextType}`);
    
    // Add visual feedback to the LCD indicator
    const methodInd = document.getElementById('job-method-indicator');
    if (methodInd) {
        methodInd.style.background = '#fff';
        methodInd.style.color = '#000';
        setTimeout(() => {
            methodInd.style.background = '';
            methodInd.style.color = '';
        }, 150);
    }
    
    renderJob();
}

function toggleInterlock() {
    DxState.isInterlockPressed = !DxState.isInterlockPressed;
    const btn = document.getElementById('interlock-btn');
    if (DxState.isInterlockPressed) {
        btn.style.background = '#2b4b9b';
        btn.style.color = '#fff';
        btn.style.boxShadow = 'inset 0 0 10px rgba(0,0,0,0.5), 0 0 5px #2b4b9b';
        setInfoDisplay('✓ INTERLOCK: ACTIVADO');
    } else {
        btn.style.background = '';
        btn.style.color = '';
        btn.style.boxShadow = '';
        setInfoDisplay('✓ INTERLOCK: LIBERADO');
    }
}

function updateKeySwitchDisplay() {
    const dial = document.getElementById('keySwitch');
    const position = document.getElementById('keyPosition');
    const indicator = document.getElementById('keyIndicator');

    dial.style.transform = `rotate(${keyRotations[keyPosition]}deg)`;
    position.textContent = keyPositions[keyPosition];
    indicator.style.boxShadow = keyPosition === 0
        ? '0 0 6px rgba(200, 100, 0, 0.6)'
        : '0 0 6px rgba(0, 255, 0, 0.6)';
}

function emergencyStop() {
    RobotState.programRunning = false;
    RobotState.deadman = false;
    const btn = document.getElementById('deadman-btn');
    if (btn) {
        btn.textContent = 'INACTIVO';
        btn.classList.remove('active');
    }
    document.getElementById('lcd-status').textContent = 'E-STOP';
    setInfoDisplay('🚨 PARO EMERGENCIA');
}

function handleFunc(func) {
    if (func === 'hold') {
        RobotState.programRunning = false;
        document.getElementById('lcd-status').textContent = 'HOLD';
        setInfoDisplay('⏸️ PROGRAMA PAUSADO (HOLD)');
    } else {
        setInfoDisplay(func.toUpperCase());
    }
}

function showMsg(msg) {
    setInfoDisplay('ℹ️ ' + msg + ' (Sin acción)');
}

function setInfoDisplay(msg) {
    const el = document.getElementById('infoDisplay');
    if (el) el.textContent = msg;
}

function moveAxis(axis, dir) {
    if (!checkTeachMode('Movimiento manual')) return;
    if (RobotState.programRunning) return;

    if (axis === 'a') {
        const maxOpen = 0.030;
        gripperAngle = Math.max(0, Math.min(maxOpen, gripperAngle + (0.03 * dir)));
        const pct = Math.round((gripperAngle / maxOpen) * 100);
        if (gripperAngle <= 0.001) setInfoDisplay('✓ PINZA 1 CERRADA');
        else if (gripperAngle >= maxOpen - 0.001) setInfoDisplay('✓ PINZA 1 ABIERTA');
        else setInfoDisplay(`✓ PINZA 1: ${pct}%`);
        return;
    }
    if (axis === 'e') {
        const maxOpen = 0.030;
        gripper2Angle = Math.max(0, Math.min(maxOpen, gripper2Angle + (0.03 * dir)));
        if (gripper2Angle <= 0.001) setInfoDisplay('✓ PINZA 2 CERRADA');
        else if (gripper2Angle >= maxOpen - 0.001) setInfoDisplay('✓ PINZA 2 ABIERTA');
        else setInfoDisplay(`✓ PINZA 2: ${Math.round((gripper2Angle / maxOpen) * 100)}%`);
        return;
    }
    if (!RobotState.deadman) {
        setInfoDisplay('⚠️ Deadman (ESPACIO)');
        return;
    }
    if (!DxState.isServoOn) {
        setInfoDisplay('⚠️ Servo DESCONECTADO (Pulsa SERVO ON)');
        return;
    }
    const axisMap = { x: 's', y: 'l', z: 'u', r: 'r', b: 'b', t: 't' };
    const sAxis = axisMap[axis];
    if (sAxis && RobotState.angles[sAxis] !== undefined) {
        const inc = RobotState.speed * 0.18 * dir;
        RobotState.angles[sAxis] = Math.max(
            RobotState.limits[sAxis].min,
            Math.min(RobotState.limits[sAxis].max, RobotState.angles[sAxis] + inc)
        );
        const axisToJoint = { s: 0, l: 1, u: 2, r: 3, b: 4, t: 5 };
        highlightJoint(axisToJoint[sAxis]);
        updateDisplay();
        setInfoDisplay(`✓ ${sAxis.toUpperCase()} ${dir > 0 ? '+' : '−'}`);
    }
}

function updateDisplay() {
    document.getElementById('s').textContent = RobotState.angles.s.toFixed(1) + '°';
    document.getElementById('l').textContent = RobotState.angles.l.toFixed(1) + '°';
    document.getElementById('u').textContent = RobotState.angles.u.toFixed(1) + '°';
    document.getElementById('r').textContent = RobotState.angles.r.toFixed(1) + '°';
    document.getElementById('b').textContent = RobotState.angles.b.toFixed(1) + '°';
    document.getElementById('t').textContent = RobotState.angles.t.toFixed(1) + '°';

    const lcdS = document.getElementById('lcd-s');
    if (lcdS) {
        lcdS.textContent = RobotState.angles.s.toFixed(3) + ' °';
        document.getElementById('lcd-l').textContent = RobotState.angles.l.toFixed(3) + ' °';
        document.getElementById('lcd-u').textContent = RobotState.angles.u.toFixed(3) + ' °';
        document.getElementById('lcd-r').textContent = RobotState.angles.r.toFixed(3) + ' °';
        document.getElementById('lcd-b').textContent = RobotState.angles.b.toFixed(3) + ' °';
        document.getElementById('lcd-t').textContent = RobotState.angles.t.toFixed(3) + ' °';
    }
}

function checkTeachMode(actionName) {
    if (RobotState.mode !== 'TEACH' && keyPositions[keyPosition] !== 'TEACH') {
        setInfoDisplay(`❌ ${actionName} anulado. Gira llave a TEACH.`);
        return false;
    }
    return true;
}

function handleDir(dir) {
    if (DxState.view === 'WGRAV') {
        if (dir === 'up' && wgravSelectedIdx > 0) selectWgravLine(wgravSelectedIdx - 1);
        if (dir === 'down' && wgravSelectedIdx < 4) selectWgravLine(wgravSelectedIdx + 1);
        return;
    }
    if (DxState.view === 'JOB') {
        const currentProgram = robotJobs[DxState.currentJobId];
        if (currentProgram && currentProgram.length > 0) {
            if (dir === 'up') {
                DxState.selectedLineIndex = Math.max(0, DxState.selectedLineIndex - 1);
                DxState.selectedTokenIndex = 0;
            } else if (dir === 'down') {
                DxState.selectedLineIndex = Math.min(currentProgram.length - 1, DxState.selectedLineIndex + 1);
                DxState.selectedTokenIndex = 0;
            } else if (dir === 'left') {
                DxState.selectedTokenIndex = Math.max(0, DxState.selectedTokenIndex - 1);
            } else if (dir === 'right') {
                const step = currentProgram[DxState.selectedLineIndex];
                const maxTokens = (step.code || '').split(' ').length - 1;
                DxState.selectedTokenIndex = Math.min(maxTokens, DxState.selectedTokenIndex + 1);
            }
            renderJob();
        }
    } else if (DxState.view === 'LIST') {
        const jobKeys = Object.keys(robotJobs);
        if (jobKeys.length > 0) {
            if (dir === 'up') DxState.selectedListIndex = Math.max(0, DxState.selectedListIndex - 1);
            else if (dir === 'down') DxState.selectedListIndex = Math.min(jobKeys.length - 1, DxState.selectedListIndex + 1);
            renderList();
        }
    } else {
        setInfoDisplay('Dirección ' + dir + ' pulsada');
    }
}

function handleEditAction(action) {
    if (!checkTeachMode('EDIT')) return;
    const currentProgram = robotJobs[DxState.currentJobId];
    if (!currentProgram || currentProgram.length === 0) return;

    if (action === 'TOP LINE') {
        DxState.selectedLineIndex = 0; DxState.selectedTokenIndex = 0;
        setInfoDisplay('✓ CURSOR AL INICIO');
    } else if (action === 'END LINE') {
        DxState.selectedLineIndex = currentProgram.length - 1; DxState.selectedTokenIndex = 0;
        setInfoDisplay('✓ CURSOR AL FINAL');
    } else if (action === 'SEARCH') {
        showMsg('SEARCH: Función en desarrollo'); return;
    } else if (action === 'COPY') {
        DxState.clipboard = JSON.parse(JSON.stringify(currentProgram[DxState.selectedLineIndex]));
        showMsg('✓ Línea ' + DxState.selectedLineIndex + ' copiada'); return;
    } else if (action === 'CUT') {
        DxState.clipboard = JSON.parse(JSON.stringify(currentProgram[DxState.selectedLineIndex]));
        currentProgram.splice(DxState.selectedLineIndex, 1);
        if (DxState.selectedLineIndex >= currentProgram.length) DxState.selectedLineIndex = Math.max(0, currentProgram.length - 1);
        showMsg('✓ Línea cortada');
    } else if (action === 'CHANGE SPEED') {
        let step = currentProgram[DxState.selectedLineIndex];
        let tokens = (step.code || '').split(' ');
        let speedChanged = false;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i].startsWith('VJ=') || tokens[i].startsWith('V=')) {
                const speeds = ['VJ=1.00', 'VJ=5.00', 'VJ=10.00', 'VJ=25.00', 'VJ=50.00', 'VJ=100.00'];
                let idx = speeds.indexOf(tokens[i]);
                tokens[i] = speeds[(idx + 1) % speeds.length];
                step.code = tokens.join(' ');
                setInfoDisplay('✓ Velocidad cambiada a ' + tokens[i]);
                speedChanged = true; break;
            }
        }
        if (!speedChanged) setInfoDisplay('⚠ La línea no tiene parámetro de velocidad');
    } else {
        showMsg(action + ': Función reservada/en desarrollo');
    }
    saveJobsLocally();
    if (DxState.view !== 'JOB') setView('JOB');
    else renderJob();
}

function pressSelect() {
    if (DxState.view === 'LIST') {
        const jobKeys = Object.keys(robotJobs);
        if (jobKeys.length > 0) {
            DxState.currentJobId = jobKeys[DxState.selectedListIndex];
            DxState.selectedLineIndex = 0; DxState.selectedTokenIndex = 0;
            setView('JOB');
            setInfoDisplay('✓ Cargado: ' + DxState.currentJobId);
        }
    } else if (DxState.view === 'JOB') {
        const currentProgram = robotJobs[DxState.currentJobId];
        if (currentProgram && currentProgram.length > 0) {
            let step = currentProgram[DxState.selectedLineIndex];
            let tokens = (step.code || '').split(' ');
            if (DxState.selectedTokenIndex > 0 && tokens.length > DxState.selectedTokenIndex) {
                if (!checkTeachMode('Edición de parámetros')) return;
                let target = tokens[DxState.selectedTokenIndex];
                if (target.startsWith('VJ=')) {
                    const speeds = ['VJ=1.00', 'VJ=5.00', 'VJ=10.00', 'VJ=25.00', 'VJ=50.00', 'VJ=100.00'];
                    let idx = speeds.indexOf(target);
                    tokens[DxState.selectedTokenIndex] = speeds[(idx + 1) % speeds.length];
                } else if (target.startsWith('T=')) {
                    const timers = ['T=0.1', 'T=0.5', 'T=1.0', 'T=2.0', 'T=5.0'];
                    let idx = timers.indexOf(target);
                    tokens[DxState.selectedTokenIndex] = timers[(idx + 1) % timers.length];
                }
                step.code = tokens.join(' ');
                saveJobsLocally();
                renderJob();
                setInfoDisplay('✓ Parámetro actualizado');
            } else {
                setInfoDisplay('✓ SELECT pulsado');
            }
        }
    } else if (DxState.view === 'HOME-POSITION') {
        document.getElementById('home-confirm-dialog').style.display = 'flex';
    } else if (DxState.view === 'WGRAV') {
        const span = document.getElementById('wgrav-consider');
        if (span) {
            const newVal = span.textContent === 'NOT CONSIDER' ? 'CONSIDER' : 'NOT CONSIDER';
            span.textContent = newVal;
            setInfoDisplay('✓ LOAD SETTING: ' + newVal);
        }
    } else {
        setInfoDisplay('✓ SELECT pulsado');
    }
}

function toggleDropdown(id, element) {
    const dropdown = document.getElementById(id);
    if (!dropdown) return;
    if (dropdown.style.display === 'flex') {
        dropdown.style.display = 'none';
        document.querySelectorAll('.menu-tab').forEach(t => { t.style.background = ''; t.style.color = ''; });
    } else {
        document.querySelectorAll('.dropdown-menu').forEach(d => d.style.display = 'none');
        document.querySelectorAll('.menu-tab').forEach(t => { t.style.background = ''; t.style.color = ''; });
        dropdown.style.display = 'flex';
        if (element) {
            const barRect = element.parentElement.getBoundingClientRect();
            const elRect = element.getBoundingClientRect();
            dropdown.style.left = (elRect.left - barRect.left) + 'px';
            element.style.background = '#2b4b9b';
            element.style.color = 'white';
        }
    }
}

function closeHomeConfirm(accepted) {
    document.getElementById('home-confirm-dialog').style.display = 'none';
    if (accepted) {
        if (!checkTeachMode('Create Home Pos')) return;
        setInfoDisplay('✓ Posición Home guardada correctamente');
        const activeDataBox = document.querySelector('.hp-select.active').nextElementSibling;
        if (activeDataBox) activeDataBox.textContent = '*';
    } else {
        setInfoDisplay('❌ Operación cancelada');
    }
}

function pressModify() {
    if (DxState.view === 'WGRAV') {
        setInfoDisplay('⚠ MANTENGA PULSADO [FWD] PARA MEDICIÓN AUTÓNOMA'); return;
    }
    if (DxState.view !== 'JOB') { setInfoDisplay('⚠ MODIFY presionado'); return; }
    if (!checkTeachMode('MODIFY')) return;
    if (DxState.securityMode === 'OPERATION') { setInfoDisplay('❌ SECURITY ERROR: REQUIRE EDITING MODE'); return; }

    const btn = document.getElementById('modify-btn');
    if (DxState.activeEditAction === 'MODIFY') {
        cancelEdit();
    } else {
        cancelEdit();
        DxState.activeEditAction = 'MODIFY';
        DxState.isModifying = true;
        if (btn) btn.classList.add('blink-active');

        // Populate buffer with current line
        const currentProgram = robotJobs[DxState.currentJobId];
        const step = currentProgram[DxState.selectedLineIndex];
        DxState.editingBuffer = step.code || '';

        setInfoDisplay('MODIFY activo. Mueva robot y pulse ENTER.');
    }
    renderJob();
}

function pressInsert() {
    if (!checkTeachMode('INSERT')) return;
    if (DxState.securityMode === 'OPERATION') { setInfoDisplay('❌ SECURITY ERROR: REQUIRE EDITING MODE'); return; }

    const btn = document.getElementById('insert-btn');
    if (DxState.activeEditAction === 'INSERT') {
        cancelEdit();
    } else {
        cancelEdit();
        DxState.activeEditAction = 'INSERT';
        DxState.isInserting = true;
        if (btn) btn.classList.add('blink-active');

        // Default instruction in buffer
        DxState.editingBuffer = 'MOVJ VJ=' + RobotState.speed + '.00';
        setInfoDisplay('INSERT activo. Elija instrucción y pulse ENTER.');
    }
    renderJob();
}

function pressDelete() {
    if (!checkTeachMode('DELETE')) return;
    if (DxState.securityMode === 'OPERATION') { setInfoDisplay('❌ SECURITY ERROR: REQUIRE EDITING MODE'); return; }

    const btn = document.getElementById('delete-btn');
    if (DxState.activeEditAction === 'DELETE') {
        cancelEdit();
    } else {
        cancelEdit();
        DxState.activeEditAction = 'DELETE';
        DxState.isDeleting = true;
        if (btn) btn.classList.add('blink-active');

        setInfoDisplay('DELETE activo. Pulse ENTER para confirmar borrado.');
    }
    renderJob();
}

function cancelEdit() {
    DxState.activeEditAction = null;
    DxState.isModifying = false;
    DxState.isInserting = false;
    DxState.isDeleting = false;
    DxState.editingBuffer = '';
    document.querySelectorAll('.blink-active').forEach(el => el.classList.remove('blink-active'));
}

function goToTop() {
    DxState.selectedLineIndex = 0;
    if (DxState.view !== 'JOB') setView('JOB');
    else renderJob();
    setInfoDisplay('↑ CURSOR EN INICIO DEL PROGRAMA');
}

function resetToZero() {
    if (!RobotState.deadman) { showMsg('⚠️ Requiere Deadman (Pulse ESPACIO)'); return; }
    RobotState.programRunning = false;
    let target = { s: 0, l: 0, u: 0, r: 0, b: 0, t: 0, gripper: 0 };
    const startAngles = { ...RobotState.angles };
    const startGripper = gripperAngle;
    let p = 0;
    const zeroAnim = setInterval(() => {
        p += 0.05;
        if (p >= 1.0) { p = 1.0; clearInterval(zeroAnim); }
        RobotState.angles.s = startAngles.s + (target.s - startAngles.s) * p;
        RobotState.angles.l = startAngles.l + (target.l - startAngles.l) * p;
        RobotState.angles.u = startAngles.u + (target.u - startAngles.u) * p;
        RobotState.angles.r = startAngles.r + (target.r - startAngles.r) * p;
        RobotState.angles.b = startAngles.b + (target.b - startAngles.b) * p;
        RobotState.angles.t = startAngles.t + (target.t - startAngles.t) * p;
        gripperAngle = startGripper + (target.gripper - startGripper) * p;
    }, 30);
    setInfoDisplay('🏠 HOME FÍSICO (Retorno Absoluto a Cero)');
    document.getElementById('lcd-status').textContent = 'HOMING';
}

export {
    setView, selectHomeAxis, setSecurityMode, selectWgravLine, toggleShift,
    toggleDeadman, toggleServo, setMode, setSpeed, rotateKeySwitch,
    updateKeySwitchDisplay, emergencyStop, handleFunc, showMsg, setInfoDisplay,
    moveAxis, updateDisplay, checkTeachMode, handleDir, handleEditAction,
    pressSelect, toggleDropdown, closeHomeConfirm, pressModify, pressInsert,
    pressDelete, goToTop, resetToZero, keyPositions, keyPosition, toggleUsage,
    cycleMotionType, toggleInterlock
};
