// Audio Player with Enhanced Waveform Visualizer (Mobile Optimized)
(function() {
  const audio = document.getElementById('background-music');
  const toggleBtn = document.getElementById('audio-toggle');
  const canvas = document.getElementById('visualizer-canvas');
  const ctx = canvas.getContext('2d');
  
  let audioContext;
  let analyser;
  let dataArray;
  let bufferLength;
  let animationId;
  let isPlaying = false;

  // ========================================
  // MOBILE DETECTION
  // ========================================
  const IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  
  // Mobile-specific settings
  const CONFIG = {
    barCount: IS_MOBILE ? 30 : 50,           // Fewer bars on mobile
    fftSize: IS_MOBILE ? 256 : 512,          // Lower resolution on mobile
    smoothing: IS_MOBILE ? 0.85 : 0.75,      // More smoothing on mobile
    shadowBlur: IS_MOBILE ? 5 : 15,          // Less blur on mobile
    pixelRatio: IS_MOBILE ? 1 : window.devicePixelRatio, // Lower DPI on mobile
  };

  console.log(`🎵 Audio player mode: ${IS_MOBILE ? 'MOBILE' : 'DESKTOP'}`);

  // Set canvas size
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * CONFIG.pixelRatio;
    canvas.height = rect.height * CONFIG.pixelRatio;
    ctx.scale(CONFIG.pixelRatio, CONFIG.pixelRatio);
  }

  resizeCanvas();
  
  // Debounced resize for better performance
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 100);
  });

  // Initialize audio context and analyser
  function initAudio() {
    if (audioContext) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audio);
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Enhanced settings for better frequency response
    analyser.fftSize = CONFIG.fftSize;
    analyser.smoothingTimeConstant = CONFIG.smoothing;
    analyser.minDecibels = -85;
    analyser.maxDecibels = -20;
    
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
  }

  // Enhanced waveform visualization with better frequency response
  function drawVisualizer() {
    animationId = requestAnimationFrame(drawVisualizer);
    
    analyser.getByteFrequencyData(dataArray);
    
    const width = canvas.width / CONFIG.pixelRatio;
    const height = canvas.height / CONFIG.pixelRatio;
    
    // Clear canvas completely
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw bars with enhanced frequency mapping
    const barCount = CONFIG.barCount;
    const barWidth = width / barCount;
    const gap = IS_MOBILE ? 1 : 1.5;
    
    for (let i = 0; i < barCount; i++) {
      // Use logarithmic mapping for better bass/treble representation
      const percent = i / barCount;
      const exponentialPercent = Math.pow(percent, 1.5);
      const dataIndex = Math.floor(exponentialPercent * bufferLength * 0.7);
      
      // Get frequency data with smoothing
      let value = dataArray[dataIndex];
      
      // Apply frequency weighting
      if (i < barCount * 0.2) {
        value *= 1.3; // Boost bass
      } else if (i < barCount * 0.6) {
        value *= 1.5; // Boost mids
      } else {
        value *= 1.2; // Slight boost treble
      }
      
      // Calculate bar height with better scaling
      const normalizedValue = Math.min(value / 255, 1);
      const barHeight = normalizedValue * height * 0.85;
      
      // Create dynamic gradient based on bar height
      const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
      
      if (normalizedValue > 0.7) {
        // High energy - brighter colors
        gradient.addColorStop(0, '#fbbf24');
        gradient.addColorStop(0.3, '#f472b6');
        gradient.addColorStop(0.6, '#ec4899');
        gradient.addColorStop(1, '#db2777');
      } else if (normalizedValue > 0.4) {
        // Medium energy
        gradient.addColorStop(0, '#f9a8d4');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#db2777');
      } else {
        // Low energy
        gradient.addColorStop(0, '#f472b6');
        gradient.addColorStop(0.5, '#ec4899');
        gradient.addColorStop(1, '#be185d');
      }
      
      ctx.fillStyle = gradient;
      
      const x = i * barWidth;
      const y = height - barHeight;
      const actualBarWidth = barWidth - gap;
      
      // Draw rounded bar with shadow (reduced on mobile)
      ctx.shadowBlur = CONFIG.shadowBlur;
      ctx.shadowColor = normalizedValue > 0.6 
        ? 'rgba(236, 72, 153, 0.8)' 
        : 'rgba(236, 72, 153, 0.4)';
      
      ctx.beginPath();
      ctx.roundRect(x, y, actualBarWidth, barHeight, [3, 3, 0, 0]);
      ctx.fill();
      
      // Add reflection effect at bottom (skip on mobile for performance)
      if (!IS_MOBILE && barHeight > height * 0.3) {
        ctx.shadowBlur = 0;
        const reflectionGradient = ctx.createLinearGradient(0, height, 0, height - 8);
        reflectionGradient.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
        reflectionGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
        ctx.fillStyle = reflectionGradient;
        ctx.fillRect(x, height - 8, actualBarWidth, 8);
      }
      
      ctx.shadowBlur = 0;
    }
    
    // Add center glow effect (skip on mobile for performance)
    if (!IS_MOBILE) {
      const centerGlow = ctx.createRadialGradient(width/2, height, 0, width/2, height, width/2);
      centerGlow.addColorStop(0, 'rgba(236, 72, 153, 0.1)');
      centerGlow.addColorStop(1, 'rgba(236, 72, 153, 0)');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Enhanced idle state with more dynamic animation
  function drawIdle() {
    animationId = requestAnimationFrame(drawIdle);
    
    const width = canvas.width / CONFIG.pixelRatio;
    const height = canvas.height / CONFIG.pixelRatio;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, width, height);
    
    const barCount = CONFIG.barCount;
    const barWidth = width / barCount;
    const gap = IS_MOBILE ? 1 : 1.5;
    const time = Date.now() * 0.0015;
    
    for (let i = 0; i < barCount; i++) {
      // Create wave pattern (simplified on mobile)
      const wave1 = Math.sin(time + i * 0.2) * 6;
      const wave2 = Math.sin(time * 1.5 + i * 0.15) * 4;
      const wave3 = IS_MOBILE ? 0 : Math.sin(time * 0.8 + i * 0.25) * 3;
      const waveHeight = wave1 + wave2 + wave3 + 15;
      
      const gradient = ctx.createLinearGradient(0, height - waveHeight, 0, height);
      gradient.addColorStop(0, 'rgba(244, 114, 182, 0.5)');
      gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.4)');
      gradient.addColorStop(1, 'rgba(219, 39, 119, 0.5)');
      
      ctx.fillStyle = gradient;
      
      const x = i * barWidth;
      const y = height - waveHeight;
      const actualBarWidth = barWidth - gap;
      
      ctx.shadowBlur = IS_MOBILE ? 3 : 8;
      ctx.shadowColor = 'rgba(236, 72, 153, 0.3)';
      
      ctx.beginPath();
      ctx.roundRect(x, y, actualBarWidth, waveHeight, [3, 3, 0, 0]);
      ctx.fill();
      
      ctx.shadowBlur = 0;
    }
    
    // Add subtle ambient glow (skip on mobile)
    if (!IS_MOBILE) {
      const ambientGlow = ctx.createRadialGradient(width/2, height, 0, width/2, height, width/2);
      ambientGlow.addColorStop(0, 'rgba(236, 72, 153, 0.08)');
      ambientGlow.addColorStop(1, 'rgba(236, 72, 153, 0)');
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Toggle play/pause
  async function toggleAudio() {
    try {
      if (!audioContext) {
        initAudio();
      }

      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      if (isPlaying) {
        audio.pause();
        isPlaying = false;
        toggleBtn.classList.remove('playing');
        cancelAnimationFrame(animationId);
        drawIdle();
      } else {
        // Set start time to 20 seconds if starting from beginning
        if (audio.currentTime === 0) {
          audio.currentTime = 20;
        }
        
        await audio.play();
        isPlaying = true;
        toggleBtn.classList.add('playing');
        cancelAnimationFrame(animationId);
        drawVisualizer();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      
      // Fallback: try again without seek on mobile
      if (IS_MOBILE && error.name === 'NotAllowedError') {
        console.log('Mobile autoplay blocked - waiting for user interaction');
      }
    }
  }

  // Auto-play on page load with user interaction fallback
  function attemptAutoplay() {
    initAudio();
    
    // Skip the 20-second seek on mobile (can cause issues)
    if (!IS_MOBILE) {
      audio.currentTime = 20;
    }
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying = true;
          toggleBtn.classList.add('playing');
          drawVisualizer();
          console.log('✅ Audio autoplay successful');
        })
        .catch((error) => {
          console.log('⚠️ Autoplay prevented, waiting for user interaction');
          // Draw idle state while waiting
          drawIdle();
        });
    }
  }

  // Event listeners
  toggleBtn.addEventListener('click', toggleAudio);
  
  // Handle audio end
  audio.addEventListener('ended', () => {
    isPlaying = false;
    toggleBtn.classList.remove('playing');
    if (!IS_MOBILE) {
      audio.currentTime = 20;
    }
    cancelAnimationFrame(animationId);
    drawIdle();
  });

  // Attempt autoplay after a short delay
  window.addEventListener('load', () => {
    setTimeout(attemptAutoplay, IS_MOBILE ? 1000 : 500); // Longer delay on mobile
  });

  // Fallback: try autoplay on first user interaction
  let userInteracted = false;
  function handleFirstInteraction() {
    if (!userInteracted && !isPlaying) {
      userInteracted = true;
      attemptAutoplay();
      console.log('🎵 Audio started after user interaction');
    }
  }

  // Multiple interaction events for better mobile support
  const interactionEvents = ['click', 'touchstart', 'touchend', 'keydown'];
  interactionEvents.forEach(eventType => {
    document.addEventListener(eventType, handleFirstInteraction, { 
      once: true,
      passive: true 
    });
  });

  // ========================================
  // MOBILE-SPECIFIC: Prevent audio interruption
  // ========================================
  if (IS_MOBILE) {
    // Resume audio context on visibility change (mobile browsers pause it)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('🔊 Audio context resumed');
        });
      }
    });

    // Handle iOS audio session interruptions
    audio.addEventListener('pause', () => {
      if (isPlaying && audioContext && audioContext.state === 'running') {
        // Audio was paused by system, not user
        console.log('⚠️ Audio paused by system');
      }
    });
  }

  // Start with idle animation
  drawIdle();

  console.log('✅ Audio player initialized');
})();