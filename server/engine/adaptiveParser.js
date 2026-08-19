import * as cheerio from 'cheerio';

/**
 * Multi-Selector Adaptive Parser & Schema Drift Detector
 * Prevents silent pipeline failures when websites update DOM classes, change tag hierarchy,
 * or A/B test layouts overnight.
 */

export class AdaptiveParser {
  constructor() {
    this.driftHistory = [];
  }

  /**
   * Parses HTML payload using a tiered strategy ladder
   * @param {string} html - Raw HTML from target
   * @param {string} sourceId - Identifier of the source (e.g. 'remoteok', 'sandbox')
   * @returns {Object} { listings: Array, driftReport: Object }
   */
  parseJobPayload(html, sourceId = 'generic') {
    if (!html || typeof html !== 'string') {
      return {
        listings: [],
        driftReport: { status: 'EMPTY_PAYLOAD', confidence: 0, strategyUsed: 'none' }
      };
    }

    const $ = cheerio.load(html);

    // Strategy 1: JSON-LD Structured Data (Highest fidelity, immune to CSS class changes)
    const jsonLdResult = this.tryJsonLd($);
    if (jsonLdResult.success && jsonLdResult.listings.length > 0) {
      return {
        listings: jsonLdResult.listings,
        driftReport: {
          strategyUsed: 'STRATEGY_1_JSON_LD',
          confidence: 1.0,
          driftDetected: false,
          details: 'Extracted pristine structured data from schema.org/JobPosting'
        }
      };
    }

    // Strategy 2: Primary CSS Selectors
    const primaryResult = this.tryPrimarySelectors($, sourceId);
    if (primaryResult.success && primaryResult.listings.length > 0) {
      return {
        listings: primaryResult.listings,
        driftReport: {
          strategyUsed: 'STRATEGY_2_PRIMARY_SELECTORS',
          confidence: 0.95,
          driftDetected: false,
          details: `Primary class match succeeded with ${primaryResult.listings.length} valid entities`
        }
      };
    }

    // Strategy 3: Heuristic Multi-Selector Fallback (Engaged when classes mutate overnight)
    const heuristicResult = this.tryHeuristicFallback($);
    if (heuristicResult.listings.length > 0) {
      const confidence = heuristicResult.confidence;
      const driftDetected = true;

      const driftReport = {
        strategyUsed: 'STRATEGY_3_HEURISTIC_FALLBACK',
        confidence,
        driftDetected,
        details: 'Primary CSS selectors broke (DOM Drift). Recovered listings via structural text & tag heuristics.'
      };

      this.driftHistory.push({
        sourceId,
        timestamp: Date.now(),
        ...driftReport
      });

      return {
        listings: heuristicResult.listings,
        driftReport
      };
    }

    // Pipeline Failure Safeguard
    return {
      listings: [],
      driftReport: {
        strategyUsed: 'FAILED_ALL_STRATEGIES',
        confidence: 0,
        driftDetected: true,
        details: 'Payload contained no recognizable job structures. Sent to DLQ for quarantine.'
      }
    };
  }

  /**
   * Strategy 1: Extracts from <script type="application/ld+json">
   */
  tryJsonLd($) {
    const listings = [];
    try {
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const raw = $(el).html();
          if (!raw) return;
          const parsed = JSON.parse(raw);
          const items = Array.isArray(parsed) ? parsed : [parsed];

          for (const item of items) {
            if (item['@type'] === 'JobPosting' || item.title) {
              listings.push({
                id: item.identifier?.value || `jsonld-${Math.random().toString(36).substring(2, 9)}`,
                title: item.title || item.name,
                company: item.hiringOrganization?.name || 'Unknown',
                location: item.jobLocation?.address?.addressLocality || (item.jobLocationType === 'TELECOMMUTE' ? 'Remote' : 'Worldwide'),
                salary: item.baseSalary?.value?.value ? `$${item.baseSalary.value.value}` : (item.salaryCurrency ? `${item.salaryCurrency} Open` : 'Competitive'),
                tags: Array.isArray(item.occupationalCategory) ? item.occupationalCategory : ['Engineering'],
                url: item.url || '#',
                timestamp: item.datePosted || new Date().toISOString(),
                extractionMethod: 'JSON-LD (Structured)'
              });
            }
          }
        } catch (_) {
          // ignore malformed JSON-LD blobs
        }
      });
      return { success: listings.length > 0, listings };
    } catch (_) {
      return { success: false, listings: [] };
    }
  }

  /**
   * Strategy 2: Tries known standard class selectors
   */
  tryPrimarySelectors($, sourceId) {
    const listings = [];

    // Check RemoteOK pattern
    $('tr.job, div.job-card, article.job-listing, .job-row').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, .title, .job-title, [itemprop="title"]').first().text().trim();
      const company = $el.find('.company, .company-name, [itemprop="hiringOrganization"], h3').first().text().trim();
      const location = $el.find('.location, .job-location, .region').first().text().trim() || 'Remote';
      const salary = $el.find('.salary, .compensation, .badge-salary').first().text().trim() || 'Competitive';
      const tags = [];
      $el.find('.tag, .badge, .skill').each((__, t) => {
        const txt = $(t).text().trim();
        if (txt && tags.length < 5) tags.push(txt);
      });

      if (title && title.length > 2) {
        listings.push({
          id: $el.attr('data-id') || `primary-${Math.random().toString(36).substring(2, 9)}`,
          title,
          company: company || 'Confidential',
          location: location || 'Remote',
          salary,
          tags: tags.length ? tags : ['Full-Time'],
          url: $el.find('a').first().attr('href') || '#',
          timestamp: new Date().toISOString(),
          extractionMethod: 'Primary CSS Selector'
        });
      }
    });

    return { success: listings.length > 0, listings };
  }

  /**
   * Strategy 3: Resilient heuristic fallback using regex & DOM patterns
   */
  tryHeuristicFallback($) {
    const listings = [];
    const salaryRegex = /(\$[\d,]+(\s*-\s*\$[\d,]+)?|\b\d{2,3}k\b|\bEUR\b|\bGBP\b)/i;
    const locationRegex = /\b(remote|hybrid|worldwide|usa|europe|uk|canada|india|germany|singapore)\b/i;

    // Search for semantic containers containing a heading followed by metadata
    $('div, li, section, article, tr').each((_, el) => {
      const $el = $(el);
      // Skip very large containers (like entire body/main)
      if ($el.children().length > 15 || $el.text().length > 800) return;

      const heading = $el.find('h1, h2, h3, h4, strong, a').filter((__, h) => {
        const text = $(h).text().trim();
        return text.length > 4 && text.length < 70 && !text.includes('Sign In') && !text.includes('Cookie');
      }).first();

      if (heading.length > 0) {
        const rawText = $el.text();
        const title = heading.text().trim();
        const hasSalary = salaryRegex.test(rawText);
        const hasLocation = locationRegex.test(rawText);

        if ((hasSalary || hasLocation) && title.length > 4) {
          const salaryMatch = rawText.match(salaryRegex);
          const locationMatch = rawText.match(locationRegex);

          // Extract secondary text as possible company
          const siblingText = $el.find('span, p, small, em').map((___, s) => $(s).text().trim()).get()
            .filter(t => t.length > 1 && t !== title && !salaryRegex.test(t))[0] || 'Unknown Company';

          listings.push({
            id: `heuristic-${Math.random().toString(36).substring(2, 9)}`,
            title,
            company: siblingText.substring(0, 40),
            location: locationMatch ? locationMatch[0].toUpperCase() : 'Remote (Inferred)',
            salary: salaryMatch ? salaryMatch[0] : 'Disclosed on Application',
            tags: ['Heuristic Fallback'],
            url: $el.find('a').attr('href') || '#',
            timestamp: new Date().toISOString(),
            extractionMethod: 'Fuzzy DOM Heuristics'
          });
        }
      }
    });

    // Deduplicate by title
    const unique = [];
    const seen = new Set();
    for (const item of listings) {
      if (!seen.has(item.title.toLowerCase())) {
        seen.add(item.title.toLowerCase());
        unique.push(item);
      }
    }

    const confidence = unique.length > 0 ? 0.72 : 0;
    return { listings: unique.slice(0, 20), confidence };
  }

  getDriftHistory() {
    return this.driftHistory;
  }
}
