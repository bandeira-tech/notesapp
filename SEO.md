# SEO and Social Media Optimization

This document outlines the SEO and social media optimization implementation for Firecat Notes.

## Implementation Overview

### ✅ Completed

1. **Dynamic Meta Tags**
   - Installed `react-helmet-async` for managing meta tags
   - Created `SEO` component for consistent meta tag generation
   - Implemented on all public pages (NotebookPage, PostPage, DiscoverPage)

2. **Structured Data (JSON-LD)**
   - Created `StructuredData` component with Schema.org markup
   - `NotebookStructuredData` - Blog schema for notebooks
   - `PostStructuredData` - BlogPosting schema for posts
   - Includes author, dates, interaction counts, and relationships

3. **Base Meta Tags**
   - Enhanced `index.html` with comprehensive meta tags
   - Open Graph tags for Facebook/LinkedIn
   - Twitter Card tags
   - Primary SEO meta tags (title, description, keywords)

4. **Robots.txt**
   - Created `/public/robots.txt`
   - Allows all crawlers
   - Disallows private/protected paths
   - References sitemap location

5. **Sitemap**
   - Created basic `/public/sitemap.xml`
   - Includes main pages (home, discover)
   - Contains instructions for dynamic URL generation

## Page-Specific SEO

### NotebookPage
- **Title**: `{notebook.title} | Firecat Notes`
- **Description**: Notebook description or auto-generated from metadata
- **Type**: Website
- **Image**: Notebook cover image
- **Structured Data**: Blog schema with author, dates, post count

### PostPage
- **Title**: First 60 chars of post content
- **Description**: First 160 chars of post content
- **Type**: Article
- **Image**: Post images or notebook cover
- **Structured Data**: BlogPosting schema with interactions
- **Author**: Post author name/pubkey
- **Dates**: Published and modified times

### DiscoverPage
- **Title**: Discover title (i18n)
- **Description**: Discover subtitle (i18n)
- **Type**: Website

## Production Readiness Tasks

### 🎨 Required Assets

1. **Favicon**: Add `/public/firecat.svg` (referenced in index.html)
2. **OG Image**: Add `/public/og-default.jpg` (1200x630px recommended)
   - Used as fallback when notebooks/posts don't have images
   - Should represent Firecat Notes brand

### 🌐 Domain Configuration

Update all hardcoded URLs from `https://firecat.notes/` to your actual domain:
- `index.html` - base meta tags
- `src/components/seo/SEO.tsx` - default image path
- `src/components/seo/StructuredData.tsx` - publisher logo, isPartOf URLs
- `public/robots.txt` - sitemap URL
- `public/sitemap.xml` - all URLs

### 📊 Dynamic Sitemap Generation

The current sitemap is static. For production, implement dynamic generation:

**Option 1: Build-time Generation**
```typescript
// scripts/generate-sitemap.ts
// - Query B3nd network for all public notebooks
// - Query all posts for each notebook
// - Generate sitemap.xml with current URLs
// - Run during build process
```

**Option 2: Server-side Route**
```typescript
// api/sitemap.xml route
// - Dynamically query and generate sitemap on request
// - Cache for performance
// - Update based on content changes
```

**Option 3: Scheduled Static Generation**
```typescript
// Cron job or scheduled task
// - Regenerate sitemap periodically
// - Upload to static hosting
```

### 🔍 SEO Enhancements

1. **Sitemap Index**
   - Create sitemap index if you have many notebooks/posts
   - Split into multiple sitemaps (e.g., by month, by category)

2. **Canonical URLs**
   - Ensure all pages have correct canonical URLs
   - Handle URL parameters properly

3. **Image Optimization**
   - Optimize OG images for size and quality
   - Use appropriate dimensions (1200x630 for OG)
   - Add alt text for accessibility

4. **Performance**
   - Monitor Core Web Vitals
   - Optimize page load times
   - Consider SSR/SSG for better SEO

5. **Analytics**
   - Add Google Analytics or similar
   - Track social media referrals
   - Monitor search console

## Testing SEO Implementation

### Meta Tags Testing
1. **Facebook Debugger**: https://developers.facebook.com/tools/debug/
2. **Twitter Card Validator**: https://cards-dev.twitter.com/validator
3. **LinkedIn Inspector**: https://www.linkedin.com/post-inspector/
4. **Google Rich Results Test**: https://search.google.com/test/rich-results

### Structured Data Testing
- **Google Rich Results Test**: Validates JSON-LD
- **Schema.org Validator**: https://validator.schema.org/

### Sitemap Testing
- **XML Sitemap Validator**: https://www.xml-sitemaps.com/validate-xml-sitemap.html
- Google Search Console - Submit sitemap

## Content Best Practices

### Notebook Titles
- Keep under 60 characters for optimal display
- Include relevant keywords naturally
- Make them descriptive and unique

### Notebook Descriptions
- Aim for 120-160 characters
- Include relevant keywords
- Write for humans first, search engines second

### Post Content
- First 160 characters are especially important (used in meta description)
- Front-load important information
- Use clear, descriptive language

### Images
- Add descriptive cover images to notebooks
- Include images in posts when relevant
- Images significantly improve social sharing

## Maintenance

### Regular Updates
- Update sitemap as content changes
- Monitor search console for errors
- Update meta tags based on performance
- Keep structured data schema current

### Monitoring
- Check for broken canonical URLs
- Validate structured data regularly
- Monitor social media sharing previews
- Track organic search performance
