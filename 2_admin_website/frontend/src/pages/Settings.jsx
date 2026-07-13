const SETTINGS = [
  ["Admin Name", "Admin User"],
  ["Email", "admin@internal.corp"],
  ["Role", "Administrator"],
  ["Portal Version", "v2.4.1"],
];

export default function Settings() {
  return (
    <>
      <div className="pg-title">Settings</div>
      <div style={{ marginTop: 18 }}>
        <div className="settings-card">
          <div style={{ fontFamily: 'Sora,sans-serif', fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Admin Account</div>
          {SETTINGS.map(([label, val]) => (
            <div className="setting-row" key={label}>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b' }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
