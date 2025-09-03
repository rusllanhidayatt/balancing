import { initAuth } from './auth.js';
import { initForm } from './form.js';
import { initExport } from './export.js';
import { initData } from './data.js';
import { applyThemeByTime } from './utils.js';

// Terapkan tema otomatis
applyThemeByTime();

// Init semua modul
initAuth();
initForm();
initExport();
initData();
