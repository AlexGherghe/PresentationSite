const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

// Custom Math Extension for Marked
const mathExtension = {
    name: 'math',
    level: 'inline',
    start(src) { return src.indexOf('$'); },
    tokenizer(src, tokens) {
        const blockMatch = /^\$\$([\s\S]+?)\$\$/.exec(src);
        if (blockMatch) {
            return {
                type: 'math',
                raw: blockMatch[0],
                text: blockMatch[1].trim(),
                displayMode: true
            };
        }
        const inlineMatch = /^\$([^$\n]+)\$/.exec(src);
        if (inlineMatch) {
            return {
                type: 'math',
                raw: inlineMatch[0],
                text: inlineMatch[1].trim(),
                displayMode: false
            };
        }
    },
    renderer(token) {
        return token.displayMode ? `\\[ ${token.text} \\]` : `\\( ${token.text} \\)`;
    }
};
marked.use({ extensions: [mathExtension] });

// Custom renderer to add IDs to headings for anchor links
const renderer = new marked.Renderer();
renderer.heading = function ({ text, depth }) {
    const slug = text
        .toLowerCase()
        .replace(/<[^>]*>/g, '')     // strip HTML tags
        .replace(/[^\w\s-]/g, '')    // remove special characters
        .replace(/\s+/g, '-')        // spaces to hyphens
        .replace(/-+/g, '-')         // collapse multiple hyphens
        .trim();
    return `<h${depth} id="${slug}">${text}</h${depth}>\n`;
};
renderer.image = function ({ href, title, text }) {
    if (title) {
        return `<figure><img src="${href}" alt="${text}" title="${title}"><figcaption>${title}</figcaption></figure>\n`;
    }
    return `<img src="${href}" alt="${text}">\n`;
};
marked.setOptions({ renderer });

// ========================================
// Configuration
// ========================================
const POSTS_DIR = path.join(__dirname, 'posts');
const TEMPLATES_DIR = path.join(__dirname, 'templates');
const DIST_DIR = path.join(__dirname, 'dist');
const CSS_DIR = path.join(__dirname, 'css');
const JS_DIR = path.join(__dirname, 'js');
const ASSETS_DIR = path.join(__dirname, 'assets');

// ========================================
// Utilities
// ========================================

/** Read a template file */
function readTemplate(name) {
    return fs.readFileSync(path.join(TEMPLATES_DIR, name), 'utf-8');
}

/** Estimate reading time in minutes */
function readingTime(text) {
    const wordsPerMinute = 200;
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
}

/** Format a date as "Month DD, YYYY" */
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/** Generate a slug from the markdown filename */
function slug(filename) {
    return filename
        .replace(/^\d{4}-\d{2}-\d{2}-/, '') // Remove date prefix
        .replace(/\.md$/, '');               // Remove extension
}

/** Copy a directory recursively */
function copyDir(src, dest) {
    if (!fs.existsSync(src)) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        const srcPath = path.join(src, entry);
        const destPath = path.join(dest, entry);
        if (fs.statSync(srcPath).isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/** Wrap content with the base template */
function wrapInBase(content, options = {}) {
    const base = readTemplate('base.html');
    const cacheBust = Date.now().toString(36);
    return base
        .replace(/\{\{title\}\}/g, options.title || 'Alexandru Gherghe')
        .replace(/\{\{meta_description\}\}/g, options.description || 'Alexandru Gherghe — Software Engineer. Blog, tutorials, and articles about software engineering and AI.')
        .replace(/\{\{root\}\}/g, options.root || '')
        .replace(/\{\{head_extra\}\}/g, options.headExtra || '')
        .replace(/\{\{cache_bust\}\}/g, cacheBust)
        .replace(/\{\{nav_home_active\}\}/g, options.activeNav === 'home' ? 'active' : '')
        .replace(/\{\{nav_blog_active\}\}/g, options.activeNav === 'blog' ? 'active' : '')
        .replace(/\{\{content\}\}/g, () => content);
}

// ========================================
// Post-process code blocks
// ========================================
const COPY_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
const CHECK_ICON = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
const CHEVRON_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;

const TOC_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="15" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>`;
const TOC_CLOSE_ICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

// ========================================
// Generate Table of Contents HTML
// ========================================
function generateTOC(htmlContent) {
    const headingRegex = /<h([23]) id="([^"]+)">([\s\S]*?)<\/h[23]>/g;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(htmlContent)) !== null) {
        headings.push({
            level: parseInt(match[1]),
            id: match[2],
            text: match[3].replace(/<[^>]*>/g, '') // Strip any inner HTML tags
        });
    }

    if (headings.length < 2) return ''; // Don't show TOC for very short articles

    const tocItems = headings.map(h => {
        const indent = h.level === 3 ? ' toc__link--sub' : '';
        return `<a href="#${h.id}" class="toc__link${indent}" data-target="${h.id}">${h.text}</a>`;
    }).join('\n            ');

    return `
    <!-- Table of Contents -->
    <button class="toc-toggle" id="toc-toggle" aria-label="Table of Contents">
        <span class="toc-toggle__icon toc-toggle__icon--open">${TOC_ICON}</span>
        <span class="toc-toggle__icon toc-toggle__icon--close">${TOC_CLOSE_ICON}</span>
        <span class="toc-toggle__label">Contents</span>
    </button>
    <nav class="toc" id="toc" aria-label="Table of Contents">
        <div class="toc__header">
            <span class="toc__title">Contents</span>
            <button class="toc__close" id="toc-close" aria-label="Close table of contents">${TOC_CLOSE_ICON}</button>
        </div>
        <div class="toc__links">
            ${tocItems}
        </div>
    </nav>
    <div class="toc-overlay" id="toc-overlay"></div>`;
}

function postProcessCodeBlocks(html) {
    // Match entire <pre><code class="language-xxx">...content...</code></pre> blocks
    // Using [\s\S]*? for non-greedy match across newlines
    return html.replace(
        /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
        (match, lang, content) => {
            if (lang === 'mermaid') {
                const decoded = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
                return `<div class="mermaid">\n${decoded}\n</div>`;
            }
            const displayLang = lang.charAt(0).toUpperCase() + lang.slice(1);
            return `<div class="code-block" data-lang="${lang}">
  <div class="code-block__header">
    <span class="code-block__lang">${displayLang}</span>
    <button class="code-block__copy" aria-label="Copy code">
      <span class="code-block__copy-icon">${COPY_ICON}</span>
      <span class="code-block__copy-check">${CHECK_ICON}</span>
      <span class="code-block__copy-text">Copy</span>
    </button>
  </div>
  <div class="code-block__body">
    <pre class="line-numbers"><code class="language-${lang}">${content}</code></pre>
  </div>
  <button class="code-block__expand" aria-label="Expand code">
    <span>Show more</span>
    ${CHEVRON_ICON}
  </button>
</div>`;
        }
    );
}

// ========================================
// Parse all posts
// ========================================
function parsePosts() {
    if (!fs.existsSync(POSTS_DIR)) return [];

    const files = fs.readdirSync(POSTS_DIR)
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse(); // Newest first

    return files.map(file => {
        const raw = fs.readFileSync(path.join(POSTS_DIR, file), 'utf-8');
        const { data, content } = matter(raw);
        const htmlContent = postProcessCodeBlocks(marked(content));

        return {
            title: data.title || 'Untitled',
            date: data.date,
            dateFormatted: formatDate(data.date),
            tags: data.tags || [],
            excerpt: data.excerpt || '',
            slug: slug(file),
            content: htmlContent,
            readingTime: readingTime(content)
        };
    });
}

// ========================================
// Generate a post card HTML
// ========================================
function postCard(post, root = '') {
    const tags = post.tags
        .map(tag => `<span class="tag">${tag}</span>`)
        .join('');

    return `
    <a href="${root}articles/${post.slug}.html" class="post-card fade-in">
      <div class="post-card__meta">
        <span class="post-card__date">${post.dateFormatted}</span>
        <span class="post-card__reading-time">${post.readingTime} min read</span>
      </div>
      <h3 class="post-card__title">${post.title}</h3>
      <p class="post-card__excerpt">${post.excerpt}</p>
      <div class="post-card__tags">${tags}</div>
    </a>
  `;
}

// ========================================
// Build pages
// ========================================
function build() {
    console.log('🔨 Building site...\n');

    // Clean & create dist
    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true });
    }
    fs.mkdirSync(DIST_DIR, { recursive: true });
    fs.mkdirSync(path.join(DIST_DIR, 'articles'), { recursive: true });

    // Copy static assets
    copyDir(CSS_DIR, path.join(DIST_DIR, 'css'));
    copyDir(JS_DIR, path.join(DIST_DIR, 'js'));
    copyDir(ASSETS_DIR, path.join(DIST_DIR, 'assets'));

    // Parse posts
    const posts = parsePosts();
    console.log(`📝 Found ${posts.length} post(s)`);

    // Generate post cards HTML
    const allPostCards = posts.map(p => postCard(p)).join('\n');
    const latestPostCards = posts.slice(0, 3).map(p => postCard(p)).join('\n');

    // --- Home page ---
    const homeTemplate = readTemplate('home.html');
    const homeContent = homeTemplate.replace('{{posts}}', latestPostCards);
    const homePage = wrapInBase(homeContent, {
        title: 'Alexandru Gherghe — Software Engineer',
        description: 'Alexandru Gherghe — Software Engineer. Blog, tutorials, and articles about software engineering and AI.',
        root: '',
        activeNav: 'home'
    });
    fs.writeFileSync(path.join(DIST_DIR, 'index.html'), homePage);
    console.log('✅ index.html');

    // --- Blog page ---
    const blogTemplate = readTemplate('blog.html');
    const blogContent = blogTemplate.replace('{{posts}}', allPostCards);
    const blogPage = wrapInBase(blogContent, {
        title: 'Blog — Alexandru Gherghe',
        description: 'Articles, tutorials, and deep dives into software engineering by Alexandru Gherghe.',
        root: '',
        activeNav: 'blog'
    });
    fs.writeFileSync(path.join(DIST_DIR, 'blog.html'), blogPage);
    console.log('✅ blog.html');

    // --- Article pages ---
    const articleTemplate = readTemplate('article.html');

    // Prism.js CDN for syntax highlighting
    const prismHead = `
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/line-numbers/prism-line-numbers.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-java.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
  <script defer src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body);"></script>
  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
    mermaid.initialize({ startOnLoad: true });
  </script>`;

    for (const post of posts) {
        const tagsHtml = post.tags
            .map(tag => `<span class="tag">${tag}</span>`)
            .join('');

        // Generate TOC from post content
        const tocHtml = generateTOC(post.content);

        const articleContent = articleTemplate
            .replace('{{root}}', '../')
            .replace('{{title}}', post.title)
            .replace('{{date}}', post.dateFormatted)
            .replace('{{reading_time}}', post.readingTime)
            .replace('{{tags}}', tagsHtml)
            .replace('{{toc}}', () => tocHtml)
            .replace('{{content}}', () => post.content);

        const articlePage = wrapInBase(articleContent, {
            title: `${post.title} — Alexandru Gherghe`,
            description: post.excerpt,
            root: '../',
            headExtra: prismHead,
            activeNav: 'blog'
        });

        const outPath = path.join(DIST_DIR, 'articles', `${post.slug}.html`);
        fs.writeFileSync(outPath, articlePage);
        console.log(`✅ articles/${post.slug}.html`);
    }

    console.log('\n🚀 Build complete! Output in dist/');
}

// Run
build();
