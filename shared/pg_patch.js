module.exports = function(pg) {
  if (pg.__patched) return;
  pg.__patched = true;

  const origClientQuery = pg.Client.prototype.query;
  const origPoolQuery = pg.Pool.prototype.query;

  // Matches our 10 database tables as standalone words in SQL queries
  const regex = /\b(access_requests|api_keys|audit_log|project_feedback|project_files|projects|published_projects|team_access|tickets|users)\b/g;

  function rewriteSql(args) {
    if (!args || args.length === 0) return args;

    const rewriteStr = (str) => {
      if (typeof str !== 'string') return str;
      return str.replace(regex, (match, p1, offset) => {
        // Ensure we don't double-prefix already prefixed table names
        if (offset >= 5 && str.substring(offset - 5, offset) === 'aace_') {
          return match;
        }
        return 'aace_' + match;
      });
    };

    if (typeof args[0] === 'string') {
      args[0] = rewriteStr(args[0]);
    } else if (args[0] && typeof args[0] === 'object' && typeof args[0].text === 'string') {
      args[0].text = rewriteStr(args[0].text);
    }
    return args;
  }

  pg.Client.prototype.query = function(...args) {
    return origClientQuery.apply(this, rewriteSql(args));
  };

  pg.Pool.prototype.query = function(...args) {
    return origPoolQuery.apply(this, rewriteSql(args));
  };

  console.log('[PG PATCH] PostgreSQL table prefix aace_ monkey-patch applied.');
};
