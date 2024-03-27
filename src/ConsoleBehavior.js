//ConsoleBehavior.js

function ConsoleBehavior() {
	// If hideConsole is undefined, proceed as true
	const hideConsole = process.env.REACT_APP_DISPLAY_CONSOLE;

	if (hideConsole === 'false') {
		Object.keys(console).forEach(method => {
			if (typeof console[method] === 'function') {
				console[method] = () => { };
			}
		});
	}
}

export default ConsoleBehavior;
