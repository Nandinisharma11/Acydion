/**
 * Jobicy Public Remote Job Feed Handler
 * Extracts real live job postings from Jobicy public API with resilience normalization.
 */

export class JobicyScraper {
  static formatRawJobs(rawResponse) {
    const rawJobs = rawResponse?.jobs || (Array.isArray(rawResponse) ? rawResponse : []);

    return rawJobs.map(item => ({
      id: `jby-${item.id || Math.random().toString(36).substring(2, 9)}`,
      title: item.jobTitle || item.title || 'Software Engineer',
      company: item.companyName || item.company || 'Tech Org',
      location: item.jobGeo || item.location || 'Remote',
      salary: item.annualSalaryMin && item.annualSalaryMax
        ? `$${item.annualSalaryMin.toLocaleString()} - $${item.annualSalaryMax.toLocaleString()}`
        : (item.salary || 'Competitive'),
      tags: Array.isArray(item.jobIndustry) ? item.jobIndustry : [item.jobCategory || 'Engineering'],
      url: item.url || item.jobUrl || '#',
      timestamp: item.pubDate || new Date().toISOString(),
      extractionMethod: 'Live Public Feed (Jobicy V2)'
    }));
  }
}
