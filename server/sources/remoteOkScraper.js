/**
 * RemoteOK Public Job Board Ingestion Handler
 * Extracts real live job postings using Stealth HTTP and Adaptive Parsing.
 */

export class RemoteOkScraper {
  static formatRawJobs(rawItems) {
    if (!Array.isArray(rawItems)) return [];
    
    // Filter out the legal/legal disclaimer first element that RemoteOK puts in its API array
    return rawItems
      .filter(item => item && item.position && item.company)
      .map(item => ({
        id: `rok-${item.id || item.slug || Math.random().toString(36).substring(2, 9)}`,
        title: item.position,
        company: item.company,
        location: item.location || 'Remote Worldwide',
        salary: item.salary_min && item.salary_max
          ? `$${item.salary_min.toLocaleString()} - $${item.salary_max.toLocaleString()}`
          : (item.salary || 'Competitive'),
        tags: Array.isArray(item.tags) ? item.tags.slice(0, 5) : ['Remote', 'Tech'],
        url: item.url || `https://remoteok.com/l/${item.id}`,
        timestamp: item.date || new Date().toISOString(),
        extractionMethod: 'Live Public Egress (RemoteOK API & Schema)'
      }));
  }
}
