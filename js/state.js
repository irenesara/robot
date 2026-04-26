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
    mode: 'TEACH',
    gripperAngle: 0,
    gripper2Angle: 0
};

window.DxState = window.DxState || {
    view: 'JOB',
    coordSystem: 'JOINT', // MANTENER: JOINT, WORLD, TOOL
    currentToolNo: 0,
    currentJobId: 'JOB_NUEVO',
    selectedLineIndex: 0,
    selectedListIndex: 0,
    selectedTokenIndex: 0,
    isInserting: false,
    isDeleting: false,
    isModifying: false,
    activeEditAction: null,
    editingBuffer: '',
    securityMode: 'EDITING',
    clipboard: null,
    selectedLines: null,
    language: 'en' // Default to English as per user request
};

// Referencias locales para mantener compatibilidad con los imports de otros módulos
const RobotState = window.RobotState;
const DxState = window.DxState;

let robotJobs = {
    "JOB_NUEVO": [
        { s: 0, l: -60, u: 60, r: 0, b: 0, t: 0, gripper: 0, gripper2: 0, code: 'NOP', desc: 'INICIO' },
        { s: 45, l: -20, u: 40, r: 0, b: -45, t: 0, gripper: 0, gripper2: 0, code: 'MOVJ VJ=50.00 PL=4', desc: 'IR ZONA A' },
        { s: 45, l: -40, u: 60, r: 0, b: -90, t: 0, gripper: 0, gripper2: 0, code: 'MOVL V=25.00 PL=0', desc: 'BAJAR A ZONA A' },
        { s: 45, l: -40, u: 60, r: 0, b: -90, t: 0, gripper: 0.015, gripper2: 0, code: 'DOUT OG#(1) ON', desc: 'COGER OBJETO 1' },
        { s: 45, l: -40, u: 60, r: 0, b: -90, t: 0, gripper: 0.015, gripper2: 0, code: 'TIMER T=0.5', desc: 'ESPERAR' },
        { s: 0, l: 0, u: 30, r: 0, b: -45, t: 0, gripper: 0.015, gripper2: 0, code: 'MOVJ VJ=50.00 PL=4', desc: 'PASAR POR CENTRO' },
        { s: -45, l: -20, u: 40, r: 90, b: -45, t: 90, gripper: 0.015, gripper2: 0, code: 'MOVJ VJ=50.00 PL=2', desc: 'IR ZONA B' },
        { s: -45, l: -40, u: 60, r: 90, b: -90, t: 90, gripper: 0.015, gripper2: 0, code: 'MOVL V=50.00 PL=0', desc: 'BAJAR A ZONA B' },
        { s: -45, l: -40, u: 60, r: 90, b: -90, t: 90, gripper: 0.015, gripper2: 0.015, code: 'DOUT OG#(2) ON', desc: 'COGER OBJETO 2' },
        { s: -45, l: -40, u: 60, r: 90, b: -90, t: 90, gripper: 0.015, gripper2: 0.015, code: 'TIMER T=0.5', desc: 'ESPERAR' },
        { s: 0, l: -60, u: 60, r: 0, b: 0, t: 0, gripper: 0, gripper2: 0, code: 'MOVJ VJ=100.00 PL=0', desc: 'SOLTAR Y VOLVER' },
        { s: 0, l: -60, u: 60, r: 0, b: 0, t: 0, gripper: 0, gripper2: 0, code: 'END', desc: 'FIN PROGRAMA' }
    ]
};

let wgravSelectedIdx = 0;
let wgravCompleted = [false, false, false, false, false];
let isShiftPressed = false;
let isServoOn = false;
let keyPosition = 0;
const keyPositions = ['OFF', 'REMOTE', 'TEACH'];
const keyRotations = [0, -120, 120];

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
            if (!parsed['JOB_NUEVO']) parsed['JOB_NUEVO'] = robotJobs['JOB_NUEVO'];
            robotJobs = parsed;
        }
    } catch (e) { console.error("Error al cargar trabajos", e); }
}

export {
    RobotState, DxState, robotJobs, wgravSelectedIdx, wgravCompleted,
    isShiftPressed, isServoOn, keyPosition, keyPositions, keyRotations,
    saveJobsLocally, loadJobsLocally
};
