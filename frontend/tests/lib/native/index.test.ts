// ABOUTME: Tests for the native shim module
// ABOUTME: Tests browser fallback behavior (Tauri doesn't exist in test environment)

import { describe, it, expect, vi, afterEach } from 'vitest';
import * as native from '../../../src/lib/native/index';

describe('native shim', () => {
  describe('markNativeWindow', () => {
    afterEach(() => {
      delete window.__TAURI__;
      delete document.documentElement.dataset.native;
    });

    it('leaves <html> unmarked in a plain browser', () => {
      native.markNativeWindow();
      expect(document.documentElement.hasAttribute('data-native')).toBe(false);
    });

    it('sets data-native on <html> inside the desktop app', () => {
      window.__TAURI__ = { core: { invoke: async () => undefined as never } };
      native.markNativeWindow();
      expect(document.documentElement.hasAttribute('data-native')).toBe(true);
    });
  });

  describe('isTauri', () => {
    it('should return false when window.__TAURI__ is not present', () => {
      expect(native.isTauri()).toBe(false);
    });
  });

  describe('saveFile', () => {
    it('should have saveFile function', () => {
      expect(typeof native.saveFile).toBe('function');
    });

    it('should return a promise', () => {
      const result = native.saveFile('test.txt', new Blob(['content']));
      expect(result instanceof Promise).toBe(true);
    });

    it('should resolve successfully for browser fallback', async () => {
      const blob = new Blob(['test content'], { type: 'text/plain' });
      const result = await native.saveFile('test.txt', blob);
      expect(typeof result).toBe('string');
    });
  });

  describe('loadFile', () => {
    it('should have loadFile function', () => {
      expect(typeof native.loadFile).toBe('function');
    });

    it('should return a promise', () => {
      const result = native.loadFile();
      expect(result instanceof Promise).toBe(true);
    });

    it('names the Tauri-loaded file after the chosen path so callers get its stem', async () => {
      // jsdom has no Tauri runtime: stand in for the dialog/fs plugins.
      window.__TAURI__ = {
        dialog: { open: async () => '/Users/test/flows/my-flow.dot' },
        fs: { readTextFile: async () => 'digraph { a -> b }' },
      };
      try {
        const file = await native.loadFile();

        expect(file).toBeInstanceOf(File);
        expect((file as File).name).toBe('my-flow.dot');
        expect(await file!.text()).toBe('digraph { a -> b }');
      } finally {
        delete window.__TAURI__;
      }
    });
  });

  describe('notifications', () => {
    it('should have showNotification function', () => {
      expect(typeof native.showNotification).toBe('function');
    });

    it('warns and resolves when neither Tauri nor the Notification API exists', async () => {
      // jsdom has no Notification API, so this exercises the last fallback.
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(
        native.showNotification('Test title', { body: 'Test body' })
      ).resolves.toBeUndefined();
      expect(warn).toHaveBeenCalledWith('Notifications not supported');

      warn.mockRestore();
    });
  });

  describe('revealInFinder', () => {
    afterEach(() => {
      delete window.__TAURI__;
    });

    it('refuses outside the desktop app', async () => {
      await expect(native.revealInFinder('/w/review.dot')).rejects.toThrow('Show in Finder is only available in the desktop app');
    });

    it("invokes the desktop app's reveal_in_finder command with the path", async () => {
      const invoke = vi.fn(async () => undefined as never);
      window.__TAURI__ = { core: { invoke } };

      await native.revealInFinder('/w/review.dot');

      expect(invoke).toHaveBeenCalledWith('reveal_in_finder', { path: '/w/review.dot' });
    });
  });
});
