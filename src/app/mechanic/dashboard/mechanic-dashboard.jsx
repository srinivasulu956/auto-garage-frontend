import { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './mechanic-dashboard.scss';
import { toastError } from '../../../app-core/services/toast-service';
import { mechanicJobService } from '../../../app-core/services/mechanic-service';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_META = {
	AssignedToMechanic: { bg: '#f0f9ff', color: '#0369a1', dot: '#0ea5e9', label: 'Assigned' },
	InProgress: { bg: '#fefce8', color: '#a16207', dot: '#eab308', label: 'In Progress' },
	WaitingForParts: { bg: '#fdf4ff', color: '#7e22ce', dot: '#a855f7', label: 'Waiting for Parts' },
	QualityCheck: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', label: 'Quality Check' },
	Completed: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Completed' },
	Paid: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Paid' },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
	const m = STATUS_META[status] || { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af', label: status };
	return (
		<span className="mcd-badge" style={{ background: m.bg, color: m.color }}>
			<span className="mcd-badge__dot" style={{ background: m.dot }} />
			{m.label}
		</span>
	);
}

function MetricCard({ icon, label, value, accent, onClick }) {
	return (
		<div
			className={`metric-card mcd-metric ${onClick ? 'mcd-metric--clickable' : ''}`}
			style={{ '--accent': accent }}
			onClick={onClick}
		>
			<div className="mcd-metric__icon">{icon}</div>
			<div className="mcd-metric__body">
				<strong className="mcd-metric__value">{value ?? '—'}</strong>
				<span className="mcd-metric__label">{label}</span>
			</div>
			{onClick && <span className="mcd-metric__arrow">→</span>}
		</div>
	);
}

function SkeletonRow() {
	return (
		<div className="mcd-job-row mcd-job-row--skeleton">
			<div className="sk" style={{ width: '45%', height: 13 }} />
			<div className="sk" style={{ width: '25%', height: 13 }} />
			<div className="sk" style={{ width: 70, height: 22, borderRadius: '1rem' }} />
		</div>
	);
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MechanicDashboard() {
	const navigate = useNavigate();
	const userData = useSelector((s) => s.commonState.loggedUserData);
	const firstName = userData?.user?.firstName || 'Mechanic';

	const [jobs, setJobs] = useState([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async () => {
		try {
			setLoading(true);
			const data = await mechanicJobService.getAll();
			setJobs(data || []);
		} catch {
			toastError('Failed to load jobs');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	// ── Derived stats ──────────────────────────────────────────────────────────
	const activeJobs = jobs.filter((j) =>
		['AssignedToMechanic', 'InProgress', 'WaitingForParts'].includes(j.statusLabel?.replace(/ /g, ''))
	);
	const inQC = jobs.filter((j) => j.statusLabel?.replace(/ /g, '') === 'QualityCheck');
	const completed = jobs.filter((j) => ['Completed', 'Paid'].includes(j.statusLabel?.replace(/ /g, '')));
	const recentJobs = [...jobs].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5);

	return (
		<div className="dashboard-page">
			{/* ── Hero ── */}
			<section className="page-hero compact">
				<div>
					<p className="page-kicker">Workshop</p>
					<h1>Welcome back, {firstName} 👋</h1>
					<p>Here is a snapshot of your current workload.</p>
				</div>
			</section>

			{/* ── Quick actions ── */}
			<div className="mcd-quick-grid">
				<button className="mcd-quick-card" onClick={() => navigate('/mechanic/jobs')}>
					<span className="mcd-quick-card__icon">📋</span>
					<span>My Jobs</span>
				</button>
				<button className="mcd-quick-card" onClick={() => navigate('/mechanic/details')}>
					<span className="mcd-quick-card__icon">👤</span>
					<span>My Profile</span>
				</button>
			</div>

			{/* ── Metrics ── */}
			<div className="metric-grid mcd-metric-grid">
				<MetricCard
					icon="🔧"
					label="Active Jobs"
					value={loading ? '…' : activeJobs.length}
					accent="#0ea5e9"
					onClick={() => navigate('/mechanic/jobs')}
				/>
				<MetricCard
					icon="🔍"
					label="In Quality Check"
					value={loading ? '…' : inQC.length}
					accent="#f97316"
					onClick={() => navigate('/mechanic/jobs')}
				/>
				<MetricCard icon="✅" label="Completed" value={loading ? '…' : completed.length} accent="#22c55e" />
				<MetricCard icon="📋" label="Total Assigned" value={loading ? '…' : jobs.length} accent="#a855f7" />
			</div>

			{/* ── Recent Jobs ── */}
			<div className="mcd-panel">
				<div className="mcd-panel__header">
					<h2>Recent Jobs</h2>
					<button className="mcd-link-btn" onClick={() => navigate('/mechanic/jobs')}>
						View all →
					</button>
				</div>

				{loading ? (
					Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
				) : recentJobs.length === 0 ? (
					<div className="empty-panel">
						<div className="empty-panel-icon">🔧</div>
						<h2>No jobs yet</h2>
						<p>Jobs assigned to you will appear here.</p>
					</div>
				) : (
					<div className="mcd-job-list">
						{recentJobs.map((job) => {
							const raw = job.statusLabel?.replace(/ /g, '');
							return (
								<div
									key={job.id}
									className="mcd-job-row"
									onClick={() => navigate(`/mechanic/jobs/${job.id}`)}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => e.key === 'Enter' && navigate(`/mechanic/jobs/${job.id}`)}
								>
									<div className="mcd-job-row__info">
										<span className="mcd-job-row__service">{job.serviceType?.name}</span>
										<span className="mcd-job-row__vehicle">
											{job.vehicle?.make} {job.vehicle?.model} · {job.vehicle?.licensePlate}
										</span>
									</div>
									<span className="mcd-job-row__date">{fmtDate(job.scheduledDate)}</span>
									<StatusBadge status={raw} />
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
