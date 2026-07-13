/**
 * Fetch with automatic retry logic.
 * Retries up to `maxRetries` times with exponential backoff.
 * This handles the case where the backend (port 3000) hasn't started yet.
 */
export async function fetchWithRetry(url, options = {}, maxRetries = 5, baseDelay = 2000) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      if (attempt < maxRetries) {
        // Exponential backoff: 2s, 4s, 8s, 16s, 32s
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`[fetchWithRetry] Attempt ${attempt + 1} failed for ${url}, retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error(`[fetchWithRetry] All ${maxRetries + 1} attempts failed for ${url}`);
        throw err;
      }
    }
  }
}

/**
 * Fetch published projects with retry.
 * Returns an array of published projects or an empty array on failure.
 */
export async function fetchPublishedProjects() {
  try {
    const data = await fetchWithRetry(`/api/published-projects`);
    return Array.isArray(data) ? data : (data.projects || []);
  } catch {
    return [];
  }
}
