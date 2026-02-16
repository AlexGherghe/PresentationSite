# Alexandru Gherghe — Personal Blog

A static personal blog built with vanilla HTML, CSS, and JavaScript. Articles are written in Markdown and compiled to static HTML via a Node.js build script.

## Getting Started

```bash
npm install
npm run build    # Generate static site in dist/
npm run dev      # Build + serve locally at http://localhost:3456
```

## Writing a New Post

Create a Markdown file in `posts/` with frontmatter:

```markdown
---
title: My New Article
date: 2026-03-01
tags: [JavaScript, Tutorial]
excerpt: A brief description of the article.
---

Your article content here...
```

Then run `npm run build` to generate the updated site.

## Project Structure

```
posts/          → Markdown articles
templates/      → HTML templates (base, home, blog, article)
css/            → Stylesheet
js/             → Client-side JavaScript
build.js        → Build script (Markdown → HTML)
dist/           → Generated static site (git-ignored)
```

## Deployment

Upload the contents of `dist/` to any static hosting provider (GitHub Pages, S3, Netlify, etc.).

## License

The source code (templates, build scripts, CSS, JS) is licensed under the [MIT License](LICENSE).

Blog content in `posts/` is © Alexandru Gherghe. All rights reserved.
