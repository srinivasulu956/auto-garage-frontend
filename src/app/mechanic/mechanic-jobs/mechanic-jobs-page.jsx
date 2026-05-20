import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { mechanicJobService } from '../../../app-core/services/mechanic-service';
import { toastError } from '../../../app-core/services/toast-service';
import StatusBadgeBase from '../../../shared/components/status-badge/status-badge';
import { MECHANIC_ACTIVE_JOB_STATUSES, MECHANIC_DONE_JOB_STATUSES, MECHANIC_JOB_FILTERS } from '../../../shared/data-modals/booking-status';
import { formatDateIN } from '../../../shared/utils/date-formatters';
import { normalizeStatusKey } from '../../../shared/utils/status';
import './mechanic-jobs-page.scss';

function StatusBadge({ statusLabel }) {
	return <StatusBadgeBase className="mj-status" dotClassName="mj-status__dot" status={statusLabel} variant="mechanic" />;
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

	const filterCounts = useMemo(
		() => ({
			all: jobs.length,
			active: jobs.filter((job) => MECHANIC_ACTIVE_JOB_STATUSES.includes(normalizeStatusKey(job.statusLabel))).length,
			qc: jobs.filter((job) => normalizeStatusKey(job.statusLabel) === 'QualityCheck').length,
			done: jobs.filter((job) => MECHANIC_DONE_JOB_STATUSES.includes(normalizeStatusKey(job.statusLabel))).length,
		}),
		[jobs]
	);

	const filtered = useMemo(
		() =>
			jobs.filter((job) => {
				const statusKey = normalizeStatusKey(job.statusLabel);
				if (filter === 'active') return MECHANIC_ACTIVE_JOB_STATUSES.includes(statusKey);
				if (filter === 'qc') return statusKey === 'QualityCheck';
				if (filter === 'done') return MECHANIC_DONE_JOB_STATUSES.includes(statusKey);
				return true;
			}),
		[jobs, filter]
	);

	const activeFilterLabel = MECHANIC_JOB_FILTERS.find((item) => item.key === filter)?.label.toLowerCase();

	return (
		<div className="dashboard-page mj-page">
			<section className="page-hero compact">
				<div>
					<p className="page-kicker">Mechanic</p>
					<h1>My Jobs</h1>
					<p>{jobs.length} total assigned</p>
				</div>
			</section>

			<div className="mj-filters">
				{MECHANIC_JOB_FILTERS.map((item) => (
					<button
						key={item.key}
						className={`mj-filter-btn ${filter === item.key ? 'mj-filter-btn--active' : ''}`}
						onClick={() => setFilter(item.key)}
					>
						{item.label}
						{!loading && <span className="mj-filter-count">{filterCounts[item.key] ?? 0}</span>}
					</button>
				))}
			</div>

			<div className="mj-list">
				{loading ? (
					Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
				) : filtered.length === 0 ? (
					<div className="empty-panel">
						<div className="empty-panel-icon">🔧</div>
						<h2>{filter === 'all' ? 'No jobs assigned' : `No ${activeFilterLabel} jobs`}</h2>
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
								<span className="mj-date">📅 {formatDateIN(job.scheduledDate)}</span>
							</div>
							<StatusBadge statusLabel={job.statusLabel} />
						</div>
					))
				)}
			</div>
		</div>
	);
}
