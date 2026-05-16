export const parseErrorMessage = async (response) => {
	const contentType = response.headers.get('content-type') ?? '';

	if (!contentType.includes('application/json')) {
		const text = await response.text().catch(() => '');
		return text || `Request failed with status ${response.status}`;
	}

	const error = await response.json().catch(() => ({}));

	if (Array.isArray(error)) {
		return error.join('\n');
	}

	if (error?.errors) {
		return Object.values(error.errors).flat().join('\n');
	}

	return error.error || error.message || error.title || `Request failed with status ${response.status}`;
};

export const handleResponse = async (response) => {
	if (response.status === 204) {
		return null;
	}

	if (!response.ok) {
		throw new Error(await parseErrorMessage(response));
	}

	return response.json();
};
