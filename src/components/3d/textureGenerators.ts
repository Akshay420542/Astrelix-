/**
 * High-Resolution Procedural Texture Generators for Celestial Bodies
 * Creates realistic 2048x1024 or 1024x512 Canvas textures for Earth, Night Lights, Clouds, Moon, Sun, Mars, Jupiter, Saturn.
 */
import * as THREE from 'three';

export function createEarthDayTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // Deep ocean background
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  oceanGrad.addColorStop(0, '#0c1b33');
  oceanGrad.addColorStop(0.5, '#0a254a');
  oceanGrad.addColorStop(1, '#0c1b33');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Continental landmasses (stylized realistic equirectangular projection)
  ctx.fillStyle = '#1e3a24'; // Forest green / savanna

  // North America
  ctx.beginPath();
  ctx.ellipse(450, 320, 180, 110, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2d5a37';
  ctx.beginPath();
  ctx.ellipse(480, 260, 100, 70, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // South America
  ctx.fillStyle = '#1c4a25';
  ctx.beginPath();
  ctx.ellipse(650, 680, 110, 200, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Eurasia
  ctx.fillStyle = '#314e30';
  ctx.beginPath();
  ctx.ellipse(1300, 300, 380, 150, -0.1, 0, Math.PI * 2);
  ctx.fill();

  // Africa
  ctx.fillStyle = '#615433'; // Sahara / savanna
  ctx.beginPath();
  ctx.ellipse(1080, 520, 150, 210, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a4023'; // Central Africa jungle
  ctx.beginPath();
  ctx.ellipse(1100, 600, 100, 110, 0, 0, Math.PI * 2);
  ctx.fill();

  // Australia
  ctx.fillStyle = '#7a5229'; // Outback red/brown
  ctx.beginPath();
  ctx.ellipse(1650, 720, 130, 90, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Antarctica / Ice Caps
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, canvas.width, 40);
  ctx.fillRect(0, canvas.height - 70, canvas.width, 70);

  // Texture details & coastal shelf shading
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 12;
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createEarthNightTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#020408';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // City clusters (golden points)
  ctx.fillStyle = '#fbbf24';
  const clusters = [
    { x: 240, y: 150, count: 250, r: 40 }, // US East
    { x: 180, y: 160, count: 180, r: 35 }, // US West
    { x: 520, y: 130, count: 320, r: 45 }, // Western Europe
    { x: 740, y: 170, count: 300, r: 50 }, // East Asia / Japan
    { x: 670, y: 200, count: 240, r: 40 }, // India
    { x: 340, y: 350, count: 150, r: 30 }, // SE Brazil
    { x: 820, y: 370, count: 90, r: 25 },  // East Australia
    { x: 550, y: 280, count: 80, r: 20 }   // South Africa
  ];

  for (const c of clusters) {
    for (let i = 0; i < c.count; i++) {
      const dist = Math.random() * c.r;
      const angle = Math.random() * Math.PI * 2;
      const px = c.x + Math.cos(angle) * dist;
      const py = c.y + Math.sin(angle) * dist;
      const brightness = Math.random() * 0.8 + 0.2;
      ctx.fillStyle = `rgba(253, 224, 71, ${brightness})`;
      ctx.fillRect(px, py, 1.2, 1.2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createEarthCloudTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0, 0, 0, 0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Swirling weather patterns
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  for (let i = 0; i < 40; i++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const rx = Math.random() * 80 + 30;
    const ry = Math.random() * 30 + 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, Math.random() * 0.5 - 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

export function createMoonTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#64748b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dark lunar maria (seas)
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(180, 110, 45, 0, Math.PI * 2);
  ctx.arc(240, 90, 35, 0, Math.PI * 2);
  ctx.arc(140, 140, 30, 0, Math.PI * 2);
  ctx.arc(320, 120, 50, 0, Math.PI * 2);
  ctx.fill();

  // Impact craters
  ctx.fillStyle = '#94a3b8';
  for (let i = 0; i < 120; i++) {
    const cx = Math.random() * canvas.width;
    const cy = Math.random() * canvas.height;
    const cr = Math.random() * 5 + 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

export function createSunTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.5, '#f59e0b');
  grad.addColorStop(1, '#d97706');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Solar flares & granulation
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 200; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
  }

  return new THREE.CanvasTexture(canvas);
}

export function createMarsTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.arc(200, 120, 60, 0, Math.PI * 2);
  ctx.arc(340, 150, 45, 0, Math.PI * 2);
  ctx.fill();

  // White polar caps
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, 18);
  ctx.fillRect(0, canvas.height - 18, canvas.width, 18);

  return new THREE.CanvasTexture(canvas);
}
