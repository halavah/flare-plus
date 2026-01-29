/**
 * Halavah's Tech - Main JavaScript
 */

// Global State
const state = {
  isDarkMode: true,
  isMobileNavOpen: false,
  articles: [],
  filteredArticles: [],
  activeCategory: 'all',
  searchQuery: '',
  currentPage: 1,
  itemsPerPage: 6,
  viewMode: 'table', // 'table' or 'list'
  observers: new Set()
};

// DOM Elements
const elements = {
  body: null,
  themeToggle: null,
  mobileMenuToggle: null,
  searchButton: null,
  searchModal: null,
  searchEscButton: null,
  searchInput: null,
  banner: null,
  bannerClose: null,
  articlesList: null,
  searchInputHome: null,
  searchResults: null,
  categoryFilter: null,
  pagination: null,
  tableViewBtn: null,
  listViewBtn: null,
  articleCount: null
};

/**
 * Initialize the application
 */
function init() {
  cacheElements();
  setupEventListeners();
  initializeTheme();
  initializeMobileNav();
  initializeSearch();
  initializeBanner();
  initializeCodeCopyButtons();

  // Initialize homepage features
  if (isHomePage()) {
    loadArticles();
    initializeHomeSearch();
    initializeViewModeToggle();
  }

  console.log('🚀 Halavah\'s Tech initialized successfully!');
}

/**
 * Check if current page is homepage
 */
function isHomePage() {
  return document.querySelector('.home-container');
}

/**
 * Cache DOM elements for better performance
 */
function cacheElements() {
  elements.body = document.body;
  elements.themeToggle = document.getElementById('themeToggle');
  elements.mobileMenuToggle = document.getElementById('mobileMenuToggle');
  elements.searchButton = document.getElementById('searchButton');
  elements.searchModal = document.getElementById('searchModal');
  elements.searchEscButton = document.getElementById('searchEscButton');
  elements.searchInput = document.getElementById('searchInput');
  elements.banner = document.getElementById('banner');
  elements.bannerClose = document.getElementById('bannerClose');
  elements.articlesList = document.getElementById('articlesList');
  elements.searchInputHome = document.getElementById('searchInput');
  elements.searchResults = document.getElementById('searchResults');
  elements.categoryFilter = document.getElementById('categoryFilter');
  elements.pagination = document.getElementById('pagination');
  elements.tableViewBtn = document.getElementById('tableViewBtn');
  elements.listViewBtn = document.getElementById('listViewBtn');
  elements.articleCount = document.getElementById('articleCount');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Theme toggle
  if (elements.themeToggle) {
    elements.themeToggle.addEventListener('click', toggleTheme);
  }

  // Mobile menu
  if (elements.mobileMenuToggle) {
    elements.mobileMenuToggle.addEventListener('click', toggleMobileNav);
  }

  // Search functionality
  if (elements.searchButton) {
    elements.searchButton.addEventListener('click', openSearch);
  }
  if (elements.searchEscButton) {
    elements.searchEscButton.addEventListener('click', closeSearch);
  }
  if (elements.searchModal) {
    elements.searchModal.addEventListener('click', (e) => {
      // Close if clicking on backdrop or searchModal itself
      if (e.target === elements.searchModal || e.target.classList.contains('search-backdrop')) {
        closeSearch();
      }
    });
  }

  // Banner close
  if (elements.bannerClose) {
    elements.bannerClose.addEventListener('click', closeBanner);
  }

  // Keyboard navigation
  document.addEventListener('keydown', handleKeydown);

  // Window resize - re-render pagination to update mobile/desktop layout
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Re-render pagination on resize
      const totalPages = Math.ceil(state.filteredArticles.length / state.itemsPerPage);
      renderPagination(totalPages);
    }, 150);
  });
}

/**
 * Load articles from embedded JSON data
 */
function loadArticles() {
  const articlesDataScript = document.getElementById('articles-data');
  if (!articlesDataScript) {
    console.warn('Articles data not found');
    renderEmptyState();
    return;
  }

  try {
    const data = JSON.parse(articlesDataScript.textContent);
    state.articles = data.articles || [];
    state.filteredArticles = [...state.articles];

    // Load default view mode from config or localStorage
    const savedViewMode = localStorage.getItem('viewMode');
    const defaultViewMode = data.config?.defaultViewMode || 'table';
    state.viewMode = savedViewMode || defaultViewMode;

    // Update button states based on view mode
    if (state.viewMode === 'list') {
      elements.tableViewBtn?.classList.remove('active');
      elements.listViewBtn?.classList.add('active');
    } else {
      elements.tableViewBtn?.classList.add('active');
      elements.listViewBtn?.classList.remove('active');
    }

    renderCategoryButtons();
    renderArticles();
  } catch (error) {
    console.error('Failed to parse articles data:', error);
    renderEmptyState();
  }
}

/**
 * Render category filter buttons dynamically from article categories
 */
function renderCategoryButtons() {
  if (!elements.categoryFilter) return;

  // Count articles per category
  const categoryCounts = state.articles.reduce((acc, article) => {
    acc[article.category] = (acc[article.category] || 0) + 1;
    return acc;
  }, {});

  // Extract unique categories from articles and filter out undefined/null
  const categories = ['all', ...new Set(state.articles.map(a => a.category).filter(Boolean))];

  const buttonsHTML = categories.map(category => {
    const displayName = category === 'all' ? '全部' : category;
    const count = category === 'all' ? state.articles.length : (categoryCounts[category] || 0);
    const activeClass = category === 'all' ? 'active' : '';
    return `<button class="category-btn ${activeClass}" data-category="${escapeHtml(category)}">${escapeHtml(displayName)} (${count})</button>`;
  }).join('');

  elements.categoryFilter.innerHTML = buttonsHTML;

  // Initialize category filter after buttons are rendered
  initializeCategoryFilter();
}

/**
 * Render articles list with pagination
 */
function renderArticles() {
  if (!elements.articlesList) return;

  if (state.filteredArticles.length === 0) {
    renderEmptyState();
    updateArticleCount();
    return;
  }

  // Calculate pagination
  const totalPages = Math.ceil(state.filteredArticles.length / state.itemsPerPage);
  const startIndex = (state.currentPage - 1) * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  const paginatedArticles = state.filteredArticles.slice(startIndex, endIndex);

  // Update article count
  updateArticleCount();

  // Render based on view mode
  if (state.viewMode === 'table') {
    renderTableView(paginatedArticles, startIndex);
  } else {
    renderListView(paginatedArticles, startIndex);
  }

  // Render pagination
  renderPagination(totalPages);
}

/**
 * Render table view (grid layout)
 */
function renderTableView(articles, startIndex) {
  const articlesHTML = articles.map((article, index) => {
    const articleNumber = String(startIndex + index + 1).padStart(2, '0');
    return `
      <a href="${article.url}" class="article-card" data-category="${escapeHtml(article.category)}">
        <div class="article-card-inner">
          <div class="article-card-header">
            <span class="article-category-badge">${escapeHtml(article.category)}</span>
            <span class="article-number">${articleNumber}</span>
          </div>
          <h2 class="article-title">${escapeHtml(article.title)}</h2>
          <p class="article-description">${escapeHtml(article.description)}</p>
          <div class="article-card-footer">
            <div class="article-arrow">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>
          </div>
        </div>
      </a>
    `;
  }).join('');

  elements.articlesList.className = 'articles-list table-view';
  elements.articlesList.innerHTML = articlesHTML;
}

/**
 * Render list view (vertical layout)
 */
function renderListView(articles, startIndex) {
  const articlesHTML = articles.map((article, index) => {
    const articleNumber = String(startIndex + index + 1).padStart(2, '0');
    return `
      <a href="${article.url}" class="article-card list-view-card" data-category="${escapeHtml(article.category)}">
        <div class="article-card-inner list-view-inner">
          <div class="article-number-list">${articleNumber}</div>
          <div class="article-content-list">
            <div class="article-title-wrapper">
              <h2 class="article-title">${escapeHtml(article.title)}</h2>
            </div>
          </div>
          <div class="article-arrow">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </div>
        </div>
      </a>
    `;
  }).join('');

  elements.articlesList.className = 'articles-list list-view';
  elements.articlesList.innerHTML = articlesHTML;
}

/**
 * Update article count display
 */
function updateArticleCount() {
  if (!elements.articleCount) return;
  elements.articleCount.textContent = `共找到 ${state.filteredArticles.length} 篇文章`;
}

/**
 * Render empty state
 */
function renderEmptyState() {
  if (!elements.articlesList) return;

  elements.articlesList.innerHTML = `
    <div class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <p>没有找到匹配的文章</p>
    </div>
  `;

  // Clear pagination
  if (elements.pagination) {
    elements.pagination.innerHTML = '';
  }
}

/**
 * Render pagination
 */
function renderPagination(totalPages) {
  if (!elements.pagination || totalPages <= 1) {
    if (elements.pagination) elements.pagination.innerHTML = '';
    return;
  }

  // Check if mobile viewport
  const isMobile = window.innerWidth < 640;

  let paginationHTML = '<nav class="pagination">';

  // Previous button
  const prevDisabled = state.currentPage === 1 ? 'disabled' : '';
  paginationHTML += `
    <button class="pagination-btn pagination-prev" ${prevDisabled} data-page="${state.currentPage - 1}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      ${isMobile ? '' : '上一页'}
    </button>
  `;

  // Page numbers - mobile optimized
  if (isMobile && totalPages > 5) {
    // Mobile: show limited pages with ellipsis
    const pagesToShow = [];
    const maxVisible = 3; // Maximum page buttons to show on mobile

    pagesToShow.push(1); // Always show first page

    if (state.currentPage > 3) {
      pagesToShow.push('...');
    }

    // Show current page and adjacent pages
    const start = Math.max(2, state.currentPage - 1);
    const end = Math.min(totalPages - 1, state.currentPage + 1);

    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        pagesToShow.push(i);
      }
    }

    if (state.currentPage < totalPages - 2) {
      pagesToShow.push('...');
    }

    pagesToShow.push(totalPages); // Always show last page

    // Remove duplicates and render
    const uniquePages = [...new Set(pagesToShow)];
    for (const page of uniquePages) {
      if (page === '...') {
        paginationHTML += `<span class="pagination-ellipsis">...</span>`;
      } else {
        const activeClass = page === state.currentPage ? 'active' : '';
        paginationHTML += `<button class="pagination-btn pagination-num ${activeClass}" data-page="${page}">${page}</button>`;
      }
    }
  } else {
    // Desktop or few pages: show all pages
    for (let i = 1; i <= totalPages; i++) {
      const activeClass = i === state.currentPage ? 'active' : '';
      paginationHTML += `<button class="pagination-btn pagination-num ${activeClass}" data-page="${i}">${i}</button>`;
    }
  }

  // Next button
  const nextDisabled = state.currentPage === totalPages ? 'disabled' : '';
  paginationHTML += `
    <button class="pagination-btn pagination-next" ${nextDisabled} data-page="${state.currentPage + 1}">
      ${isMobile ? '' : '下一页'}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  `;

  paginationHTML += '</nav>';
  elements.pagination.innerHTML = paginationHTML;

  // Add event listeners to pagination buttons
  elements.pagination.querySelectorAll('.pagination-btn').forEach(btn => {
    if (!btn.hasAttribute('disabled')) {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page);
        goToPage(page);
      });
    }
  });
}

/**
 * Go to specific page
 */
function goToPage(page) {
  state.currentPage = page;
  renderArticles();
  // Scroll to top of articles list
  elements.articlesList?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Initialize home search functionality
 */
function initializeHomeSearch() {
  if (!elements.searchInputHome) return;

  let debounceTimer;
  elements.searchInputHome.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      filterArticles();
    }, 300);
  });
}

/**
 * Initialize category filter
 */
function initializeCategoryFilter() {
  if (!elements.categoryFilter) return;

  const categoryButtons = elements.categoryFilter.querySelectorAll('.category-btn');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      categoryButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update filter and re-render
      state.activeCategory = btn.dataset.category;
      filterArticles();
    });
  });
}

/**
 * Filter articles based on search query and category
 */
function filterArticles() {
  state.filteredArticles = state.articles.filter(article => {
    const matchesSearch = !state.searchQuery ||
      article.title.toLowerCase().includes(state.searchQuery) ||
      article.description.toLowerCase().includes(state.searchQuery);

    const matchesCategory = state.activeCategory === 'all' ||
      article.category === state.activeCategory;

    return matchesSearch && matchesCategory;
  });

  // Reset to first page when filtering
  state.currentPage = 1;
  renderArticles();
}

/**
 * Initialize view mode toggle
 */
function initializeViewModeToggle() {
  if (!elements.tableViewBtn || !elements.listViewBtn) return;

  // Table view button
  elements.tableViewBtn.addEventListener('click', () => {
    if (state.viewMode === 'table') return;

    state.viewMode = 'table';
    elements.tableViewBtn.classList.add('active');
    elements.listViewBtn.classList.remove('active');
    localStorage.setItem('viewMode', 'table');
    renderArticles();
  });

  // List view button
  elements.listViewBtn.addEventListener('click', () => {
    if (state.viewMode === 'list') return;

    state.viewMode = 'list';
    elements.listViewBtn.classList.add('active');
    elements.tableViewBtn.classList.remove('active');
    localStorage.setItem('viewMode', 'list');
    renderArticles();
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Initialize theme based on user preference or system preference
 */
function initializeTheme() {
  // Default to dark mode
  const savedTheme = localStorage.getItem('theme');

  state.isDarkMode = savedTheme !== 'light'; // Default to dark if not set

  if (state.isDarkMode) {
    elements.body?.classList.add('dark-mode');
    elements.body?.setAttribute('data-theme', 'dark');
  } else {
    elements.body?.classList.add('light-mode');
    elements.body?.setAttribute('data-theme', 'light');
  }
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  state.isDarkMode = !state.isDarkMode;

  if (state.isDarkMode) {
    elements.body?.classList.add('dark-mode');
    elements.body?.classList.remove('light-mode');
    elements.body?.setAttribute('data-theme', 'dark');
  } else {
    elements.body?.classList.add('light-mode');
    elements.body?.classList.remove('dark-mode');
    elements.body?.setAttribute('data-theme', 'light');
  }

  localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');

  // Add animation class
  if (elements.themeToggle) {
    elements.themeToggle.style.transform = 'rotate(360deg) scale(1.2)';
    setTimeout(() => {
      elements.themeToggle.style.transform = '';
    }, 300);
  }
}

/**
 * Initialize mobile navigation
 */
function initializeMobileNav() {
  // Add backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'mobile-nav-backdrop';
  backdrop.addEventListener('click', closeMobileNav);
  elements.body?.appendChild(backdrop);

  elements.backdrop = backdrop;
}

/**
 * Toggle mobile navigation
 */
function toggleMobileNav() {
  state.isMobileNavOpen = !state.isMobileNavOpen;

  const mobileNav = document.getElementById('mobileNav');
  mobileNav?.classList.toggle('active', state.isMobileNavOpen);
  elements.mobileMenuToggle?.classList.toggle('active', state.isMobileNavOpen);
  elements.backdrop?.classList.toggle('active', state.isMobileNavOpen);

  // Prevent body scroll when mobile nav is open
  if (elements.body) {
    elements.body.style.overflow = state.isMobileNavOpen ? 'hidden' : '';
  }

  // Animate hamburger menu
  if (elements.mobileMenuToggle) {
    const spans = elements.mobileMenuToggle.querySelectorAll('span');
    if (state.isMobileNavOpen) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
    } else {
      spans.forEach(span => {
        span.style.transform = '';
        span.style.opacity = '';
      });
    }
  }
}

/**
 * Close mobile navigation
 */
function closeMobileNav() {
  if (!state.isMobileNavOpen) return;

  state.isMobileNavOpen = false;
  const mobileNav = document.getElementById('mobileNav');
  mobileNav?.classList.remove('active');
  elements.mobileMenuToggle?.classList.remove('active');
  elements.backdrop?.classList.remove('active');
  if (elements.body) {
    elements.body.style.overflow = '';
  }

  // Reset hamburger menu animation
  const spans = elements.mobileMenuToggle?.querySelectorAll('span');
  spans?.forEach(span => {
    span.style.transform = '';
    span.style.opacity = '';
  });
}

/**
 * Handle keyboard navigation
 */
function handleKeydown(e) {
  // ESC to close mobile nav
  if (e.key === 'Escape' && state.isMobileNavOpen) {
    closeMobileNav();
  }

  // ESC to close search
  if (e.key === 'Escape' && elements.searchModal?.classList.contains('active')) {
    closeSearch();
  }

  // Ctrl/Cmd + K for search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    openSearch();
  }
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
  if (!elements.searchInput || !elements.searchResults) return;

  // Load articles from embedded JSON data for search
  const articlesDataScript = document.getElementById('articles-data');
  if (!articlesDataScript) return;

  try {
    const data = JSON.parse(articlesDataScript.textContent);
    const searchArticles = data.articles || [];

    let debounceTimer;
    elements.searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = e.target.value.toLowerCase().trim();
        performSearch(searchArticles, query);
      }, 200);
    });

    // Focus search input when modal opens
    const searchModal = elements.searchModal;
    if (searchModal) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (searchModal.classList.contains('active')) {
              elements.searchInput.focus();
              // Clear previous results when opening
              if (!elements.searchInput.value) {
                elements.searchResults.innerHTML = `
                <div class="search-initial-state">
                  <p>输入关键词查找文章</p>
                </div>
              `;
              }
            }
          }
        });
      });
      observer.observe(searchModal, { attributes: true });
      state.observers.add(observer);
    }
  } catch (error) {
    console.error('Failed to load search data:', error);
  }
}

/**
 * Perform search and render results
 */
function performSearch(articles, query) {
  if (!elements.searchResults) return;

  if (!query) {
    elements.searchResults.innerHTML = '';
    return;
  }

  // Filter articles based on title and description
  const results = articles.filter(article =>
    article.title.toLowerCase().includes(query) ||
    article.description.toLowerCase().includes(query) ||
    article.category.toLowerCase().includes(query)
  );

  if (results.length === 0) {
    elements.searchResults.innerHTML = `
      <div class="search-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <p>没有找到匹配的文章</p>
        <small>尝试其他关键词</small>
      </div>
    `;
    return;
  }

  // Render search results
  const resultsHTML = results.map(article => `
    <a href="${article.url}" class="search-result-item">
      <div class="search-result-category">${escapeHtml(article.category)}</div>
      <div class="search-result-title">${escapeHtml(article.title)}</div>
      <div class="search-result-description">${escapeHtml(article.description)}</div>
    </a>
  `).join('');

  elements.searchResults.innerHTML = resultsHTML;
}

/**
 * Open search modal
 */
function openSearch() {
  if (!elements.searchModal) return;

  elements.searchModal.classList.add('active');
  if (elements.searchInput) {
    elements.searchInput.focus();
  }
  if (elements.body) {
    elements.body.style.overflow = 'hidden';
  }
}

/**
 * Close search modal
 */
function closeSearch() {
  if (!elements.searchModal) return;

  elements.searchModal.classList.remove('active');
  if (elements.body) {
    elements.body.style.overflow = '';
  }
  if (elements.searchInput) {
    elements.searchInput.value = '';
  }
}

/**
 * Initialize banner functionality
 */
function initializeBanner() {
  // Check if banner should be shown
  const bannerClosed = localStorage.getItem('bannerClosed');
  if (bannerClosed && elements.banner) {
    elements.banner.style.display = 'none';
  }
}

/**
 * Close banner
 */
function closeBanner() {
  if (!elements.banner) return;

  elements.banner.style.display = 'none';
  localStorage.setItem('bannerClosed', 'true');
}

/**
 * Initialize code block copy buttons
 */
function initializeCodeCopyButtons() {
  const codeBlocks = document.querySelectorAll('.article-content pre');

  codeBlocks.forEach(pre => {
    // Skip if already has copy button
    if (pre.querySelector('.code-copy-btn')) return;

    // Get the code element
    const code = pre.querySelector('code');
    if (!code) return;

    // Create copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.setAttribute('aria-label', '复制代码');
    copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>复制</span>
    `;

    // Add click handler
    copyBtn.addEventListener('click', async () => {
      const text = code.textContent || code.innerText;

      try {
        await navigator.clipboard.writeText(text);
        copyBtn.classList.add('copied');
        copyBtn.querySelector('span').textContent = '已复制';

        // Reset after 2 seconds
        setTimeout(() => {
          copyBtn.classList.remove('copied');
          copyBtn.querySelector('span').textContent = '复制';
        }, 2000);
      } catch (err) {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        try {
          document.execCommand('copy');
          copyBtn.classList.add('copied');
          copyBtn.querySelector('span').textContent = '已复制';

          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.querySelector('span').textContent = '复制';
          }, 2000);
        } catch (fallbackErr) {
          console.error('Copy failed:', fallbackErr);
          copyBtn.querySelector('span').textContent = '失败';
        }

        document.body.removeChild(textarea);
      }
    });

    pre.appendChild(copyBtn);
  });
}

/**
 * Cleanup function for SPA scenarios
 */
function cleanup() {
  // Clear observers
  state.observers.forEach(observer => observer.disconnect());
  state.observers.clear();

  // Clean up mobile nav backdrop
  elements.backdrop?.remove();
}

// Add CSS for mobile navigation
const style = document.createElement('style');
style.textContent = `
  .mobile-nav-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 1039;
  }

  .mobile-nav-backdrop.active {
    opacity: 1;
    visibility: visible;
  }

  .mobile-menu-toggle span {
    transition: all 0.3s ease;
  }
`;
document.head.appendChild(style);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Expose utilities for potential external use
window.HalavahTech = {
  toggleTheme,
  toggleMobileNav,
  cleanup
};
