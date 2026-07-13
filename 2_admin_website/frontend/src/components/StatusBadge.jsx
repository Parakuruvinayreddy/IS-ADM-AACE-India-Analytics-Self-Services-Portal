export default function StatusBadge({ status }) {
  const color = status === 'Pending' ? '#F97316' : status === 'Published' ? '#22C55E' : '#EF4444';
  return (
    <span className="status">
      <span className="dot" style={{ background: color }} />
      <span style={{ color }}>{status}</span>
    </span>
  );
}
