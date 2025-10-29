import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export interface SceneBuilding {
  id: string;
  name: string;
  language: string;
  height: number;
  width: number;
  depth: number;
  color: string;
  emissive_color?: string;
  emissive_intensity?: number;
  stars: number;
  issues: number;
  share: number;
  bytes: number;
  tooltip?: string;
}

export interface SceneRoadSegment {
  length: number;
  curve: number;
  elevation?: number;
}

export interface SceneRoad {
  segments: SceneRoadSegment[];
  texture: string;
  lanes: number;
  glow?: string;
  traffic?: number;
}

export interface SceneLighting {
  ambient: number;
  directional: number;
  color: string;
  time: string;
  seed: number;
  haze?: number;
  pulse?: number;
  accent?: string;
}

export interface SceneData {
  buildings: SceneBuilding[];
  roads: SceneRoad[];
  lighting: SceneLighting;
}

interface Props {
  scene?: SceneData;
}

const StreetScene: React.FC<Props> = ({ scene }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>();

  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 400;

    const scene3D = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 20, 45);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(typeof window !== 'undefined' ? window.devicePixelRatio : 1);
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 5, 0);
    controls.update();

    const ambientLight = new THREE.AmbientLight(
      scene?.lighting?.color || '#ffffff',
      (scene?.lighting?.ambient ?? 0.5) + (scene?.lighting?.pulse ?? 0) * 0.4
    );
    const directionalLight = new THREE.DirectionalLight(
      scene?.lighting?.accent || scene?.lighting?.color || '#ffffff',
      (scene?.lighting?.directional ?? 0.8) + (scene?.lighting?.pulse ?? 0)
    );
    directionalLight.position.set(10, 20, 10);
    scene3D.add(ambientLight);
    scene3D.add(directionalLight);

    if (scene?.lighting?.haze && scene?.lighting?.haze > 0) {
      scene3D.fog = new THREE.Fog(scene.lighting.color || '#ffffff', 30, 120 - scene.lighting.haze * 20);
    }

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const buildingMeshes: Array<{
      mesh: THREE.Mesh;
      baseScale: THREE.Vector3;
      data: SceneBuilding;
      pulseOffset: number;
    }> = [];
    const accentLights: THREE.PointLight[] = [];
    let particlesSystem: THREE.Points | undefined;

    const seededRandom = createSeededRandom(scene?.lighting?.seed ?? 1);

    if (scene) {
      const spacing = 4;
      const totalSpan = scene.buildings.length
        ? scene.buildings.reduce((span, building) => span + building.width + spacing, -spacing)
        : 0;
      let cursor = scene.buildings.length ? -totalSpan / 2 : 0;

      scene.buildings.forEach((building) => {
        const geometry = new THREE.BoxGeometry(building.width, building.height, building.depth);
        const material = new THREE.MeshStandardMaterial({
          color: building.color,
          emissive: new THREE.Color(building.emissive_color || '#000000'),
          emissiveIntensity: building.emissive_intensity ?? 0,
          roughness: 0.4,
          metalness: 0.1,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(cursor + building.width / 2, building.height / 2, 0);
        scene3D.add(mesh);

        buildingMeshes.push({
          mesh,
          baseScale: mesh.scale.clone(),
          data: building,
          pulseOffset: seededRandom() * Math.PI * 2,
        });

        const baseGeometry = new THREE.BoxGeometry(building.width + 1, 1, building.depth + 1);
        const baseMaterial = new THREE.MeshStandardMaterial({ color: '#2f2f2f' });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(mesh.position.x, 0.5, mesh.position.z);
        scene3D.add(base);

        const labelText = `${building.language}\n⭐ ${building.stars} • 🐛 ${building.issues}\n${formatBytes(building.bytes)} • ${Math.round(
          building.share * 100
        )}%`;
        const label = createLabelSprite(labelText);
        label.position.set(mesh.position.x, mesh.position.y + building.height / 2 + 2, mesh.position.z);
        scene3D.add(label);

        geometries.push(geometry, baseGeometry);
        materials.push(material, baseMaterial, label.material as THREE.Material);
        const labelMaterial = label.material as THREE.SpriteMaterial;
        if (labelMaterial.map) {
          textures.push(labelMaterial.map);
        }

        cursor += building.width + spacing;
      });

      scene.roads.forEach((road, index) => {
        if (road.segments.length === 0) return;
        const roadWidth = Math.max(4, road.lanes * 2.5);
        const roadOffsetZ = index * 8 - 6;
        const totalLength = road.segments.reduce((acc, segment) => acc + segment.length, 0);
        let heading = 0;
        let current = new THREE.Vector3(
          -totalLength / 2,
          (road.segments[0]?.elevation ?? 0) * 0.2,
          roadOffsetZ
        );
        const pathPoints: THREE.Vector3[] = [current.clone()];

        road.segments.forEach((segment) => {
          const dx = Math.cos(heading) * segment.length;
          const dz = Math.sin(heading) * segment.length;
          const nextPoint = current.clone().add(new THREE.Vector3(dx, 0, dz));
          nextPoint.y = (segment.elevation ?? 0) * 0.2;
          pathPoints.push(nextPoint.clone());
          current = nextPoint;
          heading += segment.curve;
        });

        if (pathPoints.length < 2) return;

        const curvePath = new THREE.CatmullRomCurve3(pathPoints);
        curvePath.curveType = 'centripetal';
        const shape = new THREE.Shape();
        const halfWidth = roadWidth / 2;
        shape.moveTo(-halfWidth, 0);
        shape.lineTo(halfWidth, 0);
        shape.lineTo(halfWidth, 0.1);
        shape.lineTo(-halfWidth, 0.1);
        shape.lineTo(-halfWidth, 0);

        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
          steps: Math.max(20, road.segments.length * 10),
          bevelEnabled: false,
          extrudePath: curvePath,
        };

        const roadGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const roadMaterial = new THREE.MeshStandardMaterial({ color: '#3f3f3f' });
        const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
        scene3D.add(roadMesh);

        geometries.push(roadGeometry);
        materials.push(roadMaterial);

        if (road.glow) {
          const glowGeometry = new THREE.TubeGeometry(
            curvePath,
            Math.max(20, road.segments.length * 10),
            roadWidth * 0.3,
            12,
            false
          );
          const glowMaterial = new THREE.MeshBasicMaterial({
            color: road.glow,
            transparent: true,
            opacity: 0.35 + (road.traffic ?? 0) * 0.4,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          });
          const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
          scene3D.add(glowMesh);

          geometries.push(glowGeometry);
          materials.push(glowMaterial);
        }
      });

      const particleCount = 120;
      const particlesGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i += 1) {
        const radius = 25 + seededRandom() * 10;
        const angle = seededRandom() * Math.PI * 2;
        positions[i * 3] = Math.cos(angle) * radius;
        positions[i * 3 + 1] = 5 + seededRandom() * 10;
        positions[i * 3 + 2] = Math.sin(angle) * radius;
      }
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        color: scene.lighting.accent || '#88ccff',
        size: 0.6,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      particlesSystem = new THREE.Points(particlesGeometry, particlesMaterial);
      scene3D.add(particlesSystem);

      geometries.push(particlesGeometry);
      materials.push(particlesMaterial);

      const ambientAccentCount = 3;
      for (let i = 0; i < ambientAccentCount; i += 1) {
        const light = new THREE.PointLight(scene.lighting.accent || scene.lighting.color || '#ffffff', 1, 80, 2);
        light.position.set((seededRandom() - 0.5) * 40, 10 + seededRandom() * 5, (seededRandom() - 0.5) * 40);
        light.userData = {
          phase: seededRandom() * Math.PI * 2,
          radius: 10 + seededRandom() * 10,
          baseIntensity: light.intensity,
        };
        accentLights.push(light);
        scene3D.add(light);
      }
    }

    let animationFrameId: number;
    const clock = new THREE.Clock();
    let elapsedTime = 0;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      elapsedTime += delta;

      buildingMeshes.forEach(({ mesh, baseScale, data, pulseOffset }) => {
        const pulseStrength = Math.min(1, data.stars / 200 + data.share);
        const pulsate = 1 + Math.sin(elapsedTime * 1.2 + pulseOffset) * 0.05 * (1 + pulseStrength);
        mesh.scale.set(
          baseScale.x * (1 + (pulsate - 1) * 0.3),
          baseScale.y * pulsate,
          baseScale.z * (1 + (pulsate - 1) * 0.3)
        );
        const meshMaterial = mesh.material;
        if (meshMaterial instanceof THREE.MeshStandardMaterial) {
          meshMaterial.emissiveIntensity =
            (data.emissive_intensity ?? 0) + Math.max(0, Math.sin(elapsedTime * 2 + pulseOffset)) * 0.3;
        }
      });

      accentLights.forEach((light) => {
        const { phase, radius, baseIntensity } = light.userData as {
          phase: number;
          radius: number;
          baseIntensity: number;
        };
        light.position.x = Math.cos(elapsedTime * 0.3 + phase) * radius;
        light.position.z = Math.sin(elapsedTime * 0.3 + phase) * radius;
        light.intensity = baseIntensity * (1.1 + Math.sin(elapsedTime * 1.5 + phase) * 0.3);
      });

      if (particlesSystem) {
        particlesSystem.rotation.y += delta * 0.1;
      }

      controls.update();
      renderer.render(scene3D, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      rendererRef.current = undefined;
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
    };
  }, [scene]);

  return <div ref={containerRef} style={{ width: '100%', height: '400px' }} />;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function createLabelSprite(text: string): THREE.Sprite {
  const lines = text.split('\n');
  const canvas = document.createElement('canvas');
  const width = 512;
  const lineHeight = 80;
  canvas.width = width;
  canvas.height = Math.max(lineHeight, lines.length * lineHeight);
  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.Sprite();
  }

  context.fillStyle = 'rgba(0, 0, 0, 0.6)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.font = '36px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  lines.forEach((line, index) => {
    context.fillText(line, width / 2, lineHeight / 2 + index * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(12, (lines.length + 0.2) * 5, 1);
  return sprite;
}

function createSeededRandom(seed: number): () => number {
  let value = Math.floor(seed) % 2147483647;
  if (value <= 0) {
    value += 2147483646;
  }
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export default StreetScene;
