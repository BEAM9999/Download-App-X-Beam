# 🟢 Slime Bouncer: ขุมทรัพย์เหรียญทอง
## Game Design Document (GDD) — ฉบับสมบูรณ์

---

## 📋 สารบัญ

1. [ภาพรวมของเกม (Game Overview)](#1-ภาพรวมของเกม)
2. [เนื้อเรื่อง (Story & Lore)](#2-เนื้อเรื่อง)
3. [ตัวละคร (Characters)](#3-ตัวละคร)
4. [กลไกการเล่น (Core Mechanics)](#4-กลไกการเล่น)
5. [ระบบการเคลื่อนที่ (Movement System)](#5-ระบบการเคลื่อนที่)
6. [ระบบศัตรู (Enemy System)](#6-ระบบศัตรู)
7. [ระบบบอส (Boss System)](#7-ระบบบอส)
8. [ระบบไอเทมและพาวเวอร์อัพ (Items & Power-ups)](#8-ระบบไอเทมและพาวเวอร์อัพ)
9. [การออกแบบด่าน (Level Design)](#9-การออกแบบด่าน)
10. [ระบบ Progression & Unlockables](#10-ระบบ-progression)
11. [UI/UX Design](#11-uiux-design)
12. [ระบบเสียง (Audio Design)](#12-ระบบเสียง)
13. [Art Style & Visual Design](#13-art-style)
14. [สถาปัตยกรรมทางเทคนิค (Technical Architecture)](#14-สถาปัตยกรรมทางเทคนิค)
15. [โครงสร้างไฟล์ (File Structure)](#15-โครงสร้างไฟล์)
16. [Game States & Screen Flow](#16-game-states)
17. [ระบบคะแนนและ Leaderboard](#17-ระบบคะแนน)
18. [การตั้งค่าและ Accessibility](#18-การตั้งค่า)
19. [Performance & Optimization](#19-performance)
20. [Roadmap การพัฒนา](#20-roadmap)

---

## 1. ภาพรวมของเกม

### 1.1 ข้อมูลพื้นฐาน
| รายการ | รายละเอียด |
|--------|-----------|
| **ชื่อเกม** | Slime Bouncer: ขุมทรัพย์เหรียญทอง |
| **แนว (Genre)** | 2D Platformer / Action Adventure |
| **แพลตฟอร์ม** | Web Browser (HTML5 Canvas) |
| **เทคโนโลยี** | HTML5 + CSS3 + JavaScript (Vanilla) |
| **การแสดงผล** | Canvas 2D API |
| **ขนาดจอเป้าหมาย** | 800×500 (responsive scale) |
| **อัตราเฟรม** | 60 FPS (requestAnimationFrame) |
| **กลุ่มเป้าหมาย** | ทุกวัย, casual gamers |
| **เวลาเล่นต่อรอบ** | 2-5 นาทีต่อด่าน |
| **จำนวนด่าน** | 20 ด่าน (4 โลก × 5 ด่าน) |
| **ระบบควบคุม** | Keyboard + Touch (mobile) |

### 1.2 แนวคิดหลัก (Core Concept)
ตัวสไลม์น่ารักสีเขียวมรกตชื่อ "กลิม (Glim)" ออกผจญภัยข้ามดินแดนทั้ง 4 เพื่อตามหาเหรียญทองโบราณที่ถูกขโมยไปโดยจอมมาร "ชาโดว์คิง (Shadow King)" กลิมต้องกระโดดข้ามเหว เหยียบศัตรู เก็บเหรียญ และปลดล็อกประตูเพื่อไปยังด่านถัดไป

### 1.3 Unique Selling Points
- **ระบบ Bounce Combo**: กระโดดเหยียบศัตรูต่อเนื่องโดยไม่แตะพื้น จะได้คะแนน combo ทวีคูณ
- **ระบบ Morph**: สไลม์แปลงร่างได้ตามพาวเวอร์อัพ (ไฟ, น้ำแข็ง, ลม)
- **Secret Rooms**: ห้องลับซ่อนอยู่ในทุกด่าน สำหรับนักสำรวจตัวจริง
- **Speed Run Mode**: โหมดจับเวลา สำหรับผู้เล่นที่อยากท้าทายตัวเอง
- **สไตล์ Pixel Art**: ศิลปะ pixel art 16-bit สีสดใส น่ารัก

---

## 2. เนื้อเรื่อง

### 2.1 เรื่องราวเบื้องหลัง (Backstory)
ในดินแดน **"เอเวอร์กลิม (Everglim)"** สไลม์ทุกตัวอาศัยอยู่อย่างสงบสุขนับพันปี เหรียญทองโบราณ 20 เหรียญถูกเก็บรักษาไว้ใน **"หอคอยแห่งแสง (Tower of Light)"** เหรียญเหล่านี้ให้พลังชีวิตแก่ป่าไม้ แม่น้ำ และสิ่งมีชีวิตทั้งหมดในดินแดน

วันหนึ่ง **ชาโดว์คิง (Shadow King)** — เงาคดเคี้ยวที่ถูกขังไว้ใต้ภูเขาอัคนีมาหลายร้อยปี ได้ตื่นขึ้นมาจากการหลับไหลเพราะแผ่นดินไหวครั้งใหญ่ เขาส่งลูกสมุนไปขโมยเหรียญทั้ง 20 เหรียญ และกระจายไปซ่อนทั่วทั้ง 4 อาณาจักร เพื่อดูดพลังจากเหรียญทำให้ตัวเองแข็งแกร่งขึ้น

ดินแดนเอเวอร์กลิมเริ่มเหี่ยวเฉา ต้นไม้เปลี่ยนเป็นสีดำ แม่น้ำแห้งขอด สัตว์ต่างๆ กลายเป็นมอนสเตอร์ดุร้าย...

### 2.2 ตัวเอก
สไลม์น้อยชื่อ **กลิม (Glim)** — สไลม์ธรรมดาตัวเล็กๆ ที่ไม่มีพลังพิเศษอะไรเลย แต่มีหัวใจที่กล้าหาญ เขาตัดสินใจออกเดินทางคนเดียวเพื่อตามหาเหรียญทั้ง 20 เหรียญกลับมา

### 2.3 โครงสร้างเนื้อเรื่อง 4 บท

#### บทที่ 1: ป่าเขียวมรกต (Emerald Forest) — ด่าน 1-5
> *"ป่าที่เคยเขียวขจีกำลังเหี่ยวเฉา ดอกไม้ร่วงโรย สัตว์ป่าเริ่มดุร้าย กลิมต้องฝ่าป่าทึบไปยังกำแพงเมืองเก่า"*

- **ธีม**: ป่า ต้นไม้ ถ้ำเห็ดยักษ์ น้ำตก
- **เนื้อเรื่อง**: กลิมออกจากหมู่บ้านสไลม์ พบ NPC ชื่อ "ผู้เฒ่าโมส" ที่บอกว่าเหรียญ 5 เหรียญถูกซ่อนไว้ในป่านี้ ต้องเก็บให้ครบเพื่อเปิดประตูสู่ทะเลทราย
- **บอสประจำบท**: **Thornback** — ต้นไม้ยักษ์ที่ถูกเงาครอบงำ ยิงหนามใส่และสะบัดกิ่ง

#### บทที่ 2: ทะเลทรายแสงทอง (Golden Desert) — ด่าน 6-10
> *"ทะเลทรายร้อนระอุ พายุทรายพัดไม่หยุด ซากปรักหักพังของอารยธรรมโบราณซ่อนความลับมากมาย"*

- **ธีม**: ทะเลทราย พีระมิด โอเอซิส กับดักหิน
- **เนื้อเรื่อง**: กลิมพบ "เจ้าหญิงซาร่า" สไลม์ทรายที่ถูกกักขัง เธอบอกว่าชาโดว์คิงสร้างมอนสเตอร์ทรายเฝ้าเหรียญไว้ในพีระมิด
- **บอสประจำบท**: **Sand Wyrm** — หนอนทรายยักษ์ที่โผล่ขึ้นมาจากพื้นทราย ผู้เล่นต้องหลบและกระโดดเหยียบหัวมัน

#### บทที่ 3: ทะเลน้ำแข็งนิรันดร์ (Frozen Sea) — ด่าน 11-15
> *"ทะเลที่กลายเป็นน้ำแข็ง ลมหนาวเย็นจนกระดูก ถ้ำน้ำแข็งลึกลับซ่อนเหรียญไว้ภายใน"*

- **ธีม**: น้ำแข็ง หิมะ ถ้ำคริสตัล ทะเลสาบแข็ง (พื้นลื่น)
- **เนื้อเรื่อง**: กลิมพบ "ฟรอสต์" สไลม์น้ำแข็งที่บอกว่ามีทางลัดไปยังปราสาทชาโดว์คิง แต่ต้องผ่านถ้ำคริสตัลอันตรายก่อน
- **บอสประจำบท**: **Frost Giant** — ยักษ์น้ำแข็งที่เหยียบพื้นสร้างคลื่นน้ำแข็ง ผู้เล่นต้องกระโดดหลบและโจมตีจุดอ่อนที่หลัง

#### บทที่ 4: ปราสาทเงา (Shadow Castle) — ด่าน 16-20
> *"ปราสาทลอยอยู่บนท้องฟ้ามืดมิด เต็มไปด้วยกับดักและสมุนของชาโดว์คิง นี่คือการต่อสู้ครั้งสุดท้าย"*

- **ธีม**: ปราสาทมืด ลาวา เวทมนตร์ เฟืองจักรกล
- **เนื้อเรื่อง**: กลิมนำเหรียญทั้ง 15 เหรียญที่เก็บมาได้เปิดประตูสู่ปราสาท ต้องสู้กับสมุนชั้นแนวหน้าทั้งหมดก่อนเข้าถึงชาโดว์คิง
- **บอสสุดท้าย**: **Shadow King** — 3 เฟส (ดูรายละเอียดในหัวข้อบอส)

### 2.4 เนื้อเรื่องจบ (Endings)

#### จบปกติ (Normal Ending)
เก็บเหรียญครบ 20 เหรียญ ชนะชาโดว์คิง → ดินแดนกลับมาเขียวขจี กลิมกลับบ้านเป็นฮีโร่

#### จบซ่อน (True Ending)
เก็บเหรียญครบ 20 + เพชรลับครบ 20 (ด่านละ 1) → ชนะชาโดว์คิงเฟสพิเศษที่ 4 → เปิดเผยว่าชาโดว์คิงเดิมคือ "ราชาสไลม์องค์เก่า" ที่ถูกเงาครอบงำ → กลิมช่วยปลดเงาออก ราชาองค์เก่ากลับมา

---

## 3. ตัวละคร

### 3.1 กลิม (Glim) — ตัวเอก

**รูปลักษณ์**:
- สไลม์ทรงกลมสีเขียวมรกต ขนาด 24×24 px (sprite)
- ตาโตกลมสีดำ 2 ดวง มีประกายสีขาว
- แก้มสีชมพูจางๆ (แสดงความน่ารัก)
- Animation: idle (กระเด้งเบาๆ), walk (บีบตัวซ้ายขวา), jump (ยืดตัวขึ้น), land (แบนลงแล้วกลับปกติ)

**สถานะ (Stats)**:
```
HP          : ❤️❤️❤️ (3 หัวใจ, เพิ่มได้สูงสุด 5)
ความเร็ว     : 180 px/sec (ปรับได้ตาม power-up)
ความสูงกระโดด : 320 px (jump velocity: -420 px/sec)
```

**Animation States**:
| State | Frames | Duration | Loop |
|-------|--------|----------|------|
| idle | 4 | 600ms | ✅ |
| walk | 6 | 400ms | ✅ |
| jump_up | 2 | 200ms | ❌ |
| jump_peak | 1 | hold | ❌ |
| fall | 2 | 300ms | ✅ |
| land_squash | 3 | 180ms | ❌ |
| hurt | 3 | 400ms | ❌ |
| morph_fire | 4 | 300ms | ❌ |
| morph_ice | 4 | 300ms | ❌ |
| morph_wind | 4 | 300ms | ❌ |
| death | 6 | 800ms | ❌ |
| celebrate | 6 | 600ms | ✅ |

### 3.2 NPC สำคัญ

#### ผู้เฒ่าโมส (Elder Moss)
- สไลม์เขียวเข้มขนาดใหญ่ มีหนวดเคราตะไคร่น้ำ
- บทบาท: ให้คำแนะนำตอนเริ่มเกม, บอกเรื่องราว
- ปรากฏที่: ด่าน 1 (เปิดเกม), จุดพักระหว่างโลก

#### เจ้าหญิงซาร่า (Princess Sara)
- สไลม์สีทองส้ม มีมงกุฎเล็กๆ
- บทบาท: ให้พาวเวอร์อัพพิเศษ "ดาวทอง" (ดูดเหรียญอัตโนมัติ 10 วินาที)
- ปรากฏที่: ด่าน 6 (เปิดบทที่ 2)

#### ฟรอสต์ (Frost)
- สไลม์สีฟ้าใส มีเกล็ดน้ำแข็งรอบตัว
- บทบาท: สอนการใช้ Ice Morph, ให้เบาะแสห้องลับ
- ปรากฏที่: ด่าน 11 (เปิดบทที่ 3)

#### ชาโดว์คิง (Shadow King)
- เงาขนาดมหึมา มีตาสีแดงเรืองแสง 2 ดวง สวมมงกุฎหัก
- ท่าทาง: ลอยอยู่กลางอากาศ มีหมอกดำคลุมรอบตัว
- ปรากฏที่: Cutscene เปิดเกม, ด่าน 20 (บอสสุดท้าย)

---

## 4. กลไกการเล่น (Core Mechanics)

### 4.1 กลไกหลัก

#### 4.1.1 การเคลื่อนที่ (Movement)
```
- เดินซ้าย/ขวา (Arrow Keys / A,D / Touch Left-Right)
- ระบบ Acceleration: ไม่หยุดทันที มี deceleration ให้รู้สึกลื่นไหล
  - Acceleration: 1200 px/sec²
  - Max Speed: 180 px/sec
  - Friction (ground): 800 px/sec²
  - Air Friction: 200 px/sec² (ควบคุมในอากาศได้น้อยกว่า)
```

#### 4.1.2 การกระโดด (Jumping)
```
- กดปุ่มกระโดด (Space / Up / W / Touch Button)
- Jump Velocity: -420 px/sec
- Gravity: 980 px/sec²
- Max Fall Speed: 600 px/sec (terminal velocity)
- Coyote Time: 80ms (กระโดดได้แม้เพิ่งตกออกจากขอบแพลตฟอร์ม)
- Jump Buffer: 100ms (กดกระโดดก่อนแตะพื้นเล็กน้อย จะกระโดดทันทีเมื่อแตะพื้น)
- Variable Jump Height: ปล่อยปุ่มเร็ว = กระโดดต่ำ, กดค้าง = กระโดดสูง
  - ถ้าปล่อยปุ่มขณะขึ้น: velocity *= 0.4 (ตัดแรงลง) 
```

#### 4.1.3 การเหยียบศัตรู (Stomp)
```
- ลงมาจากด้านบนศัตรู → ทำลายศัตรู + กระดอนขึ้น (bounce velocity: -350 px/sec)
- การตรวจจับ: ตำแหน่งล่างของกลิม อยู่เหนือ 40% บนของ hitbox ศัตรู
- ชนด้านข้างหรือด้านล่าง → กลิมเสียเลือด
- Bounce Combo: กระดอนไม่แตะพื้น x2, x3, x4... คะแนนทวีคูณ
  - Combo 3+ = เอฟเฟกต์ประกายดาว
  - Combo 5+ = เอฟเฟกต์สายรุ้ง + เสียงพิเศษ
  - Combo 10+ = ได้ 1UP
```

#### 4.1.4 การเก็บเหรียญ (Coin Collection)
```
- เหรียญทอง (Gold Coin): +10 คะแนน, มีทั่วด่าน
- เหรียญเงิน (Silver Coin): +5 คะแนน, มีทั่วด่าน
- เหรียญแดง (Red Coin): +50 คะแนน, ด่านละ 5 เหรียญ (ซ่อนในจุดยาก)
- เหรียญโบราณ (Ancient Coin): สำคัญต่อเนื้อเรื่อง, ด่านละ 1 (ต้องเก็บครบเพื่อจบเกม)
- เพชรลับ (Secret Gem): ด่านละ 1, ซ่อนในห้องลับ → ใช้ปลดล็อก True Ending
```

### 4.2 ระบบ HP & Damage

```
HP เริ่มต้น: 3 หัวใจ (สูงสุด 5)
การเสียเลือด:
  - ชนศัตรูด้านข้าง: -1 HP
  - ตกเหว: เสียชีวิตทันที (ไม่สนใจ HP)
  - ชนหนาม/ลาวา: -1 HP
  - โดนกระสุนบอส: -1 HP
  - ชนบอส: -2 HP

Invincibility Frame:
  - หลังโดนตี: 1.5 วินาที กระพริบ (8 frame flicker)
  - ระหว่างนี้ผ่านทะลุศัตรูได้

Knockback:
  - โดนตีด้านซ้าย: ถูกดีดไปขวา (velocity: 200 px/sec, -200 px/sec ขึ้น)
  - โดนตีด้านขวา: ถูกดีดไปซ้าย

Death:
  - HP = 0 → เล่น death animation → หน้าจอ "Game Over" → "ลองใหม่" / "กลับเมนู"
  - ตกเหว → หน้าจอมืดเร็ว → respawn ที่ checkpoint ล่าสุด (เสีย 1 life)

Life System:
  - เริ่มต้น: 3 ชีวิต
  - หมดชีวิต = Game Over → เริ่มด่านใหม่ (ไม่ต้องเริ่มเกมใหม่ทั้งหมด)
  - ได้ชีวิตเพิ่ม: เก็บเหรียญทอง 100 = +1 life, หา 1UP (หายาก)
```

### 4.3 ระบบ Checkpoint

```
Checkpoint Flag:
  - ธงสีแดง ขนาด 16×32 px
  - เมื่อกลิมวิ่งผ่าน → ธงเปลี่ยนเป็นสีเขียว + animation โบก
  - ตายแล้ว respawn ที่ธง checkpoint ล่าสุด
  - แต่ละด่านมี 1-3 checkpoint (ด่านยาว = มากกว่า)

Auto-Save:
  - บันทึกอัตโนมัติเมื่อผ่านด่าน
  - บันทึกใน localStorage:
    - ด่านที่ปลดล็อก
    - เหรียญที่เก็บได้
    - เพชรลับที่หาเจอ
    - เวลาเล่นรวม
    - High score แต่ละด่าน
```

---

## 5. ระบบการเคลื่อนที่ (Movement System) — รายละเอียดทางเทคนิค

### 5.1 Physics Engine (Custom)

```javascript
// === Physics Constants ===
const GRAVITY = 980;           // px/sec²
const MAX_FALL_SPEED = 600;    // px/sec
const MOVE_ACCEL = 1200;       // px/sec²
const MAX_MOVE_SPEED = 180;    // px/sec
const GROUND_FRICTION = 800;   // px/sec²
const AIR_FRICTION = 200;      // px/sec²
const JUMP_VELOCITY = -420;    // px/sec (negative = up)
const JUMP_CUT_MULT = 0.4;    // เมื่อปล่อยปุ่มกระโดด
const COYOTE_TIME = 0.08;     // sec
const JUMP_BUFFER = 0.1;      // sec
const STOMP_BOUNCE = -350;    // px/sec

// === State Machine ===
STATES: IDLE | WALK | JUMP | FALL | HURT | DEAD
```

### 5.2 Collision Detection

```
ระบบ AABB (Axis-Aligned Bounding Box):
  - ทุก entity มี hitbox สี่เหลี่ยม
  - กลิม hitbox: 18×20 px (เล็กกว่า sprite 24×24 เพื่อให้เล่นง่าย)
  - Tile collision: เช็คทั้ง 4 มุมของ hitbox กับ tilemap
  - Entity collision: sweep test ตาม velocity

Tilemap Collision:
  - Solid tiles: กลิมเดินผ่านไม่ได้ (ดิน, หิน, อิฐ)
  - One-way platform: กระโดดทะลุจากด้านล่างได้ แต่ยืนบนได้
  - Hazard tiles: หนาม, ลาวา → damage
  - Ladder tiles: ไต่ขึ้นลงได้
  - Water tiles: กลิมลอยช้าลง, กระโดดสูงขึ้นเล็กน้อย
```

### 5.3 การเคลื่อนที่พิเศษ

```
Wall Slide (ปลดล็อกหลังด่าน 5):
  - เกาะกำแพงขณะตก → ตกช้าลง (max fall: 80 px/sec)
  - กดกระโดดขณะเกาะ → Wall Jump

Wall Jump (ปลดล็อกหลังด่าน 5):
  - กระโดดออกจากกำแพง → velocity: (±280, -380) px/sec
  - Cooldown: 0.15 sec (กันกดสแปม)

Dash (ปลดล็อกหลังด่าน 15):
  - กด Shift/กดปุ่มพิเศษ → พุ่งไปข้างหน้าเร็ว 600 px/sec, 0.2 วินาที
  - Cooldown: 1 วินาที
  - ระหว่าง dash: ไม่โดน damage (invincible)
  - Trail effect: ภาพเงาสีเขียว 3-4 ภาพตามหลัง
```

---

## 6. ระบบศัตรู (Enemy System)

### 6.1 รายชื่อศัตรูทั้งหมด

#### โลกที่ 1: ป่าเขียวมรกต

| ชื่อ | Sprite | HP | ความเร็ว | พฤติกรรม | คะแนน |
|------|--------|----|---------|---------|----|
| **สไลม์แดง (Red Slime)** | 16×16 | 1 | 40 px/s | เดินซ้ายขวาบนแพลตฟอร์ม, ถอยกลับเมื่อชนขอบ | 100 |
| **เห็ดพิษ (Poison Shroom)** | 16×20 | 1 | 0 | อยู่กับที่, ยิงสปอร์ทุก 3 วินาที (โค้งพาราโบลา) | 150 |
| **ค้างคาวจิ๋ว (Tiny Bat)** | 16×12 | 1 | 60 px/s | บินตาม pattern sine wave, เดินเข้าหาเมื่อผู้เล่นอยู่ใกล้ < 120px | 200 |
| **หมาป่าซุ่ม (Lurk Wolf)** | 24×20 | 2 | 100 px/s | ซ่อนอยู่ในพุ่มไม้ กระโดดออกมาเมื่อผู้เล่นเดินผ่าน | 300 |

#### โลกที่ 2: ทะเลทรายแสงทอง

| ชื่อ | Sprite | HP | ความเร็ว | พฤติกรรม | คะแนน |
|------|--------|----|---------|---------|----|
| **แมงป่องทราย (Sand Scorpion)** | 20×16 | 2 | 50 px/s | เดินซ้ายขวา, จะหยุดแล้วแทงหาง (ระยะ 32px ข้างหน้า) ทุก 2.5 วินาที | 250 |
| **มัมมี่จิ๋ว (Mini Mummy)** | 16×24 | 3 | 30 px/s | เดินตามผู้เล่นช้าๆ ไม่หยุดไม่ตาย, เหยียบ 3 ครั้งถึงจะตาย | 400 |
| **แร้งกระดูก (Bone Vulture)** | 24×20 | 1 | 80 px/s | บินวนอยู่ด้านบน พุ่งลงมาโจมตีเมื่อผู้เล่นอยู่ด้านล่างตรง | 350 |
| **กับดักทราย (Sand Trap)** | 32×8 | ∞ | 0 | วงกลมทรายหมุนบนพื้น เดินผ่านจะถูกดูดลงช้าๆ (ต้องกดกระโดดหนี) | 0 |

#### โลกที่ 3: ทะเลน้ำแข็งนิรันดร์

| ชื่อ | Sprite | HP | ความเร็ว | พฤติกรรม | คะแนน |
|------|--------|----|---------|---------|----|
| **เพนกวินกลิ้ง (Rolling Penguin)** | 16×16 | 1 | 120 px/s | นั่งนิ่งอยู่, เมื่อผู้เล่นเข้าใกล้จะกลิ้งตัวพุ่งใส่เร็วมาก | 200 |
| **ก้อนน้ำแข็งมีชีวิต (Ice Block)** | 20×20 | 2 | 40 px/s | เดินไปมา, เมื่อเห็นผู้เล่นจะหยุดแล้วยิงลูกน้ำแข็ง 3 ลูกพัดรูปพัด | 350 |
| **หมีขาวน้อย (Snow Bear Cub)** | 24×24 | 3 | 60 px/s | เดินตามผู้เล่น, ตบด้วยอุ้งเท้า (knockback แรง 2x ปกติ) | 500 |
| **เกล็ดหิมะวนเวียน (Snowflake Spinner)** | 12×12 | ∞ | 0 | หมุนวนรอบจุดศูนย์กลาง (obstacle, ทำลายไม่ได้) | 0 |

#### โลกที่ 4: ปราสาทเงา

| ชื่อ | Sprite | HP | ความเร็ว | พฤติกรรม | คะแนน |
|------|--------|----|---------|---------|----|
| **อัศวินเงา (Shadow Knight)** | 20×28 | 3 | 70 px/s | เดินตามผู้เล่น, มีโล่ด้านหน้า (เหยียบด้านบนเท่านั้น) | 800 |
| **ค้างคาวเปลวไฟ (Fire Bat)** | 16×12 | 1 | 90 px/s | บินและทิ้ง "ลูกไฟ" ที่ตกลงมาทุก 2 วินาที | 400 |
| **หุ่นยนต์เฟือง (Gear Golem)** | 28×32 | 5 | 30 px/s | เดินช้ามาก แต่ทำลายยาก ยิงเฟืองที่เด้งกลับจากกำแพง | 1000 |
| **เงาคดเคี้ยว (Shadow Wisp)** | 12×12 | 1 | 0→200 | ลอยอยู่กับที่ เมื่อผู้เล่นเข้าใกล้จะพุ่งตรงเข้าหาเร็วมาก (homing) | 500 |

### 6.2 Enemy AI Patterns

```
=== PatrolAI (เดินไปมา) ===
direction = 1 (ขวา)
เดินไปตาม direction * speed
ถ้าชนกำแพง OR ถึงขอบแพลตฟอร์ม → direction *= -1
ใช้โดย: Red Slime, Sand Scorpion, Ice Block

=== ChaseAI (ไล่ตาม) ===
ถ้า player อยู่ในรัศมี detectionRange:
  เดินเข้าหา player
ไม่งั้น:
  ใช้ PatrolAI
ใช้โดย: Lurk Wolf, Mini Mummy, Snow Bear Cub, Shadow Knight

=== FlyPatternAI (บิน pattern) ===
เคลื่อนที่ตาม sine wave: y = baseY + sin(time * freq) * amplitude
ถ้า player อยู่ในรัศมี: เปลี่ยนเป็นพุ่งตรงเข้าหา
ใช้โดย: Tiny Bat, Fire Bat

=== TurretAI (ยิงอยู่กับที่) ===
อยู่กับที่ ทุก shootInterval วินาที:
  สร้าง projectile บินไปทาง player
ใช้โดย: Poison Shroom, Ice Block, Gear Golem

=== AmbushAI (ซุ่มโจมตี) ===
ซ่อนตัว (invisible) จนกว่า player จะเข้าใกล้ triggerRange
แล้วกระโดดออกมาและเปลี่ยนเป็น ChaseAI
ใช้โดย: Lurk Wolf
```

---

## 7. ระบบบอส (Boss System)

### 7.1 โครงสร้างบอสทั่วไป

```
ทุกบอสมี:
  - HP Bar: แถบเลือดยาวที่ด้านบนจอ แสดงชื่อบอส
  - เฟส (Phase): เปลี่ยนพฤติกรรมเมื่อ HP ลดถึงจุดกำหนด
  - Invulnerable ชั่วคราว: ระหว่างเปลี่ยนเฟส (2 วินาที)
  - Arena เฉพาะ: ห้องล็อกไม่ให้ออก จนกว่าจะชนะ
  - BGM พิเศษ: เพลงบอสไม่ซ้ำกัน
  - Drop: เหรียญโบราณของด่านนั้น + เหรียญทอง 50 เหรียญ
```

### 7.2 บอสละเอียด

#### Boss 1: Thornback (โลกป่า, ด่าน 5)
```
- รูปลักษณ์: ต้นไม้ยักษ์ 128×160 px มีหน้ายักษ์สีม่วง เถาวัลย์เป็นแขน
- HP: 12
- Arena: 400×300 px มีแพลตฟอร์มลอย 3 ชั้น

เฟส 1 (HP 12-7):
  - โจมตี 1: สะบัดเถาวัลย์ขวา→ซ้าย (ต้องกระโดดหลบ)
  - โจมตี 2: ยิงหนาม 3 ลูก โค้งพาราโบลา
  - จุดอ่อน: ดอกไม้สีแดงบนหัว → ต้องกระโดดขึ้นแพลตฟอร์มชั้น 3 แล้วเหยียบ
  - รอบโจมตี: สะบัด → ยิงหนาม → หยุดพัก 2 วิ (เปิดจุดอ่อน) → วนซ้ำ

เฟส 2 (HP 6-1):
  - ความเร็วโจมตีเพิ่ม 30%
  - โจมตีใหม่: รากไม้โผล่จากพื้น (สุ่ม 3 จุด, มี warning สั่น 0.5 วิ ก่อนโผล่)
  - จุดอ่อนเดิมแต่เปิดแค่ 1.5 วิ
  
ชนะ: ต้นไม้แตกออก เหลือแกนกลางสีเขียว → เหรียญโบราณปรากฏ
```

#### Boss 2: Sand Wyrm (โลกทะเลทราย, ด่าน 10)
```
- รูปลักษณ์: หนอนทรายยักษ์ ยาว 200px สีน้ำตาลทอง มีเขี้ยววิบวับ
- HP: 18
- Arena: 500×250 px พื้นทราย มีแพลตฟอร์มหินลอย 5 อัน

เฟส 1 (HP 18-10):
  - โจมตี 1: มุดทราย → โผล่ขึ้นมาจากด้านล่าง (shadow warning บนพื้น 1 วิ ก่อนโผล่)
  - โจมตี 2: พ่นทรายตรงข้างหน้า (ระยะยาว 200px)
  - จุดอ่อน: หัว → ต้องกระโดดเหยียบเมื่อมันโผล่ขึ้น (เปิด 1.5 วิ)
  
เฟส 2 (HP 9-1):
  - โผล่ถี่ขึ้น, โผล่ 2 ตัวพร้อมกัน (ตัวจริง + ตัวปลอม สีจางกว่า)
  - โจมตีใหม่: กลิ้งตัวไปมาบนพื้น (ต้องอยู่บนแพลตฟอร์มลอย)
  - เมื่อ HP < 5: หนอนเริ่มทำลายแพลตฟอร์มหิน (เหลือ 3 แล้วเหลือ 2)

ชนะ: หนอนมุดลงดินตลอดไป → เหรียญโบราณโผล่จากพื้นทราย
```

#### Boss 3: Frost Giant (โลกน้ำแข็ง, ด่าน 15)
```
- รูปลักษณ์: ยักษ์น้ำแข็งสีฟ้า 96×128 px มือถือค้อนน้ำแข็ง
- HP: 24
- Arena: 450×300 px พื้นน้ำแข็ง (ลื่น!) มีแพลตฟอร์มน้ำแข็ง 4 ชั้น

เฟส 1 (HP 24-16):
  - โจมตี 1: ทุบค้อนลงพื้น → คลื่นน้ำแข็ง 2 shard วิ่งไปซ้ายขวา
  - โจมตี 2: เดินเข้าหาผู้เล่นช้าๆ แล้วสวิง (ระยะกว้าง)
  - จุดอ่อน: คริสตัลสีแดงที่หลัง → ต้องวิ่งอ้อมไปข้างหลังแล้วกระโดดเหยียบ
  
เฟส 2 (HP 15-8):
  - ทุบค้อน → คลื่นน้ำแข็ง 4 shard (dual wave)
  - โจมตีใหม่: หายใจเย็นแช่แข็ง (beam ตรง 2 วิ จากปากไปจนสุดจอ)
  - พื้นบางส่วนแตกเป็นเหว (ice cracks)
  
เฟส 3 (HP 7-1): 
  - กลายเป็นสีแดง (rage mode) ความเร็วเพิ่ม 50%
  - Combo: ทุบ → หายใจ → กระโดดตบ (shockwave 360°)
  - จุดอ่อนเปิดแค่หลัง combo

ชนะ: ยักษ์แตกเป็นเศษน้ำแข็ง → คริสตัลสีฟ้าสวยงามปรากฏ + เหรียญ
```

#### Boss 4: Shadow King (ปราสาทเงา, ด่าน 20)
```
- รูปลักษณ์: เงาขนาดมหึมา 120×160 px ลอยกลางอากาศ ตาสีแดงเรืองแสง สวมมงกุฎหัก
- HP: 36 (บอสสุดท้าย)
- Arena: 500×350 px ปราสาลอยฟ้า มีแพลตฟอร์มเคลื่อนที่ 6 อัน

เฟส 1 "Shadows Arise" (HP 36-25):
  - ลอยอยู่ด้านบน ไม่ลงมาเอง
  - โจมตี 1: ยิงลูกเงา 5 ลูกกระจาย fan-shape
  - โจมตี 2: สร้าง shadow clone (ศัตรูเงา) 2 ตัว ลงมาไล่ผู้เล่น
  - โจมตี 3: ยิงเลเซอร์เงาตรง (sweep ช้าจากซ้ายไปขวา)
  - จุดอ่อน: เมื่อยิงเลเซอร์จบ จะลอยต่ำลงมา 2 วิ → กระโดดเหยียบ
  
เฟส 2 "Dark Storm" (HP 24-13):
  - สร้างพายุเงา: วัตถุสุ่มตกจากด้านบน (ก้อนหิน, เศษเหล็ก) ทั้งด่าน
  - โจมตี 4: teleport ไปจุดสุ่ม → ปรากฏตัว → ฟาดกรงเล็บลง (shockwave)
  - แพลตฟอร์มบางอันเริ่มหายไป/กลับมา (flicker)
  - จุดอ่อน: หลัง teleport + ฟาด จะ stun 2.5 วิ → เหยียบ
  
เฟส 3 "Final Form" (HP 12-1):
  - กลายเป็นยักษ์ 2 เท่า ตาเรืองแสงสีม่วง
  - ทุกโจมตีเร็วขึ้น 40%
  - โจมตี 5: ดูดทุกอย่างเข้าหาตัว 3 วิ (gravity pull) → ระเบิดออก (ต้องอยู่ให้ไกลที่สุด)
  - โจมตี 6: เสก portal 2 อัน → shadow hand ยื่นออกมาจาก portal ไล่หวดผู้เล่น
  - จุดอ่อน: เมื่อทำ gravity pull + ระเบิด จะหมดแรง 3 วิ → เหยียบ

เฟสลับ (True Ending only, HP +12):
  - มงกุฎหักปลดออก → เปิดเผยว่าเป็นสไลม์ราชาองค์เก่าสีทอง
  - เล่นเหมือนเฟส 1-3 แต่เร็วขึ้น + มีแพลตฟอร์มน้อยลง
  - เมื่อชนะ: animation กลิมใช้พลังเหรียญ + เพชร 20 เหรียญ → ชำระเงา → ราชาสไลม์คืนสภาพ

ชนะ: Cutscene จบเกม → เครดิต
```

---

## 8. ระบบไอเทมและพาวเวอร์อัพ (Items & Power-ups)

### 8.1 Power-ups (หยิบแล้วใช้ทันที)

| ไอเทม | ไอคอน | เอฟเฟกต์ | ระยะเวลา | พบได้ใน |
|--------|-------|---------|---------|--------|
| **Mushroom Heart** | 🍄❤️ | +1 HP | ถาวร | ทุกด่าน (1-2 อัน) |
| **Speed Star** | ⭐ | ความเร็ว x1.5 + กระพริบทอง | 10 วินาที | โลก 1,2,3,4 |
| **Shield Bubble** | 🛡️ | กัน damage 1 ครั้ง (ฟองล้อมตัว) | จนกว่าจะโดนตี | หายาก |
| **Magnet Coin** | 🧲 | ดูดเหรียญรัศมี 120px | 15 วินาที | ทุกด่าน |
| **1UP** | 💚 | +1 ชีวิต | ถาวร | ซ่อนในห้องลับ |
| **Golden Star** | ⭐(ใหญ่) | ดูดเหรียญอัตโนมัติทั้งจอ + ชนศัตรูตายทันที | 8 วินาที | NPC ให้ |

### 8.2 Morph Power-ups (แปลงร่างชั่วคราว)

#### 🔥 Fire Morph
```
- หยิบ: คริสตัลสีแดง (ลอยอยู่ใน ? Block)
- เปลี่ยน: กลิมเปลี่ยนเป็นสีส้มแดง มีเปลวไฟรอบตัว
- ความสามารถ: กดปุ่มโจมตี → ยิง fireball ตรง (ทำลายศัตรู 1 HP, ระยะ 200px)
- ระยะเวลา: 30 วินาที หรือจนกว่าจะโดนตี
- หมด: กลิมกลับเป็นปกติ + flash สีขาว
- พบได้ใน: โลก 1 เป็นต้นไป
- ฟิสิกส์ fireball: speed 300 px/s, gravity 0, destroy on hit/wall
```

#### ❄️ Ice Morph
```
- หยิบ: คริสตัลสีฟ้า
- เปลี่ยน: กลิมเปลี่ยนเป็นสีฟ้าใส มีเกล็ดน้ำแข็ง
- ความสามารถ: กดปุ่มโจมตี → ยิง ice bolt → ศัตรูถูกแช่แข็ง 3 วินาที (กลายเป็นแพลตฟอร์มชั่วคราว!)
- ระยะเวลา: 25 วินาที
- พบได้ใน: โลก 2 เป็นต้นไป
- พิเศษ: เดินบนน้ำได้ (สร้างน้ำแข็งใต้เท้า)
```

#### 💨 Wind Morph
```
- หยิบ: คริสตัลสีเขียวอ่อน
- เปลี่ยน: กลิมเปลี่ยนเป็นสีเขียวอ่อน มีลมวน
- ความสามารถ: กระโดดได้ 3 ครั้งในอากาศ (triple jump) + ร่อนได้ (glide)
- ร่อน: กดค้างกระโดดขณะตก → ตกช้า 60 px/sec + เลื่อนไปข้างหน้า
- ระยะเวลา: 20 วินาที
- พบได้ใน: โลก 2 เป็นต้นไป
```

### 8.3 Special Blocks

```
? Block (สีเหลืองมีเครื่องหมาย ?):
  - ชนจากด้านล่าง → กระเด้งออกไอเทมสุ่ม
  - ไอเทมที่ออก: เหรียญทอง(60%), เหรียญแดง(15%), Mushroom Heart(10%), Power-up(10%), 1UP(5%)
  - ใช้แล้วเปลี่ยนเป็นบล็อกว่าง (สีเทา)
  
Brick Block (สีน้ำตาล):
  - มี Fire Morph → ทำลายได้ด้วย fireball
  - ไม่มี → ชนจากด้านล่างไม่แตก
  
Invisible Block (มองไม่เห็น):
  - ชนจากด้านล่างถึงจะปรากฏ + ปล่อยไอเทม
  - ซ่อนไว้สำหรับนักสำรวจ (มักอยู่ในจุดที่ดูเหมือนตกเหวแน่ๆ)
  
Spring Block (สปริงสีชมพู):
  - กระโดดขึ้นมาบน → กระดอนสูง 2 เท่าของกระโดดปกติ
  - ใช้เข้าถึงจุดสูงที่กระโดดปกติไม่ถึง
```

---

## 9. การออกแบบด่าน (Level Design)

### 9.1 โครงสร้างด่าน

```
ขนาดแต่ละด่าน:
  - ความกว้าง: 3000 - 8000 px (แล้วแต่ด่าน)
  - ความสูง: 500 px (คงที่, จอเลื่อนแนวนอนเท่านั้น)

Tilemap:
  - Tile size: 16×16 px
  - Grid: 188-500 tiles กว้าง × 31 tiles สูง
  - Layer 1: Background (ฉากหลัง, ไม่มี collision)
  - Layer 2: Main (บล็อกเดิน/กำแพง, มี collision)
  - Layer 3: Foreground (ฉากหน้า ไม่มี collision, ให้ความลึก)
  - Layer 4: Entities (ศัตรู, ไอเทม, NPC, trigger zones)

Camera System:
  - ตามผู้เล่นแนวนอน (lerp 0.1 สำหรับความลื่นไหล)
  - จำกัดไม่ให้เลื่อนเกินขอบด่าน
  - เมื่อเข้า Boss Arena → ล็อกกล้อง
  - Dead Zone: กล้องไม่ขยับถ้าผู้เล่นอยู่ใกล้กลางจอ (±40px)
```

### 9.2 Level Design Principles (หลักการออกแบบ)

```
1. 📖 สอนผ่านการเล่น (Teach Through Play):
   - ด่าน 1-1: แนะนำการเดิน, กระโดด, เก็บเหรียญ (ไม่มีศัตรู)
   - ด่าน 1-2: แนะนำศัตรู Red Slime ตัวเดียว (เหยียบง่าย)
   - ด่าน 1-3: รวม mechanic + ? Block + เหว
   - ทุกด่าน: mechanic ใหม่แนะนำในสถานการณ์ปลอดภัยก่อน → ท้าทายทีหลัง

2. 🎢 จังหวะ (Pacing):
   - สลับช่วงตื่นเต้น (เหว, ศัตรูเยอะ) กับช่วงพัก (เก็บเหรียญ, ทิวทัศน์สวย)
   - ทุก 30-40 วินาทีของ gameplay ควรมีช่วงพักเล็กน้อย
   - ก่อนถึง Boss Room มีห้องเก็บไอเทมเล็กๆ (preparation room)
   
3. 🔍 รางวัลสำหรับนักสำรวจ:
   - ทุกด่านมีทางแยกลับ/ห้องลับอย่างน้อย 1 จุด
   - เบาะแส: กำแพงที่ดูผิดปกติ, เหรียญที่ลอยไปยังที่ลับ
   
4. 📈 ความยากที่เพิ่มขึ้นอย่างราบรื่น:
   - โลก 1: ง่าย (สอน mechanic พื้นฐาน)
   - โลก 2: ปานกลาง (ศัตรูหลากหลาย + platforming ยากขึ้น)
   - โลก 3: ยาก (พื้นลื่น + ศัตรูแข็ง + กับดัก)
   - โลก 4: ยากมาก (ทุก mechanic รวมกัน + กับดักซับซ้อน)
```

### 9.3 ด่านตัวอย่าง: 1-1 "จุดเริ่มต้น" (Tutorial Level)

```
ความกว้าง: 3200 px
Checkpoint: 1 อัน (กลางด่าน)
เหรียญทอง: 30
เหรียญแดง: 0
เหรียญโบราณ: 1 (ท้ายด่าน)
เพชรลับ: 1 (ห้องลับใต้ดิน)

Layout:
[START] → ทุ่งหญ้า (เก็บเหรียญ 5 เหรียญ)
        → แพลตฟอร์ม 3 ขั้น (สอนกระโดด) + เหรียญลอย
        → ? Block แรก (ได้ Mushroom Heart)
        → เหว เล็ก (ตกได้ไม่ตาย มีทางกลับขึ้น)
        → [CHECKPOINT]
        → กำแพงที่มีรอยแตก (ถ้าสำรวจ → ห้องลับมีเพชร + 1UP)
        → Red Slime ตัวแรก (พื้นกว้าง ตกไม่ได้ ปลอดภัย)
        → แพลตฟอร์มเคลื่อนที่ (moving platform จากซ้ายไปขวา)
        → ? Block 2 อัน (เหรียญ)
        → เหว กว้างขึ้น (ต้องกระโดดให้พอดี)
        → ประตูท้ายด่าน + เหรียญโบราณ
[END → ไปด่าน 1-2]
```

### 9.4 ด่านตัวอย่าง: 2-5 "พีระมิดแห่งความลับ" (Boss Level)

```
ความกว้าง: 5500 px
Checkpoint: 3 อัน
เหรียญทอง: 65
เหรียญแดง: 5 (ซ่อนในจุดยาก)
เหรียญโบราณ: 1 (หลังชนะ Sand Wyrm)
เพชรลับ: 1 (ห้องลับใต้พีระมิด)

Layout:
[START] → ทางเข้าพีระมิด (เสาหิน กำแพงหิน)
        → ด่านกับดัก: หนามที่ขึ้นลง + แพลตฟอร์มเคลื่อนที่
        → Sand Scorpion 2 ตัว + กับดักทราย
        → [CHECKPOINT 1]
        → ด่านภายในพีระมิด: ทางมืด (torch ส่องแสงเฉพาะจุด)
        → ปริศนา: ต้องกดปุ่ม 3 อันให้ถูกลำดับเพื่อเปิดประตู
        → Mini Mummy x3 + Bone Vulture x2
        → [CHECKPOINT 2]
        → ทางแยกลับ → ห้องลับใต้ดิน (เพชร + เหรียญ 20)
        → ด่านแพลตฟอร์มเคลื่อนที่เหนือเหวลาวา
        → ห้องเก็บไอเทม (Mushroom Heart + Fire Crystal)
        → [CHECKPOINT 3]
        → ประตูบอส → Boss Arena: Sand Wyrm
[END → ไปโลก 3]
```

---

## 10. ระบบ Progression

### 10.1 ปลดล็อกด่าน
```
- เริ่มต้น: เข้าได้แค่ด่าน 1-1
- ผ่านด่าน → ปลดล็อกด่านถัดไป
- ต้องเก็บเหรียญโบราณครบ 5 ของแต่ละโลก → ปลดล็อกโลกถัดไป
  - ป่า (5 เหรียญ) → ทะเลทราย (5) → น้ำแข็ง (5) → ปราสาท (5)
- ด่านที่ผ่านแล้วเล่นซ้ำได้ (สำหรับทำ speed run / เก็บของ)
```

### 10.2 Star Rating (ดาว 3 ดวง)
```
ทุกด่านให้คะแนนดาว 0-3:
  ⭐: ผ่านด่าน (จบได้)
  ⭐⭐: เก็บเหรียญทอง ≥ 80% + ไม่ตายเลย
  ⭐⭐⭐: เก็บเหรียญทอง 100% + เก็บเหรียญแดงครบ + จบภายในเวลาที่กำหนด
```

### 10.3 Speed Run Mode
```
- ปลดล็อกหลังผ่านเกมรอบแรก
- มีตัวจับเวลาที่มุมจอ
- Ghost System: ดูเงาตัวเองจากรอบที่ดีที่สุด
- Leaderboard: บันทึกเวลาที่ดีที่สุดของแต่ละด่าน
```

---

## 11. UI/UX Design

### 11.1 HUD (Head-Up Display) — ระหว่างเล่น

```
┌─────────────────────────────────────────────┐
│ ❤️❤️❤️    🪙 47   ⭐x3    ⏱️ 01:23         │  ← แถบบนสุด
│                                              │
│                                              │
│              [ GAME WORLD ]                  │
│                                              │
│                                              │
│                          (D-pad)  (A)(B)     │  ← Touch controls (mobile)
└──────────────────────────────────────────────┘

ซ้ายบน: HP (หัวใจ), ชีวิต (x3)
กลางบน: เหรียญทอง (จำนวน), เหรียญโบราณ (icon เล็ก)
ขวาบน: เวลา, ปุ่ม pause (⏸)

Mobile Touch Controls:
- ซ้ายล่าง: D-pad เสมือน (ซ้าย/ขวา)
- ขวาล่าง: ปุ่ม A (กระโดด), ปุ่ม B (โจมตี/dash)
- opacity: 50% เมื่อไม่กด, 80% เมื่อกด
```

### 11.2 หน้าจอทั้งหมด (Screens)

```
1. Title Screen:
   - โลโก้เกม (animated, สไลม์กระเด้ง)
   - ฉากหลัง: ป่าเขียวมรกตสวยงาม + parallax
   - ปุ่ม: "เริ่มเกม", "ต่อจากที่ค้างไว้", "ตั้งค่า"
   - BGM: Main Theme (เพลงสดใส)

2. World Map:
   - แผนที่ 2D แสดงทั้ง 4 โลก เชื่อมด้วยทางเดิน
   - ด่านที่ผ่านแล้ว = สีเต็ม, ด่านล็อก = สีเทา
   - แสดง Star Rating ของแต่ละด่าน
   - กลิมยืนที่ด่านปัจจุบัน (animate)

3. Level Loading:
   - แสดงชื่อด่าน + คำอธิบายสั้นๆ (1 ประโยค)
   - "ด่าน 1-1: จุดเริ่มต้น"
   - Loading bar (fake 1-2 วินาที)

4. Pause Menu:
   - overlay ทับ game (blur background)
   - ปุ่ม: "เล่นต่อ", "เริ่มด่านใหม่", "กลับแผนที่", "ตั้งค่า"

5. Level Complete:
   - แสดงผลสรุป: เหรียญที่เก็บ, เวลา, Star Rating
   - Fanfare animation + เสียง victory
   - ปุ่ม: "ด่านต่อไป", "เล่นซ้ำ", "กลับแผนที่"

6. Game Over:
   - "Game Over" ข้อความใหญ่ + animation หน้าจอมืด
   - แสดง: คะแนนที่ได้, เหรียญที่เก็บ
   - ปุ่ม: "ลองใหม่" (จากชีวิตที่เหลือ) / "กลับแผนที่"

7. Settings:
   - เสียง: BGM volume slider, SFX volume slider
   - กราฟิก: ลด particles (สำหรับเครื่องช้า)
   - ควบคุม: Keyboard layout, sensitivity
   - อื่นๆ: ภาษา, ลบ save data

8. Cutscene:
   - กล่องข้อความด้านล่างจอ + portrait ตัวละคร
   - ข้อความปรากฏทีละตัวอักษร (typewriter effect)
   - กดปุ่มเพื่อข้าม/เร่ง
```

### 11.3 Transitions & Animations

```
Screen Transition:
  - หน้าจอมืด: fade to black (0.3s) → fade in (0.3s)
  - ระหว่าง zone: iris wipe (วงกลมหดเข้า → ขยายออก) 

Pickup Animation:
  - เหรียญ: หมุน (8 frames), เมื่อเก็บ = ลอยขึ้น + fade out + "+10" text popup
  - Power-up: กระเด้งออกจาก ? Block → ลอยขึ้นช้าๆ → กลิมสัมผัส → flash สีขาว

HUD Animation:
  - HP ลด: หัวใจสั่น + flash สีแดง ก่อนหายไป
  - เหรียญเพิ่ม: counter เลื่อนตัวเลขขึ้น (rolling number)
  - combo multiplier: ตัวเลขใหญ่ขึ้น + bounce animation

Particle Effects:
  - กระโดดแตะพื้น: dust puff (4-6 particle)
  - ทำลายศัตรู: stars burst (8 particle, คนละสี)
  - เก็บเหรียญ: sparkle (3-4 particle สีทอง)
  - Fire Morph: flame trail (continuous particles)
  - Death: ตัวกลิม poof เป็นควัน (8 particle สีเขียว)
```

---

## 12. ระบบเสียง (Audio Design)

### 12.1 Background Music (BGM)

```
ทุกเพลงสร้างด้วย Web Audio API (procedural/synthesized):

1. Title Theme: 
   - อารมณ์: สดใส ตื่นเต้น ผจญภัย
   - BPM: 120, Key: C Major
   - เครื่องดนตรี: chiptune lead + pad + drum

2. Emerald Forest:
   - อารมณ์: ธรรมชาติ สงบ แต่มีชีวิตชีวา
   - BPM: 110, Key: G Major
   
3. Golden Desert:
   - อารมณ์: ลึกลับ ตะวันออกกลาง
   - BPM: 100, Key: D Minor
   - scale: Arabic/Phrygian

4. Frozen Sea:
   - อารมณ์: เย็น กว้างใหญ่ เงียบสงบ
   - BPM: 90, Key: A Minor
   - เครื่องดนตรี: celesta-like + ethereal pad

5. Shadow Castle:
   - อารมณ์: มืด ตึงเครียด อันตราย
   - BPM: 130, Key: E Minor

6. Boss Battle (ทั่วไป):
   - อารมณ์: ตื่นเต้น เร้าใจ epic
   - BPM: 150, Key: C Minor

7. Final Boss:
   - อารมณ์: epic สุดยอด, เปลี่ยนจังหวะตาม phase
   - BPM: 140→160→180

8. Victory:
   - อารมณ์: ฉลองชัยชนะ
   - BPM: 140, Key: C Major, ยาว 8 bars

9. Game Over:
   - อารมณ์: เศร้าเล็กน้อย
   - 4 bars, ช้าลง, descending melody
```

### 12.2 Sound Effects (SFX)

```
ทุกเสียงสร้างด้วย Web Audio API (oscillator + noise):

Movement:
  - jump: short sine sweep up (200→800Hz, 0.1s)
  - land: noise burst + low thud (0.05s)
  - walk: soft click at regular intervals
  - dash: whoosh (noise + high sine, 0.15s)
  - wall_slide: continuous soft scrape
  
Combat:
  - stomp: satisfying 'boing' + enemy_die combined (0.15s)
  - enemy_die: pop + sparkle (0.2s)
  - fireball_shoot: flame whoosh (0.1s)
  - fireball_hit: sizzle (0.15s)
  - ice_shoot: crystalline ping (0.1s)
  - ice_freeze: glass crack (0.2s)
  - player_hurt: yelp descending tone (0.2s) + screen shake
  - player_die: descending melody (0.5s)

Items:
  - coin_collect: high-pitched ding (C5→E5, 0.05s), pitch increases with combo
  - red_coin: special ding (arpeggio C-E-G, 0.15s)  
  - ancient_coin: majestic chord (0.5s) + sparkle sound
  - powerup_get: ascending arpeggio (0.3s) + shimmer
  - 1up: iconic ascending melody (0.4s)
  - morph_activate: transformation whoosh (0.3s) + power tone

UI:
  - menu_select: click (0.03s)
  - menu_confirm: confirm tone (0.1s)
  - menu_back: soft descend (0.08s)
  - pause: time-stop effect (0.2s)
  - checkpoint: flag sound + short fanfare (0.4s)
  - level_complete: victory fanfare (2s)

Boss:
  - boss_appear: ominous rumble (1s)
  - boss_hit: heavy impact + flash (0.2s)
  - boss_phase_change: dramatic chord + rumble (1.5s)
  - boss_die: explosion cascade (2s)
```

---

## 13. Art Style & Visual Design

### 13.1 สไตล์ภาพ

```
สไตล์: Pixel Art 16-bit (สไตล์ SNES era)
สี: สีสดใส, palette จำกัด 32 สีต่อ scene
ขนาด Tile: 16×16 px
ขนาด Character: 24×24 px (กลิม), 16-32 px (ศัตรู), 96-160 px (บอส)

Color Palette ต่อโลก:
- ป่า: เขียว, น้ำตาล, เหลืองอ่อน, ฟ้าอ่อน
- ทะเลทราย: ส้ม, เหลืองทอง, น้ำตาลเข้ม, ฟ้าสด
- น้ำแข็ง: ฟ้าอ่อน, ขาว, เทาอ่อน, ม่วงอ่อน
- ปราสาท: ม่วงเข้ม, ดำ, แดง, เทา
```

### 13.2 Tileset Design

```
แต่ละโลกมี tileset เฉพาะ:

Emerald Forest Tileset:
  - Ground: หญ้า (3 แบบ: ปกติ, ดอกไม้, หิน), ดินใต้หญ้า, หินแข็ง
  - Platform: ท่อนไม้, ใบไม้ใหญ่, เห็ดก้อน (one-way)
  - Background: ต้นไม้, พุ่มไม้, ดอกไม้, ท้องฟ้า, เมฆ
  - Hazard: หนามพุ่มไม้, หนามพื้น
  - Interactive: ? Block, Brick, Spring, ธง checkpoint
  - Decoration: ผีเสื้อ, นก, หิ่งห้อย (animated)

Golden Desert Tileset:
  - Ground: ทราย, หินทราย, กำแพงพีระมิด
  - Platform: เสาหิน, แท่นหิน (crumbling - พังหลังยืน 2 วิ)
  - Background: เนินทราย, พีระมิด, ดวงอาทิตย์, กระบองเพชร
  - Hazard: ทรายดูด, หนามหิน, ลาวา (ภายในพีระมิด)
  - Interactive: สวิตช์หิน, ประตูหิน
  
Frozen Sea Tileset:
  - Ground: น้ำแข็ง (ลื่น!), หิมะ, หินน้ำแข็ง
  - Platform: แท่นน้ำแข็ง (ลื่น), เสาน้ำแข็ง, icicle (ตกลงมาเมื่อเดินใต้)
  - Background: ภูเขาน้ำแข็ง, ท้องฟ้าสีม่วง, แสงเหนือ (animated)
  - Hazard: น้ำเย็นจัด (damage ถ้าตก), icicle spike
  
Shadow Castle Tileset:
  - Ground: อิฐปราสาท, โลหะ, เฟืองยักษ์ (animated หมุน)
  - Platform: แท่นหินมืด, chain platform (ห้อยโซ่แกว่ง)
  - Background: ท้องฟ้ามืด, ฟ้าผ่า, ปราสาทลอย
  - Hazard: ลาวา, หนามโลหะ, laser beam (เปิด-ปิด timing)
  - Interactive: lever, pressure plate, teleporter
```

### 13.3 Parallax Background (ฉากหลังเลื่อนหลายชั้น)

```
ทุกโลกมี 4 ชั้นของฉากหลัง:

Layer 1 (ไกลสุด): ท้องฟ้า/gradient — เลื่อน 5% ของ camera
Layer 2: ภูเขา/สิ่งก่อสร้างไกล — เลื่อน 15% ของ camera
Layer 3: ต้นไม้/อาคารกลาง — เลื่อน 40% ของ camera
Layer 4: ฉากหน้า (foreground) — เลื่อน 120% ของ camera (เร็วกว่าตัวละคร)

ผลลัพธ์: สร้างความลึกและอลังการของฉาก
```

---

## 14. สถาปัตยกรรมทางเทคนิค (Technical Architecture)

### 14.1 Game Loop

```javascript
// Core Game Loop (60 FPS)
function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap delta
  lastTime = timestamp;
  
  update(dt);       // logic + physics
  render();          // draw everything
  
  requestAnimationFrame(gameLoop);
}

// Update Order:
1. Input System (keyboard/touch state)
2. Player Update (movement, physics, collision, state machine)
3. Camera Update (follow player)
4. Enemy Update (AI, movement, collision)
5. Projectile Update (fireballs, enemy bullets)
6. Item Update (animation, pickup detection)
7. Particle Update (spawn, move, despawn)
8. HUD Update (HP, coins, timer)
9. Check Level Complete / Game Over conditions

// Render Order:
1. Clear canvas
2. Draw parallax backgrounds (4 layers)
3. Draw tilemap Layer 1 (background tiles)
4. Draw tilemap Layer 2 (main tiles)
5. Draw items & pickups
6. Draw enemies
7. Draw projectiles
8. Draw player
9. Draw particles
10. Draw tilemap Layer 3 (foreground tiles)
11. Draw HUD
12. Draw UI overlays (pause, dialog, etc.)
```

### 14.2 Entity Component System (ง่าย)

```javascript
// Base Entity
class Entity {
  x, y, w, h          // position & hitbox
  vx, vy              // velocity
  sprite              // current sprite/animation
  active              // alive or dead
  type                // 'player'|'enemy'|'item'|'projectile'|'trigger'
}

// Player extends Entity
class Player extends Entity {
  hp, maxHp, lives
  state               // IDLE | WALK | JUMP | FALL | HURT | DEAD
  morphState           // NONE | FIRE | ICE | WIND
  morphTimer
  invincibleTimer
  coyoteTimer
  jumpBufferTimer
  combo
  facingDir            // -1 | 1
}

// Enemy extends Entity
class Enemy extends Entity {
  hp, maxHp
  ai                   // PatrolAI | ChaseAI | FlyPatternAI | ...
  attackCooldown
  detectionRange
  scoreValue
  dropTable            // [{ item, chance }]
}

// Level Data
class Level {
  tilemap              // 2D array of tile IDs
  tilesetImage         // spritesheet for tiles
  entities             // [{ type, x, y, props }]
  bgLayers             // [{ image, scrollFactor }]
  checkpoints          // [{ x, y }]
  width, height
  timeLimit            // for 3-star rating
  coinTotal            // total coins in level
  metadata             // name, description, world
}
```

### 14.3 Resource Management

```javascript
// Asset Loader
const Assets = {
  images: {},    // all spritesheets, tilesets, backgrounds
  audio: {},     // all BGM & SFX (Web Audio buffers)
  levels: {},    // level JSON data
  
  async loadAll(progressCallback) {
    // Load in order:
    // 1. Core sprites (player, UI)
    // 2. Current world assets (tileset, enemies, bg)
    // 3. Audio (lazy load per world)
    // 4. Level data (JSON)
  }
};

// Sprite System
class SpriteSheet {
  image              // source image
  frameWidth, frameHeight
  animations         // { name: { frames: [col], row, duration, loop } }
  currentAnim
  currentFrame
  timer
  
  update(dt) { ... }
  draw(ctx, x, y, flipX) { ... }
}
```

---

## 15. โครงสร้างไฟล์ (File Structure)

```
Slime Bouncer/
├── index.html                 # Entry point
├── GAME-PLAN.md               # This document
├── css/
│   └── game.css               # Canvas styling, UI overlays, mobile controls
├── js/
│   ├── main.js                # Entry point, game loop, state manager
│   ├── input.js               # Keyboard & touch input handler
│   ├── renderer.js            # Canvas rendering, camera, parallax
│   ├── physics.js             # Gravity, collision detection, AABB
│   ├── player.js              # Player class, movement, morph system
│   ├── enemy.js               # Enemy base class + all enemy types
│   ├── boss.js                # Boss class + all boss types
│   ├── items.js               # Coins, power-ups, blocks
│   ├── particles.js           # Particle system
│   ├── level.js               # Level loader, tilemap renderer
│   ├── camera.js              # Camera follow, deadzone, bounds
│   ├── hud.js                 # HP, coins, timer, combo display
│   ├── audio.js               # Web Audio API: BGM + SFX generator
│   ├── ui.js                  # Menus, dialogs, transitions, cutscenes
│   ├── save.js                # localStorage save/load system
│   └── utils.js               # Math helpers, AABB, lerp, etc.
├── data/
│   ├── levels/
│   │   ├── world1/
│   │   │   ├── 1-1.json       # Level data (tilemap + entities)
│   │   │   ├── 1-2.json
│   │   │   ├── 1-3.json
│   │   │   ├── 1-4.json
│   │   │   └── 1-5.json
│   │   ├── world2/
│   │   │   ├── 2-1.json ... 2-5.json
│   │   ├── world3/
│   │   │   ├── 3-1.json ... 3-5.json
│   │   └── world4/
│   │       ├── 4-1.json ... 4-5.json
│   └── dialogues.json         # NPC/cutscene dialogue data
└── assets/
    ├── sprites/
    │   ├── glim.png            # Player spritesheet (all animations)
    │   ├── enemies_forest.png  # Forest enemy spritesheet
    │   ├── enemies_desert.png
    │   ├── enemies_ice.png
    │   ├── enemies_castle.png
    │   ├── bosses.png          # All boss spritesheets
    │   ├── items.png           # Coins, power-ups, blocks
    │   ├── particles.png       # Particle sprites
    │   └── npcs.png            # NPC portraits & sprites
    ├── tilesets/
    │   ├── forest.png
    │   ├── desert.png
    │   ├── ice.png
    │   └── castle.png
    ├── backgrounds/
    │   ├── forest_bg1.png ... forest_bg4.png
    │   ├── desert_bg1.png ... desert_bg4.png
    │   ├── ice_bg1.png ... ice_bg4.png
    │   └── castle_bg1.png ... castle_bg4.png
    └── ui/
        ├── title_logo.png
        ├── world_map.png
        ├── hud_icons.png
        └── buttons.png
```

---

## 16. Game States & Screen Flow

```
                    ┌─────────┐
                    │  BOOT   │ (โหลด assets)
                    └────┬────┘
                         ▼
                    ┌─────────┐
               ┌───→│  TITLE  │←──────────────┐
               │    └────┬────┘               │
               │         ▼                     │
               │    ┌──────────┐               │
               │    │ WORLD MAP│←──────┐       │
               │    └────┬─────┘       │       │
               │         ▼             │       │
               │    ┌───────────┐      │       │
               │    │LEVEL LOAD │      │       │
               │    └────┬──────┘      │       │
               │         ▼             │       │
               │    ┌──────────┐       │       │
               │    │ PLAYING  │───────┤       │
               │    └┬───┬───┬─┘       │       │
               │     │   │   │         │       │
               │     ▼   │   ▼         │       │
               │  ┌──────┐ ┌────────┐  │       │
               │  │PAUSE │ │CUTSCENE│  │       │
               │  └──┬───┘ └───┬────┘  │       │
               │     │         │       │       │
               │     ▼         ▼       │       │
               │  (resume)  (return)───┘       │
               │     │                         │
               │     ▼                         │
               │  ┌──────────────┐             │
               │  │LEVEL COMPLETE│─────────────┘
               │  └──────────────┘
               │
               │  ┌──────────┐
               └──│GAME OVER │
                  └──────────┘

State Machine Implementation:
  - GameState enum: BOOT, TITLE, WORLD_MAP, LEVEL_LOAD, PLAYING, PAUSED, CUTSCENE, LEVEL_COMPLETE, GAME_OVER, SETTINGS
  - แต่ละ state มี: enter(), update(dt), render(), exit()
  - Transition ระหว่าง state มี animation (fade/iris wipe)
```

---

## 17. ระบบคะแนนและ Leaderboard

```
Score Calculation Per Level:
  - เหรียญทอง: +10 each
  - เหรียญเงิน: +5 each
  - เหรียญแดง: +50 each
  - ทำลายศัตรู: ตามค่าคะแนนศัตรู (100-1000)
  - Bounce Combo: x2, x3, x4... multiplier
  - Time Bonus: max(0, (timeLimit - finishTime) * 100)
  - No Death Bonus: +5000 (ถ้าไม่ตายทั้งด่าน)
  - All Coins Bonus: +3000 (ถ้าเก็บเหรียญทองครบ)
  - Secret Found Bonus: +10000 (ถ้าเจอห้องลับ)

Leaderboard Storage (localStorage):
  {
    "slime_bouncer_scores": {
      "1-1": { "score": 45200, "time": 82.3, "stars": 3, "coins": 30, "secretFound": true },
      "1-2": { ... },
      ...
    },
    "slime_bouncer_global": {
      "totalScore": 1234567,
      "totalCoins": 890,
      "totalDeaths": 42,
      "totalPlayTime": 7200,
      "levelsCompleted": 18,
      "secretsFound": 15
    }
  }
```

---

## 18. การตั้งค่าและ Accessibility

```
Settings:
  - 🔊 BGM Volume: 0-100% (slider)
  - 🔊 SFX Volume: 0-100% (slider)
  - 🎮 Control Scheme: WASD / Arrow Keys / Custom
  - 📱 Touch Controls: Show/Hide, Size (S/M/L), Opacity
  - 🖼️ Particles: Full / Reduced / Off
  - 🖼️ Screen Shake: On / Off
  - ⏸️ Auto-Pause: On focus lost (yes/no)
  - 💾 Delete Save Data (with confirmation)
  
Accessibility:
  - High Contrast Mode: เส้นขอบหนาขึ้น, สีตัดกันมากขึ้น
  - Larger HUD: HUD ใหญ่ 1.5x
  - Invincibility Mode: โหมดไม่ตาย (สำหรับเพลิดเพลินกับเนื้อเรื่อง, ไม่นับคะแนน)
```

---

## 19. Performance & Optimization

```
Target: 60 FPS บน mid-range smartphone browser

Techniques:
  1. Offscreen Canvas: วาด tilemap ลงบน offscreen canvas ครั้งเดียว
     → แค่ drawImage ทั้งภาพเมื่อ scroll (ไม่ต้องวาดทีละ tile ทุกเฟรม)
     
  2. Object Pooling: ศัตรู, projectile, particle ใช้ pool
     → ไม่สร้าง new object ทุกเฟรม (ลด garbage collection)
     
  3. Spatial Hashing: ตรวจ collision เฉพาะ entity ที่อยู่ใกล้กัน
     → ไม่ต้องเช็ค entity ทุกตัวกับทุกตัว
     
  4. Culling: ไม่วาด entity ที่อยู่นอกจอ
     → เช็คว่า entity ซ้อนกับ camera viewport หรือไม่
     
  5. Asset Compression: sprite sheet ใช้ PNG quantized (8-bit)
     → ไฟล์เล็กลง 60-70%
     
  6. Lazy Loading: โหลด assets ตาม world ไม่โหลดทีเดียวทั้งหมด
  
  7. Web Audio Optimization: สร้าง SFX node ล่วงหน้า (pre-allocate)
     → ไม่สร้าง AudioNode ใหม่ทุกครั้งที่เล่นเสียง

Memory Budget:
  - Images: < 4 MB total
  - Audio: < 1 MB (procedural, no files)
  - Level Data: < 500 KB (JSON compressed)
  - Total: < 6 MB
```

---

## 20. Roadmap การพัฒนา

```
Phase 1 — Core Engine (สำคัญที่สุด):
  □ Canvas setup + game loop (60fps)
  □ Input system (keyboard + touch)
  □ Player movement (walk, jump, gravity, friction)
  □ Tilemap renderer + collision
  □ Camera system
  □ Basic HUD

Phase 2 — Gameplay:
  □ Enemy system (PatrolAI, death, stomp mechanic)
  □ Coin & item system
  □ ? Block, Spring, one-way platform
  □ Checkpoint & respawn
  □ Level complete condition

Phase 3 — Content World 1:
  □ Forest tileset + parallax backgrounds
  □ Forest enemies (Red Slime, Poison Shroom, Tiny Bat, Lurk Wolf)
  □ Level 1-1 to 1-4
  □ Boss: Thornback (Level 1-5)
  □ NPC: Elder Moss + dialogue system

Phase 4 — Polish (ทำให้เกมน่าเล่น):
  □ Particle system
  □ Screen transitions (fade, iris wipe)
  □ Death animation + game over screen
  □ Victory animation + level complete screen
  □ Score system + star rating

Phase 5 — Audio:
  □ BGM (Web Audio procedural music)
  □ SFX (all gameplay sounds)

Phase 6 — Content World 2-4:
  □ Desert world + enemies + boss
  □ Ice world + enemies + boss
  □ Castle world + enemies + Shadow King
  □ Morph system (Fire, Ice, Wind)
  □ All 20 levels

Phase 7 — Meta Features:
  □ World Map screen
  □ Title screen
  □ Save/Load system (localStorage)
  □ Settings menu
  □ Speed Run mode
  □ True Ending + secret rooms

Phase 8 — Final Polish:
  □ Cutscenes (opening, between worlds, ending)
  □ Mobile optimization
  □ Performance testing
  □ Bug fixing
  □ Balance tuning (enemy HP, coin counts, difficulty curve)
```

---

> **หมายเหตุ**: เอกสารนี้คือ "แผนแม่บท" สำหรับการพัฒนาเกม Slime Bouncer ทั้งหมด ทุกรายละเอียดสามารถปรับเปลี่ยนได้ระหว่างการพัฒนาจริง แต่โครงสร้างหลักควรยึดตามนี้เพื่อให้เกมออกมามีคุณภาพระดับสูง
