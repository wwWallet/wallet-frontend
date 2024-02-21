function isMethodAllowed(method) {
	if (process.env.NODE_ENV === 'production') {
		return false;
	}

	const allowedMethodsEnv = process.env.REACT_APP_DEV_CONSOLE_TYPES?.split(',') || [];
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
