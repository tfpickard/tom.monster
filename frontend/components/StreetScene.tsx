import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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
    rendererRef.current = renderer;
    containerRef.current.appendChild(renderer.domElement);

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

        cursor += building.width + spacing;
      });

      scene.roads.forEach((road, index) => {
        const roadWidth = Math.max(4, road.lanes * 2.5);
        const segmentTotal = road.segments.reduce((acc, segment) => acc + segment.length, 0);
        const totalLength = road.segments.length > 0 ? segmentTotal + (road.segments.length - 1) : 0;
        let segmentCursor = road.segments.length > 0 ? -totalLength / 2 : 0;

        road.segments.forEach((segment) => {
          const geometry = new THREE.PlaneGeometry(segment.length, roadWidth);
          const material = new THREE.MeshStandardMaterial({ color: '#3f3f3f', side: THREE.DoubleSide });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(segmentCursor + segment.length / 2, (segment.elevation ?? 0) * 0.2, index * 8 - 6);
          mesh.rotation.z = segment.curve;
          scene3D.add(mesh);

          if (road.glow) {
            const glowGeometry = new THREE.PlaneGeometry(segment.length, roadWidth * 0.6);
            const glowMaterial = new THREE.MeshBasicMaterial({
              color: road.glow,
              transparent: true,
              opacity: 0.35 + (road.traffic ?? 0) * 0.4,
              side: THREE.DoubleSide,
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            glow.rotation.x = -Math.PI / 2;
            glow.position.copy(mesh.position);
            scene3D.add(glow);
          }

          segmentCursor += segment.length + 1;
        });
      });
    }

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene3D, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      rendererRef.current = undefined;
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

export default StreetScene;
