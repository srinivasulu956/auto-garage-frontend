import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import assistantService from '../../../app-core/services/assistant-service';
import MessageContent from './message-content';
import './AIChat.scss';

const STORAGE_KEY = 'autofix-assistant-transcript';
const MAX_STORED_MESSAGES = 40;

const SUGGESTIONS = [
	'My brakes are squealing when I stop',
	"What's the status of my car?",
	'Book a service for my car',
	'Explain my latest bill',
];

/** Turns raw tool names into something a customer can read. */
const TOOL_LABELS = {
	get_service_catalog: 'Checked the service list',
	get_my_vehicles: 'Looked up your garage',
	get_my_bookings: 'Checked your bookings',
	get_booking_details: 'Read the repair timeline',
	get_my_invoices: 'Checked your invoices',
	get_invoice_details: 'Read the bill details',
	add_vehicle: 'Prepared a new vehicle',
	update_vehicle: 'Prepared a vehicle update',
	remove_vehicle: 'Prepared a vehicle removal',
	create_booking: 'Prepared a booking',
	reschedule_booking: 'Prepared a booking change',
	cancel_booking: 'Prepared a cancellation',
	open_page: 'Found the right page',
};

const newId = () =>
	globalThis.crypto?.randomUUID?.() ?? `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const readStoredTranscript = () => {
	try {
		const stored = sessionStorage.getItem(STORAGE_KEY);
		const parsed = stored ? JSON.parse(stored) : null;
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
};

const AIChat = () => {
	const navigate = useNavigate();
	const loggedUserData = useSelector((state) => state.commonState.loggedUserData);
	const firstName = loggedUserData?.user?.firstName ?? loggedUserData?.user?.FirstName ?? '';

	const [isOpen, setIsOpen] = useState(false);
	const [messages, setMessages] = useState(readStoredTranscript);
	const [input, setInput] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState(null);

	const scrollAnchorRef = useRef(null);
	const inputRef = useRef(null);
	// The API needs the transcript as it was *before* the new turn, so keep a ref
	// alongside state to avoid stale closures inside async handlers.
	const messagesRef = useRef(messages);
	const retryRef = useRef(null);

	useEffect(() => {
		messagesRef.current = messages;

		try {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
		} catch {
			// A full or unavailable sessionStorage must never break the conversation.
		}
	}, [messages]);

	useEffect(() => {
		if (isOpen) scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, busy, isOpen]);

	useEffect(() => {
		if (isOpen) inputRef.current?.focus();
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return undefined;

		const onKeyDown = (event) => {
			if (event.key === 'Escape') setIsOpen(false);
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [isOpen]);

	const appendMessage = useCallback((message) => {
		setMessages((prev) => [...prev, { id: newId(), ...message }]);
	}, []);

	const setActionState = useCallback((messageId, actionState) => {
		setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, actionState } : m)));
	}, []);

	/** Shared by first attempts and retries so a retry never duplicates the user's turn. */
	const requestReply = useCallback(
		async (text, history) => {
			setBusy(true);
			setError(null);

			try {
				const response = await assistantService.sendMessage(text, history);

				retryRef.current = null;
				appendMessage({
					role: 'assistant',
					content: response.reply,
					pendingAction: response.pendingAction ?? null,
					link: response.link ?? null,
					toolsUsed: response.toolsUsed ?? [],
					actionState: response.pendingAction ? 'pending' : null,
				});
			} catch (err) {
				retryRef.current = { text, history };
				setError(err.message || 'Something went wrong. Please try again.');
			} finally {
				setBusy(false);
			}
		},
		[appendMessage],
	);

	const sendMessage = useCallback(
		(text) => {
			const trimmed = text.trim();
			if (!trimmed || busy) return;

			const history = messagesRef.current;

			appendMessage({ role: 'user', content: trimmed });
			setInput('');
			requestReply(trimmed, history);
		},
		[appendMessage, busy, requestReply],
	);

	const retry = useCallback(() => {
		const pending = retryRef.current;
		if (pending) requestReply(pending.text, pending.history);
	}, [requestReply]);

	const confirmAction = useCallback(
		async (messageId, action) => {
			if (busy) return;

			const history = messagesRef.current;

			setBusy(true);
			setError(null);
			// A stale chat retry must not be offered as the fix for a confirm failure.
			retryRef.current = null;
			setActionState(messageId, 'working');

			try {
				const response = await assistantService.confirmAction(action, history);

				// A confirmed action can still fail re-validation, and the API answers 200
				// either way — so the card follows actionStatus, not the absence of an error.
				setActionState(messageId, response.actionStatus === 'failed' ? 'failed' : 'confirmed');
				appendMessage({ role: 'assistant', content: response.reply });
			} catch (err) {
				// Leave the card actionable so the customer can try again.
				setActionState(messageId, 'pending');
				setError(err.message || 'That action could not be completed.');
			} finally {
				setBusy(false);
			}
		},
		[appendMessage, busy, setActionState],
	);

	const declineAction = useCallback(
		(messageId) => {
			setActionState(messageId, 'declined');
			appendMessage({
				role: 'assistant',
				content: "No problem — I haven't changed anything. Just tell me what you'd like instead.",
			});
		},
		[appendMessage, setActionState],
	);

	const openLink = useCallback(
		(route) => {
			navigate(route);
			setIsOpen(false);
		},
		[navigate],
	);

	const clearConversation = useCallback(() => {
		setMessages([]);
		setError(null);
		retryRef.current = null;
	}, []);

	const handleKeyDown = (event) => {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			sendMessage(input);
		}
	};

	const renderActionCard = (message) => {
		const { pendingAction, actionState } = message;
		if (!pendingAction) return null;

		const resolved = actionState === 'confirmed' || actionState === 'declined' || actionState === 'failed';

		return (
			<div className={`action-card ${resolved ? 'is-resolved' : ''}`}>
				<p className="action-title">{pendingAction.title}</p>

				<dl className="action-details">
					{pendingAction.details?.map((detail) => (
						<div className="action-detail" key={detail.label}>
							<dt>{detail.label}</dt>
							<dd>{detail.value}</dd>
						</div>
					))}
				</dl>

				{actionState === 'confirmed' && <p className="action-outcome confirmed">Confirmed</p>}
				{actionState === 'declined' && <p className="action-outcome declined">Not applied</p>}
				{actionState === 'failed' && <p className="action-outcome failed">Couldn&apos;t be applied</p>}

				{!resolved && (
					<div className="action-buttons">
						<button
							type="button"
							className="btn-confirm"
							disabled={busy}
							onClick={() => confirmAction(message.id, pendingAction)}
						>
							{actionState === 'working' ? 'Working…' : pendingAction.confirmLabel}
						</button>
						<button type="button" className="btn-decline" disabled={busy} onClick={() => declineAction(message.id)}>
							Not now
						</button>
					</div>
				)}
			</div>
		);
	};

	return (
		<>
			<button
				type="button"
				className={`ai-launcher ${isOpen ? 'is-hidden' : ''}`}
				onClick={() => setIsOpen(true)}
				aria-label="Open the AutoFix assistant"
			>
				<span className="launcher-icon" aria-hidden="true">
					✦
				</span>
				<span className="launcher-label">Ask AutoFix</span>
			</button>

			{isOpen && (
				<section className="ai-panel" role="dialog" aria-label="AutoFix assistant">
					<header className="ai-panel-header">
						<div className="assistant-identity">
							<span className="assistant-avatar" aria-hidden="true">
								✦
							</span>
							<div>
								<p className="assistant-name">AutoFix Assistant</p>
								<p className="assistant-status">Connected to your account</p>
							</div>
						</div>

						<div className="header-actions">
							{messages.length > 0 && (
								<button
									type="button"
									className="icon-btn"
									onClick={clearConversation}
									// Clearing mid-request would drop the reply into an empty transcript.
									disabled={busy}
									title="Start a new conversation"
								>
									New
								</button>
							)}
							<button type="button" className="icon-btn" onClick={() => setIsOpen(false)} aria-label="Close assistant">
								✕
							</button>
						</div>
					</header>

					<div className="ai-panel-body">
						{messages.length === 0 && (
							<div className="ai-welcome">
								<p className="welcome-title">Hi{firstName ? ` ${firstName}` : ''} 👋</p>
								<p className="welcome-text">
									Describe a problem with your car, or ask me to book, reschedule or check on a service. I can see your
									vehicles, bookings and bills, so you don&apos;t have to go looking for them.
								</p>

								<div className="suggestions">
									{SUGGESTIONS.map((suggestion) => (
										<button type="button" key={suggestion} className="suggestion" onClick={() => sendMessage(suggestion)}>
											{suggestion}
										</button>
									))}
								</div>
							</div>
						)}

						{messages.map((message) => (
							<article key={message.id} className={`message ${message.role}`}>
								<div className="bubble">
									<MessageContent text={message.content} />

									{renderActionCard(message)}

									{message.link && (
										<button type="button" className="link-action" onClick={() => openLink(message.link.route)}>
											{message.link.label} →
										</button>
									)}
								</div>

								{message.role === 'assistant' && message.toolsUsed?.length > 0 && (
									<ul className="tool-trace">
										{message.toolsUsed.map((tool) => (
											<li key={tool}>{TOOL_LABELS[tool] ?? tool.replaceAll('_', ' ')}</li>
										))}
									</ul>
								)}
							</article>
						))}

						{busy && (
							<article className="message assistant">
								<div className="bubble">
									<span className="typing" aria-label="The assistant is thinking">
										<span />
										<span />
										<span />
									</span>
								</div>
							</article>
						)}

						{error && (
							<div className="ai-error" role="alert">
								<span>{error}</span>
								{retryRef.current && (
									<button type="button" onClick={retry} disabled={busy}>
										Try again
									</button>
								)}
							</div>
						)}

						<div ref={scrollAnchorRef} />
					</div>

					<footer className="ai-panel-footer">
						<div className="composer">
							<textarea
								ref={inputRef}
								value={input}
								onChange={(event) => setInput(event.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Describe the problem, or ask me to book a service…"
								rows={1}
								maxLength={2000}
								disabled={busy}
							/>
							<button
								type="button"
								className="send-btn"
								onClick={() => sendMessage(input)}
								disabled={busy || !input.trim()}
								aria-label="Send message"
							>
								↑
							</button>
						</div>
						<p className="composer-hint">
							Nothing is booked or cancelled until you confirm it. Payments are always made by you on the invoices page.
						</p>
					</footer>
				</section>
			)}
		</>
	);
};

export default AIChat;
