function FormAlert({ className, message, role }) {
	if (!message) return null;

	return (
		<div className={className} role={role}>
			{message.split('\n').map((line, index) => (
				<div key={index}>{line}</div>
			))}
		</div>
	);
}

export default FormAlert;
