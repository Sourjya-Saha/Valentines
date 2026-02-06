import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
function isMobile() {
  return window.innerWidth <= 600;
}

document.querySelectorAll(".tooltip").forEach((card) => {
  card.addEventListener("click", () => {

    // Close others
    document.querySelectorAll(".tooltip").forEach((c) => {
      if (c !== card) c.classList.remove("open");
    });

    // Toggle this one
    card.classList.toggle("open");
  });
});

// Wait for GSAP to load
window.addEventListener("load", () => {
  if (typeof gsap === "undefined") {
    console.error("❌ GSAP not loaded!");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  initializeApp();
});

function initializeApp() {
  console.log("🚀 App initialized");

  // Split text function
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

  // Split all text elements - Product Overview
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
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  renderer.setClearColor(0x000000, 0);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const modelContainer = document.querySelector(".model-container");
  if (modelContainer) {
    modelContainer.appendChild(renderer.domElement);
    console.log("✅ Canvas added to DOM (product overview)");
  } else {
    console.error("❌ .model-container not found!");
  }

  // Lighting setup - Romantic pink/rose theme
  const ambientLight = new THREE.AmbientLight(0xfce7f3, 1.5);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xf472b6, 2.0);
  mainLight.position.set(5, 5, 5);
  mainLight.castShadow = true;
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xec4899, 1.2);
  fillLight.position.set(-5, 3, -3);
  scene.add(fillLight);

  const backLight = new THREE.DirectionalLight(0xfce7f3, 0.8);
  backLight.position.set(0, -3, -5);
  scene.add(backLight);

  console.log("✅ Lights added (product overview)");

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
    console.log("✅ Model centered without tilt");
  }

  // Load FULL HEART for product overview section only
  console.log("📦 Loading heart.glb");

  const loader = new GLTFLoader();
  loader.load(
    "./heart.glb",
    (gltf) => {
      console.log("✅✅✅ FULL HEART LOADED! ✅✅✅");
      fullHeart = gltf.scene;

      fullHeart.traverse((node) => {
        if (node.isMesh && node.material) {
          node.castShadow = true;
          node.receiveShadow = true;

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

     // 🔽 Make heart tiny on mobile
if (isMobile()) {
  fullHeart.scale.set(0.4, 0.4, 0.4);   // very small
} else {
  fullHeart.scale.set(1, 1, 1);         // desktop size
}

fullHeart.visible = true;
scene.add(fullHeart);
setupModel(fullHeart);


      modelsReady++;
      // Start animations for product overview
      setupScrollAnimations();
      // Initialize outro scene separately
      setupOutroScene();
    },
    (progress) => {
      if (progress.total > 0) {
        const percent = ((progress.loaded / progress.total) * 100).toFixed(0);
        console.log(`⏳ Loading full heart: ${percent}%`);
      }
    },
    (error) => {
      console.error("❌❌❌ ERROR LOADING FULL HEART ❌❌❌");
      console.error(error);
    }
  );

  function setupScrollAnimations() {
    console.log("🎬 Setting up scroll animations...");

const scrollTL = gsap.timeline({
  scrollTrigger: {
    trigger: ".product-overview",
    start: "top top",
    end: "+=500%",
    pin: true,
    scrub: 1,
    anticipatePin: 1,

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

    onLeave: () => console.log("👋 Animation section left")
  }
});


   

    scrollTL
      // PHASE 1: Header-1 appears and slides left
      .fromTo(
        ".header-1 h1 .char > span",
        { y: "100%" },
        {
          y: "0%",
          stagger: 0.01,
          duration: 0.6,
          ease: "power3.out",
        },
        0
      )
      .to(
        ".header-1 h1 .char > span",
        {
          xPercent: -150,
          stagger: 0.01,
          duration: 1,
          ease: "power2.inOut",
        },
        0.4
      )

      // PHASE 2: Circular mask expands
      .fromTo(
        ".circular-mask",
        { clipPath: "circle(0% at 50% 50%)" },
        {
          clipPath: "circle(80% at 50% 50%)",
          duration: 0.8,
          ease: "power2.inOut",
        },
        0.9
      )

      // PHASE 3: Header-2 slides across
      .fromTo(
        ".header-2",
        { xPercent: 150 },
        {
          xPercent: -150,
          duration: 1.4,
          ease: "power1.inOut",
        },
        1.7
      )

      // PHASE 4: Tooltip 1
      .fromTo(
        ".tooltip:nth-child(1)",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
        2.6
      )
      .fromTo(
        ".tooltip:nth-child(1) .divider",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.35, ease: "power2.out" },
        2.65
      )
      .fromTo(
        ".tooltip:nth-child(1) .icon ion-icon",
        { y: "125%" },
        { y: "0%", duration: 0.4, ease: "power3.out" },
        2.7
      )
      .fromTo(
        ".tooltip:nth-child(1) .title .line > span",
        { y: "125%" },
        { y: "0%", duration: 0.4, ease: "power3.out", stagger: 0.05 },
        2.85
      )
      .fromTo(
        ".tooltip:nth-child(1) .description .line > span",
        { y: "125%" },
        { y: "0%", duration: 0.4, ease: "power3.out", stagger: 0.03 },
        3.0
      )

      // PHASE 5: Tooltip 2
      .fromTo(
        ".tooltip:nth-child(2)",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
        3.3
      )
      .fromTo(
        ".tooltip:nth-child(2) .divider",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.35, ease: "power2.out" },
        3.35
      )
      .fromTo(
        ".tooltip:nth-child(2) .icon ion-icon",
        { y: "125%" },
        { y: "0%", duration: 0.4, ease: "power3.out" },
        3.4
      )
      .fromTo(
        ".tooltip:nth-child(2) .title .line > span",
        { y: "125%" },
        { y: "0%", duration: 0.4, ease: "power3.out", stagger: 0.05 },
        3.55
      )
      .fromTo(
        ".tooltip:nth-child(2) .description .line > span",
        { y: "125%" },
        { y: "0%", duration: 0.4, ease: "power3.out", stagger: 0.03 },
        3.7
      )

      // PHASE 6: Tooltip 3
      .fromTo(
        ".tooltip:nth-child(3)",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
        4.0
      )
      .fromTo(
        ".tooltip:nth-child(3) .divider",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.35, ease: "power2.out" },
        4.05
      )
      .fromTo(
        ".tooltip:nth-child(3) .icon ion-icon",
        { y: "125%" },
        { y: "0%", duration: 0.4, ease: "power3.out" },
        4.1
      )
      .fromTo(
        ".tooltip:nth-child(3) .title .line > span",
        { y: "125%" },
        { y: "0%", duration: 0.4, ease: "power3.out", stagger: 0.05 },
        4.25
      )
      .fromTo(
        ".tooltip:nth-child(3) .description .line > span",
        { y: "125%" },
        { y: "0%", duration: 0.4, ease: "power3.out", stagger: 0.03 },
        4.4
      )

      // PHASE 7: Tooltip 4
      .fromTo(
        ".tooltip:nth-child(4)",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
        4.7
      )
      .fromTo(
        ".tooltip:nth-child(4) .divider",
        { scaleX: 0 },
        { scaleX: 1, duration: 0.35, ease: "power2.out" },
        4.75
      )
      .fromTo(
        ".tooltip:nth-child(4) .icon ion-icon",
        { y: "125%" },
        { y: "0%", duration: 0.4, ease: "power3.out" },
        4.8
      )
      .fromTo(
        ".tooltip:nth-child(4) .title .line > span",
        { y: "125%" },
        { y: "0%", duration: 0.4, ease: "power3.out", stagger: 0.05 },
        4.95
      )
      .fromTo(
        ".tooltip:nth-child(4) .description .line > span",
        { y: "125%" },
        { y: "0%", duration: 0.4, ease: "power3.out", stagger: 0.03 },
        5.1
      )

      // PHASE 8: Fade out tooltips
      .to(
        ".tooltip",
        {
          opacity: 0,
          y: -30,
          duration: 0.5,
          ease: "power2.in",
          stagger: 0.1,
        },
        5.5
      )

      // PHASE 9: ZOOM IN FULL HEART - Make it fill screen
      .to(
        fullHeart ? fullHeart.scale : {},
        {
       x: isMobile() ? 4 : 6.5,
y: isMobile() ? 4 : 6.5,
z: isMobile() ? 4 : 6.5,

          duration: 2,
          ease: "power2.inOut",
        },
        6.0
      )

      // PHASE 10: Fade out full heart to end section
      .to(
        fullHeart ? fullHeart.scale : {},
        {
          x: 0.01,
          y: 0.01,
          z: 0.01,
          duration: 2,
          ease: "power2.in",
        },
        8.0
      );

    // Model rotation - Full Heart rotates based on scroll
 // Model rotation - Full Heart rotates until zoom starts
ScrollTrigger.create({
  trigger: ".product-overview",
  start: "top top",
  end: "+=500%",
  scrub: 1,
  onUpdate: (self) => {
    const progress = self.progress;

    // Stop rotating once zoom begins (around 6.0 in timeline)
    if (fullHeart && progress < 0.6) {
      fullHeart.rotation.y = Math.PI * 2 * 6 * progress;
    }
  },
});


    console.log("✅✅✅ ALL ANIMATIONS READY! ✅✅✅");
    console.log("📜 Scroll down to see the magic happen!");
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
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  outroRenderer.setClearColor(0x000000, 0);
  outroRenderer.setSize(window.innerWidth, window.innerHeight);
  outroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  outroRenderer.shadowMap.enabled = true;
  outroRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const outroModelContainer = document.querySelector(".outro-model-container");
  if (outroModelContainer) {
    outroModelContainer.appendChild(outroRenderer.domElement);
    console.log("✅ Canvas added to DOM (outro)");
  }

  // Lighting setup for outro - Same as product overview
  const outroAmbientLight = new THREE.AmbientLight(0xfce7f3, 1.5);
  outroScene.add(outroAmbientLight);

  const outroMainLight = new THREE.DirectionalLight(0xf472b6, 2.0);
  outroMainLight.position.set(5, 5, 5);
  outroMainLight.castShadow = true;
  outroScene.add(outroMainLight);

  const outroFillLight = new THREE.DirectionalLight(0xec4899, 1.2);
  outroFillLight.position.set(-5, 3, -3);
  outroScene.add(outroFillLight);

  const outroBackLight = new THREE.DirectionalLight(0xfce7f3, 0.8);
  outroBackLight.position.set(0, -3, -5);
  outroScene.add(outroBackLight);

  console.log("✅ Lights added (outro)");

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

    console.log("✅ Outro camera positioned at:", outroCamera.position);
  }

  function setupOutroScene() {
    console.log("💔 Loading broken_heart.glb for outro scene");
    
    const outroLoader = new GLTFLoader();
    outroLoader.load(
      "./broken_heart.glb",
      (gltf) => {
        console.log("✅ Outro broken heart loaded!");
        outroHeart = gltf.scene;

        outroHeart.traverse((node) => {
          if (node.isMesh && node.material) {
            node.castShadow = true;
            node.receiveShadow = true;

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

       // 🔽 Make broken heart tiny on mobile
if (isMobile()) {
  outroHeart.scale.set(0.4, 0.4, 0.4);
} else {
  outroHeart.scale.set(1, 1, 1);
}

outroHeart.visible = true;
outroScene.add(outroHeart);
setupOutroModel(outroHeart);

        setupOutroAnimations();
      },
      (progress) => {
        if (progress.total > 0) {
          const percent = ((progress.loaded / progress.total) * 100).toFixed(0);
          console.log(`⏳ Loading outro broken heart: ${percent}%`);
        }
      },
      (error) => {
        console.error("❌ ERROR LOADING OUTRO BROKEN HEART");
        console.error(error);
      }
    );
  }

  function setupOutroAnimations() {
    console.log("🎬 Setting up outro scroll animations...");

    const outroScrollTL = gsap.timeline({
     scrollTrigger: {
  trigger: ".outro",
  start: "top top",
  end: "+=500%",
  pin: true,
  scrub: 1,
  anticipatePin: 1,

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

    // ✅ HARD RESET
    if (outroHeart && outroInitial) {
      gsap.set(outroHeart.scale, {
        x: outroInitial.scale.x,
        y: outroInitial.scale.y,
        z: outroInitial.scale.z
      });

      gsap.set(outroHeart.position, {
        y: outroInitial.y
      });

      gsap.set(outroHeart.rotation, {
        x: 0,
        y: 0,
        z: 0
      });
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

    // ✅ HARD RESET AGAIN
    if (outroHeart && outroInitial) {
      gsap.set(outroHeart.scale, {
        x: outroInitial.scale.x,
        y: outroInitial.scale.y,
        z: outroInitial.scale.z
      });

      gsap.set(outroHeart.position, {
        y: outroInitial.y
      });

      gsap.set(outroHeart.rotation, {
        x: 0,
        y: 0,
        z: 0
      });
    }
  },

  onLeaveBack: () => {
    console.log("👋 Leaving outro, returning to product overview");

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

  onLeave: () => console.log("👋 Outro animation section left"),
}

    });
const outroInitial = {
  scale: outroHeart.scale.clone(),
  y: outroHeart.position.y
};



// PHASE 1: Outro Question appears and slides left
outroScrollTL

// Fade in question
.to(".outro-question", {
  opacity: 1,
  duration: 0.5,
  ease: "power2.out"
}, 0)

// PHASE 1: Characters rise
.fromTo(
  ".outro-question h1 .char > span",
  { y: "100%" },
  {
    y: "0%",
    stagger: 0.01,
    duration: 0.6,
    ease: "power3.out",
  },
  0
)

// PHASE 2: Slide away
.to(
  ".outro-question h1 .char > span",
  {
    xPercent: -150,
    stagger: 0.01,
    duration: 1,
    ease: "power2.inOut",
  },
  0.4
)

// Fade question out
.to(".outro-question", {
  opacity: 0,
  duration: 1,
  ease: "power2.in"
}, 4.5)

// Zoom broken heart
.to(outroHeart.scale, {
  x: isMobile() ? 4.5 : 6.5,
  y: isMobile() ? 4.5 : 6.5,
  z: isMobile() ? 4.5 : 6.5,
  duration: 2,
  ease: "power2.inOut",
  onUpdate: () => {
    outroHeart.position.y =
      -(outroModelSize.y * (outroHeart.scale.y - 1)) / 2;
  }
}, 5.0)

// Return scale
.to(outroHeart.scale, {
  x: outroInitial.scale.x,
  y: outroInitial.scale.y,
  z: outroInitial.scale.z,
  duration: 1.5,
  ease: "power2.inOut"
}, 7.0)

// Final message
.to(".outro-final-message", {
  opacity: 1,
  duration: 1,
  ease: "power2.out",
}, 8.5);


    // Outro model rotation
  // Outro model rotation - stop before zoom
ScrollTrigger.create({
  trigger: ".outro",
  start: "top top",
  end: "+=500%",
  scrub: 1,
  onUpdate: (self) => {
    const progress = self.progress;

    // Rotate only until zoom starts
    if (outroHeart && progress < 0.6) {
      outroHeart.rotation.y = Math.PI * 2 * 6 * progress;
    } else if (outroHeart) {
      outroHeart.rotation.y = 0; // lock forward
    }
  },
});

    console.log("✅✅✅ OUTRO ANIMATIONS READY! ✅✅✅");
  }

  // Animation loop for both scenes
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    outroRenderer.render(outroScene, outroCamera);
  }
  animate();
  console.log("✅ Animation loops started");

  // Resize handler
  window.addEventListener("resize", () => {
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
  });
}

// ===============================
// ENVELOPE CLICK INTERACTION
// ===============================
