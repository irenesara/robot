/**
 * DX-200 Robot Simulator - Job Manager
 */

import { DxState, robotJobs, saveJobsLocally, gripperAngle } from './state.js';
import { RobotState } from './state.js';
import { setInfoDisplay, setView, checkTeachMode, cancelEdit } from './ui.js';

function renderJob() {
    const container = document.getElementById('job-content-area');
    if (!container) return;
    container.innerHTML = '';

    const currentProgram = robotJobs[DxState.currentJobId];
    document.getElementById('current-job-name').textContent = DxState.currentJobId;
    document.getElementById('job-line-indicator').textContent = String(DxState.selectedLineIndex).padStart(4, '0');

    currentProgram.forEach((step, index) => {
        const line = document.createElement('div');
        const isMultiSelected = DxState.selectedLines && DxState.selectedLines.includes(index);
        line.className = 'job-line' + (index === DxState.selectedLineIndex ? ' selected' : '') + (isMultiSelected ? ' multi-selected' : '');

        // Visual feedback for EDITING: Underline line number if this line is being modified/deleted
        let lineNumStyle = '';
        if (index === DxState.selectedLineIndex && DxState.activeEditAction) {
            lineNumStyle = 'text-decoration: underline; color: #fff; font-weight: bold;';
        }

        let tokenHtml = '';
        const tokens = (step.code || 'MOVJ VJ=50.00').split(' ');
        tokens.forEach((token, tIndex) => {
            let style = '';
            if (index === DxState.selectedLineIndex && tIndex === DxState.selectedTokenIndex) {
                style = 'background: #000; color: #ffea00; padding: 0 4px; border-radius: 2px;';
            }
            tokenHtml += `<span style="${style}">${token}</span> `;
        });

        line.innerHTML = `<span class="job-line-num" style="${lineNumStyle}">${String(index).padStart(4, '0')}</span> <span>${tokenHtml}</span> <span style="color:#aaa; font-size: 8px;">// ${step.desc || ''}</span>`;
        line.onclick = () => {
            DxState.selectedLineIndex = index;
            DxState.selectedTokenIndex = 0;
            cancelEdit();
            renderJob();
        };
        container.appendChild(line);
    });

    // RENDER BUFFER LINE (The area where the instruction appears before ENTER)
    let bufferContainer = document.getElementById('job-buffer-area');
    if (!bufferContainer) {
        bufferContainer = document.createElement('div');
        bufferContainer.id = 'job-buffer-area';
        bufferContainer.style = 'background: #1a1a2e; border-top: 1px solid #555; padding: 2px 6px; color: #fff; font-size: 7px; height: 14px; display: flex; align-items: center;';
        container.parentElement.appendChild(bufferContainer);
    }

    if (DxState.activeEditAction) {
        let actionColor = DxState.activeEditAction === 'DELETE' ? '#f44' : '#4f4';
        bufferContainer.innerHTML = `<span style="color:${actionColor}; font-weight:bold; margin-right:8px;">${DxState.activeEditAction}:</span> <span>${DxState.editingBuffer}</span><span class="cursor-blink">_</span>`;
        bufferContainer.style.background = '#0a2050';
    } else {
        bufferContainer.innerHTML = '<span style="color:#666;">READY</span>';
        bufferContainer.style.background = '#1a1a2e';
    }

    const selectedElem = container.querySelector('.selected');
    if (selectedElem) {
        try { selectedElem.scrollIntoView({ block: 'nearest' }); } catch (e) { selectedElem.scrollIntoView(); }
    }
}

function renderList() {
    const container = document.getElementById('list-content-area');
    if (!container) return;
    container.innerHTML = '';

    const jobKeys = Object.keys(robotJobs);
    if (DxState.selectedListIndex >= jobKeys.length) DxState.selectedListIndex = Math.max(0, jobKeys.length - 1);

    jobKeys.forEach((jobId, index) => {
        const line = document.createElement('div');
        line.className = 'job-line' + (index === DxState.selectedListIndex ? ' selected' : '');
        line.innerHTML = `⭐ <strong>${jobId}</strong> <span style="color:#666; font-size: 8px; float:right;">[${robotJobs[jobId].length} steps]</span>`;
        line.onclick = () => { DxState.selectedListIndex = index; renderList(); };
        container.appendChild(line);
    });
}

function createNewJob() {
    const num = Object.keys(robotJobs).length + 1;
    const newName = 'NEW_JOB_' + num;
    robotJobs[newName] = [
        { s: 0, l: 0, u: 0, r: 0, b: 0, t: 0, gripper: 0, code: 'NOP', desc: 'INICIO' },
        { s: 0, l: 0, u: 0, r: 0, b: 0, t: 0, gripper: 0, code: 'END', desc: 'FIN' }
    ];
    DxState.currentJobId = newName;
    DxState.selectedLineIndex = 0;
    saveJobsLocally();
    setView('JOB');
    setInfoDisplay('✓ Nuevo trabajo creado: ' + newName);
}

function pressEnter() {
    if (DxState.view === 'WGRAV') {
        const wInput = document.getElementById('wgrav-val-w');
        if (wInput && wInput.textContent !== '*.*** kg') {
            setInfoDisplay('✓ Datos TOOL registrados en sistema.');
            wgravCompleted = [false, false, false, false, false];
            for (let i = 0; i < 5; i++) {
                const dot = document.getElementById('wgrav-dot-' + i);
                if (dot) { dot.style.background = 'transparent'; dot.style.borderColor = 'currentColor'; }
            }
            wInput.textContent = '*.*** kg';
            document.getElementById('wgrav-val-x').textContent = '*.*** mm';
            document.getElementById('wgrav-val-y').textContent = '*.*** mm';
            document.getElementById('wgrav-val-z').textContent = '*.*** mm';
            import('./ui.js').then(m => m.selectWgravLine(0));
            setView('ROBOT');
        } else {
            setInfoDisplay('⚠ Mida la inercia (FWD) antes de registrar.');
        }
        return;
    }

    const currentProgram = robotJobs[DxState.currentJobId];
    if (DxState.isInserting) {
        const newStep = {
            s: RobotState.angles.s, l: RobotState.angles.l, u: RobotState.angles.u,
            r: RobotState.angles.r, b: RobotState.angles.b, t: RobotState.angles.t,
            gripper: gripperAngle, code: DxState.editingBuffer || ('MOVJ VJ=' + RobotState.speed + '.00'), desc: 'Punto ENSEÑADO'
        };
        if (DxState.selectedLineIndex >= 0 && DxState.selectedLineIndex < currentProgram.length) {
            currentProgram.splice(DxState.selectedLineIndex + 1, 0, newStep);
            DxState.selectedLineIndex++;
        } else {
            currentProgram.push(newStep);
            DxState.selectedLineIndex = currentProgram.length - 1;
        }
        setInfoDisplay('✓ Punto insertado.');
        cancelEdit();
        saveJobsLocally();
        renderJob();
    } else if (DxState.isDeleting) {
        if (DxState.selectedLineIndex >= 0 && DxState.selectedLineIndex < currentProgram.length) {
            currentProgram.splice(DxState.selectedLineIndex, 1);
            if (DxState.selectedLineIndex >= currentProgram.length && currentProgram.length > 0) {
                DxState.selectedLineIndex = currentProgram.length - 1;
            } else if (currentProgram.length === 0) {
                DxState.selectedLineIndex = -1;
            }
            setInfoDisplay('✓ Punto eliminado.');
        }
        cancelEdit();
        saveJobsLocally();
        renderJob();
    } else if (DxState.isModifying) {
        if (DxState.selectedLineIndex >= 0 && DxState.selectedLineIndex < currentProgram.length) {
            let step = currentProgram[DxState.selectedLineIndex];
            step.s = RobotState.angles.s; step.l = RobotState.angles.l; step.u = RobotState.angles.u;
            step.r = RobotState.angles.r; step.b = RobotState.angles.b; step.t = RobotState.angles.t;
            step.gripper = gripperAngle;
            step.code = DxState.editingBuffer;
            setInfoDisplay('✓ Punto modificado.');
        }
        cancelEdit();
        saveJobsLocally();
        renderJob();
    }
}

function startProgram() {
    if (!RobotState.programRunning) {
        RobotState.programRunning = true;
        const currentProgram = robotJobs[DxState.currentJobId];
        if (currentProgram && RobotState.programStep >= currentProgram.length) {
            RobotState.programStep = 0;
        }
        document.getElementById('lcd-status').textContent = 'RUNNING';
        setInfoDisplay('▶️ EJECUTANDO PROGRAMA');
    } else {
        RobotState.programRunning = false;
        document.getElementById('lcd-status').textContent = 'STOPPED';
        setInfoDisplay('⏹️ PROGRAMA DETENIDO');
    }
}

async function runWgravMacro() {
    let wgravMacroRunning = true;
    setInfoDisplay('▶ Calibración automática iniciada...');

    const poses = [
        { s: 0, l: 0.2, u: 0.5, r: 0, b: 0, t: 0, name: 'HOME' },
        { s: 0, l: 0.2, u: 0.5, r: 0, b: 0, t: 0, name: 'U' },
        { s: 0, l: 0.2, u: 0.5, r: 0, b: -0.5, t: 0, name: 'B' },
        { s: 0, l: 0.2, u: 0.5, r: 0, b: -0.5, t: 1.0, name: 'T(1)' },
        { s: 0, l: 0.2, u: 0.5, r: 0, b: -0.5, t: -1.0, name: 'T(2)' }
    ];

    for (let i = 0; i < poses.length; i++) {
        if (DxState.view !== 'WGRAV') break;
        import('./ui.js').then(m => m.selectWgravLine(i));
        setInfoDisplay(`⏳ Midiendo posición ${poses[i].name}...`);

        RobotState.angles.s = poses[i].s;
        RobotState.angles.l = poses[i].l;
        RobotState.angles.u = poses[i].u;
        RobotState.angles.r = poses[i].r;
        RobotState.angles.b = poses[i].b;
        RobotState.angles.t = poses[i].t;

        await new Promise(r => setTimeout(r, 1200));

        wgravCompleted[i] = true;
        const dot = document.getElementById('wgrav-dot-' + i);
        if (dot) { dot.style.background = '#0000aa'; dot.style.borderColor = 'transparent'; }
    }

    if (DxState.view === 'WGRAV') {
        document.getElementById('wgrav-val-w').textContent = '1.450 kg';
        document.getElementById('wgrav-val-x').textContent = '12.310 mm';
        document.getElementById('wgrav-val-y').textContent = '-4.120 mm';
        document.getElementById('wgrav-val-z').textContent = '115.600 mm';
        setInfoDisplay('✓ W.GRAV finalizada. Pulse REGISTER.');
        import('./ui.js').then(m => m.selectWgravLine(0));
    }
}

function stepProgram(direction) {
    if (!checkTeachMode('Paso a Paso')) return;
    if (DxState.view === 'WGRAV') {
        if (direction === 'FWD') {
            if (isServoOn) {
                const span = document.getElementById('wgrav-consider');
                if (span && span.textContent === 'CONSIDER') {
                    runWgravMacro();
                } else {
                    setInfoDisplay('⚠ Ponga LOAD SETTING en CONSIDER antes de medir');
                }
            } else {
                setInfoDisplay('⚠ Active el SERVO (ON) para poder mover el manipulador');
            }
        }
        return;
    }
    if (!RobotState.deadman) {
        setInfoDisplay('⚠️ Requiere Deadman (Pulse ESPACIO)'); return;
    }
    const currentProgram = robotJobs[DxState.currentJobId];
    if (!currentProgram || currentProgram.length === 0) return;

    let targetIndex = DxState.selectedLineIndex;
    if (direction === 'FWD' && targetIndex < currentProgram.length - 1) targetIndex++;
    else if (direction === 'BWD' && targetIndex > 0) targetIndex--;
    else return;

    DxState.selectedLineIndex = targetIndex;
    const target = currentProgram[targetIndex];

    const startAngles = { ...RobotState.angles };
    const startGripper = gripperAngle;
    let p = 0;
    const stepAnim = setInterval(() => {
        p += 0.1;
        if (p >= 1.0) { p = 1.0; clearInterval(stepAnim); }
        RobotState.angles.s = startAngles.s + (target.s - startAngles.s) * p;
        RobotState.angles.l = startAngles.l + (target.l - startAngles.l) * p;
        RobotState.angles.u = startAngles.u + (target.u - startAngles.u) * p;
        RobotState.angles.r = startAngles.r + (target.r - startAngles.r) * p;
        RobotState.angles.b = startAngles.b + (target.b - startAngles.b) * p;
        RobotState.angles.t = startAngles.t + (target.t - startAngles.t) * p;
        if (target.gripper !== undefined) {
            gripperAngle = startGripper + (target.gripper - startGripper) * p;
        }
    }, 30);

    DxState.selectedTokenIndex = 0;
    if (DxState.view !== 'JOB') setView('JOB');
    else renderJob();
    setInfoDisplay(direction === 'FWD' ? '⏭️ FWD: Avance a paso ' + targetIndex : '⏮️ BWD: Retroceso a paso ' + targetIndex);
}

import { isServoOn, wgravCompleted } from './state.js';

export {
    renderJob, renderList, createNewJob, pressEnter, startProgram, stepProgram, runWgravMacro
};
