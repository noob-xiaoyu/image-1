/**
 * scan.js — 扫描 bg/ 目录，生成 manifest.json 和 api/*.json
 * 零依赖，纯 Node.js 标准库
 * 用法: node scripts/scan.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BG_DIR = path.join(ROOT, 'bg');
const API_DIR = path.join(ROOT, 'api');

// GitHub Pages 部署后的绝对路径前缀
const BASE_URL = 'https://noob-xiaoyu.github.io/image-1';

// ── JPEG 尺寸解析 ──────────────────────────────────
// 读取 JPEG 文件头，找到 SOF0/SOF2 marker 获取宽高
function getJpegSize(buffer) {
  if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) return null; // 不是 JPEG

  let offset = 2;
  while (offset < buffer.length - 1) {
    if (buffer[offset] !== 0xFF) return null;
    const marker = buffer[offset + 1];
    // SOF0 (0xC0) 或 SOF2 (0xC2)
    if (marker === 0xC0 || marker === 0xC2) {
      // SOF 段: [0xFF, marker, length(2), precision(1), height(2), width(2), ...]
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    // 跳过 marker 和长度字段
    if (marker === 0xD8 || marker === 0xD9) {
      offset += 2;
    } else {
      const length = buffer.readUInt16BE(offset + 2);
      offset += 2 + length;
    }
  }
  return null;
}

// ── PNG 尺寸解析 ────────────────────────────────────
// PNG header: 8 bytes signature, then IHDR chunk
function getPngSize(buffer) {
  if (buffer.toString('hex', 0, 8) !== '89504e470d0a1a0a') return null; // 不是 PNG
  // IHDR 在固定的位置: 签名后第一个 chunk
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

// ── 主扫描函数 ─────────────────────────────────────
function getImageSize(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  // 只读前 64KB — 足够覆盖 JPEG/PNG 的头信息
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(64 * 1024);
  fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);

  if (ext === '.jpg' || ext === '.jpeg') return getJpegSize(buffer);
  if (ext === '.png') return getPngSize(buffer);
  return null;
}

function scanCategory(category) {
  const dir = path.join(BG_DIR, category);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir);
  const images = [];
  let idCounter = 0;

  for (const filename of files) {
    const ext = path.extname(filename).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;

    idCounter++;
    const filePath = path.join(dir, filename);
    const stat = fs.statSync(filePath);
    const size = getImageSize(filePath);
    const stem = path.parse(filename).name;

    images.push({
      id: `${category}-${idCounter}`,
      category: category,
      filename: filename,
      url: `bg/${category}/${filename}`,
      absoluteUrl: `${BASE_URL}/bg/${category}/${filename}`,
      width: size ? size.width : 0,
      height: size ? size.height : 0,
      format: ext === '.png' ? 'png' : 'jpg',
      fileSize: stat.size,
    });
  }

  return images;
}

// ── 执行扫描 ───────────────────────────────────────
const pcImages = scanCategory('pc');
const phoneImages = scanCategory('phone');
const allImages = [...pcImages, ...phoneImages];

// 构建 manifest
const manifest = {
  name: 'image-1 - Pixiv Wallpapers',
  description: 'PC 和手机壁纸图库，图片来自 Pixiv',
  updated: new Date().toISOString().slice(0, 10),
  count: allImages.length,
  categories: {
    pc: { name: 'PC 壁纸', count: pcImages.length },
    phone: { name: '手机壁纸', count: phoneImages.length },
  },
  images: allImages,
};

// 确保 api/ 目录存在
if (!fs.existsSync(API_DIR)) {
  fs.mkdirSync(API_DIR, { recursive: true });
}

// 写入 manifest.json (根目录 — 主 API)
fs.writeFileSync(
  path.join(ROOT, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf-8'
);
console.log(`✓ manifest.json — ${allImages.length} 张图片`);

// 写入 api/pc.json
const pcManifest = {
  ...manifest,
  count: pcImages.length,
  categories: { pc: manifest.categories.pc },
  images: pcImages,
};
fs.writeFileSync(
  path.join(API_DIR, 'pc.json'),
  JSON.stringify(pcManifest, null, 2),
  'utf-8'
);
console.log(`✓ api/pc.json — ${pcImages.length} 张 PC 壁纸`);

// 写入 api/phone.json
const phoneManifest = {
  ...manifest,
  count: phoneImages.length,
  categories: { phone: manifest.categories.phone },
  images: phoneImages,
};
fs.writeFileSync(
  path.join(API_DIR, 'phone.json'),
  JSON.stringify(phoneManifest, null, 2),
  'utf-8'
);
console.log(`✓ api/phone.json — ${phoneImages.length} 张手机壁纸`);

// 写入纯文本 API（每行一个绝对 URL，供 Halo 等主题使用）
const pcTxt = pcImages.map((img) => img.absoluteUrl).join('\n') + '\n';
fs.writeFileSync(path.join(API_DIR, 'pc.txt'), pcTxt, 'utf-8');
console.log(`✓ api/pc.txt — ${pcImages.length} 个绝对 URL`);

const phoneTxt = phoneImages.map((img) => img.absoluteUrl).join('\n') + '\n';
fs.writeFileSync(path.join(API_DIR, 'phone.txt'), phoneTxt, 'utf-8');
console.log(`✓ api/phone.txt — ${phoneImages.length} 个绝对 URL`);

// 写入全部图片的 txt（供需要全部图片的场景）
const allTxt = allImages.map((img) => img.absoluteUrl).join('\n') + '\n';
fs.writeFileSync(path.join(API_DIR, 'all.txt'), allTxt, 'utf-8');
console.log(`✓ api/all.txt — ${allImages.length} 个绝对 URL`);

console.log('\nDone! 运行完毕。');
