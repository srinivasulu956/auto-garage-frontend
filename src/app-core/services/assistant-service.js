import api from './api-client';

/**
 * The AI assistant lives entirely behind the backend: the browser never holds a model
 * provider key and never chooses which data to read. It sends the visible transcript,
 * and the API — which knows the caller from their JWT — decides what the assistant may see.
 */

/** The API caps history content; one long reply must not wedge the whole conversation. */
const MAX_CONTENT_LENGTH = 8000;

/** Strip client-only fields; the API replays role + content and nothing else. */
const toHistory = (messages) =>
	messages
		.filter((m) => (m.role === 'user' || m.role === 'assistant') && m.content?.trim())
		.map(({ role, content }) => ({ role, content: content.slice(0, MAX_CONTENT_LENGTH) }));

const assistantService = {
	/**
	 * Which model backends are usable right now. The local one is probed by the API, so a
	 * model that is configured but not running comes back unavailable rather than being
	 * offered and then failing on the first question.
	 */
	getProviders: () => api.get('/assistant/providers'),

	/**
	 * Send a turn. Resolves to { reply, pendingAction, link, toolsUsed, provider, providerNotice }.
	 * `provider` is the backend that actually answered, which is not always the one asked
	 * for — the API falls back to the local model when the cloud allowance runs out.
	 */
	sendMessage: (message, messages = [], provider) =>
		api.post('/assistant/chat', { message, history: toHistory(messages), provider }),

	/**
	 * Approve a write the assistant proposed. This is the only call that changes data —
	 * the chat endpoint can read, but it can never write without this confirmation.
	 *
	 * The provider travels with the confirmation so the outcome is narrated by whichever
	 * backend proposed the card.
	 */
	confirmAction: (action, messages = [], provider) =>
		api.post('/assistant/confirm', { action, history: toHistory(messages), provider }),
};

export default assistantService;
