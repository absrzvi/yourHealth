export default function SettingsPage() {
  return (
    <div className="content-section active">
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <div className="widget-card">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>👤</div>
          <div className="card-title">Account Management</div>
        </div>
        <div className="text-gray-500">Placeholder for account management options.</div>
      </div>
      <div className="widget-card mt-8">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>🔗</div>
          <div className="card-title">Integrations</div>
        </div>
        <div className="text-gray-500">Placeholder for integration settings.</div>
      </div>
      <div className="widget-card mt-8">
        <div className="card-header">
          <div className="card-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>⚙️</div>
          <div className="card-title">Preferences</div>
        </div>
        <div className="text-gray-500">Placeholder for user preferences.</div>
      </div>
    </div>
  );
}
