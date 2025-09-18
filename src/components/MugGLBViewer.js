import { useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Palette, Image, Trash2 } from "lucide-react";

export default function MugGLBViewer({ color = "#ffffff", texture = null, editable = false, onChange }) {
  const containerRef = useRef(null);
  const rendererRef = useRef();
  const sceneRef = useRef();
  const cameraRef = useRef();
  const controlsRef = useRef();
  const bodyMaterialRef = useRef();
  const colorMaterialRef = useRef();
  const paintMaterialsRef = useRef([]);
  const targetTextureMaterialRef = useRef(null);
  const animationIdRef = useRef();
  const currentTextureUrlRef = useRef(null);

  const renderLoop = useCallback(() => {
    animationIdRef.current = requestAnimationFrame(renderLoop);
    if (controlsRef.current) controlsRef.current.update();
    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, []);

  const normalizeTextureUrl = (src) => {
    if (!src) return src;
    if (src.startsWith("data:")) return src;
    if (typeof window === "undefined") return src;
    const isAbsolute = /^https?:\/\//i.test(src);
    if (!isAbsolute) return src;
    try {
      const u = new URL(src);
      const sameOrigin = u.origin === window.location.origin;
      if (sameOrigin) return src;
      return `/api/storage/proxy?url=${encodeURIComponent(src)}`;
    } catch {
      return src;
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(20, 1, 0.01, 1e4);
    cameraRef.current = camera;
    scene.add(camera);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1);
    scene.add(hemi);
    const dir = new THREE.DirectionalLight(0xffffff, 0.6);
    dir.position.set(2, 3, 4);
    scene.add(dir);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.autoRotate = true;
    controlsRef.current = controls;

    const loader = new GLTFLoader();
    loader.load(
      "/model1.glb",
      (gltf) => {
        const object = gltf.scene || gltf.scenes[0];
        let largestMetric = -Infinity;
        object.traverse((obj) => {
          if (obj.isMesh) {
            console.log("Mesh encontrado:", obj.name, "Material:", obj.material);
            
            // Coleciona materiais "pintáveis"
            const material = obj.material;
            const materials = Array.isArray(material) ? material : [material];
            materials.forEach((m, index) => {
              if (m) {
                console.log(`Material ${index}:`, m.type, m.name, "Color:", m.color?.getHex());
                paintMaterialsRef.current.push(m);
              }
            });

            // Heurística do corpo: maior bounding box
            obj.geometry?.computeBoundingBox?.();
            const bb = obj.geometry?.boundingBox;
            if (bb) {
              const size = new THREE.Vector3();
              bb.getSize(size);
              const metric = size.x * size.y + size.y * size.z + size.z * size.x;
              if (metric > largestMetric) {
                largestMetric = metric;
                targetTextureMaterialRef.current = materials[0];
                console.log("Maior mesh para textura:", obj.name, "Metric:", metric);
              }
            }

            // Preferir nomes conhecidos
            if (obj.name === "Mug_Porcelain_PBR001_0") {
              bodyMaterialRef.current = materials[0];
              console.log("Body material definido:", materials[0]);
            }
            if (obj.name === "Mug_Porcelain_PBR002_0") {
              colorMaterialRef.current = materials[0];
              console.log("Color material definido:", materials[0]);
            }
            if (!bodyMaterialRef.current) bodyMaterialRef.current = materials[0];
            else if (!colorMaterialRef.current) colorMaterialRef.current = materials[0];
          }
        });

        console.log("Materiais coletados:", {
          paintMaterials: paintMaterialsRef.current.length,
          bodyMaterial: !!bodyMaterialRef.current,
          colorMaterial: !!colorMaterialRef.current,
          targetTextureMaterial: !!targetTextureMaterialRef.current
        });

        const colorTarget = colorMaterialRef.current || bodyMaterialRef.current;
        if (colorTarget && colorTarget.color) colorTarget.color.set(color);

        object.updateMatrixWorld(true);
        const bbox = new THREE.Box3().setFromObject(object);
        const size = new THREE.Vector3();
        bbox.getSize(size);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        object.position.sub(center);

        const radius = size.length();
        camera.position.copy(center);
        camera.position.x += radius * -0.2;
        camera.position.y += radius * 0.4;
        camera.position.z += radius * 1.4;
        camera.near = radius / 100;
        camera.far = radius * 100;
        camera.updateProjectionMatrix();
        camera.lookAt(new THREE.Vector3(0, 0, 0));
        controls.maxDistance = radius * 50;

        scene.add(object);
        resize();
      },
      undefined,
      () => {}
    );

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
        if (renderer.domElement && renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      }
      if (controlsRef.current) controlsRef.current.dispose();
      if (sceneRef.current) {
        sceneRef.current.traverse((obj) => {
          if (obj.isMesh) {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) {
              const material = obj.material;
              if (Array.isArray(material)) material.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
              else { if (material.map) material.map.dispose(); material.dispose(); }
            }
          }
        });
      }
      if (currentTextureUrlRef.current && String(currentTextureUrlRef.current).startsWith("blob:")) {
        URL.revokeObjectURL(currentTextureUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const m = colorMaterialRef.current;
    if (m && m.color) { m.color.set(color); m.needsUpdate = true; }
  }, [color]);

  useEffect(() => {
    console.log("=== APLICANDO TEXTURA ===");
    console.log("Texture prop:", texture ? `${texture.substring(0, 50)}...` : "null");
    
    // Aplicar textura a TODOS os materiais disponíveis para garantir visibilidade
    const allMaterials = paintMaterialsRef.current.length > 0 ? paintMaterialsRef.current : [];
    if (targetTextureMaterialRef.current) allMaterials.push(targetTextureMaterialRef.current);
    if (bodyMaterialRef.current) allMaterials.push(bodyMaterialRef.current);
    if (colorMaterialRef.current) allMaterials.push(colorMaterialRef.current);
    
    // Remover duplicatas
    const uniqueMaterials = [...new Set(allMaterials)].filter(Boolean);
    console.log("Materiais únicos para textura:", uniqueMaterials.length);
    
    if (!uniqueMaterials.length) {
      console.warn("Nenhum material encontrado para aplicar textura!");
      return;
    }
    
    if (!texture) {
      console.log("Removendo texturas existentes...");
      uniqueMaterials.forEach((mat, index) => {
        console.log(`Removendo textura do material ${index}:`, mat.type);
        if (mat.map) {
          mat.map.dispose();
          mat.map = null;
        }
        mat.needsUpdate = true;
      });
      return;
    }
    
    const url = normalizeTextureUrl(texture);
    console.log("URL normalizada:", url.substring(0, 100));
    
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    
    const applyTexture = (tex) => {
      console.log("Textura carregada com sucesso:", tex.image.width, "x", tex.image.height);
      tex.encoding = THREE.sRGBEncoding;
      tex.flipY = false;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.needsUpdate = true;
      
      uniqueMaterials.forEach((mat, index) => {
        console.log(`Aplicando textura ao material ${index}:`, mat.type);
        if (mat.map) mat.map.dispose();
        mat.map = tex.clone();
        mat.map.needsUpdate = true;
        // Manter cor branca para mostrar a textura
        if (mat.color) {
          mat.color.set("#ffffff");
        }
        mat.needsUpdate = true;
      });
      console.log("Textura aplicada a todos os materiais!");
    };
    
    console.log("Carregando textura...");
    loader.load(url, applyTexture, undefined, (error) => {
      console.error("Erro no carregamento principal:", error);
      // Fallback: tentar carregar diretamente
      console.log("Tentando fallback...");
      const loader2 = new THREE.TextureLoader();
      loader2.load(texture, applyTexture, undefined, (error2) => {
        console.error("Falha completa ao carregar textura:", error2);
      });
    });
  }, [texture]);

  const handleColorChange = (e) => onChange && onChange({ color: e.target.value });
  const handleTextureChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
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
            <label><Palette size={12} className="inline mr-1" />Cor</label>
            <input type="color" value={color} onChange={handleColorChange} />
          </div>
          <div className="control-group">
            <label><Image size={12} className="inline mr-1" />Textura</label>
            <input type="file" accept="image/*" onChange={handleTextureChange} />
            <button className="btn" type="button" onClick={handleRemoveTexture}><Trash2 size={12} /></button>
          </div>
        </div>
      ) : null}
      <div className="canvas-wrap" ref={containerRef} />
    </div>
  );
}

