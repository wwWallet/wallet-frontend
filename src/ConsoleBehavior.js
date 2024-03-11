function isMethodAllowed(method) {

	const allowedMethodsEnv = process.env.REACT_APP_CONSOLE_TYPES?.split(',') || [];
	const methodCategories = {
		log: 'info',
		info: 'info',
		warn: 'warn',
		error: 'error',
		assert: 'error'
	};

	return allowedMethodsEnv.includes(methodCategories[method]);
}

function ConsoleBehavior() {
	const originalConsole = { ...console };

	const originalPrepareStackTrace = Error.prepareStackTrace;

	Object.keys(console).forEach(method => {
		if (typeof console[method] === 'function') {
			console[method] = (...args) => {
				if (isMethodAllowed(method)) {
					Error.prepareStackTrace = (_, stack) => stack;
					const stack = new Error().stack;
					Error.prepareStackTrace = originalPrepareStackTrace;

					const callSite = stack[1];
					if (callSite) {
						const fileName = callSite.getFileName();
						const lineNumber = callSite.getLineNumber();
						args.push(`(at ${fileName}:${lineNumber})`);
					}

					originalConsole[method].apply(console, args);
				}
			};
		}
	});
}

export default ConsoleBehavior;
