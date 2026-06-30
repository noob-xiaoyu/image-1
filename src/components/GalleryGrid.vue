<template>
  <div>
    <div class="gallery-grid">
      <div
        v-for="img in images"
        :key="img.id"
        :ref="(el) => setCardRef(img.id, el)"
        class="card"
        :data-id="img.id"
        @click="$emit('open-lightbox', img)"
      >
        <img
          class="card-img skeleton"
          :data-src="img.url"
          :alt="img.filename"
          :style="{ aspectRatio: img.width + '/' + img.height }"
        >
        <div class="card-overlay">
          <span class="card-badge" :class="img.category">{{ img.category }}</span>
          <span class="card-name">{{ img.filename }}</span>
        </div>
      </div>
    </div>
    <p class="count-bar">
      共 <span>{{ images.length }}</span> 张 | 图片来自 Pixiv
    </p>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue';

const props = defineProps({
  images: { type: Array, default: () => [] },
});

defineEmits(['open-lightbox']);

const cardRefs = {};
let observer = null;

function setCardRef(id, el) {
  if (el) {
    cardRefs[id] = el;
  }
}

function setupObserver() {
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const img = entry.target.querySelector('img[data-src]');
        if (!img) continue;
        const src = img.dataset.src;
        if (!src) continue;

        img.src = src;
        img.removeAttribute('data-src');
        observer.unobserve(entry.target);

        img.onload = () => img.classList.remove('skeleton');
      }
    },
    { rootMargin: '200px' }
  );

  // 等待 DOM 更新后观察所有卡片
  requestAnimationFrame(() => {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => observer.observe(card));
  });
}

// 当 images 变化时重新设置 observer
watch(() => props.images, () => {
  requestAnimationFrame(() => setupObserver());
}, { deep: false });

onMounted(() => {
  setupObserver();
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
});

// 暴露 cardRefs 给父组件（用于随机时高亮卡片）
defineExpose({ cardRefs });
</script>

<style scoped>
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--grid-gap);
}

.count-bar {
  text-align: center;
  padding: 16px;
  color: var(--text-muted);
  font-size: 0.85rem;
}

/* ── Card ────────────────────────────────── */
.card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius);
  background: var(--surface);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid var(--border);
}

.card:hover {
  transform: scale(1.025);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  border-color: var(--accent);
}

.card-img {
  width: 100%;
  height: auto;
  display: block;
  background: var(--surface-hover);
}

.card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 10px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card:hover .card-overlay {
  opacity: 1;
}

.card-badge {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.card-badge.pc {
  background: var(--accent);
}

.card-badge.phone {
  background: #3fb950;
}

.card-name {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.9);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Skeleton ────────────────────────────── */
:deep(.skeleton) {
  background: linear-gradient(
    90deg,
    var(--surface) 25%,
    var(--surface-hover) 50%,
    var(--surface) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Responsive ──────────────────────────── */
@media (max-width: 768px) {
  .gallery-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
}
</style>
