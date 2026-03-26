# VThePeople: LLM SEO Implementation Guide for Claude Code

## File Manifest and Deployment Locations

### Root directory files (place at site root: vthepeople.org/)

| File | Deploy to | Purpose |
|---|---|---|
| `robots.txt` | `/robots.txt` | Explicitly allows all major AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.) and points to sitemap |
| `sitemap.xml` | `/sitemap.xml` | Standard XML sitemap with lastmod dates for all pages |
| `llms.txt` | `/llms.txt` | Markdown-formatted guide for LLM crawlers. Follows the llmstxt.org spec. Tells AI systems where the high-value content is and how to cite it |
| `llms-full.txt` | `/llms-full.txt` | Full-text Markdown version of entire site content for LLM inference. Allows AI systems to ingest all content in one request |
| `feed.xml` | `/feed.xml` | Atom feed for content freshness signals. Update the `<updated>` timestamps whenever content changes |

### Content pages (place in your site's page/routing structure)

| File | Deploy to | Schema types included |
|---|---|---|
| `article-v-convention.html` | `/article-v-convention` | ScholarlyArticle, BreadcrumbList, citation objects |
| `faq.html` | `/article-v-convention/faq` | FAQPage with 44 Q&A pairs |
| `glossary.html` | `/article-v-convention/glossary` | DefinedTermSet with 22 terms |
| `strategy.html` | `/article-v-convention/strategy` | ScholarlyArticle |

### Template snippet (include in every page's `<head>`)

| File | What to do |
|---|---|
| `schema-sitewide.html` | Copy the three `<script type="application/ld+json">` blocks into the `<head>` of every page on the site. These define the Organization, WebSite, and Person (author) schemas that establish sitewide identity for crawlers. |

## Post-Deployment Checklist

### 1. Verify file accessibility
After deployment, confirm all root files return HTTP 200:
```
curl -I https://vthepeople.org/robots.txt
curl -I https://vthepeople.org/sitemap.xml
curl -I https://vthepeople.org/llms.txt
curl -I https://vthepeople.org/llms-full.txt
curl -I https://vthepeople.org/feed.xml
```

### 2. Validate structured data
Run each content page through Google's Rich Results Test:
https://search.google.com/test/rich-results

Check that:
- `article-v-convention.html` shows ScholarlyArticle
- `faq.html` shows FAQPage with all 44 Q&A pairs
- `glossary.html` shows DefinedTermSet
- `strategy.html` shows ScholarlyArticle

### 3. Submit sitemap to search engines
- Google Search Console: Submit `https://vthepeople.org/sitemap.xml`
- Bing Webmaster Tools: Submit same URL

### 4. Verify AI crawler access
Check server logs after 1-2 weeks for hits from:
- GPTBot (OpenAI)
- ClaudeBot (Anthropic)
- PerplexityBot
- Google-Extended
- Bingbot

### 5. Add `<link>` tags to all pages
In the `<head>` of every page, add:
```html
<link rel="alternate" type="application/atom+xml" title="VThePeople" href="https://vthepeople.org/feed.xml">
```

### 6. Content headers
Ensure your server returns these headers for llms.txt and llms-full.txt:
```
Content-Type: text/plain; charset=utf-8
```
And for feed.xml:
```
Content-Type: application/atom+xml; charset=utf-8
```

## Ongoing Maintenance

### When you publish new content:
1. Add the new page to `sitemap.xml` with current `<lastmod>` date
2. Add a new entry to `feed.xml` with current `<updated>` timestamp
3. Add a link to the new page in the appropriate `## Section` of `llms.txt`
4. Regenerate `llms-full.txt` to include the new page's full text
5. Update `<lastmod>` dates on any existing pages that link to the new content

### When you update existing content:
1. Update `<lastmod>` in `sitemap.xml` for that page
2. Update `<updated>` in `feed.xml` for that entry
3. Update `dateModified` in any JSON-LD schema on the page
4. Regenerate `llms-full.txt`

### Quarterly:
- Verify the current Article V application count and update FAQ answers if the count has changed
- Check Google Search Console for any structured data errors
- Review server logs for AI crawler activity
- Test a handful of Article V questions in ChatGPT, Claude, and Perplexity to see if your content is being cited
