import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface SceneData {
  buildings: Array<{ name: string; height: number; width: number; color: string }>;
  roads: Array<{ segments: Array<{ length: number; curve: number }>; texture: string }>;
  lighting: { ambient: number; directional: number; color: string; time: string; seed: number };
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

    const ambientLight = new THREE.AmbientLight(scene?.lighting?.color || '#ffffff', scene?.lighting?.ambient ?? 0.5);
    const directionalLight = new THREE.DirectionalLight(scene?.lighting?.color || '#ffffff', scene?.lighting?.directional ?? 0.8);
    directionalLight.position.set(10, 20, 10);
    scene3D.add(ambientLight);
    scene3D.add(directionalLight);

    if (scene) {
      scene.buildings.forEach((building, index) => {
        const geometry = new THREE.BoxGeometry(building.width, building.height, building.width);
        const material = new THREE.MeshStandardMaterial({ color: building.color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(index * (building.width + 2), building.height / 2, 0);
        scene3D.add(mesh);

        const label = createLabelSprite(building.name);
        label.position.set(mesh.position.x, mesh.position.y + building.height / 2 + 2, mesh.position.z);
        scene3D.add(label);
      });

      scene.roads.forEach((road, index) => {
        const geometry = new THREE.PlaneGeometry(road.segments.length * 10, 4);
        const material = new THREE.MeshStandardMaterial({ color: '#444444' });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(0, 0.01, index * 6 - 3);
        scene3D.add(mesh);
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

function createLabelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  const size = 256;
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) {
    return new THREE.Sprite();
  }

  context.fillStyle = 'rgba(0, 0, 0, 0.6)';
  context.fillRect(0, 0, size, size);
  context.fillStyle = '#ffffff';
  context.font = '28px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(10, 5, 1);
  return sprite;
}

export default StreetScene;
