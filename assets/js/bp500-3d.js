// Modelo 3D paramétrico da Bomba Periférica BP500, construído a partir da
// vista explodida oficial (BP500 EXPLOADED VIEW). Eixo do motor = eixo X;
// frente da bomba (sucção) em -X, ventoinha em +X. Unidades ≈ cm.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MAT = {
  orange: () => new THREE.MeshStandardMaterial({ color: 0xf0661a, metalness: 0.25, roughness: 0.45 }),
  black: () => new THREE.MeshStandardMaterial({ color: 0x1f2124, metalness: 0.1, roughness: 0.55 }),
  rubber: () => new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0, roughness: 0.9 }),
  steel: () => new THREE.MeshStandardMaterial({ color: 0xc3c8cf, metalness: 0.85, roughness: 0.3 }),
  darkSteel: () => new THREE.MeshStandardMaterial({ color: 0x6d737b, metalness: 0.7, roughness: 0.4 }),
  copper: () => new THREE.MeshStandardMaterial({ color: 0xb8642a, metalness: 0.7, roughness: 0.35 }),
  bronze: () => new THREE.MeshStandardMaterial({ color: 0xc19a55, metalness: 0.75, roughness: 0.35 }),
  white: () => new THREE.MeshStandardMaterial({ color: 0xf2f2f2, metalness: 0, roughness: 0.4, transparent: true, opacity: 0.92 }),
  silver: () => new THREE.MeshStandardMaterial({ color: 0xdfe3e8, metalness: 0.6, roughness: 0.3 }),
  green: () => new THREE.MeshStandardMaterial({ color: 0x2e9e4f, metalness: 0.2, roughness: 0.5 }),
  hole: () => new THREE.MeshBasicMaterial({ color: 0x0a0a0a }),
};

// ---------- helpers de geometria ----------
const mesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; return m; };
function cylX(r, len, mat, seg = 40, r2 = r, open = false) {
  const m = mesh(new THREE.CylinderGeometry(r2, r, len, seg, 1, open), mat);
  m.rotation.z = -Math.PI / 2; return m; // eixo ao longo de +X (r na ponta -X)
}
function cylY(r, h, mat, seg = 32) { return mesh(new THREE.CylinderGeometry(r, r, h, seg), mat); }
function cylZ(r, len, mat, seg = 24) { const m = cylY(r, len, mat, seg); m.rotation.x = Math.PI / 2; return m; }
function torusX(R, r, mat) { const m = mesh(new THREE.TorusGeometry(R, r, 12, 48), mat); m.rotation.y = Math.PI / 2; return m; }
function torusY(R, r, mat) { const m = mesh(new THREE.TorusGeometry(R, r, 12, 48), mat); m.rotation.x = Math.PI / 2; return m; }
function box(w, h, d, mat) { return mesh(new THREE.BoxGeometry(w, h, d), mat); }
function rbox(w, h, d, rad, mat) {
  const s = new THREE.Shape(), x = -w / 2, z = -d / 2;
  s.moveTo(x + rad, z); s.lineTo(x + w - rad, z); s.quadraticCurveTo(x + w, z, x + w, z + rad);
  s.lineTo(x + w, z + d - rad); s.quadraticCurveTo(x + w, z + d, x + w - rad, z + d);
  s.lineTo(x + rad, z + d); s.quadraticCurveTo(x, z + d, x, z + d - rad);
  s.lineTo(x, z + rad); s.quadraticCurveTo(x, z, x + rad, z);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 3 });
  g.rotateX(Math.PI / 2); g.translate(0, h / 2, 0);
  return mesh(g, mat);
}
function hex(r, h, mat) { return mesh(new THREE.CylinderGeometry(r, r, h, 6), mat); }
function boltX(len, mat) { // parafuso ao longo de X, cabeça em -X
  const g = new THREE.Group();
  const head = hex(0.38, 0.3, mat); head.rotation.z = Math.PI / 2; head.position.x = -len / 2; g.add(head);
  const sh = cylX(0.18, len, mat, 12); g.add(sh); return g;
}
function boltY(len, mat) { // cabeça em +Y
  const g = new THREE.Group();
  const head = cylY(0.3, 0.18, mat, 16); head.position.y = len / 2; g.add(head);
  g.add(cylY(0.13, len, mat, 10)); return g;
}
function grp(...items) { const g = new THREE.Group(); items.forEach(i => g.add(i)); return g; }
function at(obj, x = 0, y = 0, z = 0) { obj.position.set(x, y, z); return obj; }

// ---------- peças ----------
// pos = posição montada; ex = deslocamento quando 100% explodido
function buildParts() {
  const P = [];
  const add = (n, obj, pos, ex) => P.push({ n, obj, pos: new THREE.Vector3(...pos), ex: new THREE.Vector3(...ex) });

  // 1 — Tampa plástica da sucção
  add(1, grp(cylX(1.25, 0.7, MAT.white()), at(cylX(0.95, 0.72, MAT.white(), 24), 0.05)), [-12.2, 0, 0], [-14.5, 0, 0]);

  // 2 — Parafusos da tampa frontal (4x)
  { const g = new THREE.Group(); const m = MAT.steel();
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.add(at(boltX(3.4, m), 0, Math.cos(a) * 4.25, Math.sin(a) * 4.25)); }
    add(2, g, [-8.7, 0, 0], [-12.5, 0, 0]); }

  // 3 — Tampa frontal / caracol (sucção frontal, recalque superior)
  { const m = MAT.orange(); const g = new THREE.Group();
    g.add(cylX(4.9, 2.6, m, 48));
    g.add(at(torusX(4.4, 0.35, m), -1.1));
    g.add(at(cylX(1.7, 2.6, m, 32, 1.55), -2.5));                  // bocal de sucção
    g.add(at(cylX(1.75, 0.45, m), -3.75));
    g.add(at(mesh(new THREE.CircleGeometry(1.15, 32), MAT.hole()), -4.0).rotateY(-Math.PI / 2));
    const out = at(cylY(1.6, 3.6, m), 0.2, 5.2, 0); g.add(out);     // bocal de recalque
    g.add(at(cylY(1.72, 0.45, m), 0.2, 6.85, 0));
    const h = at(mesh(new THREE.CircleGeometry(1.1, 32), MAT.hole()), 0.2, 7.08, 0); h.rotation.x = -Math.PI / 2; g.add(h);
    g.add(at(box(1.6, 2.2, 1.6, m), -0.9, 3.9, 0));                 // ressalto do dreno
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.add(at(cylX(0.55, 2.6, m, 16), 0, Math.cos(a) * 4.25, Math.sin(a) * 4.25)); }
    add(3, g, [-8.6, 0, 0], [-9.5, 0, 0]); }

  // 4 — Anel de vedação do dreno
  add(4, torusY(0.42, 0.1, MAT.rubber()), [-9.5, 5.05, 0], [-10.7, 3.6, 0]);
  // 5 — Bujão de escorva/dreno
  add(5, grp(hex(0.55, 0.55, MAT.steel()), at(cylY(0.32, 0.5, MAT.steel(), 16), 0, -0.45, 0)), [-9.5, 5.35, 0], [-10.7, 5.4, 0]);
  // 6 — Tampa plástica do recalque
  add(6, grp(cylY(1.25, 0.7, MAT.white()), at(cylY(0.95, 0.72, MAT.white(), 24), 0, -0.05, 0)), [-8.4, 7.4, 0], [-9.5, 4.2, 0]);

  // 7 — O-ring da carcaça
  add(7, torusX(4.15, 0.14, MAT.rubber()), [-7.2, 0, 0], [-7.6, 0, 0]);

  // 8 — Rotor periférico (impulsor) em latão
  { const m = MAT.bronze(); const g = new THREE.Group();
    g.add(cylX(3.1, 0.55, m, 48)); g.add(at(cylX(0.85, 1.1, m, 24), 0.1));
    for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2;
      const b = at(box(0.5, 0.7, 0.16, m), 0, Math.cos(a) * 3.35, Math.sin(a) * 3.35); b.rotation.x = -a; g.add(b); }
    add(8, g, [-7.0, 0, 0], [-6.1, 0, 0]); }

  // 9 — Anel trava
  add(9, torusX(0.6, 0.09, MAT.steel()), [-6.55, 0, 0], [-4.9, 0, 0]);
  // 10 — Gaxeta do selo
  add(10, grp(cylX(0.95, 0.15, MAT.rubber(), 28)), [-6.35, 0, 0], [-4.1, 0, 0]);
  // 11 — Selo mecânico
  add(11, grp(cylX(1.0, 0.45, MAT.steel(), 28), at(cylX(0.85, 0.45, MAT.rubber(), 28), 0.45), at(cylX(1.05, 0.2, MAT.darkSteel(), 28), 0.8)), [-6.15, 0, 0], [-3.2, 0, 0]);

  // 12 — Parafusos da tampa intermediária (2x)
  { const g = new THREE.Group(); const m = MAT.steel();
    g.add(at(boltX(2.2, m), 0, 3.7, 2.2)); g.add(at(boltX(2.2, m), 0, -3.7, -2.2));
    add(12, g, [-6.4, 0, 0], [-2.4, 3.2, 0]); }

  // 13 — Tampa intermediária (suporte da bomba)
  { const m = MAT.orange(); const g = new THREE.Group();
    g.add(cylX(4.9, 1.0, m, 48)); g.add(at(cylX(3.6, 0.9, m, 40, 4.4), 0.9));
    g.add(at(cylX(1.25, 0.5, MAT.darkSteel(), 24), -0.5));
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.add(at(cylX(0.5, 1.0, m, 12), 0, Math.cos(a) * 4.9, Math.sin(a) * 4.9)); }
    add(13, g, [-5.6, 0, 0], [-1.3, 0, 0]); }

  // 14 — Corpo da bomba / carcaça do motor (fixo)
  { const m = MAT.orange(); const g = new THREE.Group();
    g.add(at(cylX(4.6, 9.2, m, 48), 0));
    for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; const y = Math.cos(a), z = Math.sin(a);
      if (y > 0.55 || y < -0.75) continue;
      const r = at(box(8.6, 0.35, 0.28, m), 0, y * 4.75, z * 4.75); r.rotation.x = -a; g.add(r); }
    g.add(at(box(3.4, 3.2, 3.2, m), 0, -4.4, 0));                 // pedestal
    g.add(at(box(6.0, 0.6, 7.6, m), 0, -6.1, 0));                 // base com furos
    [-2.3, 2.3].forEach(x => [-3.2, 3.2].forEach(z => { const h = at(cylY(0.32, 0.62, MAT.hole(), 12), x, -6.1, z); g.add(h); }));
    g.add(at(box(6.4, 1.4, 6.4, m), -0.2, 4.55, 0));             // base da caixa elétrica
    g.add(at(box(5.8, 0.15, 5.8, MAT.darkSteel()), -0.2, 5.3, 0));
    add(14, g, [0, 0, 0], [0, 0, 0]); }

  // 15 — Protetor do cabo elétrico (passa-cabo)
  add(15, grp(cylZ(0.55, 1.2, MAT.black()), at(cylZ(0.3, 2.4, MAT.black(), 12), 0, 0, 1.4)), [2.0, 4.5, 3.5], [0, 0, 4.5]);
  // 16 — Parafuso de pressão
  add(16, boltY(0.8, MAT.steel()), [1.9, 5.6, -2.2], [0, 3, 0]);
  // 17 — Marca de aterramento
  add(17, box(0.9, 0.06, 0.9, MAT.green()), [1.9, 5.4, -1.2], [0, 3.6, 0]);
  // 18 — Prensador de cabo
  add(18, box(1.4, 0.3, 0.6, MAT.steel()), [1.9, 5.5, 2.3], [0, 3.6, 1.2]);
  // 19 — Parafuso do prensador
  add(19, boltY(0.8, MAT.steel()), [1.9, 5.85, 2.3], [0, 5.4, 1.2]);
  // 20 — O-ring da tampa da caixa
  add(20, torusY(2.6, 0.08, MAT.rubber()), [-0.2, 5.4, 0], [0, 9.6, 0]);
  // 21 — Capacitor
  add(21, grp(cylX(0.85, 2.8, MAT.silver(), 32), at(cylX(0.6, 0.3, MAT.black(), 24), 1.5)), [-0.9, 6.2, 1.3], [0, 6.0, 0]);
  // 22 — Placa de terminal
  add(22, grp(box(2.0, 0.35, 1.3, MAT.white()), ...[-0.6, 0, 0.6].map(x => at(cylY(0.12, 0.3, MAT.copper(), 10), x, 0.3, 0))), [-1.3, 5.55, -1.6], [0, 4.6, 0]);
  // 23 — Chave seletora 127/220V
  add(23, grp(box(1.1, 0.7, 0.9, MAT.black()), at(box(0.3, 0.35, 0.3, MAT.white()), 0, 0.5, 0)), [0.6, 5.75, -1.6], [0, 6.8, 0]);
  // 24 — Tampa da caixa elétrica
  add(24, rbox(6.4, 1.7, 6.6, 0.6, MAT.black()), [-0.2, 6.3, 0], [0, 12, 0]);
  // 25 — Parafuso da tampa
  add(25, boltY(2.2, MAT.steel()), [1.6, 6.6, 0], [0, 15.5, 0]);
  // 26 — Placa de identificação
  add(26, box(4.0, 0.05, 3.6, MAT.silver()), [-0.9, 7.25, 0], [0, 17.2, 0]);
  // 27 — Rebites / parafusos de aperto da placa
  { const g = new THREE.Group(); const m = MAT.steel();
    [[-2.6, -1.5], [0.8, -1.5], [-2.6, 1.5], [0.8, 1.5]].forEach(([x, z]) => g.add(at(cylY(0.15, 0.12, m, 10), x + 0.9, 0, z)));
    add(27, g, [-0.9, 7.3, 0], [0, 19, 0]); }

  // 28 — Estator com bobinas
  { const g = new THREE.Group();
    g.add(cylX(4.25, 5.4, MAT.darkSteel(), 48, 4.25, true));
    g.add(at(cylX(3.75, 5.4, MAT.darkSteel(), 48, 3.75, true), 0));
    g.add(at(torusX(3.0, 0.75, MAT.copper()), -3.0)); g.add(at(torusX(3.0, 0.75, MAT.copper()), 3.0));
    add(28, g, [0.3, 0, 0], [3, 2.5, -11]); }
  // 29 — Protetor térmico
  add(29, box(0.9, 0.35, 0.6, MAT.white()), [3.5, 3.1, 0], [8.5, 5.5, -11]);

  // 30–33 — conjunto rotativo (linha inferior da vista)
  const row = [-1.2, -3.2, 11];
  add(30, grp(cylX(0.95, 0.65, MAT.steel(), 32), at(cylX(0.5, 0.67, MAT.darkSteel(), 20), 0)), [-4.4, 0, 0], [row[0] - 3.2, row[1], row[2]]);
  add(31, box(0.7, 0.18, 0.2, MAT.steel()), [-6.75, 0.42, 0], [row[0] - 1.6, row[1] + 1.4, row[2]]);
  { const g = new THREE.Group();
    g.add(at(cylX(0.42, 12.4, MAT.steel(), 24), -0.6));
    g.add(at(cylX(3.55, 5.0, MAT.darkSteel(), 48), 0));
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; const s = at(box(5.02, 0.12, 0.25, MAT.copper()), 0, Math.cos(a) * 3.5, Math.sin(a) * 3.5); s.rotation.x = -a; g.add(s); }
    add(32, g, [0.3, 0, 0], row); }
  add(33, grp(cylX(0.95, 0.65, MAT.steel(), 32), at(cylX(0.5, 0.67, MAT.darkSteel(), 20), 0)), [4.4, 0, 0], [row[0] + 3.4, row[1], row[2]]);

  // 34 — Arruela mola
  add(34, torusX(0.95, 0.07, MAT.steel()), [4.85, 0, 0], [2.6, 0, 0]);
  // 35 — Tampa do motor (traseira)
  { const m = MAT.orange(); const g = new THREE.Group();
    g.add(cylX(4.6, 0.8, m, 48)); g.add(at(cylX(1.4, 0.8, m, 24), 0.7));
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; g.add(at(cylX(0.5, 0.8, m, 12), 0, Math.cos(a) * 4.6, Math.sin(a) * 4.6)); }
    add(35, g, [5.0, 0, 0], [4.6, 0, 0]); }
  // 36 — Parafusos da tampa do motor (4x)
  { const g = new THREE.Group(); const m = MAT.steel();
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; const b = boltX(1.6, m); b.rotation.z = Math.PI; g.add(at(b, 0, Math.cos(a) * 4.6, Math.sin(a) * 4.6)); }
    add(36, g, [5.1, 0, 0], [7.6, 0, 0]); }
  // 37 — Ventoinha
  { const m = MAT.black(); const g = new THREE.Group();
    g.add(cylX(0.9, 0.9, m, 24));
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; const b = at(box(0.8, 3.0, 0.12, m), 0, Math.cos(a) * 2.2, Math.sin(a) * 2.2); b.rotation.x = -a; b.rotation.y = 0.35; g.add(b); }
    add(37, g, [6.2, 0, 0], [10.5, 0, 0]); }
  // 38 — Tampa da ventoinha
  { const m = MAT.black(); m.side = THREE.DoubleSide; const g = new THREE.Group();
    g.add(cylX(4.75, 3.0, m, 48, 4.75, true));
    const end = at(cylX(4.75, 0.2, MAT.black(), 48), 1.5); g.add(end);
    const hm = MAT.hole();
    for (let yy = -2; yy <= 2; yy++) for (let zz = -2; zz <= 2; zz++) {
      if (yy * yy + zz * zz > 6) continue;
      const h = at(mesh(new THREE.CircleGeometry(0.42, 6), hm), 1.62, yy * 1.15, zz * 1.15); h.rotation.y = Math.PI / 2; g.add(h); }
    add(38, g, [6.9, 0, 0], [15, 0, 0]); }

  return P;
}

// ---------- visualizador ----------
export function createViewer(container, { onSelect, onHover } = {}) {
  const canvasHost = container.querySelector('.stage') || container;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  canvasHost.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 500);
  camera.position.set(-10, 15, 40);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.minDistance = 10; controls.maxDistance = 140;
  controls.target.set(0, 1, 0); controls.autoRotate = false; controls.autoRotateSpeed = 0.8;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8890a0, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(18, 30, 20); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 120 });
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.8); rim.position.set(-25, 10, -20); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.ShadowMaterial({ opacity: 0.12 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -6.45; floor.receiveShadow = true; scene.add(floor);

  const model = new THREE.Group(); scene.add(model);
  const parts = buildParts();
  const byN = new Map();
  parts.forEach(p => {
    p.obj.position.copy(p.pos); p.obj.userData.n = p.n; model.add(p.obj); byN.set(p.n, p);
    p.meshes = []; p.obj.traverse(o => { if (o.isMesh) { o.userData.n = p.n; p.meshes.push(o); o.userData.baseOpacity = o.material.opacity ?? 1; o.userData.baseTransparent = o.material.transparent; } });
  });

  let explode = 0, explodeTarget = 0, selected = null, hovered = null, isolate = false;
  const camGoal = { pos: null, target: null };

  function applyExplode(t) {
    const e = t * t * (3 - 2 * t); // suavização
    parts.forEach(p => p.obj.position.copy(p.pos).addScaledVector(p.ex, e));
  }
  function paint() {
    parts.forEach(p => {
      const isSel = p.n === selected, isHov = p.n === hovered;
      p.meshes.forEach(m => {
        const mat = m.material;
        if (mat.emissive) { mat.emissive.setHex(isSel ? 0xea362e : isHov ? 0x5a1512 : 0x000000); mat.emissiveIntensity = isSel ? 0.55 : 0.6; }
        const dim = isolate && selected != null && !isSel;
        mat.transparent = dim || m.userData.baseTransparent; mat.opacity = dim ? 0.12 : m.userData.baseOpacity; mat.depthWrite = !dim;
      });
    });
  }

  // tooltip + rótulos
  const tip = container.querySelector('.tip');
  const labelsEl = container.querySelector('.labels');
  const labelEls = new Map();
  if (labelsEl) parts.forEach(p => { const s = document.createElement('span'); s.textContent = p.n; labelsEl.appendChild(s); labelEls.set(p.n, s); });
  const tmpBox = new THREE.Box3(), tmpV = new THREE.Vector3();
  function partCenter(p, out) { tmpBox.setFromObject(p.obj); return tmpBox.getCenter(out); }

  // picking
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(); let downAt = null;
  function pick(ev) {
    const r = renderer.domElement.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const pickable = parts.filter(p => !(isolate && selected != null && p.n !== selected)).flatMap(p => p.meshes);
    const hit = ray.intersectObjects(pickable, false)[0];
    return hit ? hit.object.userData.n : null;
  }
  renderer.domElement.addEventListener('pointermove', ev => {
    const n = pick(ev);
    if (n !== hovered) { hovered = n; paint(); onHover && onHover(n); }
    renderer.domElement.style.cursor = n ? 'pointer' : 'grab';
    if (tip) {
      if (n) { const r = renderer.domElement.getBoundingClientRect(); tip.style.left = (ev.clientX - r.left) + 'px'; tip.style.top = (ev.clientY - r.top) + 'px'; tip.style.opacity = 1; tip.dataset.n = n; tip.dispatchEvent(new CustomEvent('part', { detail: n })); }
      else tip.style.opacity = 0;
    }
  });
  renderer.domElement.addEventListener('pointerleave', () => { hovered = null; paint(); if (tip) tip.style.opacity = 0; });
  renderer.domElement.addEventListener('pointerdown', ev => { downAt = [ev.clientX, ev.clientY]; controls.autoRotate = false; });
  renderer.domElement.addEventListener('pointerup', ev => {
    if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 5) return;
    const n = pick(ev); select(n, false); onSelect && onSelect(n);
  });

  function fit(t = explodeTarget, focusN = null) {
    const prev = explode; applyExplode(t);
    const b = new THREE.Box3();
    if (focusN != null) b.setFromObject(byN.get(focusN).obj); else b.setFromObject(model);
    applyExplode(prev);
    const s = b.getBoundingSphere(new THREE.Sphere()).radius, c = b.getCenter(new THREE.Vector3()); c.y -= s * 0.1;
    const dist = Math.max(focusN != null ? 9 : 14, s / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * (camera.aspect < 1 ? 1.05 : 0.74));
    const dir = camera.position.clone().sub(controls.target).normalize();
    camGoal.target = c; camGoal.pos = c.clone().addScaledVector(dir, dist);
  }

  function select(n, focus = true) {
    selected = n ?? null; paint();
    if (focus && n != null) fit(explodeTarget, isolate ? n : null);
  }

  function resize() {
    const w = canvasHost.clientWidth, h = canvasHost.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvasHost); resize();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (Math.abs(explode - explodeTarget) > 1e-4) { explode += (explodeTarget - explode) * Math.min(1, dt * 4); applyExplode(explode); container.dispatchEvent(new CustomEvent('explode', { detail: explode })); }
    if (camGoal.pos) {
      const k = Math.min(1, dt * 3.5);
      camera.position.lerp(camGoal.pos, k); controls.target.lerp(camGoal.target, k);
      if (camera.position.distanceTo(camGoal.pos) < 0.05) camGoal.pos = null;
    }
    controls.update();
    renderer.render(scene, camera);
    if (labelsEl && container.classList.contains('show-labels')) {
      const w = canvasHost.clientWidth, h = canvasHost.clientHeight;
      parts.forEach(p => { const el = labelEls.get(p.n); partCenter(p, tmpV).project(camera);
        const hidden = tmpV.z > 1 || (isolate && selected != null && p.n !== selected);
        el.style.display = hidden ? 'none' : ''; el.style.left = ((tmpV.x + 1) / 2 * w) + 'px'; el.style.top = ((1 - tmpV.y) / 2 * h) + 'px'; });
    }
  });

  applyExplode(0); fit(0);
  camera.position.copy(camGoal.pos); controls.target.copy(camGoal.target); camGoal.pos = null;

  return {
    setExplode(t, refit = false) { explodeTarget = THREE.MathUtils.clamp(t, 0, 1); if (refit) fit(explodeTarget, isolate && selected != null ? selected : null); },
    getExplode: () => explodeTarget,
    select,
    setIsolate(v) { isolate = v; paint(); fit(explodeTarget, v && selected != null ? selected : null); },
    setAutoRotate(v) { controls.autoRotate = v; },
    reset() { selected = null; isolate = false; paint(); camera.position.set(-10, 15, 40); controls.target.set(0, 1, 0); fit(explodeTarget); },
    fit: () => fit(explodeTarget),
    partNumbers: parts.map(p => p.n),
  };
}
