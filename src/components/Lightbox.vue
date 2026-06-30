<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="lightbox open"
      role="dialog"
      aria-label="图片查看器"
      @click.self="$emit('close')"
    >
      <button class="lightbox-close" aria-label="关闭" @click="$emit('close')">✕</button>
      <button class="lightbox-nav prev" aria-label="上一张" @click="$emit('navigate', -1)">‹</button>
      <button class="lightbox-nav next" aria-label="下一张" @click="$emit('navigate', 1)">›</button>
      <div class="lightbox-img-wrap">
        <img class="lightbox-img" :src="image?.url" :alt="image?.filename">
      </div>
      <div class="lightbox-info" v-if="image">
        <span class="card-badge" :class="image.category">{{ image.category }}</span>
        <span>{{ image.filename }}</span>
        <span>{{ image.width }}×{{ image.height }}</span>
        <span v-if="image.fileSize">{{ (image.fileSize / 1024).toFixed(0) }} KB</span>
        <a :href="image.url" download>⬇ 下载</a>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { watch, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  image: { type: Object, default: null },
  visible: { type: Boolean, default: false },
});

const emit = defineEmits(['close', 'navigate']);

function onKeydown(e) {
  if (!props.visible) return;
  switch (e.key) {
    case 'Escape':
      emit('close');
      break;
    case 'ArrowLeft':
      emit('navigate', -1);
      break;
    case 'ArrowRight':
      emit('navigate', 1);
      break;
  }
}

// 灯箱打开时禁止 body 滚动
watch(() => props.visible, (val) => {
  document.body.style.overflow = val ? 'hidden' : '';
});

onMounted(() => {
  document.addEventListener('keydown', onKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>

<style scoped>
.lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
}

.lightbox-img-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 90vw;
  max-height: 88vh;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 4px 60px rgba(0, 0, 0, 0.6);
}

/* ── Controls ────────────────────────────── */
.lightbox-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 1.4rem;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  z-index: 10;
}

.lightbox-close:hover {
  background: var(--danger);
}

.lightbox-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 80px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 1.8rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.2);
}

.lightbox-nav.prev {
  left: 16px;
}

.lightbox-nav.next {
  right: 16px;
}

.lightbox-info {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 12px;
}

.lightbox-info a {
  color: var(--accent-hover);
  font-weight: 600;
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

/* ── Responsive ──────────────────────────── */
@media (max-width: 768px) {
  .lightbox-nav {
    width: 36px;
    height: 60px;
    font-size: 1.4rem;
  }
  .lightbox-nav.prev { left: 4px; }
  .lightbox-nav.next { right: 4px; }
  .lightbox-close {
    top: 8px;
    right: 8px;
    width: 34px;
    height: 34px;
  }
}
</style>
