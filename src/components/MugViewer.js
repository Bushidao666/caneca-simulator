import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function MugViewer({ color = "#ffffff", texture = null, editable = false, onChange }) {
  const containerRef = useRef(null);
  const rendererRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const bodyMaterialRef = useRef();
  const currentTextureUrlRef = useRef(null);
  const animationIdRef = useRef();

  const renderLoop = useCallback(() => {
    animationIdRef.current = requestAnimationFrame(renderLoop);
    if (controlsRef.current) controlsRef.current.update();
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
    camera.position.set(-1.6, 1.2, 2.2);
    cameraRef.current = camera;
    scene.add(camera);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = true;
    controlsRef.current = controls;

    // Simple mug: cylinder + torus handle
    const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 64, 1, true);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), metalness: 0.1, roughness: 0.8, side: THREE.DoubleSide });
    bodyMaterialRef.current = bodyMaterial;
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);

    // Top/bottom caps
    const capGeometry = new THREE.CircleGeometry(0.5, 64);
    const capTop = new THREE.Mesh(capGeometry, bodyMaterial);
    capTop.position.y = 0.4;
    capTop.rotation.x = -Math.PI / 2;
    const capBottom = new THREE.Mesh(capGeometry, bodyMaterial);
    capBottom.position.y = -0.4;
    capBottom.rotation.x = Math.PI / 2;

    // Handle
    const handleGeometry = new THREE.TorusGeometry(0.28, 0.07, 24, 64, Math.PI * 1.2);
    const handle = new THREE.Mesh(handleGeometry, bodyMaterial);
    handle.position.set(0.6, 0, 0);
    handle.rotation.y = Math.PI / 2;

    const group = new THREE.Group();
    group.add(bodyMesh, capTop, capBottom, handle);
    scene.add(group);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener("resize", resize);
    resize();

    renderLoop();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener("resize", resize);
      ro.disconnect();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (renderer.domElement && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      }
      if (sceneRef.current) {
        sceneRef.current.traverse((obj) => {
          if (obj.isMesh) {
            obj.geometry.dispose();
            if (obj.material.map) obj.material.map.dispose();
            obj.material.dispose();
          }
        });
      }
      if (currentTextureUrlRef.current) {
        URL.revokeObjectURL(currentTextureUrlRef.current);
      }
    };
  }, []);

  // Apply color prop changes
  useEffect(() => {
    const mat = bodyMaterialRef.current;
    if (mat && mat.color) mat.color.set(color);
  }, [color]);

  // Apply texture prop changes
  useEffect(() => {
    const mat = bodyMaterialRef.current;
    if (!mat) return;
    if (!texture) {
      if (mat.map) mat.map.dispose();
      mat.map = null;
      mat.needsUpdate = true;
      return;
    }
    const url = texture.startsWith("blob:") || texture.startsWith("data:") ? texture : texture;
    const loader = new THREE.TextureLoader();
    loader.load(url, (tex) => {
      mat.map = tex;
      mat.needsUpdate = true;
    });
  }, [texture]);

  const handleColorChange = (e) => {
    onChange && onChange({ color: e.target.value });
  };

  const handleTextureChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Ler como Data URL para persistir no localStorage
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      currentTextureUrlRef.current = dataUrl;
      onChange && onChange({ texture: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveTexture = () => {
    if (currentTextureUrlRef.current && String(currentTextureUrlRef.current).startsWith("blob:")) {
      URL.revokeObjectURL(currentTextureUrlRef.current);
    }
    currentTextureUrlRef.current = null;
    onChange && onChange({ texture: null });
  };

  return (
    <div className="viewer">
      {editable ? (
        <div className="controls">
          <div className="control-group">
            <label>Cor</label>
            <input type="color" value={color} onChange={handleColorChange} />
          </div>
          <div className="control-group">
            <label>Textura</label>
            <input type="file" accept="image/*" onChange={handleTextureChange} />
            <button type="button" onClick={handleRemoveTexture}>Remover textura</button>
          </div>
        </div>
      ) : null}
      <div className="canvas-wrap" ref={containerRef} />
    </div>
  );
}

