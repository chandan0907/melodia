// PURPOSE: Manages reactive audio playback state and subscriber notifications.
// INTEGRATION: Bridges the AudioEngine service with UI components (mini-dock, modal player, spectrum visualizer).
// INPUT: Audio engine state updates (playback status, track metadata, progress percentages, volume levels).
// OUTPUT: Readonly reactive snapshots delivered to registered UI observers.

class AudioStateManager {
  constructor() {
    // Registered observer callbacks
    this.subscribers = new Set();
    this.currentState = {
      isPlaying: false,
      volume: 0.85,
      mode: 'youtube',
      track: null,
      progress: 0
    };
  }

  /**
   * Registers a callback to receive audio state updates.
   * Immediately calls the callback with the current state snapshot.
   * @param {Function} callback - Function receiving (state)
   * @returns {Function} Unsubscribe teardown function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') return () => {};
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  /**
   * Updates internal state and notifies all active observers.
   * @param {Object} nextState - New audio state snapshot
   */
  update(nextState) {
    this.currentState = {
      ...this.currentState,
      ...nextState
    };
    this.notify();
  }

  /**
   * Dispatches current state to all subscribed UI components.
   */
  notify() {
    const snapshot = this.getState();
    this.subscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (err) {
        console.error('AudioState subscriber error:', err);
      }
    });
  }

  /**
   * Returns a copy of the current audio state snapshot.
   * @returns {Object}
   */
  getState() {
    return {
      ...this.currentState,
      track: this.currentState.track ? { ...this.currentState.track } : null
    };
  }
}

export const audioState = new AudioStateManager();
