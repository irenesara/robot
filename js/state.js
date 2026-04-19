/**
 * DX-200 Robot Simulator - Application State
 * Unificado para compatibilidad entre index.html y módulos JS
 */

// Intentar recuperar el estado global si ya existe (de index.html), si no, crearlo
window.RobotState = window.RobotState || {
    deadman: false,
    speed: 50,
    angles: { s: 0, l: 0, u: 0, r: 0, b: 0, t: 0 },
    limits: {
        s: { min: -170, max: 170 },
        l: { min: -120, max: 120 },
        u: { min: -120, max: 120 },
        r: { min: -190, max: 190 },
        b: { min: -120, max: 120 },
        t: { min: -360, max: 360 }
    },
    programRunning: false,
    programStep: 0,
    stepTimer: 0,
    mode: 'TEACH'
};

window.DxState = window.DxState || {
    view: 'JOB',
    coordSystem: 'JOINT', // MANTENER: JOINT, WORLD, TOOL
    currentToolNo: 0,
    currentJobId: 'JOB_ALAMBRE',
    selectedLineIndex: 0,
    selectedListIndex: 0,
    selectedTokenIndex: 0,
    isInserting: false,
    isDeleting: false,
    isModifying: false,
    activeEditAction: null,
    editingBuffer: '',
    securityMode: 'EDITING',
    clipboard: null
};

// Referencias locales para mantener compatibilidad con los imports de otros módulos
const RobotState = window.RobotState;
const DxState = window.DxState;

let robotJobs = {
    "JOB_ALAMBRE": [
        { s: 0, l: -30, u: 60, r: 0, b: 0, t: 0, gripper: 0, code: 'NOP', desc: 'INICIO' },
        { s: 30, l: -20, u: 50, r: 0, b: -45, t: 0, gripper: 0, code: 'MOVJ VJ=50.00', desc: 'IR A ROLLO HILO' },
        { s: 30, l: -40, u: 70, r: 0, b: -90, t: 0, gripper: 0, code: 'MOVJ VJ=25.00', desc: 'BAJAR A HILO' },
        { s: 30, l: -40, u: 70, r: 0, b: -90, t: 0, gripper: 0.015, code: 'TIMER T=0.5', desc: 'CERRAR PINZA (COGER)' },
        { s: 30, l: -20, u: 50, r: 0, b: -45, t: 0, gripper: 0.015, code: 'MOVJ VJ=10.00', desc: 'TENSAR SUAVE' },
        { s: 0, l: -20, u: 50, r: 90, b: -45, t: -90, gripper: 0.015, code: 'MOVJ VJ=50.00', desc: 'TIRAR Y ENROLLAR' },
        { s: -45, l: -10, u: 40, r: 180, b: 0, t: -180, gripper: 0.015, code: 'MOVJ VJ=50.00', desc: 'ARRASTRAR LARGO' },
        { s: -45, l: -10, u: 40, r: 180, b: 0, t: -180, gripper: 0, code: 'TIMER T=0.5', desc: 'SOLTAR ALAMBRE' },
        { s: -45, l: -30, u: 60, r: 0, b: 0, t: 0, gripper: 0, code: 'MOVJ VJ=100.00', desc: 'RETORNO SEGURO' },
        { s: 0, l: -30, u: 60, r: 0, b: 0, t: 0, gripper: 0, code: 'END', desc: 'FIN BUCLE' }
    ]
};

let wgravSelectedIdx = 0;
let wgravCompleted = [false, false, false, false, false];
let isShiftPressed = false;
let isServoOn = false;
let keyPosition = 0;
const keyPositions = ['OFF', 'REMOTE', 'TEACH'];
const keyRotations = [0, -120, 120];
let gripperAngle = 0;
let gripper2Angle = 0;

function saveJobsLocally() {
    try {
        localStorage.setItem('dx200_robotJobs', JSON.stringify(robotJobs));
    } catch (e) { console.error("Error al guardar trabajos", e); }
}

function loadJobsLocally() {
    try {
        const saved = localStorage.getItem('dx200_robotJobs');
        if (saved) {
            let parsed = JSON.parse(saved);
            if (!parsed['JOB_ALAMBRE']) parsed['JOB_ALAMBRE'] = robotJobs['JOB_ALAMBRE'];
            robotJobs = parsed;
        }
    } catch (e) { console.error("Error al cargar trabajos", e); }
}

export {
    RobotState, DxState, robotJobs, wgravSelectedIdx, wgravCompleted,
    isShiftPressed, isServoOn, keyPosition, keyPositions, keyRotations,
    gripperAngle, gripper2Angle, saveJobsLocally, loadJobsLocally
};
