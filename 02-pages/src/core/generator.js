/**
 * Flare Plus Static Site Generator
 * Modern, well-structured static site generator
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import { marked } from 'marked';
import matter from 'gray-matter';
import Handlebars from 'handlebars';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import configurations
import buildConfig from '../config/build.js';

/**
 * Static Site Generator Class
 */
class StaticSiteGenerator {
  constructor() {
    // Load site configuration from articles.json
    const articlesJsonPath = path.resolve(__dirname, '../../data/articles.json');
    let siteConfig = {
      site: {
        name: "Halavah's Tech",
        title: "Halavah's Tech - 探索前沿技术,提升开发效率",
        heroTitle: "技术分享平台",
        description: "探索前沿技术,提升开发效率",
        url: "https://flare-plus.pages.dev",
        language: "zh-CN",
        copyrightText: "© 2025 Halavah's Tech. All rights reserved.",
        beianNumber: "京ICP备12345678号"
      }
    };

    // Try to load from articles.json if it exists
    if (fs.existsSync(articlesJsonPath)) {
      try {
        const articlesData = JSON.parse(fs.readFileSync(articlesJsonPath, 'utf-8'));
        if (articlesData.config) {
          const cfg = articlesData.config;
          siteConfig.site = {
            name: cfg.siteName,
            title: `${cfg.siteName} - ${cfg.siteDescription}`,
            heroTitle: "技术分享平台",
            description: cfg.siteDescription,
            url: "https://flare-plus.pages.dev",
            language: "zh-CN",
            copyrightText: cfg.copyrightText,
            beianNumber: cfg.beianNumber
          };
        }
      } catch (err) {
        console.warn('Failed to load site config from articles.json, using defaults');
      }
    }

    this.config = {
      ...siteConfig,
      build: {
        inputDir: path.resolve(__dirname, '../../'),
        outputDir: path.resolve(__dirname, '../../public'),
        ...buildConfig
      }
    };

    this.posts = [];
    this.pages = [];
    this.templates = {};

    // Configure marked with custom renderer for heading IDs
    this.setupMarked();
  }

  /**
   * Setup marked with custom renderer for heading IDs
   */
  setupMarked() {
    // Configure marked options
    marked.setOptions({
      gfm: true,
      breaks: true,
      mangle: false
    });

    // Create custom renderer for headings with IDs
    const renderer = new marked.Renderer();

    renderer.heading = function(text, level) {
      // Generate slug from text (remove special chars, replace spaces with hyphens)
      const slug = text
        .toLowerCase()
        .replace(/[^\u4e00-\u9fa5a-z0-9\s-]/g, '') // Keep Chinese, English, numbers, spaces, hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .trim();

      return `<h${level} id="${slug}">${text}</h${level}>\n`;
    };

    marked.use({ renderer });
  }

  /**
   * Initialize the generator
   */
  async init() {
    console.log('Initializing static site generator...');

    // Clean output directory
    await this.cleanOutput();

    // Load templates
    await this.loadTemplates();

    // Load content
    await this.loadContent();

    console.log('Initialization complete.');
  }

  /**
   * Clean output directory
   */
  async cleanOutput() {
    console.log('Cleaning output directory...');

    const outputDir = this.config.build.outputDir;

    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir, { withFileTypes: true });

      for (const file of files) {
        const filePath = path.join(outputDir, file.name);

        if (file.isDirectory() && file.name !== '.git') {
          fs.rmSync(filePath, { recursive: true, force: true });
        } else if (!file.isDirectory()) {
          fs.unlinkSync(filePath);
        }
      }
    }

    console.log('Output directory cleaned.');
  }

  /**
   * Load Handlebars templates
   */
  async loadTemplates() {
    console.log('Loading templates...');

    // Create a simple default layout
    this.templates.default = `<!DOCTYPE html>
<html lang="{{site.language}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{page.title}} | {{site.title}}</title>
  <meta name="description" content="{{page.description}}">
  <link rel="stylesheet" href="/assets/css/main.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
</head>
<body data-theme="dark">
  <!-- Navigation Bar (Quartz-style) -->
  <nav class="navbar">
    <div class="navbar-container">
      <div class="navbar-content">
        <!-- Logo -->
        <a href="/" class="navbar-logo" title="{{site.heroTitle}}">
          <span class="logo-text logo-gradient">{{site.name}}</span>
        </a>

        <!-- Right side: Banner + Tools -->
        <div class="navbar-actions">
          <!-- Banner (closable) -->
          <div class="banner" id="banner">
            <a href="https://api.nekoapi.com" target="_blank" rel="noopener noreferrer" class="banner-link">
              <span class="banner-text">🔥 限时优惠：Claude Code 正版授权，立享85折</span>
              <button class="banner-close" id="bannerClose">×</button>
            </a>
          </div>

          <!-- Divider -->
          <div class="navbar-divider"></div>

          <!-- Tools -->
          <div class="navbar-tools">
            <!-- Search Button -->
            <button class="tool-button search-button" id="searchButton" aria-label="搜索">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>

            <!-- Theme Toggle -->
            <button class="tool-button theme-toggle" id="themeToggle" aria-label="切换主题">
              <div class="theme-icon theme-icon-dark">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              </div>
              <div class="theme-icon theme-icon-light">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              </div>
            </button>

            <!-- Mobile Menu -->
            <button class="tool-button mobile-menu-toggle" id="mobileMenuToggle" aria-label="菜单">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- Search Modal -->
  <div class="search-modal" id="searchModal">
    <div class="search-backdrop" id="searchBackdrop"></div>
    <div class="search-content">
      <div class="search-input-wrapper">
        <svg class="search-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
        <input type="text" class="search-input" id="searchInput" placeholder="搜索文章标题、描述或分类..." autocomplete="off">
        <button class="search-esc-button" id="searchEscButton" aria-label="ESC关闭">ESC</button>
      </div>
      <div class="search-results" id="searchResults">
        <!-- Search results will appear here -->
      </div>
      <div class="search-keyboard-hints">
        <span class="search-hint-item"><kbd class="search-hint-key">ESC</kbd>关闭</span>
        <span class="search-hint-item"><kbd class="search-hint-key">↵</kbd>打开</span>
      </div>
    </div>
  </div>

  <main>
    {{{body}}}
  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-copyright">{{site.copyrightText}}</div>
        <div class="footer-beian">{{site.beianNumber}}</div>
      </div>
    </div>
  </footer>

  <!-- Articles Data -->
  <script id="articles-data" type="application/json">
    {{{articlesData}}}
  </script>

  <script src="/assets/js/main.js"></script>
</body>
</html>`;

    console.log('Templates loaded.');
  }

  /**
   * Load content from markdown files
   */
  async loadContent() {
    console.log('Loading content...');

    // Load pages
    await this.loadPages();

    // Load posts
    await this.loadPosts();

    console.log('Content loaded.');
  }

  /**
   * Load pages from markdown files
   */
  async loadPages() {
    const pagesDir = path.join(this.config.build.inputDir, 'content/pages');

    if (!fs.existsSync(pagesDir)) {
      console.log('Pages directory not found, skipping.');
      return;
    }

    const files = globSync('**/*.md', { cwd: pagesDir });

    for (const file of files) {
      const filePath = path.join(pagesDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data, content: markdown } = matter(content);

      this.pages.push({
        slug: file.replace('.md', ''),
        ...data,
        content: marked(markdown),
        excerpt: data.excerpt || this.generateExcerpt(markdown)
      });
    }
  }

  /**
   * Load posts from markdown files
   */
  async loadPosts() {
    const postsDir = path.join(this.config.build.inputDir, 'content');

    if (!fs.existsSync(postsDir)) {
      console.log('Posts directory not found, skipping.');
      return;
    }

    // Scan chapter01, chapter02, chapter03, chapter04, chapter05 directories
    const chapters = ['chapter01', 'chapter02', 'chapter03', 'chapter04', 'chapter05'];
    const allFiles = [];

    for (const chapter of chapters) {
      const chapterPath = path.join(postsDir, chapter);
      if (!fs.existsSync(chapterPath)) {
        continue;
      }
      // Get all markdown files in this chapter
      const files = globSync('*.md', { cwd: chapterPath });
      allFiles.push(...files.map(f => `${chapter}/${f}`));
    }

    for (const file of allFiles) {
      const filePath = path.join(postsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { data, content: markdown } = matter(content);

      // Extract chapter number
      const chapterMatch = file.match(/^chapter(\d+)\//);
      const chapter = chapterMatch ? chapterMatch[1] : '0';

      // Create slug from file path (remove chapter prefix)
      const slug = file.replace('.md', '').replace(/^chapter\d+\//, '');

      this.posts.push({
        slug,
        chapter,
        ...data,
        content: marked(markdown),
        html: marked(markdown),
        excerpt: data.excerpt || this.generateExcerpt(markdown),
        wordCount: markdown.split(/\s+/).length,
        readingTime: Math.ceil(markdown.split(/\s+/).length / 200)
      });
    }

    // Sort posts by chapter then by date
    this.posts.sort((a, b) => {
      const chapterA = parseInt(a.chapter || '0');
      const chapterB = parseInt(b.chapter || '0');
      if (chapterA !== chapterB) {
        return chapterA - chapterB;
      }
      return new Date(b.date) - new Date(a.date);
    });

    console.log(`Loaded ${this.posts.length} posts from chapters.`);
  }

  /**
   * Generate excerpt from markdown content
   */
  generateExcerpt(markdown) {
    const text = markdown.replace(/[#*`_]/g, '').trim();
    const sentences = text.split(/[.!?]+/);
    return sentences.slice(0, 3).join('.').trim() + '...';
  }

  /**
   * Generate articles data from JSON configuration
   */
  async generateBlogData() {
    console.log('Generating articles data...');

    const articlesConfigPath = path.join(this.config.build.inputDir, 'data/articles.json');

    if (!fs.existsSync(articlesConfigPath)) {
      console.warn('articles.json not found, skipping articles data generation');
      return;
    }

    const articlesConfig = JSON.parse(fs.readFileSync(articlesConfigPath, 'utf-8'));

    // Create articles data structure
    const articlesData = {
      config: articlesConfig.config,
      articles: []
    };

    // Process articles from configuration
    for (const articleConfig of articlesConfig.articles) {
      articlesData.articles.push({
        ...articleConfig,
        id: articleConfig.htmlFile.replace(/\.html$/, '').split('/').pop(),
        url: '/' + articleConfig.htmlFile
      });
    }

    // Create scripts directory if it doesn't exist
    const scriptsDir = path.join(this.config.build.outputDir, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    // Write articles.json for client-side loading
    const articlesJsonPath = path.join(scriptsDir, 'articles.json');
    fs.writeFileSync(articlesJsonPath, JSON.stringify(articlesData, null, 2));

    console.log(`Generated: articles.json with ${articlesData.articles.length} articles`);
  }

  /**
   * Process CSS files
   */
  async processCSS() {
    console.log('Processing CSS files...');

    const cssInputDir = path.join(this.config.build.inputDir, 'src/client/css');
    const cssOutputDir = path.join(this.config.build.outputDir, 'assets/css');

    if (!fs.existsSync(cssInputDir)) {
      console.log('CSS directory not found, skipping.');
      return;
    }

    // Ensure output directory exists
    fs.mkdirSync(cssOutputDir, { recursive: true });

    const cssFiles = globSync('**/*.css', { cwd: cssInputDir });

    for (const file of cssFiles) {
      const inputPath = path.join(cssInputDir, file);
      const outputPath = path.join(cssOutputDir, file);

      const css = fs.readFileSync(inputPath, 'utf-8');

      // Process with PostCSS
      const result = await postcss([
        autoprefixer,
        cssnano({ preset: 'default' })
      ]).process(css, { from: inputPath });

      fs.writeFileSync(outputPath, result.css);
    }

    console.log('CSS processed successfully.');
  }

  /**
   * Process JavaScript files
   */
  async processJS() {
    console.log('Processing JavaScript files...');

    const jsInputDir = path.join(this.config.build.inputDir, 'src/client/js');
    const jsOutputDir = path.join(this.config.build.outputDir, 'assets/js');

    if (!fs.existsSync(jsInputDir)) {
      console.log('JavaScript directory not found, skipping.');
      return;
    }

    // Ensure output directory exists
    fs.mkdirSync(jsOutputDir, { recursive: true });

    const jsFiles = globSync('**/*.js', { cwd: jsInputDir });

    for (const file of jsFiles) {
      const inputPath = path.join(jsInputDir, file);
      const outputPath = path.join(jsOutputDir, file);

      // Copy JS files (could be minified in production)
      const js = fs.readFileSync(inputPath, 'utf-8');
      fs.writeFileSync(outputPath, js);
    }

    console.log('JavaScript processed successfully.');
  }

  /**
   * Copy static assets
   */
  async processAssets() {
    console.log('Processing assets...');

    const staticInputDir = path.join(this.config.build.inputDir, 'src/static');
    const staticOutputDir = path.join(this.config.build.outputDir, 'assets');

    if (!fs.existsSync(staticInputDir)) {
      console.log('Static directory not found, skipping.');
      return;
    }

    // Copy all static assets
    this.copyDirectory(staticInputDir, staticOutputDir);

    console.log('Assets processed successfully.');
  }

  /**
   * Copy directory recursively
   */
  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  /**
   * Generate articles data from data/articles.json
   */
  generateArticlesData() {
    const articlesJsonPath = path.join(this.config.build.inputDir, 'data/articles.json');

    if (!fs.existsSync(articlesJsonPath)) {
      console.warn('articles.json not found, generating from markdown files...');
      return this.generateArticlesDataFromMarkdown();
    }

    const articlesConfig = JSON.parse(fs.readFileSync(articlesJsonPath, 'utf-8'));

    // Add url and id fields to each article
    const articlesWithUrl = articlesConfig.articles.map(article => ({
      ...article,
      id: article.htmlFile.replace(/\.html$/, '').split('/').pop(),
      url: '/' + article.htmlFile
    }));

    console.log(`Generated articles data: ${articlesWithUrl.length} articles`);

    return JSON.stringify({
      ...articlesConfig,
      articles: articlesWithUrl
    });
  }

  /**
   * Fallback: Generate articles data from markdown files
   */
  generateArticlesDataFromMarkdown() {
    const chapters = ['chapter01', 'chapter02', 'chapter03', 'chapter04', 'chapter05'];
    const articles = [];

    for (const chapter of chapters) {
      const chapterDir = path.join(this.config.build.inputDir, 'content', chapter);

      if (!fs.existsSync(chapterDir)) {
        console.log(`Chapter directory not found: ${chapter}`);
        continue;
      }

      // Get all markdown files in this chapter
      const files = fs.readdirSync(chapterDir).filter(f => f.endsWith('.md'));

      for (const file of files) {
        const filePath = path.join(chapterDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const { data } = matter(content);

        // Generate URL from filename
        const slug = file.replace('.md', '');
        const url = `/${chapter}/${slug}.html`;

        articles.push({
          title: data.title || file,
          description: data.description || '',
          url: url,
          category: data.category || '未分类'
        });
      }
    }

    console.log(`Generated articles data: ${articles.length} articles`);

    return JSON.stringify({
      config: {
        siteName: this.config.site.name,
        siteDescription: this.config.site.description,
        githubUrl: 'https://github.com/halavah',
        beianNumber: '京ICP备12345678号',
        copyrightText: `© ${new Date().getFullYear()} ${this.config.site.name}. All rights reserved.`,
        adLink: 'https://api.nekoapi.com',
        defaultViewMode: 'table'
      },
      articles: articles
    });
  }

  /**
   * Copy assets folders from chapter directories
   */
  async copyAssetsFolders() {
    const chapters = ['chapter01', 'chapter02', 'chapter03', 'chapter04', 'chapter05'];

    for (const chapter of chapters) {
      const chapterDir = path.join(this.config.build.inputDir, 'content', chapter);

      if (!fs.existsSync(chapterDir)) {
        continue;
      }

      // Find all .assets folders
      const entries = fs.readdirSync(chapterDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.endsWith('.assets')) {
          const srcAssetsPath = path.join(chapterDir, entry.name);
          const destAssetsPath = path.join(this.config.build.outputDir, chapter, entry.name);

          // Copy the assets folder
          this.copyDirectory(srcAssetsPath, destAssetsPath);
          console.log(`Copied assets: ${chapter}/${entry.name}`);
        }
      }
    }
  }

  /**
   * Generate pages
   */
  async generatePages() {
    console.log('Generating pages...');

    const template = Handlebars.compile(this.templates.default);

    // Generate articles data from chapter directories
    const articlesData = this.generateArticlesData();

    // Copy assets folders
    await this.copyAssetsFolders();

    for (const page of this.pages) {
      // Process Handlebars in page content
      const contentTemplate = Handlebars.compile(page.content);
      const processedContent = contentTemplate({
        site: this.config.site,
        page: page,
        posts: this.posts
      });

      const html = template({
        site: this.config.site,
        page: page,
        body: processedContent,
        posts: this.posts,
        articlesData: articlesData
      });

      const outputPath = path.join(
        this.config.build.outputDir,
        page.slug === 'index' ? 'index.html' : `${page.slug}.html`
      );

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, html);
      console.log(`Generated: ${page.slug}`);
    }

    console.log('Pages generated successfully.');
  }

  /**
   * Generate individual post pages
   */
  async generatePostPages() {
    console.log('Generating post pages...');

    const template = Handlebars.compile(this.templates.default);

    for (const post of this.posts) {
      // Create a page-like object for the post
      const postPage = {
        title: post.title,
        slug: post.slug,
        description: post.description || post.excerpt,
        date: post.date,
        author: post.author,
        category: post.category,
        tags: post.tags
      };

      // Post content as HTML body
      const body = `
        <article class="article-content">
          <h1>${this.escapeHtml(post.title)}</h1>
          ${post.content}
        </article>
      `;

      const html = template({
        site: this.config.site,
        page: postPage,
        body: body,
        posts: this.posts,
        articlesData: null
      });

      // Output path: chapter01/slug.html
      const outputPath = path.join(
        this.config.build.outputDir,
        `chapter${post.chapter}`,
        `${post.slug}.html`
      );

      // Ensure directory exists
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(outputPath, html);
      console.log(`Generated post: chapter${post.chapter}/${post.slug}.html`);
    }

    console.log('Post pages generated successfully.');
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Generate sitemap
   */
  async generateSitemap() {
    console.log('Generating sitemap...');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${this.config.site.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${this.posts.map(post => `
  <url>
    <loc>${this.config.site.url}/posts/${post.slug}</loc>
    <lastmod>${post.date || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`;

    const sitemapPath = path.join(this.config.build.outputDir, 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap);

    console.log('Generated: sitemap.xml');
  }

  /**
   * Get generation statistics
   */
  getStats() {
    return {
      pages: this.pages.length,
      posts: this.posts.length,
      site: this.config.site.name
    };
  }

  /**
   * Generate the complete site
   */
  async generate() {
    try {
      console.log('Starting static site generation...');

      // Initialize
      await this.init();

      // Generate pages
      await this.generatePages();

      // Generate post pages
      await this.generatePostPages();

      // Process assets
      await this.processCSS();
      await this.processJS();
      await this.processAssets();

      // Generate blog data
      await this.generateBlogData();

      // Generate sitemap
      await this.generateSitemap();

      console.log('\n✅ Site generated successfully!');
      console.log(`📁 Output directory: ${this.config.build.outputDir}`);

      // Show statistics
      const stats = this.getStats();
      console.log('\n📊 Generation Statistics:');
      console.log(`   - Pages: ${stats.pages}`);
      console.log(`   - Posts: ${stats.posts}`);
      console.log(`   - Site: ${stats.site}`);

    } catch (error) {
      console.error('\n❌ Generation failed:', error);
      throw error;
    }
  }
}

// Run the generator
async function main() {
  const generator = new StaticSiteGenerator();
  await generator.generate();
}

// Export for testing
export { StaticSiteGenerator };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}