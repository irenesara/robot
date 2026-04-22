/**
 * DX-200 Robot Simulator - UI Handlers
 */

import {
    RobotState, DxState, robotJobs, wgravSelectedIdx, wgravCompleted,
    isShiftPressed, isServoOn, keyPosition, keyPositions, keyRotations,
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
    if (active !== undefined && isShiftPressed === active) return;
    isShiftPressed = (active !== undefined) ? active : !isShiftPressed;
    setInfoDisplay(isShiftPressed ? '✓ SHIFT: BLOQUEADO (Activo)' : '✓ SHIFT: LIBERADO (Inactivo)');
    document.querySelectorAll('.kb-bot-btn').forEach(b => {
        if (b.textContent.trim() === 'SHIFT') b.style.background = isShiftPressed ? '#a0a0a0' : '';
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
    isServoOn = !isServoOn;
    if (isServoOn) {
        btn.style.background = '#d00000';
        btn.style.color = '#fff';
        btn.style.boxShadow = '0 0 8px #ff0000';
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

    if (axis === 'a' || axis === 'e') {
        const isPinza2 = (axis === 'e');
        const maxOpen = 0.030;
        let angle = isPinza2 ? gripper2Angle : gripperAngle;
        angle = Math.max(0, Math.min(maxOpen, angle + (0.01 * dir)));
        if (isPinza2) gripper2Angle = angle; else gripperAngle = angle;
        
        const pct = Math.round((angle / maxOpen) * 100);
        setInfoDisplay(`✓ PINZA ${isPinza2 ? '2' : '1'}: ${pct}%`);
        return;
    }

    if (!RobotState.deadman) { setInfoDisplay('⚠️ Deadman (ESPACIO)'); return; }
    if (!isServoOn) { setInfoDisplay('⚠️ Servo DESCONECTADO (Pulsa SERVO ON)'); return; }

    if (DxState.coordSystem === 'JOINT') {
        const axisMap = { x: 's', y: 'l', z: 'u', r: 'r', b: 'b', t: 't' };
        const sAxis = axisMap[axis];
        if (sAxis) {
            const inc = RobotState.speed * 0.18 * dir;
            RobotState.angles[sAxis] = Math.max(
                RobotState.limits[sAxis].min,
                Math.min(RobotState.limits[sAxis].max, RobotState.angles[sAxis] + inc)
            );
            highlightJoint({ s: 0, l: 1, u: 2, r: 3, b: 4, t: 5 }[sAxis]);
            updateDisplay();
            setInfoDisplay(`✓ ${sAxis.toUpperCase()} ${dir > 0 ? '+' : '−'}`);
        }
    } else {
        // 6-DOF CARTESIAN (WORLD / TOOL)
        const isWorld = (DxState.coordSystem === 'WORLD');
        const stepPos = (RobotState.speed * 0.0008) * dir;
        const stepRot = (RobotState.speed * 0.005) * dir; // Radians for IK
        
        let delta = [0, 0, 0, 0, 0, 0]; // dx, dy, dz, drx, dry, drz
        const axisIdx = { x: 0, y: 1, z: 2, r: 3, b: 4, t: 5 }[axis];
        delta[axisIdx] = (axisIdx < 3) ? stepPos : stepRot;

        if (!isWorld) {
            // TOOL MODE: Rotate delta by current TCP orientation
            const current = calculateFK(RobotState.angles);
            const rot = new THREE.Euler(
                THREE.MathUtils.degToRad(current.rx),
                THREE.MathUtils.degToRad(current.ry),
                THREE.MathUtils.degToRad(current.rz)
            );
            const quat = new THREE.Quaternion().setFromEuler(rot);
            
            // Rotate translation
            const vecPos = new THREE.Vector3(delta[0], delta[1], delta[2]).applyQuaternion(quat);
            // Rotate orientation (Simplified: Tool-relative rotation)
            const vecRot = new THREE.Vector3(delta[3], delta[4], delta[5]).applyQuaternion(quat);
            
            delta = [vecPos.x, vecPos.y, vecPos.z, vecRot.x, vecRot.y, vecRot.z];
        }

        const newAngles = solveCartesianStep(RobotState.angles, delta);
        if (newAngles) {
            let withinLimits = true;
            for (let k in newAngles) {
                if (newAngles[k] < RobotState.limits[k].min - 0.1 || newAngles[k] > RobotState.limits[k].max + 0.1) {
                    withinLimits = false; break;
                }
            }
            if (withinLimits) {
                for (let k in newAngles) RobotState.angles[k] = newAngles[k];
                updateDisplay();
                setInfoDisplay(`✓ ${DxState.coordSystem}: ${axis.toUpperCase()} ${dir > 0 ? '+' : '−'}`);
            } else {
                setInfoDisplay('⚠ LÍMITE DE EJE ALCANZADO');
            }
        } else {
            setInfoDisplay('⚠ SINGULARIDAD / FUERA DE RANGO');
        }
    }
}

function updateDisplay() {
    const state = window.DxState;
    const robot = window.RobotState;
    if (!robot || !robot.angles) return;
    
    const angles = robot.angles;
    const mode = state.coordSystem || 'JOINT';
    const coords = (typeof calculateFK === 'function') ? calculateFK(angles) : {x:0,y:0,z:0,rx:0,ry:0,rz:0};

    const labels = ['s', 'l', 'u', 'r', 'b', 't'];
    const cartLabels = ['X', 'Y', 'Z', 'Rx', 'Ry', 'Rz'];
    const currentLabels = (mode === 'JOINT') ? labels : cartLabels;
    
    // 1. Update Labels
    labels.forEach((id, i) => {
        const text = currentLabels[i].toUpperCase();
        const elLbl = document.getElementById('lbl-' + id);
        if (elLbl) elLbl.textContent = text + (text.length === 1 ? " :" : ":");
        const elSmall = document.getElementById('lbl-' + id + '-small');
        if (elSmall) elSmall.textContent = text + ":";
        const elMl = document.getElementById('ml-lbl-' + id);
        if (elMl) elMl.textContent = text + ":";
    });

    // 2. Update Values
    const isCart = (mode !== 'JOINT');
    const vals = isCart
        ? [coords.x * 1000, coords.y * 1000, coords.z * 1000, coords.rx, coords.ry, coords.rz]
        : [angles.s, angles.l, angles.u, angles.r, angles.b, angles.t];

    labels.forEach((id, i) => {
        const isPosValue = (isCart && i < 3);
        const unit = isPosValue ? ' mm' : '°';
        const elVal = document.getElementById(id);
        if (elVal) elVal.textContent = vals[i].toFixed(1) + unit;
        const elLcd = document.getElementById('lcd-' + id);
        if (elLcd) elLcd.textContent = vals[i].toFixed(3) + (isPosValue ? ' mm' : ' °');
        const elMlVal = document.getElementById('ml-' + id);
        if (elMlVal) elMlVal.textContent = vals[i].toFixed(isPosValue ? 3 : 1) + (isPosValue ? ' mm' : '°');
    });

    // 3. Status Indicators & Labels
    const statusEl = document.getElementById('lcd-coord');
    if (statusEl) {
        if (statusEl.textContent !== mode) {
            statusEl.classList.remove('coord-flash');
            void statusEl.offsetWidth; 
            statusEl.classList.add('coord-flash');
        }
        statusEl.textContent = mode;
        if (mode === 'JOINT') statusEl.style.color = '#0ff';
        else if (mode === 'WORLD') statusEl.style.color = '#0f0';
        else if (mode === 'TOOL') statusEl.style.color = '#ff0';
    }
    
    const mlTitleEl = document.getElementById('ml-coord-title');
    if (mlTitleEl) mlTitleEl.textContent = mode + " COORD";
    
    const robotTitleEl = document.getElementById('lcd-coords-title');
    if (robotTitleEl) robotTitleEl.textContent = mode + " CURRENT POSITION";

    const toolNoEl = document.getElementById('lcd-tool-no');
    if (toolNoEl) {
        toolNoEl.textContent = '(' + String(state.currentToolNo || 0).padStart(2, '0') + ')';
        toolNoEl.style.display = (mode === 'TOOL') ? 'inline' : 'none';
    }

    if (state.view === 'JOB' && typeof renderJob === 'function') renderJob();
}


function toggleCoordSystem() {
    const state = window.DxState;
    if (typeof isShiftPressed !== 'undefined' && isShiftPressed) {
        // Alt-logic: Tool Selection
        state.currentToolNo = (state.currentToolNo === 0) ? 1 : 0;
        setInfoDisplay('✓ TOOL SELECT: Herramienta #' + state.currentToolNo);
        updateDisplay();
        return;
    }

    const systems = ['JOINT', 'WORLD', 'TOOL'];
    let idx = systems.indexOf(state.coordSystem);
    state.coordSystem = systems[(idx + 1) % systems.length];
    setInfoDisplay('✓ SISTEMA COORD: ' + state.coordSystem);
    updateDisplay();
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
    pressDelete, goToTop, resetToZero, toggleCoordSystem, keyPositions, keyPosition
};

window.updateDisplay = updateDisplay;
window.moveAxis = moveAxis;
window.toggleCoordSystem = toggleCoordSystem;
