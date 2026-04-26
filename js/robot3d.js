/**
 * DX-200 Robot Simulator - Three.js 3D Renderer
 */

import { RobotState } from './state.js';

let scene, camera, renderer;
let robotGroup, joints = [];
let gripperGroup = null;
let scissorGroup = null;
let startTime = Date.now();
let cameraDistance = 1.2;
let cameraAngleX = 0.25;
let cameraAngleY = 0.5;
let cameraTargetX = 0.15;
let cameraTargetY = 0.1;
let cameraTargetZ = 0;
let isDragging = false, isPanning = false, dragStartX = 0, dragStartY = 0;
let activeJoint = -1, activeJointTimeout, highlightLight = null;

function initRenderer(canvas) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x788896);

    camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    updateCameraPosition();

    renderer = new THREE.WebGLRenderer({ antialias: true, canvas, preserveDrawingBuffer: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.shadowMap.enabled = true;

    const light1 = new THREE.DirectionalLight(0xffffff, 1.0);
    light1.position.set(5, 8, 5);
    light1.castShadow = true;
    light1.shadow.mapSize.width = 2048;
    light1.shadow.mapSize.height = 2048;
    light1.shadow.camera.far = 20;
    scene.add(light1);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 0.4));
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    const backLight = new THREE.DirectionalLight(0xffffff, 0.6);
    backLight.position.set(-5, 3, -5);
    scene.add(backLight);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(4, 4),
        new THREE.ShadowMaterial({ opacity: 0.4 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    buildRobot();
    setupCanvasEvents(canvas);
}

function buildRobot() {
    robotGroup = new THREE.Group();
    scene.add(robotGroup);

    const yBlue = 0x0077C8;
    const yGrey = 0x888CA0;
    const yDark = 0x333333;

    const floorPlateGeom = new THREE.BoxGeometry(0.6, 0.02, 0.6);
    const floorPlateMat = new THREE.MeshPhongMaterial({ color: 0x444444, shininess: 90, specular: 0x444444 });
    const floorPlate = new THREE.Mesh(floorPlateGeom, floorPlateMat);
    floorPlate.receiveShadow = true;
    floorPlate.position.y = 0.01;
    scene.add(floorPlate);

    const baseGeom = new THREE.CylinderGeometry(0.14, 0.18, 0.12, 32);
    const baseMat = new THREE.MeshPhongMaterial({ color: yBlue, shininess: 90, specular: 0x444444 });
    const base = new THREE.Mesh(baseGeom, baseMat);
    base.castShadow = true;
    base.receiveShadow = true;
    base.position.y = 0.08;
    robotGroup.add(base);

    const baseStructGeom = new THREE.CylinderGeometry(0.12, 0.14, 0.20, 32);
    const baseStructMat = new THREE.MeshPhongMaterial({ color: yBlue, shininess: 90 });
    const baseStruct = new THREE.Mesh(baseStructGeom, baseStructMat);
    baseStruct.castShadow = true;
    baseStruct.position.y = 0.20;
    robotGroup.add(baseStruct);

    const sMotorGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 16);
    const sMotor = new THREE.Mesh(sMotorGeo, new THREE.MeshPhongMaterial({ color: yDark, shininess: 90 }));
    sMotor.rotation.z = Math.PI / 2;
    sMotor.position.set(-0.15, 0.20, 0);
    robotGroup.add(sMotor);

    const joint0 = new THREE.Group();
    joint0.position.y = 0.30;
    robotGroup.add(joint0);

    const shoulderGeom = new THREE.CylinderGeometry(0.10, 0.10, 0.14, 24);
    const shoulder = new THREE.Mesh(shoulderGeom, new THREE.MeshPhongMaterial({ color: yBlue, shininess: 90 }));
    shoulder.castShadow = true;
    shoulder.position.y = 0;
    joint0.add(shoulder);

    const lMotor = new THREE.Mesh(sMotorGeo, new THREE.MeshPhongMaterial({ color: yDark, shininess: 90 }));
    lMotor.position.set(0, 0, -0.12);
    lMotor.rotation.x = Math.PI / 2;
    joint0.add(lMotor);

    const joint1 = new THREE.Group();
    joint1.position.y = 0.04;
    joint0.add(joint1);

    const upperArmGeom = new THREE.CylinderGeometry(0.045, 0.07, 0.38, 16);
    const upperArm = new THREE.Mesh(upperArmGeom, new THREE.MeshPhongMaterial({ color: yBlue, shininess: 90 }));
    upperArm.castShadow = true;
    upperArm.rotation.z = Math.PI / 2;
    upperArm.position.x = 0.19;
    joint1.add(upperArm);

    const elbowJoint = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.11, 16),
        new THREE.MeshPhongMaterial({ color: yGrey, shininess: 90 })
    );
    elbowJoint.castShadow = true;
    elbowJoint.rotation.x = Math.PI / 2;
    elbowJoint.position.x = 0.38;
    joint1.add(elbowJoint);

    const uMotor = new THREE.Mesh(sMotorGeo, new THREE.MeshPhongMaterial({ color: yDark, shininess: 90 }));
    uMotor.position.set(0.38, 0, 0.10);
    uMotor.rotation.x = Math.PI / 2;
    joint1.add(uMotor);

    joints.push(joint0);
    joints.push(joint1);

    const joint2 = new THREE.Group();
    joint2.position.x = 0.38;
    joint1.add(joint2);

    const foreArmGeom = new THREE.CylinderGeometry(0.035, 0.045, 0.35, 16);
    const foreArm = new THREE.Mesh(foreArmGeom, new THREE.MeshPhongMaterial({ color: yBlue, shininess: 90 }));
    foreArm.castShadow = true;
    foreArm.rotation.z = Math.PI / 2;
    foreArm.position.x = 0.175;
    joint2.add(foreArm);

    const wristBase = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 16, 16),
        new THREE.MeshPhongMaterial({ color: yGrey, shininess: 90 })
    );
    wristBase.castShadow = true;
    wristBase.position.x = 0.35;
    joint2.add(wristBase);

    joints.push(joint2);

    const joint3 = new THREE.Group();
    joint3.position.x = 0.35;
    joint2.add(joint3);

    const wristAdapter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16),
        new THREE.MeshPhongMaterial({ color: yBlue, shininess: 90 })
    );
    wristAdapter.castShadow = true;
    wristAdapter.rotation.x = Math.PI / 2;
    joint3.add(wristAdapter);

    joints.push(joint3);

    const joint4 = new THREE.Group();
    joint4.position.z = 0;
    joint3.add(joint4);

    const toolAdapterGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.03, 16);
    const toolAdapter = new THREE.Mesh(toolAdapterGeom, new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 90 }));
    toolAdapter.castShadow = true;
    toolAdapter.rotation.z = Math.PI / 2;
    toolAdapter.position.x = 0.035;
    joint4.add(toolAdapter);

    joints.push(joint4);

    const joint5 = new THREE.Group();
    joint5.position.x = 0.05;
    joint4.add(joint5);

    joints.push(joint5);

    gripperGroup = new THREE.Group();
    gripperGroup.position.x = 0.08;
    gripperGroup.position.z = 0.05;
    gripperGroup.rotation.x = Math.PI / 2;
    joint5.add(gripperGroup);

    const gripperBaseGeom = new THREE.BoxGeometry(0.020, 0.030, 0.050);
    const gripperBaseMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 90 });
    const gripperBase = new THREE.Mesh(gripperBaseGeom, gripperBaseMat);
    gripperBase.castShadow = true;
    gripperGroup.add(gripperBase);

    const fingerMat = new THREE.MeshPhongMaterial({ color: 0xdd8844, shininess: 90, specular: 0x444444 });

    const fingerTopGeom = new THREE.BoxGeometry(0.008, 0.035, 0.090);
    const fingerTop = new THREE.Mesh(fingerTopGeom, fingerMat);
    fingerTop.castShadow = true;
    fingerTop.position.y = 0.028;
    fingerTop.position.z = 0.065;
    fingerTop.userData.isPinza1Top = true;
    gripperGroup.add(fingerTop);

    const fingerBottomGeom = new THREE.BoxGeometry(0.008, 0.035, 0.090);
    const fingerBottom = new THREE.Mesh(fingerBottomGeom, fingerMat);
    fingerBottom.castShadow = true;
    fingerBottom.position.y = -0.028;
    fingerBottom.position.z = 0.065;
    fingerBottom.userData.isPinza1Bottom = true;
    gripperGroup.add(fingerBottom);

    scissorGroup = new THREE.Group();
    scissorGroup.position.x = 0.08;
    scissorGroup.position.z = -0.05;
    scissorGroup.rotation.x = Math.PI / 2;
    joint5.add(scissorGroup);

    const gripper2BaseGeom = new THREE.BoxGeometry(0.020, 0.030, 0.050);
    const gripper2BaseMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 90 });
    const gripper2Base = new THREE.Mesh(gripper2BaseGeom, gripper2BaseMat);
    gripper2Base.castShadow = true;
    scissorGroup.add(gripper2Base);

    const finger2TopGeom = new THREE.BoxGeometry(0.008, 0.035, 0.090);
    const finger2Top = new THREE.Mesh(finger2TopGeom, fingerMat);
    finger2Top.castShadow = true;
    finger2Top.position.y = 0.028;
    finger2Top.position.z = 0.065;
    finger2Top.userData.isPinza2Top = true;
    scissorGroup.add(finger2Top);

    const finger2BottomGeom = new THREE.BoxGeometry(0.008, 0.035, 0.090);
    const finger2Bottom = new THREE.Mesh(finger2BottomGeom, fingerMat);
    finger2Bottom.castShadow = true;
    finger2Bottom.position.y = -0.028;
    finger2Bottom.position.z = 0.065;
    finger2Bottom.userData.isPinza2Bottom = true;
    scissorGroup.add(finger2Bottom);
}

function highlightJoint(index) {
    if (activeJoint >= 0 && joints[activeJoint]) {
        joints[activeJoint].children.forEach(child => {
            if (child.isMesh) {
                if (child.userData.origColor !== undefined) {
                    child.material.color.setHex(child.userData.origColor);
                }
                child.material.emissive.setHex(0x000000);
            }
        });
        if (highlightLight) {
            scene.remove(highlightLight);
            highlightLight = null;
        }
    }

    activeJoint = index;
    if (joints[index]) {
        joints[index].children.forEach(child => {
            if (child.isMesh) {
                if (child.userData.origColor === undefined) {
                    child.userData.origColor = child.material.color.getHex();
                }
                child.material.color.setHex(0xff0000);
                child.material.emissive.setHex(0x880000);
            }
        });
        const worldPos = new THREE.Vector3();
        joints[index].getWorldPosition(worldPos);
        highlightLight = new THREE.PointLight(0xff0000, 2.5, 0.6);
        highlightLight.position.copy(worldPos);
        scene.add(highlightLight);
    }

    clearTimeout(activeJointTimeout);
    activeJointTimeout = setTimeout(() => {
        if (activeJoint >= 0 && joints[activeJoint]) {
            joints[activeJoint].children.forEach(child => {
                if (child.isMesh) {
                    if (child.userData.origColor !== undefined) {
                        child.material.color.setHex(child.userData.origColor);
                    }
                    child.material.emissive.setHex(0x000000);
                }
            });
        }
        if (highlightLight) {
            scene.remove(highlightLight);
            highlightLight = null;
        }
        activeJoint = -1;
    }, 1200);
}

function updateCameraPosition() {
    const x = cameraTargetX + Math.sin(cameraAngleY) * Math.cos(cameraAngleX) * cameraDistance;
    const y = cameraTargetY + Math.sin(cameraAngleX) * cameraDistance;
    const z = cameraTargetZ + Math.cos(cameraAngleY) * Math.cos(cameraAngleX) * cameraDistance;
    camera.position.set(x, y, z);
    camera.lookAt(cameraTargetX, cameraTargetY, cameraTargetZ);
}

function setupCanvasEvents(canvas) {
    window.addEventListener('resize', () => {
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        cameraDistance = Math.max(0.5, Math.min(2, cameraDistance + (e.deltaY > 0 ? 0.05 : -0.05)));
        updateCameraPosition();
    }, { passive: false });

    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { isDragging = true; isPanning = false; }
        else if (e.button === 2 || e.button === 1) { isPanning = true; isDragging = false; }
        dragStartX = e.clientX;
        dragStartY = e.clientY;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            cameraAngleY += (e.clientX - dragStartX) * 0.005;
            cameraAngleX -= (e.clientY - dragStartY) * 0.005;
            cameraAngleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraAngleX));
            updateCameraPosition();
            dragStartX = e.clientX;
            dragStartY = e.clientY;
        } else if (isPanning) {
            const rightX = Math.cos(cameraAngleY);
            const rightZ = -Math.sin(cameraAngleY);
            const dx = (e.clientX - dragStartX) * 0.002;
            const dy = (e.clientY - dragStartY) * 0.002;
            cameraTargetX -= rightX * dx;
            cameraTargetZ -= rightZ * dx;
            cameraTargetY += dy;
            updateCameraPosition();
            dragStartX = e.clientX;
            dragStartY = e.clientY;
        }
    });

    window.addEventListener('mouseup', () => { isDragging = false; isPanning = false; });

    let lastDistance = 0;
    let lastTouchCenter = { x: 0, y: 0 };

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true; isPanning = false;
            dragStartX = e.touches[0].clientX;
            dragStartY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
            isDragging = false; isPanning = true;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastDistance = Math.sqrt(dx * dx + dy * dy);
            lastTouchCenter.x = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            lastTouchCenter.y = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (e.touches.length === 1 && isDragging) {
            cameraAngleY += (e.touches[0].clientX - dragStartX) * 0.005;
            cameraAngleX -= (e.touches[0].clientY - dragStartY) * 0.005;
            cameraAngleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraAngleX));
            updateCameraPosition();
            dragStartX = e.touches[0].clientX;
            dragStartY = e.touches[0].clientY;
        } else if (e.touches.length === 2 && isPanning) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const deltaRadius = distance - lastDistance;
            cameraDistance = Math.max(0.5, Math.min(2.5, cameraDistance - (deltaRadius * 0.01)));

            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            const dxPan = (centerX - lastTouchCenter.x) * 0.002;
            const dyPan = (centerY - lastTouchCenter.y) * 0.002;
            const rightX = Math.cos(cameraAngleY);
            const rightZ = -Math.sin(cameraAngleY);
            cameraTargetX -= rightX * dxPan;
            cameraTargetZ -= rightZ * dxPan;
            cameraTargetY += dyPan;
            updateCameraPosition();
            lastDistance = distance;
            lastTouchCenter.x = centerX;
            lastTouchCenter.y = centerY;
        }
    }, { passive: false });

    canvas.addEventListener('touchend', () => { isDragging = false; isPanning = false; lastDistance = 0; });
}

function updateRobotDisplay() {
    if (joints.length >= 6) {
        joints[0].rotation.z = RobotState.angles.s * Math.PI / 180;
        joints[1].rotation.x = RobotState.angles.l * Math.PI / 180;
        joints[2].rotation.x = RobotState.angles.u * Math.PI / 180;
        joints[3].rotation.z = RobotState.angles.r * Math.PI / 180;
        joints[4].rotation.x = RobotState.angles.b * Math.PI / 180;
        joints[5].rotation.z = RobotState.angles.t * Math.PI / 180;

        if (gripperGroup) {
            gripperGroup.children.forEach(child => {
                if (child.userData.isPinza1Top) child.position.y = 0.028 + RobotState.gripperAngle;
                else if (child.userData.isPinza1Bottom) child.position.y = -0.028 - RobotState.gripperAngle;
            });
        }
        if (scissorGroup) {
            scissorGroup.children.forEach(child => {
                if (child.userData.isPinza2Top) child.position.y = 0.028 + RobotState.gripper2Angle;
                else if (child.userData.isPinza2Bottom) child.position.y = -0.028 - RobotState.gripper2Angle;
            });
        }
    }
    renderer.render(scene, camera);

    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const elRuntime = document.getElementById('runtime');
    if (elRuntime) elRuntime.textContent =
        String(Math.floor(elapsed / 60)).padStart(2, '0') + ':' + String(elapsed % 60).padStart(2, '0');
}

export {
    initRenderer, updateRobotDisplay, highlightJoint, updateCameraPosition, cameraAngleY, cameraAngleX,
    cameraDistance, cameraTargetX, cameraTargetY, cameraTargetZ, joints, scene, startTime
};
