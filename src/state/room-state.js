// PURPOSE: Manages reactive synchronized room state and listener counts.
// INTEGRATION: Bridges the RealtimeRoomSync service with Room Hub UI, Header status, and Invite Banners.
// INPUT: Room connection states, room codes, authoritative room snapshots, and peer presence counts.
// OUTPUT: Readonly reactive snapshots delivered to registered UI observers.

class RoomStateManager {
  constructor() {
    this.subscribers = new Set();
    this.currentState = {
      role: 'solo', // 'solo' | 'room'
      roomId: null,
      roomName: 'Melodia Studio Room',
      connected: false,
      connecting: false,
      listenersCount: 1,
      authoritativeState: null,
      shareUrl: null,
      shortCode: null
    };
  }

  /**
   * Registers a callback to receive room state updates.
   * Immediately calls the callback with the current room snapshot.
   * @param {Function} callback - Function receiving (roomState)
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
   * @param {Object} nextState - New room state snapshot
   */
  update(nextState) {
    this.currentState = {
      ...this.currentState,
      ...nextState
    };
    this.notify();
  }

  /**
   * Dispatches current room state to all subscribed UI components.
   */
  notify() {
    const snapshot = this.getState();
    this.subscribers.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (err) {
        console.error('RoomState subscriber error:', err);
      }
    });
  }

  /**
   * Returns a copy of the current room state snapshot.
   * @returns {Object}
   */
  getState() {
    return {
      ...this.currentState,
      authoritativeState: this.currentState.authoritativeState
        ? { ...this.currentState.authoritativeState }
        : null
    };
  }
}

export const roomState = new RoomStateManager();
