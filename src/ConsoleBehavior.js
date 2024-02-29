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

	Object.keys(console).forEach(method => {
		if (typeof console[method] === 'function') {
			console[method] = (...args) => {
				if (isMethodAllowed(method)) {
					originalConsole[method](...args);
				}
			};
		}
	});
}

export default ConsoleBehavior;