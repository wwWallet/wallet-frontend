export type AppErrorId = (
	| 'canceled'
	| 'keystore_closed'
	| 'keystore_not_asymmetric'
	| 'prf_not_supported'
	| 'prf_retry_failed'
	| 'x-private-data-etag'
);

export class AppError extends Error {
	constructor(
		public readonly errorId: AppErrorId,
		message: string,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = 'AppError';
	}
}
