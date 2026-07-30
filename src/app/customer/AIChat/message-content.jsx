import React from 'react';

/**
 * A deliberately small markdown renderer for assistant replies.
 *
 * The assistant is prompted to answer in short paragraphs and bullets, so supporting
 * headings, lists, bold and inline code covers everything it produces — without pulling
 * a markdown library (and its HTML sanitising surface) into the bundle. Anything it does
 * not recognise falls through as plain text, which is always safe to render.
 */

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`)/g;

const renderInline = (text, keyPrefix) =>
	text.split(INLINE_PATTERN).map((part, index) => {
		const key = `${keyPrefix}-${index}`;

		// Length guards matter: for a bare "**" or "`" the same characters satisfy both
		// startsWith and endsWith, and slicing would render an empty element that silently
		// swallows the text.
		if (part.length > 4 && part.startsWith('**') && part.endsWith('**'))
			return <strong key={key}>{part.slice(2, -2)}</strong>;

		if (part.length > 2 && part.startsWith('`') && part.endsWith('`'))
			return <code key={key}>{part.slice(1, -1)}</code>;

		return <React.Fragment key={key}>{part}</React.Fragment>;
	});

const BULLET = /^\s*[-*•]\s+/;
const NUMBERED = /^\s*\d+[.)]\s+/;
const HEADING = /^#{1,6}\s+/;

const MessageContent = ({ text }) => {
	if (!text) return null;

	const blocks = [];
	let list = null;

	const closeList = () => {
		if (!list) return;

		const ListTag = list.ordered ? 'ol' : 'ul';
		blocks.push(
			<ListTag key={`list-${blocks.length}`} className="md-list">
				{list.items.map((item, index) => (
					<li key={index}>{renderInline(item, `li-${blocks.length}-${index}`)}</li>
				))}
			</ListTag>,
		);
		list = null;
	};

	text.split('\n').forEach((rawLine, index) => {
		const line = rawLine.trimEnd();

		if (!line.trim()) {
			closeList();
			return;
		}

		const ordered = NUMBERED.test(line);
		const bulleted = BULLET.test(line);

		if (ordered || bulleted) {
			// A change of list style starts a new list rather than mixing markers.
			if (list && list.ordered !== ordered) closeList();

			list ??= { ordered, items: [] };
			list.items.push(line.replace(ordered ? NUMBERED : BULLET, ''));
			return;
		}

		closeList();

		if (HEADING.test(line)) {
			blocks.push(
				<p key={`h-${index}`} className="md-heading">
					{renderInline(line.replace(HEADING, ''), `h-${index}`)}
				</p>,
			);
			return;
		}

		blocks.push(<p key={`p-${index}`}>{renderInline(line, `p-${index}`)}</p>);
	});

	closeList();

	return <>{blocks}</>;
};

export default MessageContent;
