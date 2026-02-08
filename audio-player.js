// Audio Player with Enhanced Waveform Visualizer
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

  // Set canvas size
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Initialize audio context and analyser
  function initAudio() {
    if (audioContext) return;

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaElementSource(audio);
    
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    
    // Enhanced settings for better frequency response
    analyser.fftSize = 512; // Increased for more detail
    analyser.smoothingTimeConstant = 0.75; // Smoother transitions
    analyser.minDecibels = -85; // Better dynamic range
    analyser.maxDecibels = -20;
    
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
  }

  // Enhanced waveform visualization with better frequency response
  function drawVisualizer() {
    animationId = requestAnimationFrame(drawVisualizer);
    
    analyser.getByteFrequencyData(dataArray);
    
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    
    // Clear canvas completely (no trail effect for cleaner look)
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw bars with enhanced frequency mapping
    const barCount = 50; // More bars for detail
    const barWidth = width / barCount;
    const gap = 1.5;
    
    for (let i = 0; i < barCount; i++) {
      // Use logarithmic mapping for better bass/treble representation
      const percent = i / barCount;
      const exponentialPercent = Math.pow(percent, 1.5);
      const dataIndex = Math.floor(exponentialPercent * bufferLength * 0.7); // Focus on more audible range
      
      // Get frequency data with smoothing
      let value = dataArray[dataIndex];
      
      // Apply frequency weighting (boost mid-range, keep bass and treble)
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
      
      // Draw rounded bar with shadow
      ctx.shadowBlur = 15;
      ctx.shadowColor = normalizedValue > 0.6 
        ? 'rgba(236, 72, 153, 0.8)' 
        : 'rgba(236, 72, 153, 0.4)';
      
      ctx.beginPath();
      ctx.roundRect(x, y, actualBarWidth, barHeight, [3, 3, 0, 0]);
      ctx.fill();
      
      // Add reflection effect at bottom
      if (barHeight > height * 0.3) {
        ctx.shadowBlur = 0;
        const reflectionGradient = ctx.createLinearGradient(0, height, 0, height - 8);
        reflectionGradient.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
        reflectionGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
        ctx.fillStyle = reflectionGradient;
        ctx.fillRect(x, height - 8, actualBarWidth, 8);
      }
      
      ctx.shadowBlur = 0;
    }
    
    // Add center glow effect
    const centerGlow = ctx.createRadialGradient(width/2, height, 0, width/2, height, width/2);
    centerGlow.addColorStop(0, 'rgba(236, 72, 153, 0.1)');
    centerGlow.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, width, height);
  }

  // Enhanced idle state with more dynamic animation
  function drawIdle() {
    animationId = requestAnimationFrame(drawIdle);
    
    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(0, 0, width, height);
    
    const barCount = 50;
    const barWidth = width / barCount;
    const gap = 1.5;
    const time = Date.now() * 0.0015;
    
    for (let i = 0; i < barCount; i++) {
      // Create more complex wave pattern
      const wave1 = Math.sin(time + i * 0.2) * 6;
      const wave2 = Math.sin(time * 1.5 + i * 0.15) * 4;
      const wave3 = Math.sin(time * 0.8 + i * 0.25) * 3;
      const waveHeight = wave1 + wave2 + wave3 + 15;
      
      const gradient = ctx.createLinearGradient(0, height - waveHeight, 0, height);
      gradient.addColorStop(0, 'rgba(244, 114, 182, 0.5)');
      gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.4)');
      gradient.addColorStop(1, 'rgba(219, 39, 119, 0.5)');
      
      ctx.fillStyle = gradient;
      
      const x = i * barWidth;
      const y = height - waveHeight;
      const actualBarWidth = barWidth - gap;
      
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(236, 72, 153, 0.3)';
      
      ctx.beginPath();
      ctx.roundRect(x, y, actualBarWidth, waveHeight, [3, 3, 0, 0]);
      ctx.fill();
      
      ctx.shadowBlur = 0;
    }
    
    // Add subtle ambient glow
    const ambientGlow = ctx.createRadialGradient(width/2, height, 0, width/2, height, width/2);
    ambientGlow.addColorStop(0, 'rgba(236, 72, 153, 0.08)');
    ambientGlow.addColorStop(1, 'rgba(236, 72, 153, 0)');
    ctx.fillStyle = ambientGlow;
    ctx.fillRect(0, 0, width, height);
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
    }
  }

  // Auto-play on page load with user interaction fallback
  function attemptAutoplay() {
    initAudio();
    audio.currentTime = 20;
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isPlaying = true;
          toggleBtn.classList.add('playing');
          drawVisualizer();
        })
        .catch((error) => {
          console.log('Autoplay prevented, waiting for user interaction');
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
    audio.currentTime = 20;
    cancelAnimationFrame(animationId);
    drawIdle();
  });

  // Attempt autoplay after a short delay
  window.addEventListener('load', () => {
    setTimeout(attemptAutoplay, 500);
  });

  // Fallback: try autoplay on first user interaction
  let userInteracted = false;
  function handleFirstInteraction() {
    if (!userInteracted && !isPlaying) {
      userInteracted = true;
      attemptAutoplay();
    }
  }

  document.addEventListener('click', handleFirstInteraction, { once: true });
  document.addEventListener('touchstart', handleFirstInteraction, { once: true });
  document.addEventListener('keydown', handleFirstInteraction, { once: true });

  // Start with idle animation
  drawIdle();
})();