---
title: 首页
slug: index
description: Halavah's Tech - 探索前沿技术,提升开发效率
layout: default
---

<!-- Hero Section - Full Width -->
<section class="hero-section">
  <div class="hero-container">
    <h1 class="hero-title">{{site.heroTitle}}</h1>
    <p class="hero-description">{{site.description}}</p>
  </div>
</section>

<div class="home-container">
  <!-- Category Filter -->
  <div class="category-filter" id="categoryFilter">
    <div class="loading">加载中...</div>
  </div>

  <!-- View Mode Toggle and Article Count -->
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; padding: 0 1.5rem; max-width: 1280px; margin-left: auto; margin-right: auto;">
    <div style="font-size: 0.875rem; color: var(--text-secondary);" id="articleCount">
      加载中...
    </div>
    <div style="display: flex; align-items: center; gap: 0.5rem; border-radius: 0.5rem; border: 1px solid var(--border-color); background: var(--card-bg);">
      <button id="tableViewBtn" class="view-mode-btn active" title="网格视图">
        <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      <button id="listViewBtn" class="view-mode-btn" title="列表视图">
        <svg style="width: 1.25rem; height: 1.25rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Articles List -->
  <div class="articles-list" id="articlesList">
    <div class="loading">加载中...</div>
  </div>

  <!-- Pagination -->
  <div class="pagination-container" id="pagination"></div>
</div>
