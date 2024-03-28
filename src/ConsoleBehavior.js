//ConsoleBehavior.js

function ConsoleBehavior() {
	// If displayConsole is undefined, proceed as true
	const displayConsole = process.env.REACT_APP_DISPLAY_CONSOLE;

	if (displayConsole === 'false') {
		Object.keys(console).forEach(method => {
			if (typeof console[method] === 'function') {
				console[method] = () => { };
			}
		});
	}
}

export default ConsoleBehavior;
