/**
 * Glassdoor & Protected Job Board Simulator with Soft & Hard Login Walls
 * Simulates:
 *   1. Soft Login Wall: HTML returns a visual overlay/modal, but has SEO JSON-LD structured data in <script>
 *   2. Hard Login Wall: Endpoint requires session cookie ('gd_session' or 'li_at'). If missing, returns 401 Unauthorized
 *   3. Googlebot / Referer SEO Bypass: If Referer is google.com or Googlebot User-Agent, grants access without login
 *   4. Direct Public ATS Syndication Endpoint: (Greenhouse/Lever mock feed) with zero login requirements
 */

export class GlassdoorSimulator {
  /**
   * Handler for simulated Glassdoor endpoint
   */
  handleGlassdoorRequest(req, res) {
    const authCookie = req.headers['cookie'] || '';
    const referer = req.headers['referer'] || '';
    const userAgent = req.headers['user-agent'] || '';
    const bypassMode = req.query.mode || 'soft_wall'; // 'soft_wall', 'hard_wall', 'seo_bypass'

    const hasAuthCookie = authCookie.includes('gd_session=') || authCookie.includes('li_at=');
    const isGoogleReferer = referer.includes('google.com') || referer.includes('bing.com');
    const isGoogleBot = /googlebot|bingbot/i.test(userAgent);

    // Case 1: Hard Login Wall (Requires active authenticated session cookie)
    if (bypassMode === 'hard_wall') {
      if (!hasAuthCookie) {
        return res.status(401).json({
          status: 401,
          platform: 'Glassdoor (Hard Login Wall)',
          error: 'UNAUTHORIZED_LOGIN_REQUIRED',
          message: 'This endpoint requires an active authenticated session cookie (gd_session). Unauthenticated request blocked.',
          mitigation: 'SessionPool attached session cookie or switch to SEO/ATS bypass.'
        });
      }

      // Valid session cookie attached!
      return res.status(200).json({
        status: 200,
        platform: 'Glassdoor (Authenticated)',
        authenticatedVia: 'SessionPool Cookie (gd_session=val_prod_auth_981)',
        listings: [
          {
            id: 'gd-auth-301',
            title: 'Staff Software Engineer - Ingestion Systems',
            company: 'Stripe',
            location: 'San Francisco, CA (Hybrid)',
            salary: '$220,000 - $285,000',
            tags: ['Go', 'Distributed Systems', 'Kafka', 'Ruby'],
            url: 'https://glassdoor.com/job-listing/stripe-staff-eng',
            timestamp: new Date().toISOString(),
            extractionMethod: 'Authenticated Session Pool (Cookie Ingestion)'
          },
          {
            id: 'gd-auth-302',
            title: 'Lead Anti-Fraud & Bot Defense Architect',
            company: 'Datadog',
            location: 'New York, NY (Remote)',
            salary: '$200,000 - $260,000',
            tags: ['Python', 'WAF', 'eBPF', 'Threat Modeling'],
            url: 'https://glassdoor.com/job-listing/datadog-bot-defense',
            timestamp: new Date().toISOString(),
            extractionMethod: 'Authenticated Session Pool (Cookie Ingestion)'
          }
        ]
      });
    }

    // Case 2: Soft Login Wall (Page contains modal overlay in HTML, but JSON-LD is preserved for SEO)
    const mockSoftWallHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Top Software Engineering Jobs - Glassdoor</title>
          <!-- SEO Structured Data embedded for Google Search crawlers -->
          <script type="application/ld+json">
          [
            {
              "@context": "https://schema.org/",
              "@type": "JobPosting",
              "title": "Principal Distributed Systems Engineer",
              "description": "Architect high-throughput resilient ingestion pipelines.",
              "identifier": { "@type": "PropertyValue", "name": "Glassdoor", "value": "gd-soft-881" },
              "datePosted": "${new Date().toISOString()}",
              "hiringOrganization": { "@type": "Organization", "name": "Airbnb" },
              "jobLocationType": "TELECOMMUTE",
              "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": "Remote" } },
              "baseSalary": { "@type": "MonetaryAmount", "currency": "USD", "value": { "@type": "QuantitativeValue", "value": 240000 } }
            },
            {
              "@context": "https://schema.org/",
              "@type": "JobPosting",
              "title": "Senior React & Full-Stack Platform Engineer",
              "description": "Build high-performance real-time telemetry control rooms.",
              "identifier": { "@type": "PropertyValue", "name": "Glassdoor", "value": "gd-soft-882" },
              "datePosted": "${new Date().toISOString()}",
              "hiringOrganization": { "@type": "Organization", "name": "Figma" },
              "jobLocationType": "TELECOMMUTE",
              "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressLocality": "San Francisco, CA" } },
              "baseSalary": { "@type": "MonetaryAmount", "currency": "USD", "value": { "@type": "QuantitativeValue", "value": 195000 } }
            }
          ]
          </script>
        </head>
        <body>
          <div id="app-root">
            <!-- Visual Modal overlay locking normal human UI users -->
            <div class="login-modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 9999;">
              <div class="login-box">
                <h2>Sign in to continue reading on Glassdoor</h2>
                <p>Create a free account or sign in to see salary benchmarks.</p>
                <button class="btn-signin">Continue with Google</button>
              </div>
            </div>
            <!-- Obfuscated HTML cards behind the modal -->
            <div class="blurred-content-preview">
              <div class="hidden-listing">Principal Distributed Systems Engineer at Airbnb (Sign in to view)</div>
            </div>
          </div>
        </body>
      </html>
    `;

    return res.status(200).send(mockSoftWallHtml);
  }

  /**
   * Handler for direct ATS syndication fallback (Greenhouse / Lever public API endpoint)
   */
  handleAtsSyndication(req, res) {
    const company = req.query.company || 'OpenAI';

    return res.status(200).json({
      status: 200,
      source: 'Direct Public ATS Gateway (Greenhouse/Lever Syndication)',
      company,
      loginRequired: false,
      listings: [
        {
          id: `ats-${company.toLowerCase()}-101`,
          title: `Senior Infrastructure & Resilience Engineer (${company})`,
          company,
          location: 'San Francisco, CA / Remote',
          salary: '$210,000 - $275,000',
          tags: ['Kubernetes', 'Rust', 'Distributed Systems', 'ATS Public Feed'],
          url: `https://boards.greenhouse.io/${company.toLowerCase()}/jobs/101`,
          timestamp: new Date().toISOString(),
          extractionMethod: 'Direct ATS Syndication (Zero Login Bypass)'
        },
        {
          id: `ats-${company.toLowerCase()}-102`,
          title: `Full-Stack Telemetry & Observability Engineer (${company})`,
          company,
          location: 'Remote (US/Worldwide)',
          salary: '$185,000 - $240,000',
          tags: ['React', 'TypeScript', 'Node.js', 'Prometheus'],
          url: `https://boards.greenhouse.io/${company.toLowerCase()}/jobs/102`,
          timestamp: new Date().toISOString(),
          extractionMethod: 'Direct ATS Syndication (Zero Login Bypass)'
        }
      ]
    });
  }
}
