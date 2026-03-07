/* ═══════════════════════════════════════════════════════════
  FAN Chat – OpenRouter Config
  ═══════════════════════════════════════════════════════════
  ไฟล์นี้ใช้เป็น "seed" เริ่มต้นเท่านั้น
  ปกติผู้ใช้จะเพิ่ม model ID และ API key เองในหน้าเลือกโมเดล
  หรือ import จากไฟล์ .txt ในแอป

  รูปแบบ:
  { id: 'provider/model-name', name: 'ชื่อโชว์', key: 'sk-or-v1-...' }

  ถ้าเว้นว่างไว้ แอปก็ยังใช้ได้ และจะรอให้ผู้ใช้กรอกเอง
  ═══════════════════════════════════════════════════════════ */

const OPENROUTER_MODELS = [
  // ─── OpenRouter Models ───


  // ─── เพิ่มโมเดลใหม่ตรงนี้ ───
  // { id: 'provider/model-name:free',  name: 'ชื่อแสดง (ฟรี)',  key: 'sk-or-v1-...' },
];

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Legacy exports เพื่อไม่ให้โค้ดเดิมพัง
const AI_MODELS = OPENROUTER_MODELS;
const AI_API_URL = OPENROUTER_API_URL;
