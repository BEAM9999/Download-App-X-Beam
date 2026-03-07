/* ═══════════════════════════════════════════════════════════
	 FAN Chat – Gemini Config
	 ═══════════════════════════════════════════════════════════
	 API key ของ Gemini จะกรอกในหน้าเลือกโมเดลหรือ import จาก .txt
	 ไฟล์นี้เก็บเฉพาะรายการโมเดลที่อยากให้แอปรู้จัก

	 วิธีเพิ่ม/ลบโมเดล:
	 - เพิ่ม/ลบ object ใน GEMINI_MODELS ได้เลย
	 - id   = model code ของ Gemini API
	 - name = ชื่อโชว์ในหน้าเลือกโมเดล
	 - note = ข้อความสั้นๆ เพิ่มเติม เช่น Preview / Deprecated
	 ═══════════════════════════════════════════════════════════ */

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const GEMINI_MODELS = [
	{ id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite', note: 'Preview' },
	{ id: 'gemini-3.1-pro-preview',        name: 'Gemini 3.1 Pro',        note: 'Preview' },
	{ id: 'gemini-3-pro-preview',          name: 'Gemini 3 Pro',          note: 'Deprecated / Discontinuing' },
	{ id: 'gemini-2.5-flash-lite',         name: 'Gemini 2.5 Flash Lite', note: 'Stable' },
	{ id: 'gemini-3-flash-preview',        name: 'Gemini 3 Flash',        note: 'Preview' },
	{ id: 'gemini-2.0-flash-lite',         name: 'Gemini 2 Flash Lite',   note: 'Deprecated' },
	{ id: 'gemini-2.0-flash-exp',          name: 'Gemini 2 Flash Exp',    note: 'Shut down / Experimental' },
	{ id: 'gemini-2.0-flash',              name: 'Gemini 2 Flash',        note: 'Deprecated' },
	{ id: 'gemini-2.5-pro',                name: 'Gemini 2.5 Pro',        note: 'Stable' },
	{ id: 'gemini-2.5-flash',              name: 'Gemini 2.5 Flash',      note: 'Stable' },

	// Gemma 3 — open models (ทำงานผ่าน Gemini API)
	{ id: 'gemma-3-1b-it',  name: 'Gemma 3 1B',  note: 'Open Model' },
	{ id: 'gemma-3-4b-it',  name: 'Gemma 3 4B',  note: 'Open Model' },
	{ id: 'gemma-3-12b-it', name: 'Gemma 3 12B', note: 'Open Model' },
	{ id: 'gemma-3-27b-it', name: 'Gemma 3 27B', note: 'Open Model' },

	// Imagen 4 — image generation
	{ id: 'imagen-4.0-generate-preview',      name: 'Imagen 4 Generate',      note: 'Image Gen', type: 'image' },
	{ id: 'imagen-4.0-ultra-generate-preview', name: 'Imagen 4 Ultra',         note: 'Image Gen', type: 'image' },
	{ id: 'imagen-4.0-flash-preview',          name: 'Imagen 4 Fast',          note: 'Image Gen', type: 'image' },

	// TTS — text-to-speech (ใช้สำหรับฟังข้อความ & Voice Chat)
	{ id: 'gemini-2.5-flash-preview-tts', name: 'Gemini 2.5 Flash TTS', note: 'TTS', type: 'tts' },

	// Native Audio Dialog — for voice chat
	{ id: 'gemini-2.5-flash-preview-native-audio-dialog', name: 'Gemini 2.5 Flash Voice', note: 'Voice Chat', type: 'voice' }
];
