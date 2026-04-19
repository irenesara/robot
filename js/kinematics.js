/**
 * DX-200 Robot Simulator - Advanced Kinematics Engine (IK/FK)
 */

/**
 * Calculates Forward Kinematics for a 6-DOF industrial robot.
 * Returns the position and orientation of the TCP.
 */
window.calculateFK = function(angles) {
    // DH Parameters (Simplified for the ES200N model used in robot3d.js)
    // Note: This matches the offsets defined in buildRobot()
    const d1 = 0.30; // Height of base to L
    const a1 = 0;
    const a2 = 0.38; // Length of upper arm
    const a3 = 0.35; // Length of forearm
    const d4 = 0;
    const d6 = 0.05; // Wrist flange offset

    const s = THREE.MathUtils.degToRad(angles.s);
    const l = THREE.MathUtils.degToRad(angles.l);
    const u = THREE.MathUtils.degToRad(angles.u);
    const r = THREE.MathUtils.degToRad(angles.r);
    const b = THREE.MathUtils.degToRad(angles.b);
    const t = THREE.MathUtils.degToRad(angles.t);

    // Using a simplified model matching the visual structure
    // S-Axis (Z-Rot) -> L-Axis (X-Rot) -> U-Axis (X-Rot) -> R-Axis (Z-Rot) -> B-Axis (X-Rot) -> T-Axis (Z-Rot)
    
    let m = new THREE.Matrix4();
    
    // Base to Joint 0 (S)
    m.multiply(new THREE.Matrix4().makeRotationZ(s));
    m.multiply(new THREE.Matrix4().makeTranslation(0, 0, d1));
    
    // Joint 0 to Joint 1 (L)
    m.multiply(new THREE.Matrix4().makeRotationX(l));
    
    // Joint 1 to Joint 2 (U)
    m.multiply(new THREE.Matrix4().makeTranslation(0, a2, 0));
    m.multiply(new THREE.Matrix4().makeRotationX(u));
    
    // Joint 2 to Joint 3 (R)
    m.multiply(new THREE.Matrix4().makeTranslation(0, a3, 0));
    m.multiply(new THREE.Matrix4().makeRotationZ(r));
    
    // Joint 3 to Joint 4 (B)
    m.multiply(new THREE.Matrix4().makeRotationX(b));
    
    // Joint 4 to Joint 5 (T)
    m.multiply(new THREE.Matrix4().makeTranslation(0, 0, d6));
    m.multiply(new THREE.Matrix4().makeRotationZ(t));

    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    m.decompose(pos, quat, scale);

    const rot = new THREE.Euler().setFromQuaternion(quat);

    return {
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rx: THREE.MathUtils.radToDeg(rot.x),
        ry: THREE.MathUtils.radToDeg(rot.y),
        rz: THREE.MathUtils.radToDeg(rot.z)
    };
};

/**
 * Solves Inverse Kinematics for a small linear step.
 * Uses Damped Least Squares (DLS) to find joint increments.
 */
window.solveCartesianStep = function(currentAngles, delta) {
    const damping = 0.01;
    const jointKeys = ['s', 'l', 'u', 'r', 'b', 't'];
    const epsilon = 0.0001;
    
    // 1. Get current TCP position
    const currentTCP = window.calculateFK(currentAngles);
    
    // 2. Compute Jacobian numerically (6x6 for position and orientation)
    let jacobian = []; // 6 rows (x,y,z,rx,ry,rz) x 6 columns (s,l,u,r,b,t)
    for (let i = 0; i < 6; i++) jacobian[i] = new Array(6).fill(0);

    for (let j = 0; j < 6; j++) {
        const tempAngles = { ...currentAngles };
        tempAngles[jointKeys[j]] += epsilon;
        const nextTCP = window.calculateFK(tempAngles);
        
        jacobian[0][j] = (nextTCP.x - currentTCP.x) / epsilon;
        jacobian[1][j] = (nextTCP.y - currentTCP.y) / epsilon;
        jacobian[2][j] = (nextTCP.z - currentTCP.z) / epsilon;
        
        // Handling angle wrap-around for numerical derivatives
        let drx = nextTCP.rx - currentTCP.rx;
        let dry = nextTCP.ry - currentTCP.ry;
        let drz = nextTCP.rz - currentTCP.rz;
        if (drx > 180) drx -= 360; if (drx < -180) drx += 360;
        if (dry > 180) dry -= 360; if (dry < -180) dry += 360;
        if (drz > 180) drz -= 360; if (drz < -180) drz += 360;

        jacobian[3][j] = THREE.MathUtils.degToRad(drx) / epsilon;
        jacobian[4][j] = THREE.MathUtils.degToRad(dry) / epsilon;
        jacobian[5][j] = THREE.MathUtils.degToRad(drz) / epsilon;
    }

    // 3. Solve J * dQ = delta using DLS
    // We want dQ = (J^T * J + lambda^2 * I)^-1 * J^T * delta
    
    // Compute JTJ = J^T * J (6x6)
    let JTJ = [];
    for (let i = 0; i < 6; i++) {
        JTJ[i] = new Array(6).fill(0);
        for (let j = 0; j < 6; j++) {
            for (let k = 0; k < 6; k++) {
                JTJ[i][j] += jacobian[k][i] * jacobian[k][j];
            }
            if (i === j) JTJ[i][j] += damping * damping;
        }
    }

    // Compute JTy = J^T * delta (6x1)
    let JTy = new Array(6).fill(0);
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
            // Note: delta index matches Jacobian rows 0-5
            JTy[i] += jacobian[j][i] * delta[j];
        }
    }

    // Solve JTJ * dQ = JTy using simple Gaussian elimination
    let dQ = solveLinearSystem6x6(JTJ, JTy);
    if (!dQ) return null;

    // 4. Update angles
    const newAngles = { ...currentAngles };
    for (let i = 0; i < 6; i++) {
        newAngles[jointKeys[i]] += dQ[i];
    }
    
    // Sanity check
    for (let k of jointKeys) if (isNaN(newAngles[k])) return null;

    return newAngles;
};

/**
 * Gaussian elimination for 6x6 system
 */
function solveLinearSystem6x6(A, b) {
    let n = 6;
    for (let i = 0; i < n; i++) {
        let max = i;
        for (let j = i + 1; j < n; j++) {
            if (Math.abs(A[j][i]) > Math.abs(A[max][i])) max = j;
        }
        let tempA = A[i]; A[i] = A[max]; A[max] = tempA;
        let tempB = b[i]; b[i] = b[max]; b[max] = tempB;

        if (Math.abs(A[i][i]) < 1e-12) return null;

        for (let j = i + 1; j < n; j++) {
            let f = A[j][i] / A[i][i];
            b[j] -= f * b[i];
            for (let k = i; k < n; k++) A[j][k] -= f * A[i][k];
        }
    }
    let x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) {
        let s = 0;
        for (let j = i + 1; j < n; j++) s += A[i][j] * x[j];
        x[i] = (b[i] - s) / A[i][i];
    }
    return x;
}

};

window.calculateFK = calculateFK;
window.solveCartesianStep = solveCartesianStep;
