/* ---------- WebGL 3D Scene Engine (oklahomin) ---------- */
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

let scene, camera, renderer;
let mainGroup;       // Houses polar floor grid, skyline towers
let orbitGroup;      // Houses category ring models
let bootLogoGroup;   // Central logo symbol shown on boot stage
let spotlight;       // THREE.PointLight under active category
let spotlightMesh;   // Visual projection floor circle for glow
let particles;
let waveGridMat;
let backEmblem;
const backWallMats = [];

let targetRotation = 0;
let currentRotation = 0;
let currentSpotlightColor = 0xb76dff;

const modelScales = {};

// Helper: Volumetric Hologram Builder (Solid translucent body + glowing edges)
function createHoloModel(geometry, color, fillOpacity = 0.22) {
    const group = new THREE.Group();
    
    // Translucent face mesh with soft Fresnel glow edges
    const meshMat = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(color) },
            opacity: { value: fillOpacity }
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vNormal = normalize(normalMatrix * normal);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            uniform float opacity;
            varying vec3 vNormal;
            varying vec3 vViewPosition;
            void main() {
                vec3 normal = normalize(vNormal);
                vec3 viewDir = normalize(vViewPosition);
                
                // Fresnel term
                float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
                
                float edge = fresnel * 0.75;
                float alpha = opacity * (0.35 + edge);
                vec3 finalColor = color + vec3(edge * 0.25);
                
                gl_FragColor = vec4(finalColor, alpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    const mesh = new THREE.Mesh(geometry, meshMat);
    mesh.userData.baseOpacity = fillOpacity;
    group.add(mesh);

    // Luminous sharp edges
    const edgeGeom = new THREE.EdgesGeometry(geometry);
    const lineMat = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.95
    });
    const edges = new THREE.LineSegments(edgeGeom, lineMat);
    edges.userData.baseLineOpacity = 0.95;
    group.add(edges);

    return group;
}

/* ===== Procedural 3D Category Geometry Builders ===== */

// ABOUT (Person Silhouette - Dome shoulder + head)
function buildAboutModel() {
    const group = new THREE.Group();
    const color = 0xf0dbff;

    const headGeo = new THREE.IcosahedronGeometry(2.4, 0);
    const head = createHoloModel(headGeo, color, 0.26);
    head.position.y = 4.0;
    group.add(head);

    // Shoulder dome (hemisphere cylinder flat face)
    const bodyGeo = new THREE.SphereGeometry(4.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const body = createHoloModel(bodyGeo, color, 0.18);
    body.position.y = -1.2;
    body.rotation.x = Math.PI; // Face downward flat face
    group.add(body);

    return group;
}

// PROJECTS (Volumetric Stacked Boxes)
function buildProjectsModel() {
    const group = new THREE.Group();
    const color = 0xb76dff;

    // Bottom main box
    const baseGeo = new THREE.BoxGeometry(8.5, 5.8, 5.8);
    const base = createHoloModel(baseGeo, color, 0.18);
    base.position.y = -1.5;
    group.add(base);

    // Top stacked smaller box
    const topGeo = new THREE.BoxGeometry(5.2, 4.4, 4.8);
    const top = createHoloModel(topGeo, color, 0.22);
    top.position.set(0, 3.2, 0);
    group.add(top);

    return group;
}

// SOCIALS (Molecular Hub - Purple center sphere + satellites)
function buildSocialsModel() {
    const group = new THREE.Group();
    const color = 0xddb7ff;

    const centerGeo = new THREE.IcosahedronGeometry(3.0, 0);
    const center = createHoloModel(centerGeo, color, 0.26);
    group.add(center);

    const satPositions = [
        new THREE.Vector3(-6.2, -3.2, 0),
        new THREE.Vector3(6.2, -3.2, 0),
        new THREE.Vector3(0, 6.2, 0)
    ];

    satPositions.forEach(pos => {
        const satGeo = new THREE.IcosahedronGeometry(1.6, 0);
        const sat = createHoloModel(satGeo, color, 0.26);
        sat.position.copy(pos);
        group.add(sat);

        // Connection wire
        const pts = [new THREE.Vector3(0, 0, 0), pos];
        const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({
            color: color, transparent: true, opacity: 0.95
        }));
        group.add(line);
    });

    return group;
}

// CONTACTS (Orange Envelope)
function buildContactsModel() {
    const group = new THREE.Group();
    const color = 0xffd28a;

    const envelopeGeo = new THREE.BoxGeometry(9.6, 6.4, 0.8);
    const body = createHoloModel(envelopeGeo, color, 0.16);
    group.add(body);

    // Flap triangular lines
    const lineMat = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.95 });
    const pts = [
        new THREE.Vector3(-4.8, 3.2, 0.42), new THREE.Vector3(0, -1.2, 0.42),
        new THREE.Vector3(4.8, 3.2, 0.42)
    ];
    const flapGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const flapLines = new THREE.Line(flapGeo, lineMat);
    group.add(flapLines);

    return group;
}

// HOME (House model)
function buildHomeModel() {
    const group = new THREE.Group();
    const color = 0xe4e1e6;

    // Base box
    const baseGeo = new THREE.BoxGeometry(7.2, 5.0, 5.0);
    const base = createHoloModel(baseGeo, color, 0.18);
    base.position.y = -1.2;
    group.add(base);

    // Triangular wedge roof shape
    const roofGeom = new THREE.CylinderGeometry(0, 5.0, 3.2, 4, 1, false);
    const roof = createHoloModel(roofGeom, color, 0.22);
    roof.position.y = 2.8;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    return group;
}

/* ===== Category Models for Sub-Rings ===== */

// Project 01: NULL.GLITCH (Glitchy Dodecahedron)
function buildNullGlitchModel() {
    const geom = new THREE.DodecahedronGeometry(3.6, 0);
    return createHoloModel(geom, 0xddb7ff, 0.2);
}
// Project 02: SIGNAL/STACK (Cogs/Plates)
function buildSignalStackModel() {
    const group = new THREE.Group();
    const color = 0x2dd4bf;
    for (let i = 0; i < 3; i++) {
        const cyl = new THREE.CylinderGeometry(4.0 - i * 0.8, 4.0 - i * 0.8, 0.8, 6);
        const ring = createHoloModel(cyl, color, 0.15);
        ring.position.y = -2.0 + i * 1.8;
        group.add(ring);
    }
    return group;
}
// Project 03: AURUM (Golden Torus)
function buildAurumModel() {
    const geom = new THREE.TorusGeometry(3.2, 1.2, 8, 24);
    return createHoloModel(geom, 0xFBBF24, 0.2);
}
// Project 04: KERNEL.OS (Technical Folder Shape)
function buildKernelOSModel() {
    const group = new THREE.Group();
    const color = 0x4ade80;
    const bodyGeo = new THREE.BoxGeometry(8.5, 6.0, 2.5);
    const body = createHoloModel(bodyGeo, color, 0.18);
    group.add(body);

    const tabGeo = new THREE.BoxGeometry(3.5, 1.2, 2.5);
    const tab = createHoloModel(tabGeo, color, 0.22);
    tab.position.set(-2.5, 3.5, 0);
    group.add(tab);
    return group;
}

// Social 01: Telegram (Paper Plane)
function buildTelegramModel() {
    const group = new THREE.Group();
    const color = 0x2dd4bf;

    const geom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        // 0: Nose (front)
        0, 3.6, 0.5,
        // 1: Left wing tip (back-left-up)
        -3.2, -2.8, 0.8,
        // 2: Right wing tip (back-right-up)
        3.2, -2.8, 0.8,
        // 3: Center tail (back-center-up)
        0, -3.0, 0.6,
        // 4: Keel bottom (back-center-down)
        0, -1.6, -1.2
    ]);

    const indices = [
        // Left wing top
        0, 1, 3,
        // Right wing top
        0, 3, 2,
        // Keel left side
        0, 3, 4,
        // Keel right side
        0, 4, 3
    ];

    geom.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    const plane = createHoloModel(geom, color, 0.22);
    plane.rotation.x = Math.PI / 6; // slightly tilted up
    group.add(plane);

    return group;
}
// Social 02: GitHub (Octocat Head Silhouette)
function buildGitHubModel() {
    const group = new THREE.Group();
    const color = 0xe4e1e6;

    const shape = new THREE.Shape();
    // Start at bottom center
    shape.moveTo(0, -3.0);
    // Left cheek
    shape.quadraticCurveTo(-3.5, -3.0, -3.5, 0.0);
    // Left ear base to tip
    shape.quadraticCurveTo(-3.5, 3.2, -2.0, 4.0);
    // Left ear inner edge
    shape.lineTo(-1.2, 2.6);
    // Top head curve between ears
    shape.quadraticCurveTo(0, 3.0, 1.2, 2.6);
    // Right ear tip
    shape.lineTo(2.0, 4.0);
    // Right ear base
    shape.quadraticCurveTo(3.5, 3.2, 3.5, 0.0);
    // Right cheek
    shape.quadraticCurveTo(3.5, -3.0, 0, -3.0);

    const extrudeSettings = {
        depth: 1.2,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.15,
        bevelThickness: 0.15
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.center();

    const logo = createHoloModel(geom, color, 0.24);
    group.add(logo);

    return group;
}
// Social 03: X (Modern Intersecting Bars Logo)
function buildXModel() {
    const group = new THREE.Group();
    const color = 0xddb7ff;

    const extrudeSettings = {
        depth: 1.0,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.1,
        bevelThickness: 0.1
    };

    // 1. Main thick diagonal bar (top-left to bottom-right)
    const thickShape = new THREE.Shape();
    thickShape.moveTo(-2.8, 2.8);
    thickShape.lineTo(-1.4, 2.8);
    thickShape.lineTo(2.8, -2.8);
    thickShape.lineTo(1.4, -2.8);
    thickShape.closePath();
    const thickGeom = new THREE.ExtrudeGeometry(thickShape, extrudeSettings);
    thickGeom.center();
    const thickMesh = createHoloModel(thickGeom, color, 0.22);
    group.add(thickMesh);

    // 2. Left side of the outline thin bar (top-right to bottom-left)
    const thinShape1 = new THREE.Shape();
    thinShape1.moveTo(1.4, 2.8);
    thinShape1.lineTo(1.7, 2.8);
    thinShape1.lineTo(-1.1, -2.8);
    thinShape1.lineTo(-1.4, -2.8);
    thinShape1.closePath();
    const thinGeom1 = new THREE.ExtrudeGeometry(thinShape1, extrudeSettings);
    thinGeom1.center();
    const thinMesh1 = createHoloModel(thinGeom1, color, 0.22);
    group.add(thinMesh1);

    // 3. Right side of the outline thin bar
    const thinShape2 = new THREE.Shape();
    thinShape2.moveTo(2.5, 2.8);
    thinShape2.lineTo(2.8, 2.8);
    thinShape2.lineTo(0.0, -2.8);
    thinShape2.lineTo(-0.3, -2.8);
    thinShape2.closePath();
    const thinGeom2 = new THREE.ExtrudeGeometry(thinShape2, extrudeSettings);
    thinGeom2.center();
    const thinMesh2 = createHoloModel(thinGeom2, color, 0.22);
    group.add(thinMesh2);

    return group;
}

// Social 04: TikTok (Music Note)
function buildTikTokModel() {
    const group = new THREE.Group();
    const color = 0xff2a7f;

    const shape = new THREE.Shape();
    shape.absarc(-1.0, -1.5, 2.0, 0, Math.PI * 2, false);

    const stem = new THREE.Shape();
    stem.moveTo(0.2, -1.5);
    stem.lineTo(1.2, -1.5);
    stem.lineTo(1.2, 3.2);
    stem.lineTo(0.2, 3.2);
    stem.closePath();

    const flag = new THREE.Shape();
    flag.moveTo(1.2, 2.0);
    flag.quadraticCurveTo(2.8, 2.0, 3.0, 3.2);
    flag.lineTo(2.0, 3.2);
    flag.quadraticCurveTo(1.8, 2.6, 1.2, 2.6);
    flag.closePath();

    const extrudeSettings = {
        depth: 1.2,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.15,
        bevelThickness: 0.15
    };

    const geomBase = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const geomStem = new THREE.ExtrudeGeometry(stem, extrudeSettings);
    const geomFlag = new THREE.ExtrudeGeometry(flag, extrudeSettings);

    const baseMesh = createHoloModel(geomBase, color, 0.22);
    const stemMesh = createHoloModel(geomStem, color, 0.22);
    const flagMesh = createHoloModel(geomFlag, color, 0.22);

    group.add(baseMesh);
    group.add(stemMesh);
    group.add(flagMesh);

    const box = new THREE.Box3().setFromObject(group);
    const center = new THREE.Vector3();
    box.getCenter(center);
    group.children.forEach(child => {
        child.position.sub(center);
    });

    return group;
}

/* ===== Build Base Scene Components ===== */

function buildFloorGrid() {
    const size = 350;
    const segments = 36;
    const planeGeo = new THREE.PlaneGeometry(size, size, segments, segments);
    planeGeo.rotateX(-Math.PI / 2); // Make it horizontal

    waveGridMat = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(0x842bd2) },
            opacity: { value: 0.16 }
        },
        vertexShader: `
            uniform float time;
            varying vec3 vPosition;
            void main() {
                vPosition = position;
                float dist = length(position.xz);
                // Dampen waves near the center to avoid mesh clipping
                float centerDampen = smoothstep(15.0, 50.0, dist);
                float wave = sin(dist * 0.045 - time * 1.2) * cos(position.x * 0.015) * 6.5 * centerDampen;
                vec3 displaced = position + vec3(0.0, wave - 10.0, 0.0); // base at y = -10
                vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            uniform float opacity;
            varying vec3 vPosition;
            void main() {
                float dist = length(vPosition.xz);
                float fade = 1.0 - smoothstep(40.0, 170.0, dist);
                gl_FragColor = vec4(color, opacity * fade);
            }
        `,
        transparent: true,
        wireframe: true,
        depthWrite: false
    });

    const grid = new THREE.Mesh(planeGeo, waveGridMat);
    mainGroup.add(grid);
}

function buildSkyline() {
    const towerMaterial = new THREE.LineBasicMaterial({
        color: 0x842bd2, transparent: true, opacity: 0.08
    });

    // P4: на мобилке башни skyline почти не попадают в обзор камеры.
    const towerCount = window.innerWidth < 600 ? 18 : 40;
    for (let i = 0; i < towerCount; i++) {
        const angle = (i / towerCount) * Math.PI * 2;
        const radius = 175 + Math.random() * 85;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;

        const w = 6 + Math.random() * 12;
        const h = 32 + Math.random() * 70;
        const d = 6 + Math.random() * 12;

        const geom = new THREE.BoxGeometry(w, h, d);
        const edges = new THREE.EdgesGeometry(geom);
        const line = new THREE.LineSegments(edges, towerMaterial);
        line.position.set(x, -10 + h / 2, z);
        mainGroup.add(line);
    }
}

function buildBackWall() {
    const gridColor = 0x842bd2;
    
    // 1. Grid standing vertically at z = -160
    const backGrid = new THREE.GridHelper(320, 32, gridColor, gridColor);
    backGrid.rotation.x = Math.PI / 2; // Make it stand vertical
    backGrid.position.set(0, 20, -160);
    backGrid.material.transparent = true;
    backGrid.material.opacity = 0.035;
    backGrid.material.depthWrite = false;
    mainGroup.add(backGrid);
    backWallMats.push(backGrid.material);

    // 2. Concentric tech rings
    const ringMat = new THREE.MeshBasicMaterial({
        color: gridColor, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.DoubleSide
    });
    backWallMats.push(ringMat);

    const ringGeo1 = new THREE.RingGeometry(72, 72.5, 64);
    const ring1 = new THREE.Mesh(ringGeo1, ringMat);
    ring1.position.set(0, 20, -158);
    mainGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(18, 18.5, 64);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat);
    ring2.position.set(0, 20, -158);
    mainGroup.add(ring2);

    // 3. Central rotating technical emblem
    backEmblem = new THREE.Group();
    backEmblem.position.set(0, 20, -156);
    mainGroup.add(backEmblem);

    const emblemLineMat = new THREE.LineBasicMaterial({
        color: gridColor, transparent: true, opacity: 0.35, depthWrite: false
    });
    backWallMats.push(emblemLineMat);

    // Hexagon outer edge (Cylinder + EdgesGeometry to be EXACTLY like the boot logo)
    const hexGeom = new THREE.CylinderGeometry(36.0, 36.0, 0.5, 6);
    const hexEdges = new THREE.EdgesGeometry(hexGeom);
    const hex = new THREE.LineSegments(hexEdges, emblemLineMat);
    hex.rotation.x = Math.PI / 2;
    backEmblem.add(hex);

    // Concentric Inner Circle (Lines, exactly like the boot logo)
    const circlePts = [];
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        circlePts.push(new THREE.Vector3(Math.cos(theta) * 9.0, Math.sin(theta) * 9.0, 0));
    }
    const circleGeom = new THREE.BufferGeometry().setFromPoints(circlePts);
    const circle = new THREE.Line(circleGeom, emblemLineMat);
    backEmblem.add(circle);

    // 6 Radial Spokes (Lines, exactly like the boot logo)
    const spokeGeom = new THREE.BufferGeometry();
    const spokeVertices = [];
    for (let i = 0; i < 6; i++) {
        const theta = (i / 6) * Math.PI * 2;
        spokeVertices.push(Math.cos(theta) * 9.0, Math.sin(theta) * 9.0, 0);
        spokeVertices.push(Math.cos(theta) * 36.0, Math.sin(theta) * 36.0, 0);
    }
    spokeGeom.setAttribute('position', new THREE.Float32BufferAttribute(spokeVertices, 3));
    const spokes = new THREE.LineSegments(spokeGeom, emblemLineMat);
    backEmblem.add(spokes);

    // 4. Tech Corner tick crosshairs
    const crossGeom = new THREE.BufferGeometry();
    const crossVerts = [
        -5, 0, 0,  5, 0, 0,
        0, -5, 0,  0, 5, 0
    ];
    crossGeom.setAttribute('position', new THREE.Float32BufferAttribute(crossVerts, 3));
    const crossMat = new THREE.LineBasicMaterial({
        color: gridColor, transparent: true, opacity: 0.07, depthWrite: false
    });
    backWallMats.push(crossMat);

    // Place corner crosshairs
    const positions = [
        [-90, 65], [90, 65],
        [-90, -25], [90, -25]
    ];
    positions.forEach(pos => {
        const cross = new THREE.LineSegments(crossGeom, crossMat);
        cross.position.set(pos[0], pos[1], -158);
        mainGroup.add(cross);
    });
}

function buildParticles() {
    // P4: на маленьком экране частицы почти не видны, но жрут GPU.
    const particleCount = window.innerWidth < 600 ? 180 : 400;
    const geom = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < particleCount; i++) {
        positions.push(
            (Math.random() - 0.5) * 350,
            Math.random() * 160 - 20,
            (Math.random() - 0.5) * 350
        );
    }
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        color: 0xddb7ff,
        size: 0.18,
        transparent: true,
        opacity: 0.60,
        sizeAttenuation: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    particles = new THREE.Points(geom, mat);
    scene.add(particles);
}

// Spotlight Floor Texture (Canvas-generated spotlight glow circle)
function makeSpotlightTexture() {
    const c = document.createElement("canvas");
    c.width = 128; c.height = 128;
    const ctx = c.getContext("2d");
    const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, "rgba(255, 255, 255, 1.0)");
    grad.addColorStop(0.35, "rgba(255, 255, 255, 0.45)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);
    
    const tex = new THREE.CanvasTexture(c);
    return tex;
}

// INITIATE SYSTEM Emblem: Hexagon + Inner circle + 6 spokes
function buildBootLogo() {
    bootLogoGroup = new THREE.Group();
    bootLogoGroup.position.set(0, 4, 0);
    scene.add(bootLogoGroup);

    const color = 0xe4e1e6;
    const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 });

    // Outer Hexagon
    const hexGeom = new THREE.CylinderGeometry(6.4, 6.4, 0.1, 6);
    const hexEdges = new THREE.EdgesGeometry(hexGeom);
    const hex = new THREE.LineSegments(hexEdges, lineMat);
    hex.rotation.x = Math.PI / 2;
    bootLogoGroup.add(hex);

    // Concentric Inner Circle
    const circlePts = [];
    const segments = 48;
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        circlePts.push(new THREE.Vector3(Math.cos(theta) * 1.6, Math.sin(theta) * 1.6, 0));
    }
    const circleGeom = new THREE.BufferGeometry().setFromPoints(circlePts);
    const circle = new THREE.Line(circleGeom, lineMat);
    bootLogoGroup.add(circle);

    // 6 Radial Spokes
    const spokeGeom = new THREE.BufferGeometry();
    const spokeVertices = [];
    for (let i = 0; i < 6; i++) {
        const theta = (i / 6) * Math.PI * 2;
        spokeVertices.push(Math.cos(theta) * 1.6, Math.sin(theta) * 1.6, 0);
        spokeVertices.push(Math.cos(theta) * 6.4, Math.sin(theta) * 6.4, 0);
    }
    spokeGeom.setAttribute('position', new THREE.Float32BufferAttribute(spokeVertices, 3));
    const spokes = new THREE.LineSegments(spokeGeom, lineMat);
    bootLogoGroup.add(spokes);

    // Initial scale and rotation
    bootLogoGroup.scale.setScalar(0.001);
    bootLogoGroup.rotation.z = -Math.PI;
}

/* ===== Scene Initialization & Orbit Populating ===== */

export function initThree() {
    const canvas = document.getElementById('webglCanvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0A0A0B, 0.0015);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 100, 240); // Boot stage starting view
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    // P2: на маленьких телефонах (iPhone 12 mini и др.) снижаем до 1.5×
    // — разница в качестве незаметна, экономия GPU ~44%.
    const dprCap = window.innerWidth < 500 ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x0A0A0B, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.22);
    scene.add(ambientLight);

    // Spotlight setup (glow under center active item)
    spotlight = new THREE.PointLight(0xb76dff, 6, 120);
    spotlight.position.set(0, -9.9, 60);
    scene.add(spotlight);

    // Spotlight floor projection ring
    const spotGeo = new THREE.PlaneGeometry(28, 28);
    const spotMat = new THREE.MeshBasicMaterial({
        map: makeSpotlightTexture(),
        transparent: true,
        opacity: 0.38,
        color: 0xb76dff,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    spotlightMesh = new THREE.Mesh(spotGeo, spotMat);
    spotlightMesh.rotation.x = -Math.PI / 2;
    spotlightMesh.position.set(0, -9.9, 60);
    scene.add(spotlightMesh);

    // Parent group for backdrop scene (polar grid, skyline)
    mainGroup = new THREE.Group();
    scene.add(mainGroup);
    mainGroup.visible = false; // Hide on boot

    // Category orbit group
    orbitGroup = new THREE.Group();
    scene.add(orbitGroup);
    orbitGroup.visible = false;

    buildFloorGrid();
    buildSkyline();
    buildBackWall();
    buildParticles();
    buildBootLogo();

    window.addEventListener('resize', onWindowResize);
    animate();
}

// Re-populates the shared orbitGroup with appropriate 3D models based on ring level
function disposeGroup(group) {
    // C1: освобождаем GPU-ресурсы — без этого каждое переключение кольца
    // оставляет в памяти видеокарты сотни мегабайт буферов и шейдеров.
    group.traverse((obj) => {
        try {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                mats.forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
            }
        } catch (e) {}
    });
}

export function populateOrbitRing(ringId) {
    while (orbitGroup.children.length > 0) {
        const child = orbitGroup.children[0];
        disposeGroup(child);
        orbitGroup.remove(child);
    }

    const radius = window.innerWidth < 600 ? 15 : 22;
    const nodes = {};

    if (ringId === 'home') {
        nodes.about = buildAboutModel();
        nodes.projects = buildProjectsModel();
        nodes.socials = buildSocialsModel();
        nodes.contacts = buildContactsModel();

        nodes.about.position.set(0, 0, radius);
        nodes.projects.position.set(radius, 0, 0);
        nodes.projects.rotation.y = Math.PI / 2;
        nodes.socials.position.set(0, 0, -radius);
        nodes.socials.rotation.y = Math.PI;
        nodes.contacts.position.set(-radius, 0, 0);
        nodes.contacts.rotation.y = -Math.PI / 2;

        Object.keys(nodes).forEach(k => {
            nodes[k].userData.nodeKey = k;
            orbitGroup.add(nodes[k]);
            modelScales[k] = 0.001; // Scale up animation seeding
        });
    } else if (ringId === 'projects') {
        const items = ['null_glitch', 'signal_stack', 'aurum', 'kernel_os', 'home'];
        
        nodes.null_glitch = buildNullGlitchModel();
        nodes.signal_stack = buildSignalStackModel();
        nodes.aurum = buildAurumModel();
        nodes.kernel_os = buildKernelOSModel();
        nodes.home = buildHomeModel();

        const count = items.length;
        items.forEach((k, idx) => {
            nodes[k].userData.nodeKey = k;
            const angle = (idx / count) * Math.PI * 2;
            nodes[k].position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
            nodes[k].rotation.y = angle;
            orbitGroup.add(nodes[k]);
            modelScales[k] = 0.001;
        });
    } else if (ringId === 'socials') {
        const items = ['telegram', 'github', 'x', 'tiktok', 'email', 'home'];

        nodes.telegram = buildTelegramModel();
        nodes.github = buildGitHubModel();
        nodes.x = buildXModel();
        nodes.tiktok = buildTikTokModel();
        nodes.email = buildContactsModel();
        nodes.home = buildHomeModel();

        const count = items.length;
        items.forEach((k, idx) => {
            nodes[k].userData.nodeKey = k;
            const angle = (idx / count) * Math.PI * 2;
            nodes[k].position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
            nodes[k].rotation.y = angle;
            orbitGroup.add(nodes[k]);
            modelScales[k] = 0.001;
        });
    }
}

/* ===== State-driven Camera & Transition Rigs ===== */

export function triggerBootIntroAnimation() {
    // A1: привязка к реальному времени, а не к кадрам — на 120 Гц играет
    // с той же скоростью, что и на 60 Гц.
    const DURATION = 800; // мс
    const startTime = performance.now();
    function intro(now) {
        const t = Math.min((now - startTime) / DURATION, 1);
        bootLogoGroup.scale.setScalar(THREE.MathUtils.lerp(0.001, 1, t));
        bootLogoGroup.rotation.z = THREE.MathUtils.lerp(-Math.PI, 0, t);
        if (t < 1) requestAnimationFrame(intro);
    }
    requestAnimationFrame(intro);
}

export function triggerInitiateSystemTransition() {
    // A1: тайминг по реальному времени — одинаково на 60 и 120 Гц.
    const DURATION = 700; // мс
    const startTime = performance.now();
    mainGroup.visible = true;
    orbitGroup.visible = true;
    populateOrbitRing('home');

    function morph(now) {
        if (!bootLogoGroup) return;
        const t = Math.min((now - startTime) / DURATION, 1);
        bootLogoGroup.scale.setScalar(THREE.MathUtils.lerp(1, 15, t));
        bootLogoGroup.rotation.z += 0.04;
        mainGroup.position.y = THREE.MathUtils.lerp(-100, 0, t);
        if (t < 1) {
            requestAnimationFrame(morph);
        } else {
            scene.remove(bootLogoGroup);
            bootLogoGroup = null;
        }
    }
    requestAnimationFrame(morph);
}

export function setTargetRotation(angle) {
    let diff = angle - (targetRotation % (Math.PI * 2));
    if (diff > Math.PI) diff -= Math.PI * 2;
    if (diff < -Math.PI) diff += Math.PI * 2;
    targetRotation += diff;
}

export function updateDragRotation(angle) {
    targetRotation = angle;
}

export function getTargetRotation() {
    return targetRotation;
}

export function setSpotlightColor(hexColor) {
    currentSpotlightColor = hexColor;
}

/* ===== Animation Loop ===== */

let lastAnimateTime = 0;

// A2: frame-rate independent exponential smooth
// factor(alpha60, dt) — даёт то же ощущение на 120 Гц, что alpha60 давал на 60 Гц.
function expF(alpha60, dt) {
    return 1 - Math.pow(1 - alpha60, dt * 60);
}

function animate(now = 0) {
    requestAnimationFrame(animate);

    // dt в секундах; cap 100 мс чтобы первый кадр / вкладка-в-фоне не давала прыжок
    const dt = Math.min((now - lastAnimateTime) / 1000, 0.1);
    lastAnimateTime = now;

    const time = Date.now() * 0.0015;

    // Dust particles background drift
    if (particles) {
        particles.rotation.y = time * 0.03;
        particles.rotation.x = time * 0.015;
    }

    // Gentle boot logo floating wobble
    if (bootLogoGroup) {
        bootLogoGroup.rotation.y = Math.sin(time * 0.5) * 0.15;
        bootLogoGroup.position.y = 4.0 + Math.sin(time * 1.2) * 0.4;
    }

    // Category node rotation interpolation
    currentRotation = THREE.MathUtils.lerp(currentRotation, targetRotation, expF(0.08, dt));
    orbitGroup.rotation.y = currentRotation;

    // Sync HTML radial ring rotation with Three.js orbit rotation
    const ring = document.querySelector('.radial .radial-ring');
    if (ring) {
        const deg = -currentRotation * (180 / Math.PI);
        ring.style.setProperty('--ring-rot', `${deg}deg`);
    }

    // Spotlight color & dynamic radius positioning lerp
    const activeRadius = window.innerWidth < 600 ? 15 : 22;
    spotlight.position.z = activeRadius;
    spotlightMesh.position.z = activeRadius;

    spotlight.color.lerp(new THREE.Color(currentSpotlightColor), expF(0.1, dt));
    spotlightMesh.material.color.lerp(new THREE.Color(currentSpotlightColor), expF(0.1, dt));

    // Calculate spotlight alignment fade
    const statePhase = window.appStatePhase || 'boot';
    let targetIntensity = 0;
    let targetMeshOpacity = 0;
    
    if (statePhase === 'home' || statePhase === 'projects_ring' || statePhase === 'socials_ring') {
        let rotationDiff = Math.abs(currentRotation - targetRotation) % (Math.PI * 2);
        if (rotationDiff > Math.PI) rotationDiff = Math.PI * 2 - rotationDiff;
        
        const alignmentFactor = Math.max(0, 1 - rotationDiff * 4.0);
        targetIntensity = alignmentFactor * 6.0;
        targetMeshOpacity = alignmentFactor * 0.38;
    }
    
    spotlight.intensity = THREE.MathUtils.lerp(spotlight.intensity, targetIntensity, expF(0.12, dt));
    spotlightMesh.material.opacity = THREE.MathUtils.lerp(spotlightMesh.material.opacity, targetMeshOpacity, expF(0.12, dt));

    // Update dynamic grid uniforms
    if (waveGridMat) {
        waveGridMat.uniforms.time.value = time;
        waveGridMat.uniforms.color.value.lerp(new THREE.Color(currentSpotlightColor), expF(0.1, dt));
    }

    // Spin back wall technical emblem
    if (backEmblem) {
        backEmblem.rotation.z = -time * 0.05;
    }

    // Lerp colors of back wall technical elements
    backWallMats.forEach(mat => {
        mat.color.lerp(new THREE.Color(currentSpotlightColor), expF(0.1, dt));
    });

    // Apply scale animations & float behavior to active ring children
    orbitGroup.children.forEach((child, idx) => {
        const key = child.userData.nodeKey || idx;
        const targetScale = window.currentFocusedKey === key ? 1.4 : 0.3;
        
        modelScales[key] = THREE.MathUtils.lerp(modelScales[key] || 0.001, targetScale, expF(0.1, dt));
        child.scale.setScalar(modelScales[key]);

        // Traverse child to fade opacity dynamically based on focus
        const targetOpacityFactor = window.currentFocusedKey === key ? 1.0 : 0.02;
        child.traverse(node => {
            if (node.isMesh && node.material && node.material.uniforms && node.material.uniforms.opacity) {
                node.material.uniforms.opacity.value = THREE.MathUtils.lerp(
                    node.material.uniforms.opacity.value,
                    (node.userData.baseOpacity !== undefined ? node.userData.baseOpacity : 0.22) * targetOpacityFactor,
                    expF(0.12, dt)
                );
            } else if (node.isLine && node.material) {
                node.material.opacity = THREE.MathUtils.lerp(
                    node.material.opacity,
                    (node.userData.baseLineOpacity !== undefined ? node.userData.baseLineOpacity : 0.95) * targetOpacityFactor,
                    expF(0.12, dt)
                );
            }
        });
        
        // Floating idle
        child.position.y = Math.sin(time + idx * Math.PI / 2) * 1.2;
    });

    // Camera Rig Positioning Interpolation based on state variables
    let targetCamPos = new THREE.Vector3();
    let targetLookAt = new THREE.Vector3(0, 0, 0);

    const statePhase = window.appStatePhase || 'boot';

    // Portrait mode aspect ratio camera zoom compensation
    const aspect = window.innerWidth / window.innerHeight;
    const zoomFactor = aspect < 1.0 ? Math.max(1.0, Math.min(1.25, 0.82 / aspect)) : 1.0;

    if (statePhase === 'boot') {
        targetCamPos.set(0, 10, 32);
        targetLookAt.set(0, 4, 0);
    } else if (statePhase === 'home') {
        targetCamPos.set(0, 1.5, 48 * zoomFactor);
        targetLookAt.set(0, 0, 0);
    } else if (statePhase === 'projects_ring' || statePhase === 'socials_ring') {
        targetCamPos.set(0, 1.5, 48 * zoomFactor);
        targetLookAt.set(0, 0, 0);
    } else if (statePhase === 'panel') {
        if (aspect < 1.0) {
            targetCamPos.set(0, 44, 150 * zoomFactor);
            targetLookAt.set(0, -6, 0);
        } else {
            targetCamPos.set(-26, 44, 120);
            targetLookAt.set(-14, 0, 0);
        }
    }

    camera.position.lerp(targetCamPos, expF(0.08, dt));

    const currentLook = new THREE.Vector3(0, 4, 0);
    currentLook.lerp(targetLookAt, expF(0.08, dt));
    camera.lookAt(currentLook);

    renderer.render(scene, camera);
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);

        // Dynamically adjust orbit child positions on resize
        const radius = window.innerWidth < 600 ? 15 : 22;
        const count = orbitGroup.children.length;
        if (count === 4) {
            orbitGroup.children.forEach(child => {
                const key = child.userData.nodeKey;
                if (key === 'about') child.position.set(0, 0, radius);
                else if (key === 'projects') child.position.set(radius, 0, 0);
                else if (key === 'socials') child.position.set(0, 0, -radius);
                else if (key === 'contacts') child.position.set(-radius, 0, 0);
            });
        } else if (count > 0) {
            orbitGroup.children.forEach((child, idx) => {
                const angle = (idx / count) * Math.PI * 2;
                child.position.set(Math.sin(angle) * radius, 0, Math.cos(angle) * radius);
            });
        }
    }
}
