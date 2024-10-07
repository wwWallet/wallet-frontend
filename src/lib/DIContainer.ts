type Constructor<T> = new (...args: any[]) => T;

export class DIContainer {
	private services = new Map<string, any>();

	register<T>(name: string, service: Constructor<T>, ...args: any[]): void {
		this.services.set(name, new service(...args));
	}

	resolve<T>(name: string): T {
		const service = this.services.get(name);
		if (!service) {
			throw new Error(`Service not found: ${name}`);
		}
		return service;
	}
}

