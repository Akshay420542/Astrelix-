/**
 * Production WebGL Space Environment
 * Realistic 3D Earth, Atmosphere Glow, Clouds, Sun, Moon, Solar System Bodies,
 * Spacecraft 3D geometries, Orbit Trajectories, and Interactive Camera Rig.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Mission, SatelliteRecord, TrajectoryPoint } from '../../types/mission';
import {
  createEarthCloudTexture,
  createEarthDayTexture,
  createEarthNightTexture,
  createMarsTexture,
  createMoonTexture,
  createSunTexture
} from './textureGenerators';

export type CameraViewMode = 'ORBIT' | 'FOLLOW' | 'EARTH' | 'SOLAR' | 'TOP' | 'PLANE';
export type ScaleMode = 'REAL' | 'MISSION' | 'EARTH_CENTRIC' | 'SOLAR';

interface SpaceSceneProps {
  activeMission: Mission;
  satellites: SatelliteRecord[];
  selectedSatellite: SatelliteRecord | null;
  onSelectSatellite: (sat: SatelliteRecord | null) => void;
  simulationTime: number; // seconds
  isPlaying: boolean;
  timeWarp: number;
  cameraView: CameraViewMode;
  scaleMode: ScaleMode;
  showOrbits: boolean;
  showGroundTracks: boolean;
  showOtherSatellites: boolean;
}

export const SpaceScene: React.FC<SpaceSceneProps> = ({
  activeMission,
  satellites,
  selectedSatellite,
  onSelectSatellite,
  simulationTime,
  isPlaying,
  timeWarp,
  cameraView,
  scaleMode,
  showOrbits,
  showOtherSatellites
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Scene sub-objects
  const earthGroupRef = useRef<THREE.Group | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const moonGroupRef = useRef<THREE.Group | null>(null);
  const sunMeshRef = useRef<THREE.Mesh | null>(null);
  const spacecraftGroupRef = useRef<THREE.Group | null>(null);
  const initialOrbitLineRef = useRef<THREE.Line | null>(null);
  const targetOrbitLineRef = useRef<THREE.Line | null>(null);
  const transferOrbitLineRef = useRef<THREE.Line | null>(null);
  const maneuverMarkersRef = useRef<THREE.Group | null>(null);
  const satelliteInstancedRef = useRef<THREE.InstancedMesh | null>(null);

  // Mouse interaction & camera control state
  const isDraggingRef = useRef(false);
  const isRightDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ theta: 0.8, phi: 0.6, distance: 22 });
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));

  // Scale factor: Earth radius 6378 km -> 5.0 scene units
  const EARTH_RADIUS_SCENE = 5.0;
  const KM_TO_SCENE = 5.0 / 6378.137;

  // Initialize WebGL Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || window.innerWidth;
    const height = containerRef.current.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030509);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(16, 12, 18);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and logarithmic depth
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Starfield
    const starCount = 3000;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const radius = 800 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = radius * Math.cos(phi);

      const tint = Math.random();
      if (tint > 0.8) {
        starColors[i * 3] = 0.8;
        starColors[i * 3 + 1] = 0.9;
        starColors[i * 3 + 2] = 1.0;
      } else if (tint > 0.6) {
        starColors[i * 3] = 1.0;
        starColors[i * 3 + 1] = 0.85;
        starColors[i * 3 + 2] = 0.7;
      } else {
        starColors[i * 3] = 0.9;
        starColors[i * 3 + 1] = 0.9;
        starColors[i * 3 + 2] = 0.9;
      }
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMaterial = new THREE.PointsMaterial({
      size: 1.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    const starField = new THREE.Points(starGeometry, starMaterial);
    scene.add(starField);

    // 5. Lighting: Sun directional light + ambient
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.4);
    sunLight.position.set(120, 20, -60);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0x0a1020, 0.4);
    scene.add(ambientLight);

    // 6. Earth Group
    const earthGroup = new THREE.Group();
    earthGroupRef.current = earthGroup;
    scene.add(earthGroup);

    // Earth Sphere with Day Texture
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS_SCENE, 64, 64);
    const dayTexture = createEarthDayTexture();
    const earthMat = new THREE.MeshStandardMaterial({
      map: dayTexture,
      roughness: 0.7,
      metalness: 0.1
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);

    // Earth Clouds
    const cloudGeo = new THREE.SphereGeometry(EARTH_RADIUS_SCENE * 1.012, 64, 64);
    const cloudTexture = createEarthCloudTexture();
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
    cloudsMeshRef.current = cloudsMesh;
    earthGroup.add(cloudsMesh);

    // Earth Atmosphere Glow Ring
    const atmosphereGeo = new THREE.SphereGeometry(EARTH_RADIUS_SCENE * 1.045, 64, 64);
    const atmosphereMat = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.68 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.2);
          gl_FragColor = vec4(0.22, 0.65, 0.98, 1.0) * intensity * 0.85;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeo, atmosphereMat);
    earthGroup.add(atmosphereMesh);

    // 7. Moon
    const moonGroup = new THREE.Group();
    moonGroupRef.current = moonGroup;
    const moonGeo = new THREE.SphereGeometry(1.36, 32, 32);
    const moonMat = new THREE.MeshStandardMaterial({
      map: createMoonTexture(),
      roughness: 0.9
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.position.set(38, 4, -20);
    moonGroup.add(moonMesh);
    scene.add(moonGroup);

    // 8. Sun Sphere in the distance
    const sunGeo = new THREE.SphereGeometry(14, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
      map: createSunTexture(),
      color: 0xffea00
    });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(120, 20, -60);
    sunMeshRef.current = sunMesh;
    scene.add(sunMesh);

    // Sun Corona Glow
    const coronaGeo = new THREE.SphereGeometry(18, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    sunMesh.add(coronaMesh);

    // 9. Spacecraft Group
    const craftGroup = new THREE.Group();
    spacecraftGroupRef.current = craftGroup;
    scene.add(craftGroup);

    // Build realistic satellite mesh geometry
    const busGeo = new THREE.BoxGeometry(0.35, 0.35, 0.5);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // Gold foil thermal blanket
      roughness: 0.3,
      metalness: 0.8
    });
    const busMesh = new THREE.Mesh(busGeo, busMat);
    craftGroup.add(busMesh);

    // Solar array wings
    const panelGeo = new THREE.BoxGeometry(1.2, 0.02, 0.4);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // Deep blue solar cell
      roughness: 0.2,
      metalness: 0.7
    });
    const leftPanel = new THREE.Mesh(panelGeo, panelMat);
    leftPanel.position.set(-0.85, 0, 0);
    craftGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(panelGeo, panelMat);
    rightPanel.position.set(0.85, 0, 0);
    craftGroup.add(rightPanel);

    // High gain antenna dish
    const dishGeo = new THREE.ConeGeometry(0.2, 0.1, 16);
    const dishMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.9,
      roughness: 0.1
    });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.rotation.x = Math.PI / 2;
    dishMesh.position.set(0, 0.25, 0);
    craftGroup.add(dishMesh);

    // 10. Orbit Lines & Maneuver Markers groups
    const maneuversGroup = new THREE.Group();
    maneuverMarkersRef.current = maneuversGroup;
    scene.add(maneuversGroup);

    // 11. Instanced mesh for satellite catalog
    const satCount = Math.max(1, satellites.length);
    const satInstGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const satInstMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const satInstanced = new THREE.InstancedMesh(satInstGeo, satInstMat, satCount);
    satelliteInstancedRef.current = satInstanced;
    scene.add(satInstanced);

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Slow Earth and clouds rotation
      if (earthGroupRef.current) {
        earthGroupRef.current.rotation.y += delta * 0.02;
      }
      if (cloudsMeshRef.current) {
        cloudsMeshRef.current.rotation.y += delta * 0.025;
      }

      // Smooth camera position update
      if (cameraRef.current) {
        const cam = cameraRef.current;
        const target = cameraTargetRef.current;
        const rot = cameraRotationRef.current;

        const x = target.x + rot.distance * Math.sin(rot.theta) * Math.cos(rot.phi);
        const y = target.y + rot.distance * Math.sin(rot.phi);
        const z = target.z + rot.distance * Math.cos(rot.theta) * Math.cos(rot.phi);

        cam.position.lerp(new THREE.Vector3(x, y, z), 0.1);
        cam.lookAt(target);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        containerRef.current?.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update Orbit Trajectory Lines
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Clean up old lines
    if (initialOrbitLineRef.current) {
      scene.remove(initialOrbitLineRef.current);
      initialOrbitLineRef.current.geometry.dispose();
    }
    if (targetOrbitLineRef.current) {
      scene.remove(targetOrbitLineRef.current);
      targetOrbitLineRef.current.geometry.dispose();
    }
    if (transferOrbitLineRef.current) {
      scene.remove(transferOrbitLineRef.current);
      transferOrbitLineRef.current.geometry.dispose();
    }

    if (!showOrbits) return;

    // 1. Initial Orbit Ellipse
    const orb = activeMission.initialOrbit;
    const aScene = orb.a * KM_TO_SCENE;
    const bScene = orb.a * Math.sqrt(1 - orb.e * orb.e) * KM_TO_SCENE;
    const cScene = orb.a * orb.e * KM_TO_SCENE; // center offset

    const pointsInitial: THREE.Vector3[] = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const xPlane = aScene * Math.cos(theta) - cScene;
      const yPlane = bScene * Math.sin(theta);

      // Rotate by inclination and RAAN
      const iRad = (orb.i * Math.PI) / 180;
      const raanRad = (orb.raan * Math.PI) / 180;
      const argPRad = (orb.argPeriapsis * Math.PI) / 180;

      // Transform from perifocal to ECI scene
      const x = (Math.cos(raanRad) * Math.cos(argPRad) - Math.sin(raanRad) * Math.sin(argPRad) * Math.cos(iRad)) * xPlane +
                (-Math.cos(raanRad) * Math.sin(argPRad) - Math.sin(raanRad) * Math.cos(argPRad) * Math.cos(iRad)) * yPlane;
      const y = (Math.sin(argPRad) * Math.sin(iRad)) * xPlane +
                (Math.cos(argPRad) * Math.sin(iRad)) * yPlane;
      const z = (Math.sin(raanRad) * Math.cos(argPRad) + Math.cos(raanRad) * Math.sin(argPRad) * Math.cos(iRad)) * xPlane +
                (-Math.sin(raanRad) * Math.sin(argPRad) + Math.cos(raanRad) * Math.cos(argPRad) * Math.cos(iRad)) * yPlane;

      pointsInitial.push(new THREE.Vector3(x, y, z));
    }

    const initGeo = new THREE.BufferGeometry().setFromPoints(pointsInitial);
    const initMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const initLine = new THREE.Line(initGeo, initMat);
    scene.add(initLine);
    initialOrbitLineRef.current = initLine;

    // 2. Target Orbit Line (if defined)
    if (activeMission.targetOrbit) {
      const tgt = activeMission.targetOrbit;
      const atScene = tgt.a * KM_TO_SCENE;
      const btScene = tgt.a * Math.sqrt(1 - tgt.e * tgt.e) * KM_TO_SCENE;
      const ctScene = tgt.a * tgt.e * KM_TO_SCENE;

      const pointsTarget: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const xPlane = atScene * Math.cos(theta) - ctScene;
        const yPlane = btScene * Math.sin(theta);
        pointsTarget.push(new THREE.Vector3(xPlane, 0, yPlane));
      }
      const tgtGeo = new THREE.BufferGeometry().setFromPoints(pointsTarget);
      const tgtMat = new THREE.LineDashedMaterial({
        color: 0x10b981,
        dashSize: 0.5,
        gapSize: 0.25
      });
      const tgtLine = new THREE.Line(tgtGeo, tgtMat);
      tgtLine.computeLineDistances();
      scene.add(tgtLine);
      targetOrbitLineRef.current = tgtLine;
    }
  }, [activeMission, showOrbits, KM_TO_SCENE]);

  // Update Spacecraft Position along Trajectory
  useEffect(() => {
    if (!spacecraftGroupRef.current) return;
    const craft = spacecraftGroupRef.current;

    // Calculate position based on Keplerian true anomaly + simulation elapsed time
    const orb = activeMission.initialOrbit;
    const meanMotion = Math.sqrt(398600.4418 / Math.pow(orb.a, 3)); // rad/s
    const currentTrueAnomaly = ((orb.trueAnomaly + (meanMotion * simulationTime * 180) / Math.PI) % 360) * (Math.PI / 180);

    const p = orb.a * (1 - orb.e * orb.e) * KM_TO_SCENE;
    const r = p / (1 + orb.e * Math.cos(currentTrueAnomaly));

    const iRad = (orb.i * Math.PI) / 180;
    const raanRad = (orb.raan * Math.PI) / 180;
    const argPRad = (orb.argPeriapsis * Math.PI) / 180;
    const u = currentTrueAnomaly + argPRad;

    const x = r * (Math.cos(raanRad) * Math.cos(u) - Math.sin(raanRad) * Math.sin(u) * Math.cos(iRad));
    const y = r * (Math.sin(u) * Math.sin(iRad));
    const z = r * (Math.sin(raanRad) * Math.cos(u) + Math.cos(raanRad) * Math.sin(u) * Math.cos(iRad));

    craft.position.set(x, y, z);
    craft.lookAt(x + 1, y, z);

    // If Follow camera mode is active, center on spacecraft
    if (cameraView === 'FOLLOW') {
      cameraTargetRef.current.copy(craft.position);
    }
  }, [simulationTime, activeMission, cameraView, KM_TO_SCENE]);

  // Update Satellite Catalog Markers
  useEffect(() => {
    if (!satelliteInstancedRef.current) return;
    const inst = satelliteInstancedRef.current;
    inst.visible = showOtherSatellites;

    const dummy = new THREE.Object3D();
    satellites.forEach((sat, i) => {
      const r = (sat.altitudeKm + 6378.137) * KM_TO_SCENE;
      const iRad = (sat.elements.i * Math.PI) / 180;
      const raanRad = (sat.elements.raan * Math.PI) / 180;
      const nuRad = (sat.elements.trueAnomaly * Math.PI) / 180;

      const x = r * (Math.cos(raanRad) * Math.cos(nuRad) - Math.sin(raanRad) * Math.sin(nuRad) * Math.cos(iRad));
      const y = r * (Math.sin(nuRad) * Math.sin(iRad));
      const z = r * (Math.sin(raanRad) * Math.cos(nuRad) + Math.cos(raanRad) * Math.sin(nuRad) * Math.cos(iRad));

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(sat.id === selectedSatellite?.id ? 2.5 : 1.0);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    });
    inst.instanceMatrix.needsUpdate = true;
  }, [satellites, selectedSatellite, showOtherSatellites, KM_TO_SCENE]);

  // Camera Preset Views
  useEffect(() => {
    switch (cameraView) {
      case 'EARTH':
        cameraTargetRef.current.set(0, 0, 0);
        cameraRotationRef.current = { theta: 0.8, phi: 0.5, distance: 16 };
        break;
      case 'ORBIT':
        cameraTargetRef.current.set(0, 0, 0);
        cameraRotationRef.current = { theta: 1.2, phi: 0.4, distance: 26 };
        break;
      case 'SOLAR':
        cameraTargetRef.current.set(0, 0, 0);
        cameraRotationRef.current = { theta: 0.5, phi: 0.8, distance: 95 };
        break;
      case 'TOP':
        cameraTargetRef.current.set(0, 0, 0);
        cameraRotationRef.current = { theta: 0, phi: Math.PI / 2 - 0.05, distance: 30 };
        break;
      case 'PLANE':
        cameraTargetRef.current.set(0, 0, 0);
        cameraRotationRef.current = { theta: 0, phi: 0.02, distance: 28 };
        break;
      case 'FOLLOW':
        if (spacecraftGroupRef.current) {
          cameraTargetRef.current.copy(spacecraftGroupRef.current.position);
          cameraRotationRef.current.distance = 5;
        }
        break;
    }
  }, [cameraView]);

  // Scale Mode presets
  useEffect(() => {
    if (scaleMode === 'SOLAR') {
      cameraRotationRef.current.distance = 180;
    } else if (scaleMode === 'EARTH_CENTRIC') {
      cameraRotationRef.current.distance = 18;
    }
  }, [scaleMode]);

  // Mouse drag & zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      isDraggingRef.current = true;
    } else if (e.button === 2) {
      isRightDraggingRef.current = true;
    }
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    if (isDraggingRef.current) {
      cameraRotationRef.current.theta -= deltaX * 0.006;
      cameraRotationRef.current.phi = Math.max(
        -Math.PI / 2 + 0.05,
        Math.min(Math.PI / 2 - 0.05, cameraRotationRef.current.phi + deltaY * 0.006)
      );
    } else if (isRightDraggingRef.current) {
      // Pan camera target
      const panSpeed = 0.02;
      cameraTargetRef.current.x -= deltaX * panSpeed;
      cameraTargetRef.current.y += deltaY * panSpeed;
    }

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isRightDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY * 0.02;
    cameraRotationRef.current.distance = Math.max(
      6.0,
      Math.min(500, cameraRotationRef.current.distance + zoomFactor)
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* 3D Viewport HUD Overlay info */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-400 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          <span>VIEWPORT: {cameraView}</span>
          <span className="text-slate-600">|</span>
          <span>SCALE: {scaleMode}</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-300">DISTANCE: {Math.round(cameraRotationRef.current.distance * 1275)} km</span>
        </div>
      </div>
    </div>
  );
};
