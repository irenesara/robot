/**
 * DX-200 Robot Simulator - Main Entry Point
 */

import { RobotState, DxState, robotJobs, loadJobsLocally } from './state.js';
import { initRenderer, updateRobotDisplay } from './robot3d.js';
import {
    setView, toggleDeadman, toggleShift, rotateKeySwitch, updateKeySwitchDisplay,
    emergencyStop, handleFunc, toggleDropdown, closeHomeConfirm, handleEditAction,
    pressSelect, pressModify, pressInsert, pressDelete, handleDir, moveAxis,
    showMsg, setSpeed, toggleServo, setMode, goToTop, resetToZero,
    checkTeachMode, selectWgravLine, selectHomeAxis, setSecurityMode, toggleLanguage, handleLanguageBtn
} from './ui.js';
import { updateLcdLanguage } from './lang.js';
import { renderJob, startProgram, stepProgram } from './jobManager.js';

loadJobsLocally();

window.addEventListener('load', () => {
    const canvas = document.getElementById('canvas');
    initRenderer(canvas);
    updateLcdLanguage();
    renderJob();
    updateKeySwitchDisplay();

    function gameLoop() {
        requestAnimationFrame(gameLoop);

        const currentProgram = robotJobs[DxState.currentJobId];
        if (RobotState.programRunning && currentProgram && currentProgram.length > 0) {
            const step = currentProgram[RobotState.programStep];
            const isTimer = (step.code || '').startsWith('TIMER');
            const targetGripper = step.gripper !== undefined ? step.gripper : RobotState.gripperAngle;
            const targetGripper2 = step.gripper2 !== undefined ? step.gripper2 : RobotState.gripper2Angle;

            if (isTimer) {
                RobotState.stepTimer++;
                let maxFrames = 30;
                let match = (step.code || '').match(/T=([\d\.]+)/);
                if (match && match[1]) maxFrames = parseFloat(match[1]) * 60;

                RobotState.gripperAngle += (targetGripper - RobotState.gripperAngle) * 0.15;
                RobotState.gripper2Angle += (targetGripper2 - RobotState.gripper2Angle) * 0.15;

                if (RobotState.stepTimer > maxFrames) {
                    RobotState.stepTimer = 0;
                    RobotState.programStep++;
                    if (RobotState.programStep >= currentProgram.length) {
                        RobotState.programStep = 0;
                        document.getElementById('infoDisplay').textContent = '🔄 REINICIANDO BUCLE';
                    }
                    DxState.selectedLineIndex = RobotState.programStep;
                    if (DxState.view === 'JOB') renderJob();
                }
            } else {
                const lerpFactor = 0.04;
                RobotState.angles.s += (step.s - RobotState.angles.s) * lerpFactor;
                RobotState.angles.l += (step.l - RobotState.angles.l) * lerpFactor;
                RobotState.angles.u += (step.u - RobotState.angles.u) * lerpFactor;
                RobotState.angles.r += (step.r - RobotState.angles.r) * lerpFactor;
                RobotState.angles.b += (step.b - RobotState.angles.b) * lerpFactor;
                RobotState.angles.t += (step.t - RobotState.angles.t) * lerpFactor;
                RobotState.gripperAngle += (targetGripper - RobotState.gripperAngle) * lerpFactor;
                RobotState.gripper2Angle += (targetGripper2 - RobotState.gripper2Angle) * lerpFactor;

                document.getElementById('lcd-mode').textContent = (RobotState.programStep + 1) + '/' + currentProgram.length;

                let maxError = Math.max(
                    Math.abs(step.s - RobotState.angles.s),
                    Math.abs(step.l - RobotState.angles.l),
                    Math.abs(step.u - RobotState.angles.u),
                    Math.abs(step.r - RobotState.angles.r),
                    Math.abs(step.b - RobotState.angles.b),
                    Math.abs(step.t - RobotState.angles.t)
                );

                let plValue = 0;
                let plMatch = (step.code || '').match(/PL=(\d+)/);
                if (plMatch && plMatch[1]) {
                    plValue = parseInt(plMatch[1]);
                }
                
                // PL=0 means exact stop (threshold 1.0 degrees)
                // PL>0 means smoothing (threshold increases, jumping to next point early)
                let threshold = 1.0 + (plValue * 5.0);

                if (maxError < threshold) {
                    RobotState.programStep++;
                    if (RobotState.programStep >= currentProgram.length) {
                        RobotState.programStep = 0;
                        document.getElementById('infoDisplay').textContent = '🔄 REINICIANDO BUCLE';
                    }
                    DxState.selectedLineIndex = RobotState.programStep;
                    if (DxState.view === 'JOB') renderJob();
                }
            }
        }

        updateRobotDisplay();
    }

    gameLoop();
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') { e.preventDefault(); toggleDeadman(); }
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { toggleShift(true); }
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { toggleShift(false); }
});

window.setView = setView;
window.toggleDeadman = toggleDeadman;
window.toggleShift = toggleShift;
window.rotateKeySwitch = rotateKeySwitch;
window.emergencyStop = emergencyStop;
window.handleFunc = handleFunc;
window.toggleDropdown = toggleDropdown;
window.closeHomeConfirm = closeHomeConfirm;
window.handleEditAction = handleEditAction;
window.pressSelect = pressSelect;
window.pressModify = pressModify;
window.pressInsert = pressInsert;
window.pressDelete = pressDelete;
window.handleDir = handleDir;
window.moveAxis = moveAxis;
window.showMsg = showMsg;
window.setSpeed = setSpeed;
window.toggleServo = toggleServo;
window.setMode = setMode;
window.startProgram = startProgram;
window.stepProgram = stepProgram;
window.goToTop = goToTop;
window.resetToZero = resetToZero;
window.selectHomeAxis = selectHomeAxis;
window.setSecurityMode = setSecurityMode;
window.toggleLanguage = toggleLanguage;
window.handleLanguageBtn = handleLanguageBtn;

