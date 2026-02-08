
    AFRAME.registerComponent('gesture-detector', {
      schema: { element: { default: '' } },
      init: function() {
        this.targetElement = this.data.element && document.querySelector(this.data.element);
        if (!this.targetElement) { this.targetElement = this.el; }
        this.internalState = { previousState: null };
        this.emitGestureEvent = this.emitGestureEvent.bind(this);
        this.targetElement.addEventListener('touchstart', this.emitGestureEvent);
        this.targetElement.addEventListener('touchend', this.emitGestureEvent);
        this.targetElement.addEventListener('touchmove', this.emitGestureEvent);
      },
      emitGestureEvent: function(event) {
        const currentState = this.getTouchState(event);
        const previousState = this.internalState.previousState;
        const gestureContinues = previousState && currentState && currentState.touchCount == previousState.touchCount;
        const gestureEnded = previousState && !gestureContinues;
        const gestureStarted = currentState && !gestureContinues;
        if (gestureEnded) { this.el.emit('gestureend'); }
        if (gestureStarted) { this.el.emit('gesturestart'); }
        if (gestureContinues) {
          const eventDetail = { positionChange: { x: currentState.position.x - previousState.position.x, y: currentState.position.y - previousState.position.y } };
          if (currentState.spread) {
            eventDetail.spreadChange = currentState.spread - previousState.spread;
            this.el.emit('twofingermove', eventDetail);
          } else {
            this.el.emit('onefingermove', eventDetail);
          }
        }
        this.internalState.previousState = currentState;
      },
      getTouchState: function(event) {
        if (event.touches.length === 0) return null;
        const touchList = [];
        for (let i = 0; i < event.touches.length; i++) { touchList.push(event.touches[i]); }
        const touchState = { touchCount: touchList.length };
        const centerPosition = touchList.reduce((sum, t) => ({ x: sum.x + t.clientX, y: sum.y + t.clientY }), { x: 0, y: 0 });
        touchState.position = { x: centerPosition.x / touchList.length, y: centerPosition.y / touchList.length };
        if (touchList.length >= 2) {
          const dx = touchList[0].clientX - touchList[1].clientX;
          const dy = touchList[0].clientY - touchList[1].clientY;
          touchState.spread = Math.sqrt(dx * dx + dy * dy);
        }
        return touchState;
      }
    });
