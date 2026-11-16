import { mount } from 'svelte';
import App from './App.svelte';
import { markNativeWindow } from './lib/native';

markNativeWindow();

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
