
    document.addEventListener('DOMContentLoaded', () => {
      const scene = document.querySelector('a-scene');
      const loader = document.getElementById('loader');
      const scanningOverlay = document.getElementById('scanning-overlay');
      const target = document.querySelector('[mindar-image-target]');

      setTimeout(() => {
        if(loader && !loader.classList.contains('hidden')) {
          console.warn("Loader timed out, forcing hide.");
          loader.classList.add('hidden');
        }
      }, 15000);

      scene.addEventListener('arReady', () => {
        console.log("AR Ready");
        if(loader) loader.classList.add('hidden');
        if(scanningOverlay) scanningOverlay.classList.remove('hidden');
      });

      scene.addEventListener('arError', (event) => {
        console.error("AR Error:", event);
        if(loader) loader.innerHTML = '<p style="color:red; text-align:center;">Camera Error. Use HTTPS.</p>';
      });

      if (target) {
        target.addEventListener('targetFound', () => {
          if(scanningOverlay) scanningOverlay.classList.add('hidden');
        });
        target.addEventListener('targetLost', () => {
          if(scanningOverlay) scanningOverlay.classList.remove('hidden');
        });
      }
      
      const startAR = async () => {
         const mindArSystem = scene.systems['mindar-image-system'];
         if(mindArSystem) {
             try {
                await mindArSystem.start({ videoSettings: { facingMode: "environment" } });
             } catch(e) {
                console.warn("AR Start failed", e);
             }
         }
      };
      if(scene.hasLoaded) startAR();
      else scene.addEventListener('loaded', startAR);

      AFRAME.registerComponent('gesture-handler', {
        schema: { enabled: { default: true }, rotationFactor: { default: 5 }, minScale: { default: 0.1 }, maxScale: { default: 8 } },
        init: function () {
          this.handleScale = this.handleScale.bind(this);
          this.handleRotation = this.handleRotation.bind(this);
          this.initialScale = this.el.object3D.scale.clone();
          this.scaleFactor = 1;
          this.el.sceneEl.addEventListener("twofingermove", this.handleScale);
          this.el.sceneEl.addEventListener("onefingermove", this.handleRotation);
        },
        handleScale: function (event) {
          this.scaleFactor *= (1 + event.detail.spreadChange / this.el.sceneEl.canvas.clientWidth * 2); 
          this.scaleFactor = Math.min(Math.max(this.scaleFactor, this.data.minScale), this.data.maxScale);
          this.el.object3D.scale.x = this.scaleFactor * this.initialScale.x;
          this.el.object3D.scale.y = this.scaleFactor * this.initialScale.y;
          this.el.object3D.scale.z = this.scaleFactor * this.initialScale.z;
        },
        handleRotation: function (event) {
          this.el.object3D.rotation.y += event.detail.positionChange.x * this.data.rotationFactor;
        }
      });
    });
