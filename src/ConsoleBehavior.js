//ConsoleBehavior.js

import * as config from './config';


function ConsoleBehavior() {
	// If displayConsole is undefined, proceed as true

	if (config.DISPLAY_CONSOLE === 'false') {
		Object.keys(console).forEach(method => {
			if (typeof console[method] === 'function') {
				console[method] = () => { };
			}
		});
	}
}

export default ConsoleBehavior;
