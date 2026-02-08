
    document.addEventListener('DOMContentLoaded', () => {
      const scene = document.querySelector('a-scene');
      const loader = document.getElementById('loader');
      const scanningOverlay = document.getElementById('scanning-overlay');
      const target = document.querySelector('[mindar-image-target]');

      // Gesture State
      let initialScale = {x: 1, y: 1, z: 1};
      let initialRotation = {x: 0, y: 0, z: 0};

      scene.addEventListener('arReady', () => {
        if(loader) loader.classList.add('hidden');
        if(scanningOverlay) scanningOverlay.classList.remove('hidden');
      });

      scene.addEventListener('arError', (event) => {
        if(loader) loader.innerHTML = '<p style="color:red">Camera Error. Use HTTPS.</p>';
      });

      if (target) {
        target.addEventListener('targetFound', () => {
          if(scanningOverlay) scanningOverlay.classList.add('hidden');
        });
        target.addEventListener('targetLost', () => {
          if(scanningOverlay) scanningOverlay.classList.remove('hidden');
        });
      }
      
      // Manual Start for Higher Quality Video
      // We rely on 'autoStart: false' in HTML and call start() here with explicit settings.
      scene.addEventListener('loaded', async () => {
         const mindArSystem = scene.systems['mindar-image-system'];
         if(mindArSystem) {
             try {
                // Request HD+ resolution (e.g., 720p or 1080p).
                // MindAR often defaults to 640x480.
                await mindArSystem.start({
                    videoSettings: {
                        facingMode: "environment",
                        width: { min: 1280, ideal: 1920 },
                        height: { min: 720, ideal: 1080 }
                    }
                });
             } catch(e) {
                console.error("Failed to start MindAR with high res, falling back.", e);
                // Fallback attempt (auto-retry usually handled by lib, but good to log)
             }
         }
      });

      // Register Gesture Component
      AFRAME.registerComponent('gesture-handler', {
        schema: {
          enabled: { default: true },
          rotationFactor: { default: 5 },
          minScale: { default: 0.1 },
          maxScale: { default: 8 },
        },
        init: function () {
          this.handleScale = this.handleScale.bind(this);
          this.handleRotation = this.handleRotation.bind(this);
          this.isVisible = false;
          this.initialScale = this.el.object3D.scale.clone();
          this.scaleFactor = 1;

          this.el.sceneEl.addEventListener("twofingermove", this.handleScale);
          this.el.sceneEl.addEventListener("onefingermove", this.handleRotation);
        },
        handleScale: function (event) {
          if (!this.data.enabled) return;
          this.scaleFactor *= (1 + event.detail.spreadChange / this.el.sceneEl.canvas.clientWidth * 2); 
          this.scaleFactor = Math.min(Math.max(this.scaleFactor, this.data.minScale), this.data.maxScale);
          this.el.object3D.scale.x = this.scaleFactor * this.initialScale.x;
          this.el.object3D.scale.y = this.scaleFactor * this.initialScale.y;
          this.el.object3D.scale.z = this.scaleFactor * this.initialScale.z;
        },
        handleRotation: function (event) {
          if (!this.data.enabled) return;
          // One finger drag to rotate Y
          this.el.object3D.rotation.y += event.detail.positionChange.x * this.data.rotationFactor;
        }
      });
    });
  
