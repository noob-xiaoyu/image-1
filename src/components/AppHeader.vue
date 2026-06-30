<template>
  <header class="header">
    <div class="header-title">
      <span class="icon">🖼️</span>
      <span>图库 Gallery</span>
    </div>
    <div class="header-right">
      <div class="tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab"
          :class="{ active: tab.id === currentCategory }"
          @click="$emit('update:category', tab.id)"
        >
          {{ tab.name }} ({{ tab.count }})
        </button>
      </div>
      <button class="btn-random" title="随机一张壁纸" @click="$emit('random')">
        🎲 随机
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  categories: { type: Object, required: true },
  totalCount: { type: Number, default: 0 },
  currentCategory: { type: String, default: 'all' },
});

defineEmits(['update:category', 'random']);

const tabs = computed(() => [
  { id: 'all', name: '全部', count: props.totalCount },
  { id: 'pc', name: props.categories.pc?.name || 'PC 壁纸', count: props.categories.pc?.count || 0 },
  { id: 'phone', name: props.categories.phone?.name || '手机壁纸', count: props.categories.phone?.count || 0 },
]);
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(13, 17, 23, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  height: var(--header-h);
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
}

.header-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title .icon {
  font-size: 1.4rem;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-wrap: wrap;
}

/* ── Tabs ──────────────────────────────── */
.tabs {
  display: flex;
  gap: 4px;
  background: var(--surface);
  border-radius: var(--radius);
  padding: 3px;
}

.tab {
  padding: 6px 14px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
  white-space: nowrap;
  font-family: inherit;
}

.tab:hover {
  color: var(--text);
  background: var(--surface-hover);
}

.tab.active {
  background: var(--accent);
  color: #fff;
  font-weight: 600;
}

/* ── Random Button ──────────────────────── */
.btn-random {
  padding: 6px 16px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: var(--radius);
  transition: all 0.15s;
  font-family: inherit;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-random:hover {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

/* ── Responsive ─────────────────────────── */
@media (max-width: 768px) {
  .header {
    padding: 0 12px;
    gap: 8px;
    height: auto;
    flex-wrap: wrap;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .header-title {
    font-size: 1rem;
  }

  .tab {
    padding: 5px 10px;
    font-size: 0.78rem;
  }

  .btn-random {
    padding: 5px 12px;
    font-size: 0.78rem;
  }
}

@media (max-width: 480px) {
  .header-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
