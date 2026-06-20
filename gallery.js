/**
 * gallery.js — 图库画廊 + 随机壁纸
 * 零依赖，纯 vanilla JS
 */

class Gallery {
  constructor() {
    this.manifest = null;
    this.currentCategory = 'all';
    this.currentImage = null;   // 灯箱中当前图片
    this.filteredImages = [];   // 当前分类下的图片列表（用于灯箱导航）
    this.observer = null;       // IntersectionObserver for lazy loading
    this.gridEl = document.getElementById('gallery-grid');
    this.tabsEl = document.getElementById('tabs');
    this.loaderEl = document.getElementById('loader');
    this.lightboxEl = document.getElementById('lightbox');
    this.countEl = document.getElementById('count-text');
  }

  async init() {
    try {
      this.manifest = await this.fetchManifest();
    } catch (err) {
      this.gridEl.innerHTML = `<div class="empty">
        <div class="empty-icon">📡</div>
        <p>无法加载图片数据，请检查网络后刷新。</p>
      </div>`;
      console.error('Failed to load manifest:', err);
      return;
    }

    this.renderTabs();
    this.renderGrid();
    this.setupLightbox();
    this.setupKeyboard();
    this.setupHashRoute();

    // 页面加载时检查 URL hash
    this.handleInitialHash();
  }

  async fetchManifest() {
    const resp = await fetch('manifest.json');
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return resp.json();
  }

  // ── 分类标签 ──────────────────────────────────
  renderTabs() {
    const categories = this.manifest.categories;
    const tabs = [
      { id: 'all', name: '全部', count: this.manifest.count },
      { id: 'pc', name: categories.pc.name, count: categories.pc.count },
      { id: 'phone', name: categories.phone.name, count: categories.phone.count },
    ];

    this.tabsEl.innerHTML = tabs
      .map(
        (t) =>
          `<button class="tab${t.id === 'all' ? ' active' : ''}" data-category="${t.id}">
            ${t.name} (${t.count})
          </button>`
      )
      .join('');

    this.tabsEl.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      this.currentCategory = tab.dataset.category;
      this.tabsEl.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      this.renderGrid();
    });
  }

  // ── 网格渲染 ──────────────────────────────────
  renderGrid() {
    // 筛选
    if (this.currentCategory === 'all') {
      this.filteredImages = [...this.manifest.images];
    } else {
      this.filteredImages = this.manifest.images.filter(
        (img) => img.category === this.currentCategory
      );
    }

    // 更新计数
    this.countEl.textContent = `${this.filteredImages.length} 张`;

    // 断开旧的 observer
    if (this.observer) this.observer.disconnect();

    // 渲染卡片
    this.gridEl.innerHTML = '';
    const frag = document.createDocumentFragment();

    for (const img of this.filteredImages) {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.id = img.id;
      card.innerHTML = `
        <img
          class="card-img"
          data-src="${img.url}"
          alt="${img.filename}"
          style="aspect-ratio: ${img.width}/${img.height}"
          loading="lazy"
        >
        <div class="card-overlay">
          <span class="card-badge ${img.category}">${img.category}</span>
          <span class="card-name">${img.filename}</span>
        </div>
      `;
      card.addEventListener('click', () => this.openLightbox(img));

      frag.appendChild(card);
    }

    this.gridEl.appendChild(frag);

    // 懒加载 observer
    this.setupLazyLoading();
  }

  // ── 懒加载 ────────────────────────────────────
  setupLazyLoading() {
    const imgObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const img = entry.target;
          const src = img.dataset.src;
          if (!src) continue;

          // 加载图片
          img.src = src;
          img.removeAttribute('data-src');
          imgObserver.unobserve(img);

          // 加载完成后移除骨架动画
          img.onload = () => img.classList.remove('skeleton');
        }
      },
      {
        rootMargin: '200px',
      }
    );

    this.gridEl.querySelectorAll('img[data-src]').forEach((img) => {
      img.classList.add('skeleton');
      imgObserver.observe(img);
    });

    this.observer = imgObserver;
  }

  // ── 随机壁纸 ──────────────────────────────────
  randomImage() {
    if (!this.filteredImages.length) return;
    const random = this.filteredImages[Math.floor(Math.random() * this.filteredImages.length)];
    this.openLightbox(random);

    // 给一个视觉反馈：滚动到该卡片
    const card = this.gridEl.querySelector(`[data-id="${random.id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.style.boxShadow = '0 0 0 3px var(--accent)';
      setTimeout(() => (card.style.boxShadow = ''), 1500);
    }
  }

  // ── 灯箱 ──────────────────────────────────────
  setupLightbox() {
    // 关闭
    this.lightboxEl.querySelector('.lightbox-close').addEventListener('click', () => {
      this.closeLightbox();
    });
    // 点击背景关闭
    this.lightboxEl.addEventListener('click', (e) => {
      if (e.target === this.lightboxEl) this.closeLightbox();
    });

    // 导航
    this.lightboxEl.querySelector('.prev').addEventListener('click', () => this.navigate(-1));
    this.lightboxEl.querySelector('.next').addEventListener('click', () => this.navigate(1));

    // 随机按钮
    document.getElementById('btn-random').addEventListener('click', () => this.randomImage());
  }

  openLightbox(image) {
    if (!image) return;

    this.currentImage = image;
    window.location.hash = image.id;

    const lightboxImg = this.lightboxEl.querySelector('.lightbox-img');
    const infoEl = this.lightboxEl.querySelector('.lightbox-info');

    // 显示加载中
    lightboxImg.src = '';
    lightboxImg.alt = image.filename;

    // 加载大图
    const fullImg = new Image();
    fullImg.onload = () => {
      lightboxImg.src = image.url;
    };
    fullImg.src = image.url;

    // 信息栏
    const sizeStr = image.fileSize
      ? `${(image.fileSize / 1024).toFixed(0)} KB`
      : '';
    infoEl.innerHTML = `
      <span class="card-badge ${image.category}">${image.category}</span>
      <span>${image.filename}</span>
      <span>${image.width}×${image.height}</span>
      <span>${sizeStr}</span>
      <a href="${image.url}" download>⬇ 下载</a>
    `;

    this.lightboxEl.classList.add('open');
    document.body.style.overflow = 'hidden';

    // 预加载相邻图片
    this.preloadAdjacent(image);
  }

  closeLightbox() {
    this.lightboxEl.classList.remove('open');
    document.body.style.overflow = '';
    history.pushState(null, '', window.location.pathname);
    this.currentImage = null;
  }

  navigate(direction) {
    if (!this.currentImage || !this.filteredImages.length) return;
    const idx = this.filteredImages.findIndex((img) => img.id === this.currentImage.id);
    const newIdx = (idx + direction + this.filteredImages.length) % this.filteredImages.length;
    this.openLightbox(this.filteredImages[newIdx]);
  }

  preloadAdjacent(image) {
    const idx = this.filteredImages.findIndex((img) => img.id === image.id);
    const adjacent = [
      this.filteredImages[(idx + 1) % this.filteredImages.length],
      this.filteredImages[(idx - 1 + this.filteredImages.length) % this.filteredImages.length],
    ];
    for (const img of adjacent) {
      if (!img || document.querySelector(`link[href="${img.url}"]`)) continue;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img.url;
      document.head.appendChild(link);
    }
  }

  // ── 键盘 ──────────────────────────────────────
  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      if (!this.lightboxEl.classList.contains('open')) return;
      switch (e.key) {
        case 'Escape':
          this.closeLightbox();
          break;
        case 'ArrowLeft':
          this.navigate(-1);
          break;
        case 'ArrowRight':
          this.navigate(1);
          break;
      }
    });
  }

  // ── URL Hash 路由 ─────────────────────────────
  setupHashRoute() {
    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  handleInitialHash() {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const img = this.manifest.images.find((i) => i.id === hash);
    if (img) {
      // 切换到对应分类
      this.currentCategory = img.category;
      this.tabsEl.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
      const tab = this.tabsEl.querySelector(`[data-category="${img.category}"]`);
      if (tab) tab.classList.add('active');
      this.renderGrid();
      // 延迟打开灯箱，等 DOM 渲染完
      setTimeout(() => this.openLightbox(img), 300);
    }
  }

  handleHashChange() {
    const hash = window.location.hash.slice(1);
    if (!hash) {
      if (this.lightboxEl.classList.contains('open')) {
        this.closeLightbox();
      }
      return;
    }
    const img = this.manifest.images.find((i) => i.id === hash);
    if (img) {
      this.openLightbox(img);
    }
  }
}

// ── 启动 ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  new Gallery().init();
});
