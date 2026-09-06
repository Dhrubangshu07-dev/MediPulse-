/**
 * syncBus.js
 * 
 * High-performance, multi-layer synchronization bus for MediPulse.
 * Enables real-time, zero-latency sync between Admin Panel, Doctor Panel,
 * Patient Panel, and Booking Modal across:
 *   1. Cross-tab & Cross-window via BroadcastChannel ('medipulse_sync')
 *   2. Storage Event fallback for older/isolated contexts
 *   3. In-memory Pub/Sub for same-tab instant component synchronization
 */

const SYNC_CHANNEL_NAME = "medipulse_sync";
const STORAGE_KEY = "medipulse_last_sync_event";

class SyncBus {
  constructor() {
    this.listeners = new Map(); // event -> Set of callbacks
    this.allListeners = new Set(); // wildcard callbacks
    this.broadcastChannel = null;

    // 1. Initialize BroadcastChannel if supported
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event) => {
          if (event?.data?.type) {
            this._notifyLocal(event.data.type, event.data.payload, false);
          }
        };
      } catch (err) {
        console.warn("BroadcastChannel not supported or restricted:", err);
      }
    }

    // 2. Fallback / supplementary cross-window storage event listener
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (event) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            const data = JSON.parse(event.newValue);
            if (data?.type) {
              this._notifyLocal(data.type, data.payload, false);
            }
          } catch {
            // Ignore parse errors
          }
        }
      });
    }
  }

  /**
   * Internal dispatcher to local in-memory listeners
   */
  _notifyLocal(eventType, payload, isOrigin = false) {
    const meta = { type: eventType, payload, isOrigin, timestamp: Date.now() };

    // Specific listeners
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(payload, meta);
        } catch (e) {
          console.error(`Error in syncBus listener for ${eventType}:`, e);
        }
      });
    }

    // Wildcard listeners
    this.allListeners.forEach((cb) => {
      try {
        cb(eventType, payload, meta);
      } catch (e) {
        console.error(`Error in syncBus wildcard listener:`, e);
      }
    });
  }

  /**
   * Emit an event across all tabs and local components
   * @param {string} eventType e.g., 'APPOINTMENT_UPDATED', 'DOCTOR_UPDATED', 'PATIENT_UPDATED'
   * @param {any} payload Data associated with the event
   */
  emit(eventType, payload = {}) {
    // 1. Notify local subscribers in the current tab immediately
    this._notifyLocal(eventType, payload, true);

    // 2. Broadcast to other tabs via BroadcastChannel
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type: eventType, payload });
      } catch (err) {
        console.warn("BroadcastChannel postMessage failed:", err);
      }
    }

    // 3. Update localStorage to trigger cross-tab storage events
    if (typeof window !== "undefined") {
      try {
        const message = JSON.stringify({ type: eventType, payload, _t: Date.now() });
        localStorage.setItem(STORAGE_KEY, message);
      } catch {
        // Ignore quota or privacy sandbox errors
      }
    }
  }

  /**
   * Subscribe to a specific event
   * @param {string} eventType
   * @param {Function} callback (payload, meta) => void
   * @returns {Function} Unsubscribe cleanup function
   */
  on(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType).add(callback);

    return () => {
      const set = this.listeners.get(eventType);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Subscribe to all sync events
   * @param {Function} callback (eventType, payload, meta) => void
   * @returns {Function} Unsubscribe cleanup function
   */
  onAny(callback) {
    this.allListeners.add(callback);
    return () => {
      this.allListeners.delete(callback);
    };
  }
}

export const syncBus = new SyncBus();

// Standard event types enum for consistency
export const SYNC_EVENTS = {
  APPOINTMENT_UPDATED: "APPOINTMENT_UPDATED",
  APPOINTMENT_CREATED: "APPOINTMENT_CREATED",
  DOCTOR_UPDATED:      "DOCTOR_UPDATED",
  DOCTORS_CHANGED:     "DOCTORS_CHANGED",
  PATIENT_UPDATED:     "PATIENT_UPDATED",
  PRESCRIPTION_UPDATED:"PRESCRIPTION_UPDATED",
};
