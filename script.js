import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// ========================================
// MOBILE DETECTION & PERFORMANCE CONFIG
// ========================================
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

const IS_MOBILE = isMobile();
const PERFORMANCE_MODE = IS_MOBILE ? 'low' : 'high';

// Mobile-specific settings
const CONFIG = {
  pixelRatio: IS_MOBILE ? 1 : Math.min(window.devicePixelRatio, 2),
  shadowsEnabled: !IS_MOBILE,
  antialias: !IS_MOBILE,
  maxLights: IS_MOBILE ? 2 : 4,
  modelScale: IS_MOBILE ? 0.4 : 1,
  scrollEnd: IS_MOBILE ? "+=300%" : "+=500%", // Shorter scroll on mobile
};

console.log(`🔧 Performance mode: ${PERFORMANCE_MODE}`, CONFIG);

// ========================================
// CLICK HANDLER FOR TOOLTIPS
// ========================================
document.querySelectorAll(".tooltip").forEach((card) => {
  card.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevent event bubbling
    
    document.querySelectorAll(".tooltip").forEach((c) => {
      if (c !== card) c.classList.remove("open");
    });
    
    card.classList.toggle("open");
  });
});

// Close tooltips when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".tooltip")) {
    document.querySelectorAll(".tooltip").forEach((c) => c.classList.remove("open"));
  }
});

// ========================================
// WAIT FOR GSAP TO LOAD
// ========================================
window.addEventListener("load", () => {
  if (typeof gsap === "undefined") {
    console.error("❌ GSAP not loaded!");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  
  // Mobile-specific ScrollTrigger settings
  if (IS_MOBILE) {
    ScrollTrigger.config({
      autoRefreshEvents: "visibilitychange,DOMContentLoaded,load",
      ignoreMobileResize: true, // Critical for iOS
    });
  }
  
  initializeApp();
});

let giftModel = null;

function initializeApp() {
  console.log("🚀 App initialized");

  // ========================================
  // TEXT SPLITTING
  // ========================================
  function splitText(selector, type = "chars") {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      const text = element.textContent;
      element.innerHTML = "";

      if (type === "chars") {
        text.split("").forEach((char) => {
          const span = document.createElement("span");
          span.className = "char";
          span.innerHTML = `<span>${char === " " ? "&nbsp;" : char}</span>`;
          element.appendChild(span);
        });
      } else if (type === "lines") {
        const words = text.split(" ");
        words.forEach((word, i) => {
          const span = document.createElement("span");
          span.className = "line";
          span.innerHTML = `<span>${word}${i < words.length - 1 ? "&nbsp;" : ""}</span>`;
          element.appendChild(span);
        });
      }
    });
  }

  splitText(".header-1 h1", "chars");
  splitText(".tooltip .title h2", "lines");
  splitText(".tooltip .description p", "lines");
  splitText(".outro-question h1", "chars");

  console.log("✅ Text split complete");

  // ========================================
  // PRODUCT OVERVIEW THREE.JS SETUP
  // ========================================
  let fullHeart, modelSize;
  let modelsReady = 0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const renderer = new THREE.WebGLRenderer({
    antialias: CONFIG.antialias,
    alpha: true,
    powerPreference: IS_MOBILE ? "default" : "high-performance", // Battery-friendly on mobile
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(CONFIG.pixelRatio);
  renderer.shadowMap.enabled = CONFIG.shadowsEnabled;
  if (CONFIG.shadowsEnabled) {
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  const modelContainer = document.querySelector(".model-container");
  if (modelContainer) {
    modelContainer.appendChild(renderer.domElement);
    console.log("✅ Canvas added to DOM (product overview)");
  } else {
    console.error("❌ .model-container not found!");
  }

  // ========================================
  // LIGHTING SETUP (Reduced for mobile)
  // ========================================
  const ambientLight = new THREE.AmbientLight(0xfce7f3, IS_MOBILE ? 2.0 : 1.5);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xf472b6, IS_MOBILE ? 1.5 : 2.0);
  mainLight.position.set(5, 5, 5);
  if (CONFIG.shadowsEnabled) {
    mainLight.castShadow = true;
  }
  scene.add(mainLight);

  if (!IS_MOBILE) {
    const fillLight = new THREE.DirectionalLight(0xec4899, 1.2);
    fillLight.position.set(-5, 3, -3);
    scene.add(fillLight);

    const backLight = new THREE.DirectionalLight(0xfce7f3, 0.8);
    backLight.position.set(0, -3, -5);
    scene.add(backLight);
  }

  console.log("✅ Lights added (product overview)");

  // ========================================
  // MODEL SETUP
  // ========================================
  function setupModel(model) {
    if (!model || !modelSize) return;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());

    model.position.set(-center.x, -center.y, -center.z);
    model.rotation.set(0, 0, 0);

    const maxDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    cameraZ *= 1.8;

    camera.position.set(0, 0, cameraZ);
    camera.lookAt(0, 0, 0);

    console.log("✅ Camera positioned at:", camera.position);
  }

  // ========================================
  // LOAD HEART MODEL
  // ========================================
  console.log("📦 Loading heart.glb");

  const loader = new GLTFLoader();
  loader.load(
    "./heart.glb",
    (gltf) => {
      console.log("✅ FULL HEART LOADED!");
      fullHeart = gltf.scene;

      fullHeart.traverse((node) => {
        if (node.isMesh && node.material) {
          if (CONFIG.shadowsEnabled) {
            node.castShadow = true;
            node.receiveShadow = true;
          }

          if (Array.isArray(node.material)) {
            node.material.forEach((mat) => {
              mat.metalness = 0.3;
              mat.roughness = 0.6;
              mat.needsUpdate = true;
            });
          } else {
            node.material.metalness = 0.3;
            node.material.roughness = 0.6;
            node.material.needsUpdate = true;
          }
        }
      });

      const box = new THREE.Box3().setFromObject(fullHeart);
      modelSize = box.getSize(new THREE.Vector3());

      console.log("📏 Full heart dimensions:", {
        x: modelSize.x.toFixed(2),
        y: modelSize.y.toFixed(2),
        z: modelSize.z.toFixed(2),
      });

      fullHeart.scale.set(CONFIG.modelScale, CONFIG.modelScale, CONFIG.modelScale);
      fullHeart.visible = true;
      scene.add(fullHeart);
      setupModel(fullHeart);

      modelsReady++;
      setupScrollAnimations();
      setupOutroScene();
    },
    (progress) => {
      if (progress.total > 0) {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(0);
        console.log(`⏳ Loading full heart: ${percent}%`);
      }
    },
    (error) => {
      console.error("❌ ERROR LOADING FULL HEART", error);
    }
  );

  // ========================================
  // SCROLL ANIMATIONS
  // ========================================
  function setupScrollAnimations() {
    console.log("🎬 Setting up scroll animations...");

    const scrollTL = gsap.timeline({
      scrollTrigger: {
        trigger: ".product-overview",
        start: "top top",
        end: CONFIG.scrollEnd,
        pin: true,
        scrub: IS_MOBILE ? 0.5 : 1, // Faster scrub on mobile
        anticipatePin: 1,
        invalidateOnRefresh: true, // Critical for mobile

        onEnter: () => {
          console.log("🎯 Animation section entered");
          const model = document.querySelector(".model-container");
          if (model) {
            model.style.opacity = "1";
            model.style.visibility = "visible";
          }
        },

        onLeaveBack: () => {
          const model = document.querySelector(".model-container");
          if (model) {
            model.style.opacity = "0";
            model.style.visibility = "hidden";
          }
        },
      }
    });

    // Simplified timeline for mobile
    const animDuration = IS_MOBILE ? 0.4 : 0.6;
    const animStagger = IS_MOBILE ? 0.005 : 0.01;

    scrollTL
      // PHASE 1: Header-1
      .fromTo(
        ".header-1 h1 .char > span",
        { y: "100%" },
        { y: "0%", stagger: animStagger, duration: animDuration, ease: "power3.out" },
        0
      )
      .to(
        ".header-1 h1 .char > span",
        { xPercent: -150, stagger: animStagger, duration: 1, ease: "power2.inOut" },
        0.4
      )

      // PHASE 2: Circular mask
      .fromTo(
        ".circular-mask",
        { clipPath: "circle(0% at 50% 50%)" },
        { clipPath: "circle(80% at 50% 50%)", duration: 0.8, ease: "power2.inOut" },
        0.9
      )

      // PHASE 3: Header-2
      .fromTo(
        ".header-2",
        { xPercent: 150 },
        { xPercent: -150, duration: 1.4, ease: "power1.inOut" },
        1.7
      )

      // TOOLTIPS (simplified for mobile)
      .fromTo(".tooltip:nth-child(1)", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35 }, 2.6)
      .fromTo(".tooltip:nth-child(1) .divider", { scaleX: 0 }, { scaleX: 1, duration: 0.35 }, 2.65)
      .fromTo(".tooltip:nth-child(1) .icon ion-icon", { y: "125%" }, { y: "0%", duration: 0.4 }, 2.7)
      .fromTo(".tooltip:nth-child(1) .title .line > span", { y: "125%" }, { y: "0%", duration: 0.4, stagger: 0.05 }, 2.85)
      .fromTo(".tooltip:nth-child(1) .description .line > span", { y: "125%" }, { y: "0%", duration: 0.4, stagger: 0.03 }, 3.0)

      .fromTo(".tooltip:nth-child(2)", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35 }, 3.3)
      .fromTo(".tooltip:nth-child(2) .divider", { scaleX: 0 }, { scaleX: 1, duration: 0.35 }, 3.35)
      .fromTo(".tooltip:nth-child(2) .icon ion-icon", { y: "125%" }, { y: "0%", duration: 0.4 }, 3.4)
      .fromTo(".tooltip:nth-child(2) .title .line > span", { y: "125%" }, { y: "0%", duration: 0.4, stagger: 0.05 }, 3.55)
      .fromTo(".tooltip:nth-child(2) .description .line > span", { y: "125%" }, { y: "0%", duration: 0.4, stagger: 0.03 }, 3.7)

      .fromTo(".tooltip:nth-child(3)", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35 }, 4.0)
      .fromTo(".tooltip:nth-child(3) .divider", { scaleX: 0 }, { scaleX: 1, duration: 0.35 }, 4.05)
      .fromTo(".tooltip:nth-child(3) .icon ion-icon", { y: "125%" }, { y: "0%", duration: 0.4 }, 4.1)
      .fromTo(".tooltip:nth-child(3) .title .line > span", { y: "125%" }, { y: "0%", duration: 0.4, stagger: 0.05 }, 4.25)
      .fromTo(".tooltip:nth-child(3) .description .line > span", { y: "125%" }, { y: "0%", duration: 0.4, stagger: 0.03 }, 4.4)

      .fromTo(".tooltip:nth-child(4)", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.35 }, 4.7)
      .fromTo(".tooltip:nth-child(4) .divider", { scaleX: 0 }, { scaleX: 1, duration: 0.35 }, 4.75)
      .fromTo(".tooltip:nth-child(4) .icon ion-icon", { y: "125%" }, { y: "0%", duration: 0.4 }, 4.8)
      .fromTo(".tooltip:nth-child(4) .title .line > span", { y: "125%" }, { y: "0%", duration: 0.4, stagger: 0.05 }, 4.95)
      .fromTo(".tooltip:nth-child(4) .description .line > span", { y: "125%" }, { y: "0%", duration: 0.4, stagger: 0.03 }, 5.1)

      // Fade out tooltips
      .to(".tooltip", { opacity: 0, y: -30, duration: 0.5, stagger: 0.1 }, 5.5)

      // ZOOM IN FULL HEART
      .to(
        fullHeart ? fullHeart.scale : {},
        {
          x: IS_MOBILE ? 4 : 6.5,
          y: IS_MOBILE ? 4 : 6.5,
          z: IS_MOBILE ? 4 : 6.5,
          duration: 2,
          ease: "power2.inOut",
        },
        6.0
      )

      // Fade out
      .to(
        fullHeart ? fullHeart.scale : {},
        { x: 0.01, y: 0.01, z: 0.01, duration: 2, ease: "power2.in" },
        8.0
      );

    // Model rotation
    ScrollTrigger.create({
      trigger: ".product-overview",
      start: "top top",
      end: CONFIG.scrollEnd,
      scrub: IS_MOBILE ? 0.5 : 1,
      onUpdate: (self) => {
        const progress = self.progress;
        if (fullHeart && progress < 0.6) {
          fullHeart.rotation.y = Math.PI * 2 * 6 * progress;
        }
      },
    });

    console.log("✅ ANIMATIONS READY!");
  }

  // ========================================
  // OUTRO SCENE SETUP
  // ========================================
  let outroHeart, outroModelSize;
  const outroScene = new THREE.Scene();
  const outroCamera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const outroRenderer = new THREE.WebGLRenderer({
    antialias: CONFIG.antialias,
    alpha: true,
    powerPreference: IS_MOBILE ? "default" : "high-performance",
  });

  outroRenderer.setClearColor(0x000000, 0);
  outroRenderer.setSize(window.innerWidth, window.innerHeight);
  outroRenderer.setPixelRatio(CONFIG.pixelRatio);
  outroRenderer.shadowMap.enabled = CONFIG.shadowsEnabled;

  const outroModelContainer = document.querySelector(".outro-model-container");
  if (outroModelContainer) {
    outroModelContainer.appendChild(outroRenderer.domElement);
    console.log("✅ Canvas added to DOM (outro)");
  }

  // Lighting
  const outroAmbientLight = new THREE.AmbientLight(0xfce7f3, IS_MOBILE ? 2.0 : 1.5);
  outroScene.add(outroAmbientLight);

  const outroMainLight = new THREE.DirectionalLight(0xf472b6, IS_MOBILE ? 1.5 : 2.0);
  outroMainLight.position.set(5, 5, 5);
  if (CONFIG.shadowsEnabled) {
    outroMainLight.castShadow = true;
  }
  outroScene.add(outroMainLight);

  if (!IS_MOBILE) {
    outroScene.add(new THREE.DirectionalLight(0xec4899, 1.2));
    outroScene.add(new THREE.DirectionalLight(0xfce7f3, 0.8));
  }

  function setupOutroModel(model) {
    if (!model || !outroModelSize) return;

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());

    model.position.set(-center.x, -center.y, -center.z);
    model.rotation.set(0, 0, 0);

    const maxDim = Math.max(outroModelSize.x, outroModelSize.y, outroModelSize.z);
    const fov = outroCamera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    cameraZ *= 1.8;

    outroCamera.position.set(0, 0, cameraZ);
    outroCamera.lookAt(0, 0, 0);
  }

  function setupOutroScene() {
    console.log("💔 Loading broken_heart.glb");
    
    const outroLoader = new GLTFLoader();
    outroLoader.load(
      "./broken_heart.glb",
      (gltf) => {
        console.log("✅ Outro broken heart loaded!");
        outroHeart = gltf.scene;

        outroHeart.traverse((node) => {
          if (node.isMesh && node.material) {
            if (CONFIG.shadowsEnabled) {
              node.castShadow = true;
              node.receiveShadow = true;
            }

            if (Array.isArray(node.material)) {
              node.material.forEach((mat) => {
                mat.metalness = 0.3;
                mat.roughness = 0.6;
                mat.needsUpdate = true;
              });
            } else {
              node.material.metalness = 0.3;
              node.material.roughness = 0.6;
              node.material.needsUpdate = true;
            }
          }
        });

        const box = new THREE.Box3().setFromObject(outroHeart);
        outroModelSize = box.getSize(new THREE.Vector3());

        outroHeart.scale.set(CONFIG.modelScale, CONFIG.modelScale, CONFIG.modelScale);
        outroHeart.visible = true;
        outroScene.add(outroHeart);
        setupOutroModel(outroHeart);

        setupOutroAnimations();
      },
      undefined,
      (error) => {
        console.error("❌ ERROR LOADING OUTRO BROKEN HEART", error);
      }
    );
  }

  // ========================================
  // GIFT SCENE SETUP
  // ========================================
  let giftSize;
  const giftScene = new THREE.Scene();
  const giftCamera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const giftRenderer = new THREE.WebGLRenderer({
    antialias: CONFIG.antialias,
    alpha: true,
    powerPreference: IS_MOBILE ? "default" : "high-performance",
  });

  giftRenderer.setClearColor(0x000000, 0);
  giftRenderer.setSize(window.innerWidth, window.innerHeight);
  giftRenderer.setPixelRatio(CONFIG.pixelRatio);

  const giftContainer = document.querySelector(".gift-model-container");
  if (giftContainer) {
    giftContainer.appendChild(giftRenderer.domElement);
    giftContainer.style.opacity = "0";
    giftContainer.style.visibility = "hidden";
  }

  // Lights
  giftScene.add(new THREE.AmbientLight(0xfce7f3, IS_MOBILE ? 2.0 : 1.5));
  const giftKey = new THREE.DirectionalLight(0xf472b6, IS_MOBILE ? 1.5 : 2);
  giftKey.position.set(5, 5, 5);
  giftScene.add(giftKey);

  if (!IS_MOBILE) {
    giftScene.add(new THREE.DirectionalLight(0xec4899, 1.2));
    giftScene.add(new THREE.DirectionalLight(0xfce7f3, 0.8));
  }

  // Load gift
  const giftLoader = new GLTFLoader();
  giftLoader.load("./gift.glb", (gltf) => {
    giftModel = gltf.scene;

    giftModel.traverse((n) => {
      if (n.isMesh && n.material) {
        n.material.metalness = 0.4;
        n.material.roughness = 0.4;
      }
    });

    const box = new THREE.Box3().setFromObject(giftModel);
    giftSize = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    giftModel.position.set(-center.x, -center.y, -center.z);

    const maxDim = Math.max(giftSize.x, giftSize.y, giftSize.z);
    const fov = giftCamera.fov * Math.PI / 180;
    giftCamera.position.z = (maxDim / Math.tan(fov / 2)) * 1.8;
    giftCamera.lookAt(0, 0, 0);

    giftScene.add(giftModel);
  });

  // ========================================
  // OUTRO ANIMATIONS
  // ========================================
  function setupOutroAnimations() {
    console.log("🎬 Setting up outro scroll animations...");

    const outroScrollTL = gsap.timeline({
      scrollTrigger: {
        trigger: ".outro",
        start: "top top",
        end: "+=100%",
        pin: true,
        scrub: IS_MOBILE ? 0.5 : 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,

        onEnter: () => {
          console.log("🎯 Outro animation section entered");

          const productContainer = document.querySelector(".model-container");
          const outroContainer = document.querySelector(".outro-model-container");

          if (productContainer) {
            productContainer.style.opacity = "0";
            productContainer.style.visibility = "hidden";
          }

          if (outroContainer) {
            outroContainer.style.opacity = "1";
            outroContainer.style.visibility = "visible";
          }

          if (outroHeart && outroInitial) {
            gsap.set(outroHeart.scale, {
              x: outroInitial.scale.x,
              y: outroInitial.scale.y,
              z: outroInitial.scale.z
            });

            gsap.set(outroHeart.position, { y: outroInitial.y });
            gsap.set(outroHeart.rotation, { x: 0, y: 0, z: 0 });
          }
        },

        onEnterBack: () => {
          console.log("🔁 Re-entering outro");

          const productContainer = document.querySelector(".model-container");
          const outroContainer = document.querySelector(".outro-model-container");

          if (productContainer) {
            productContainer.style.opacity = "0";
            productContainer.style.visibility = "hidden";
          }

          if (outroContainer) {
            outroContainer.style.opacity = "1";
            outroContainer.style.visibility = "visible";
          }

          if (outroHeart && outroInitial) {
            gsap.set(outroHeart.scale, {
              x: outroInitial.scale.x,
              y: outroInitial.scale.y,
              z: outroInitial.scale.z
            });

            gsap.set(outroHeart.position, { y: outroInitial.y });
            gsap.set(outroHeart.rotation, { x: 0, y: 0, z: 0 });
          }
        },

        onLeaveBack: () => {
          console.log("👋 Leaving outro");

          const productContainer = document.querySelector(".model-container");
          const outroContainer = document.querySelector(".outro-model-container");

          if (productContainer) {
            productContainer.style.opacity = "1";
            productContainer.style.visibility = "visible";
          }

          if (outroContainer) {
            outroContainer.style.opacity = "0";
            outroContainer.style.visibility = "hidden";
          }
        },
      }
    });

    const outroInitial = {
      scale: outroHeart.scale.clone(),
      y: outroHeart.position.y
    };

    outroScrollTL
      .to(".outro-question", { opacity: 1, duration: 0.5 }, 0)
      .fromTo(
        ".outro-question h1 .char > span",
        { y: "100%" },
        { y: "0%", stagger: IS_MOBILE ? 0.005 : 0.01, duration: 0.6, ease: "power3.out" },
        0
      )
      .to(
        ".outro-question h1 .char > span",
        { xPercent: -150, stagger: IS_MOBILE ? 0.005 : 0.01, duration: 1, ease: "power2.inOut" },
        0.4
      )
      .to(".outro-question", { opacity: 0, duration: 1 }, 4.5)
      .to(outroHeart.scale, {
        x: IS_MOBILE ? 4.5 : 6.5,
        y: IS_MOBILE ? 4.5 : 6.5,
        z: IS_MOBILE ? 4.5 : 6.5,
        duration: 2,
        ease: "power2.inOut",
        onUpdate: () => {
          outroHeart.position.y = -(outroModelSize.y * (outroHeart.scale.y - 1)) / 2;
        }
      }, 5.0)
      .to(outroHeart.scale, {
        x: outroInitial.scale.x,
        y: outroInitial.scale.y,
        z: outroInitial.scale.z,
        duration: 1.5,
        ease: "power2.inOut"
      }, 7.0)
      .to(".outro-final-message", {
        opacity: 1,
        duration: 1,
        ease: "power2.out",
        onComplete: () => {
          document.querySelector(".outro-final-message").classList.add("active");
          initNoButtonEscape();
        }
      }, 8.5);

    ScrollTrigger.create({
      trigger: ".outro",
      start: "top top",
      end: "+=100%",
      scrub: IS_MOBILE ? 0.5 : 1,
      onUpdate: (self) => {
        const progress = self.progress;
        if (outroHeart && progress < 0.6) {
          outroHeart.rotation.y = Math.PI * 2 * 6 * progress;
        } else if (outroHeart) {
          outroHeart.rotation.y = 0;
        }
      },
    });

    console.log("✅ OUTRO ANIMATIONS READY!");
  }

  // ========================================
  // ANIMATION LOOP
  // ========================================
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    outroRenderer.render(outroScene, outroCamera);
    giftRenderer.render(giftScene, giftCamera);
  }

  animate();
  console.log("✅ Animation loops started");

  // ========================================
  // RESIZE HANDLER
  // ========================================
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      // Product overview camera
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      if (fullHeart && fullHeart.visible) {
        setupModel(fullHeart);
      }

      // Outro camera
      outroCamera.aspect = window.innerWidth / window.innerHeight;
      outroCamera.updateProjectionMatrix();
      outroRenderer.setSize(window.innerWidth, window.innerHeight);
      if (outroHeart) {
        setupOutroModel(outroHeart);
      }

      // Gift camera
      giftCamera.aspect = window.innerWidth / window.innerHeight;
      giftCamera.updateProjectionMatrix();
      giftRenderer.setSize(window.innerWidth, window.innerHeight);

      // Refresh ScrollTrigger
      ScrollTrigger.refresh();
    }, 100);
  });

  // ========================================
  // YES BUTTON
  // ========================================
  const yesBtn = document.querySelector(".btn-yes");

  yesBtn.addEventListener("click", () => {
    if (!giftModel) {
      console.warn("🎁 Gift model not ready yet");
      return;
    }

    console.log("💖 YES clicked — revealing gift");

    ScrollTrigger.getAll().forEach(st => st.kill());

    const outroContainer = document.querySelector(".outro-model-container");
    const giftContainer = document.querySelector(".gift-model-container");

    gsap.to(outroContainer, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        outroContainer.style.visibility = "hidden";
      }
    });

    giftContainer.style.visibility = "visible";
    gsap.to(giftContainer, {
      opacity: 1,
      duration: 0.8,
      ease: "power2.out"
    });

    const baseScale = IS_MOBILE ? 0.8 : 1;
    gsap.set(giftModel.scale, { x: baseScale, y: baseScale, z: baseScale });
    gsap.set(giftModel.rotation, { x: 0, y: 0, z: 0 });

    const idleSpin = gsap.to(giftModel.rotation, {
      y: "+=0.5",
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.timeline({
      onStart: () => {
        idleSpin.kill();
      },
      onComplete: () => {
        window.location.href = "gift.html";
      }
    })
    .to(giftModel.rotation, {
      y: Math.PI * 4,
      duration: 3,
      ease: "none"
    })
    .to(giftModel.scale, {
      x: IS_MOBILE ? 6.5 : 8.5,
      y: IS_MOBILE ? 6.5 : 8.5,
      z: IS_MOBILE ? 6.5 : 8.5,
      duration: 2,
      ease: "power2.inOut"
    }, "-=1");
  });

  // ========================================
  // NO BUTTON ESCAPE
  // ========================================
  function initNoButtonEscape() {
    const noBtn = document.querySelector(".btn-no");
    const yesBtn = document.querySelector(".btn-yes");

    if (!noBtn || !yesBtn) return;

    const yesRect = yesBtn.getBoundingClientRect();
    noBtn.style.left = `${yesRect.right + 40}px`;
    noBtn.style.top = `${yesRect.top}px`;

    function moveNoButton() {
      const padding = 20;
      const btnRect = noBtn.getBoundingClientRect();
      const maxX = window.innerWidth - btnRect.width - padding;
      const maxY = window.innerHeight - btnRect.height - padding;

      const x = Math.random() * maxX;
      const y = Math.random() * maxY;
      const rotation = Math.random() * 120 - 60;
      const scale = 0.85 + Math.random() * 0.6;

      noBtn.style.left = `${x}px`;
      noBtn.style.top = `${y}px`;
      noBtn.style.transform = `rotate(${rotation}deg) scale(${scale})`;
    }

    // Desktop
    if (!IS_MOBILE) {
      noBtn.addEventListener("mouseenter", moveNoButton);

      document.addEventListener("mousemove", (e) => {
        const rect = noBtn.getBoundingClientRect();
        const dx = e.clientX - (rect.left + rect.width / 2);
        const dy = e.clientY - (rect.top + rect.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) moveNoButton();
      });
    }

    // Mobile touch handling (FIXED)
    if (IS_MOBILE) {
      noBtn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        moveNoButton();
      }, { passive: false });

      // Move on any nearby touch
      document.addEventListener("touchmove", (e) => {
        const touch = e.touches[0];
        const rect = noBtn.getBoundingClientRect();
        const dx = touch.clientX - (rect.left + rect.width / 2);
        const dy = touch.clientY - (rect.top + rect.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          moveNoButton();
        }
      }, { passive: true });
    }
  }
}