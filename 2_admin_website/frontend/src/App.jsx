// =============================================================================
// 2_admin_website/frontend/src/App.jsx
// Admin App console (SSO/Entra ID authentication removed)
// =============================================================================

import { useState, useEffect } from 'react';
import { ToastProvider, useToast } from './context/ToastContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Submissions from './pages/Submissions';
import Published from './pages/Published';
import Tickets from './pages/Tickets';
import Settings from './pages/Settings';
import Feedback from './pages/Feedback';
import Teams from './pages/Teams';

const API = '/admin';

// Normalise DB function names → DEPT_INFO keys used by Dashboard.jsx
const DEPT_ALIAS = {
  'Sales & Commercial': 'Sales Commercial',
  'Sales and Commercial': 'Sales Commercial',
  'Marine Oil & Gas': 'Marine, Oil & Gas',
  'Marine Oil and Gas': 'Marine, Oil & Gas',
  'Plant': 'Plants',
};

function AdminApp() {
  const [authChecked, setAuthChecked] = useState(true);

  const [page, setPage] = useState('dashboard');
  const [projects, setProjects] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [editTickets, setEditTickets] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Authenticated fetch wrapper to inject Bearer access token into header requests
  const fetchWithAuth = async (url, options = {}) => {
    const headers = {
      ...options.headers,
      'Authorization': 'Bearer mock-developer-token'
    };

    return fetch(url, {
      ...options,
      headers
    });
  };

  // ── Fetch projects from admin backend ──────────────────────────────────
  const fetchProjects = () => {
    fetchWithAuth(`${API}/api/projects`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.error('Backend returned an error instead of an array:', data);
          setProjects([]);
          return;
        }
        // Normalise API response to match the shape the UI components expect
        const normalised = data.map(p => ({
          id:     String(p.project_id),
          team:   p.team_name,
          proj:   p.title,
          dept:   DEPT_ALIAS[p.function] || p.function,
          desc:   p.description,
          status: capitaliseStatus(p.status),
          date:   new Date(p.submitted_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
          time:   new Date(p.submitted_at).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' }),
          lead:   p.team_lead || p.contact_person || '',
          email:  p.contact_email || '',
          code:   `PRJ-${p.project_id}`,
          cat:    p.category || p.function || '',
          category: p.category || '',
          start:  p.start_date || '',
          end:    p.end_date || '',
          ms:     [],
          tech:   (p.fields_selected || '').split(',').filter(Boolean),
          // Extended fields for the full project detail
          contactPerson:       p.contact_person || '',
          contactEmail:        p.contact_email  || '',
          altContact:          p.alt_contact    || '',
          whyWeUseIt:          p.why_we_use_it  || '',
          whoManagesIt:        p.who_manages_it || '',
          escalation1Name:     p.escalation1_name  || '',
          escalation1Email:    p.escalation1_email || '',
          escalation2Name:     p.escalation2_name  || '',
          escalation2Email:    p.escalation2_email || '',
          dataSource:          p.data_source        || '',
          dataOwner:           p.data_owner         || '',
          dataValidatedBy:     p.data_validated_by  || '',
          dashboardDeveloper:  p.dashboard_developer || '',
          dashboardOwner:      p.dashboard_owner     || '',
          lastValidated:       p.last_validated      || '',
          dashboardLink:       p.dashboard_link      || '',
          businessCase:        p.business_case      || '',
          techStack:           p.tech_stack         || '',
          dataDeveloper:       p.data_developer     || '',
          // Raw fields preserved for API calls
          _projectId: p.project_id,
          _status:    p.status,
          _version:   p.version,
          _submittedAt: p.submitted_at,
        }));
        setProjects(normalised);
      })
      .catch(err => {
        console.error('Failed to fetch projects:', err.message);
        toast('Could not load projects from backend.', 'e');
      })
      .finally(() => setLoading(false));
  };

  // ── Fetch tickets from admin backend ───────────────────────────────────
  const fetchTickets = () => {
    fetchWithAuth(`${API}/api/tickets`)
      .then(r => r.json())
      .then(data => setTickets(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to fetch tickets:', err.message));

    fetchWithAuth(`${API}/api/feedback`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEditTickets(data.filter(f => f.type === 'required_changes'));
          setFeedback(data.filter(f => f.type === 'website_feedback'));
        }
      })
      .catch(err => console.error('Failed to fetch edit tickets:', err.message));
  };

  // ── Fetch teams from admin backend ─────────────────────────────────────
  const fetchTeams = () => {
    fetchWithAuth(`${API}/api/teams`)
      .then(r => r.json())
      .then(data => setTeams(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to fetch teams:', err.message));
  };

  // Initialize and poll data only after client token flow resolves
  useEffect(() => {
    if (!authChecked) return;

    fetchProjects();
    fetchTickets();
    fetchTeams();

    const interval = setInterval(() => {
      fetchProjects();
      fetchTickets();
      fetchTeams();
    }, 30000);

    return () => clearInterval(interval);
  }, [authChecked]);

  // ── Status helper ──────────────────────────────────────────────────────
  function capitaliseStatus(s) {
    if (!s) return 'Pending';
    const map = {
      submitted:          'Pending',
      under_review:       'Pending',
      approved:           'Pending',
      rejected:           'Rejected',
      changes_requested:  'Pending',
      published:          'Published',
    };
    return map[s] || s.charAt(0).toUpperCase() + s.slice(1);
  }

  // ── Action handlers — call API then refresh ────────────────────────────
  const handlePublish = async (id) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    try {
      const res = await fetchWithAuth(`${API}/api/projects/${project._projectId}/publish`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      toast('Project published successfully!', 's');
      fetchProjects();
    } catch (err) {
      console.error('Publish failed:', err.message);
      toast('Failed to publish project.', 'e');
    }
  };

  const handleReject = async (id, reason) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    try {
      const res = await fetchWithAuth(`${API}/api/projects/${project._projectId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected', comment: reason || '' }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast('Submission rejected.', 'e');
      fetchProjects();
    } catch (err) {
      console.error('Reject failed:', err.message);
      toast('Failed to reject project.', 'e');
    }
  };

  const handleRequestChanges = async (id, reason) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    try {
      const res = await fetchWithAuth(`${API}/api/projects/${project._projectId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'changes_requested', comment: reason || '' }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast('Change request sent.', 'i');
      fetchProjects();
    } catch (err) {
      console.error('Request changes failed:', err.message);
      toast('Failed to send change request.', 'e');
    }
  };

  const handleUnpublish = async (id) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    try {
      const res = await fetchWithAuth(`${API}/api/projects/${project._projectId}/unpublish`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      toast('Project unpublished.', 'i');
      fetchProjects();
    } catch (err) {
      console.error('Unpublish failed:', err.message);
      toast('Failed to unpublish project.', 'e');
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#152336] text-white">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-orange-500 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-sm font-semibold tracking-wider text-gray-300">Redirecting to Microsoft Entra ID...</p>
        </div>
      </div>
    );
  }

  const pendingCount = projects.filter(s => s.status === 'Pending').length;
  const pendingTickets = tickets.filter(t => t.status === 'pending').length + editTickets.filter(e => e.status === 'pending' || !e.status).length;

  const sharedProps = {
    projects,
    submissions: projects, // legacy alias for Submissions/Dashboard pages
    onPublish: handlePublish,
    onReject: handleReject,
    onRequestChanges: handleRequestChanges,
    onUnpublish: handleUnpublish,
    loading,
    refetch: fetchProjects,
  };

  return (
    <Layout page={page} onNav={setPage} pendingCount={pendingCount} pendingTickets={pendingTickets}>
      {page === 'dashboard'   && <Dashboard {...sharedProps} />}
      {page === 'submissions' && <Submissions {...sharedProps} />}
      {page === 'published'   && <Published {...sharedProps} />}
      {page === 'feedback'    && <Feedback feedback={feedback} />}
      {page === 'teams'       && <Teams projects={projects} tickets={tickets} teams={teams} onRefetchProjects={fetchProjects} onRefetchTeams={fetchTeams} />}
      {page === 'tickets'     && <Tickets tickets={tickets} editTickets={editTickets} projects={projects} refetchTickets={fetchTickets} />}
      {page === 'settings'    && <Settings />}
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AdminApp />
    </ToastProvider>
  );
}
