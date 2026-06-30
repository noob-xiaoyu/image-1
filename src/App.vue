<template>
  <div>
    <!-- Loader -->
    <div v-if="loading" class="loader">
      <div class="loader-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="empty">
      <div class="empty-icon">📡</div>
      <p>无法加载图片数据，请检查网络后刷新。</p>
    </div>

    <template v-else>
      <AppHeader
        :categories="manifest.categories"
        :total-count="manifest.count"
        :current-category="currentCategory"
        @update:category="switchCategory"
        @random="randomImage"
      />

      <main class="main">
        <GalleryGrid
          ref="gridRef"
          :images="filteredImages"
          @open-lightbox="openLightbox"
        />
      </main>

      <AppFooter />

      <Lightbox
        :image="currentImage"
        :visible="lightboxOpen"
        @close="closeLightbox"
        @navigate="navigate"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import AppHeader from './components/AppHeader.vue';
import GalleryGrid from './components/GalleryGrid.vue';
import Lightbox from './components/Lightbox.vue';
import AppFooter from './components/AppFooter.vue';

const manifest = ref({ categories: {}, count: 0, images: [] });
const loading = ref(true);
const error = ref(false);
const currentCategory = ref('all');
const currentImage = ref(null);
const lightboxOpen = ref(false);
const gridRef = ref(null);

// ── 筛选图片 ──────────────────────
const filteredImages = computed(() => {
  if (currentCategory.value === 'all') return manifest.value.images;
  return manifest.value.images.filter((img) => img.category === currentCategory.value);
});

// ── 获取数据 ──────────────────────
async function fetchManifest() {
  try {
    const resp = await fetch('manifest.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    manifest.value = await resp.json();
  } catch (err) {
    console.error('Failed to load manifest:', err);
    error.value = true;
  } finally {
    loading.value = false;
  }
}

// ── 分类切换 ──────────────────────
function switchCategory(category) {
  currentCategory.value = category;
}

// ── 随机壁纸 ──────────────────────
function randomImage() {
  if (!filteredImages.value.length) return;
  const random = filteredImages.value[Math.floor(Math.random() * filteredImages.value.length)];
  openLightbox(random);

  // 高亮卡片
  requestAnimationFrame(() => {
    const card = document.querySelector(`[data-id="${random.id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.boxShadow = '0 0 0 3px var(--accent)';
      setTimeout(() => (card.style.boxShadow = ''), 1500);
    }
  });
}

// ── 灯箱 ─────────────────────────
function openLightbox(image) {
  if (!image) return;
  currentImage.value = image;
  lightboxOpen.value = true;
  window.location.hash = image.id;
}

function closeLightbox() {
  lightboxOpen.value = false;
  currentImage.value = null;
  history.pushState(null, '', window.location.pathname);
}

function navigate(direction) {
  if (!currentImage.value || !filteredImages.value.length) return;
  const idx = filteredImages.value.findIndex((img) => img.id === currentImage.value.id);
  const newIdx = (idx + direction + filteredImages.value.length) % filteredImages.value.length;
  openLightbox(filteredImages.value[newIdx]);
}

// ── Hash 路由 ─────────────────────
function handleHashChange() {
  const hash = window.location.hash.slice(1);
  if (!hash) {
    if (lightboxOpen.value) closeLightbox();
    return;
  }
  const img = manifest.value.images.find((i) => i.id === hash);
  if (img) openLightbox(img);
}

function handleInitialHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  const img = manifest.value.images.find((i) => i.id === hash);
  if (img) {
    currentCategory.value = img.category;
    // 等待 DOM 渲染完再打开灯箱
    setTimeout(() => openLightbox(img), 300);
  }
}

// ── 生命周期 ──────────────────────
onMounted(async () => {
  await fetchManifest();
  if (!error.value) {
    handleInitialHash();
  }
});

// 监听 hash 变化
watch(
  () => window.location.hash,
  () => handleHashChange()
);

window.addEventListener('hashchange', handleHashChange);
</script>

<style scoped>
.main {
  max-width: var(--max-width);
  margin: 0 auto;
  padding: 20px 24px 40px;
}

/* ── Loader ──────────────────────────── */
.loader {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
  color: var(--text-muted);
  font-size: 1rem;
  gap: 10px;
}

.loader-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Empty State ──────────────────────── */
.empty {
  text-align: center;
  padding: 80px 20px;
  color: var(--text-muted);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
}

/* ── Responsive ───────────────────────── */
@media (max-width: 768px) {
  .main {
    padding: 12px 8px 24px;
  }
}
</style>
