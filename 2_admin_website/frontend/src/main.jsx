if (typeof window !== 'undefined') {
  if (!window.crypto) window.crypto = {};
  if (!window.crypto.subtle) {
    window.crypto.subtle = {
      encrypt: () => Promise.resolve(new ArrayBuffer(0)),
      decrypt: () => Promise.resolve(new ArrayBuffer(0)),
      sign: () => Promise.resolve(new ArrayBuffer(0)),
      verify: () => Promise.resolve(new ArrayBuffer(0)),
      digest: () => Promise.resolve(new ArrayBuffer(0)),
      generateKey: () => Promise.resolve({}),
      deriveKey: () => Promise.resolve({}),
      deriveBits: () => Promise.resolve(new ArrayBuffer(0)),
      importKey: () => Promise.resolve({}),
      exportKey: () => Promise.resolve({}),
      wrapKey: () => Promise.resolve(new ArrayBuffer(0)),
      unwrapKey: () => Promise.resolve({}),
    };
  }
  if (!window.crypto.getRandomValues) {
    window.crypto.getRandomValues = (arr) => {
      for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
      return arr;
    };
  }
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
