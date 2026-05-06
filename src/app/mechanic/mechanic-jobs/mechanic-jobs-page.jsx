import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toastError } from '../../../app-core/services/toast-service';
import './mechanic-jobs-page.scss';
import { mechanicJobService } from '../../../app-core/services/mechanic-service';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_META = {
	AssignedToMechanic: { bg: '#f0f9ff', color: '#0369a1', dot: '#0ea5e9', label: 'Assigned' },
	InProgress: { bg: '#fefce8', color: '#a16207', dot: '#eab308', label: 'In Progress' },
	WaitingForParts: { bg: '#fdf4ff', color: '#7e22ce', dot: '#a855f7', label: 'Waiting for Parts' },
	QualityCheck: { bg: '#fff7ed', color: '#c2410c', dot: '#f97316', label: 'Quality Check' },
	Completed: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Completed' },
	Paid: { bg: '#f0fdf4', color: '#15803d', dot: '#22c55e', label: 'Paid' },
};

const FILTERS = [
	{ key: 'all', label: 'All' },
	{ key: 'active', label: 'Active' },
	{ key: 'qc', label: 'Quality Check' },
	{ key: 'done', label: 'Completed' },
];

const ACTIVE_KEYS = ['AssignedToMechanic', 'InProgress', 'WaitingForParts'];
const DONE_KEYS = ['Completed', 'Paid'];

const normalise = (s) => s?.replace(/ /g, '') ?? '';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ statusLabel }) {
	const key = normalise(statusLabel);
	const m = STATUS_META[key] || { bg: '#f3f4f6', color: '#374151', dot: '#9ca3af', label: statusLabel };
	return (
		<span className="mj-status" style={{ background: m.bg, color: m.color }}>
			<span className="mj-status__dot" style={{ background: m.dot }} />
			{m.label}
		</span>
	);
}

function SkeletonCard() {
	return (
		<div className="mj-card mj-card--skeleton">
			<div className="mj-left">
				<div className="sk-box" style={{ width: '55%', height: 15, marginBottom: 8 }} />
				<div className="sk-box" style={{ width: '70%', height: 12, marginBottom: 8 }} />
				<div className="sk-box" style={{ width: '35%', height: 11 }} />
			</div>
			<div className="sk-box" style={{ width: 90, height: 26, borderRadius: '1rem' }} />
		</div>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MechanicJobsPage() {
	const navigate = useNavigate();

	const [jobs, setJobs] = useState([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState('all');

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

	const getCount = (key) => {
		if (key === 'all') return jobs.length;
		if (key === 'active') return jobs.filter((j) => ACTIVE_KEYS.includes(normalise(j.statusLabel))).length;
		if (key === 'qc') return jobs.filter((j) => normalise(j.statusLabel) === 'QualityCheck').length;
		if (key === 'done') return jobs.filter((j) => DONE_KEYS.includes(normalise(j.statusLabel))).length;
		return 0;
	};

	const filtered = jobs.filter((j) => {
		const raw = normalise(j.statusLabel);
		if (filter === 'active') return ACTIVE_KEYS.includes(raw);
		if (filter === 'qc') return raw === 'QualityCheck';
		if (filter === 'done') return DONE_KEYS.includes(raw);
		return true;
	});

	return (
		<div className="dashboard-page mj-page">
			<section className="page-hero compact">
				<div>
					<p className="page-kicker">Mechanic</p>
					<h1>My Jobs</h1>
					<p>{jobs.length} total assigned</p>
				</div>
			</section>

			{/* Filter tabs */}
			<div className="mj-filters">
				{FILTERS.map((f) => (
					<button
						key={f.key}
						className={`mj-filter-btn ${filter === f.key ? 'mj-filter-btn--active' : ''}`}
						onClick={() => setFilter(f.key)}
					>
						{f.label}
						{!loading && <span className="mj-filter-count">{getCount(f.key)}</span>}
					</button>
				))}
			</div>

			<div className="mj-list">
				{loading ? (
					Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
				) : filtered.length === 0 ? (
					<div className="empty-panel">
						<div className="empty-panel-icon">🔧</div>
						<h2>
							{filter === 'all'
								? 'No jobs assigned'
								: `No ${FILTERS.find((f) => f.key === filter)?.label.toLowerCase()} jobs`}
						</h2>
						<p>Jobs assigned to you will appear here.</p>
					</div>
				) : (
					filtered.map((job) => (
						<div key={job.id} className="mj-card" onClick={() => navigate(`/mechanic/jobs/${job.id}`)}>
							<div className="mj-left">
								<h3>{job.serviceType?.name}</h3>
								<p>
									{job.vehicle?.make} {job.vehicle?.model} · {job.vehicle?.licensePlate}
								</p>
								<span className="mj-date">📅 {fmtDate(job.scheduledDate)}</span>
							</div>
							<StatusBadge statusLabel={job.statusLabel} />
						</div>
					))
				)}
			</div>
		</div>
	);
}
