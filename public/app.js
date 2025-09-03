import { initAuth } from './auth.js';
import { initForm } from './form.js';
import { initExport } from './export.js';
import { initData } from './data.js';
import { applyThemeByTime } from './utils.js';

window.addEventListener('DOMContentLoaded', () => {
  applyThemeByTime();
  initAuth();
  initForm();
  initExport();
  initData();

  // expose fetchAndRender for form to call after submit
  window.fetchAndRender = () => {
    try { initData(); } catch (e) { console.warn(e); }
  };
});
