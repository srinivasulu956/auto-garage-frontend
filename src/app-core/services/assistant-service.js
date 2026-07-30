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
	/** Send a turn. Resolves to { reply, pendingAction, link, toolsUsed }. */
	sendMessage: (message, messages = []) => api.post('/assistant/chat', { message, history: toHistory(messages) }),

	/**
	 * Approve a write the assistant proposed. This is the only call that changes data —
	 * the chat endpoint can read, but it can never write without this confirmation.
	 */
	confirmAction: (action, messages = []) => api.post('/assistant/confirm', { action, history: toHistory(messages) }),
};

export default assistantService;
