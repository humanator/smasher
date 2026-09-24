// ABOUTME: Tests for the native shim module
// ABOUTME: Tests browser fallback behavior (Tauri doesn't exist in test environment)

import { describe, it, expect, vi } from 'vitest';
import * as native from '../../../src/lib/native/index';

describe('native shim', () => {
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
});
