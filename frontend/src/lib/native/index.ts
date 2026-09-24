// ABOUTME: Native shim for Tauri integration
// ABOUTME: File dialogs, save/load, notifications with browser fallbacks

// Type definitions for Tauri window object
interface TauriApi {
  dialog?: {
    save?: (options?: unknown) => Promise<string | null>;
    open?: (options?: unknown) => Promise<string | string[] | null>;
  };
  fs?: {
    writeTextFile?: (path: string, contents: string) => Promise<void>;
    readTextFile?: (path: string) => Promise<string>;
  };
  notification?: {
    sendNotification?: (options: unknown) => void;
  };
}

declare global {
  interface Window {
    __TAURI__?: TauriApi;
  }
}

/**
 * Check if running inside Tauri webview.
 * True in the smasher-desktop window, where `withGlobalTauri` injects `window.__TAURI__`.
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && Boolean(window.__TAURI__);
}

/**
 * Save a file to disk.
 * Tauri: uses Tauri dialog.save() + fs.writeTextFile()
 * Browser: creates a download link and triggers download
 */
export async function saveFile(filename: string, blob: Blob): Promise<string> {
  if (isTauri() && window.__TAURI__?.dialog?.save && window.__TAURI__?.fs?.writeTextFile) {
    try {
      const path = await window.__TAURI__.dialog.save();
      if (path) {
        const text = await blob.text();
        await window.__TAURI__.fs.writeTextFile(path, text);
        return path;
      }
    } catch (error) {
      console.error('Tauri save failed, falling back to browser:', error);
    }
  }

  // Browser fallback: download blob
  if (typeof URL !== 'undefined' && URL.createObjectURL) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return filename;
}

/**
 * Load a file from disk.
 * Tauri: uses Tauri dialog.open() + fs.readTextFile()
 * Browser: shows file input dialog and returns selected file as Blob
 */
export async function loadFile(): Promise<Blob | null> {
  if (isTauri() && window.__TAURI__?.dialog?.open && window.__TAURI__?.fs?.readTextFile) {
    try {
      const path = await window.__TAURI__.dialog.open();
      if (path && typeof path === 'string') {
        const text = await window.__TAURI__.fs.readTextFile(path);
        return new Blob([text], { type: 'text/plain' });
      }
    } catch (error) {
      console.error('Tauri load failed, falling back to browser:', error);
    }
  }

  // Browser fallback: file input
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';

    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (files && files.length > 0) {
        resolve(files[0]);
      } else {
        resolve(null);
      }
    };

    input.click();
  });
}

export interface NotificationOptions {
  body?: string;
  icon?: string;
  tag?: string;
  dir?: 'auto' | 'ltr' | 'rtl';
  lang?: string;
  badge?: string;
  vibrate?: number[];
  requireInteraction?: boolean;
  data?: unknown;
}

/**
 * Show a notification.
 * Tauri: uses Tauri notification.sendNotification()
 * Browser: uses Notification API (requires permission)
 */
export async function showNotification(title: string, options?: NotificationOptions): Promise<void> {
  if (isTauri() && window.__TAURI__?.notification?.sendNotification) {
    try {
      window.__TAURI__.notification.sendNotification({ title, ...options });
      return;
    } catch (error) {
      console.error('Tauri notification failed, falling back to browser:', error);
    }
  }

  // Browser fallback: Notification API
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return;
  }

  // Request permission if needed
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }

  if (Notification.permission === 'granted') {
    new Notification(title, options);
  }
}
