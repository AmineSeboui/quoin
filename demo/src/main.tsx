import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'quoin-editor/styles.css';
import { App } from './App';
import './styles.css';
import './controls.css';
import './blocks.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
