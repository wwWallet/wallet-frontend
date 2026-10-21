import * as config from './config';

function ConsoleBehavior(): void {
	// If displayConsole is undefined, proceed as true

	if (config.DISPLAY_CONSOLE === 'false') {
		Object.keys(console).forEach((method) => {
			if (typeof console[method as keyof Console] === 'function') {
				Reflect.set(console, method, () => { });
			}
		});
	}
}

export default ConsoleBehavior;
