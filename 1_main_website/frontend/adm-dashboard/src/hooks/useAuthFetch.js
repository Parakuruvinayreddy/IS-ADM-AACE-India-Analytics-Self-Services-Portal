// =============================================================================
// 1_main_website/frontend/adm-dashboard/src/hooks/useAuthFetch.js
// Custom React Hook to perform authenticated HTTP requests with mock token
// =============================================================================

export function useAuthFetch() {
  const authFetch = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': 'Bearer mock-developer-token'
    };

    return fetch(url, {
      ...options,
      headers
    });
  };

  return authFetch;
}
