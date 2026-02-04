import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from 'react-i18next';
import { AiOutlineClose } from "react-icons/ai";
import NotificationContext, { NotificationType, NotifyPayload } from "./NotificationContext";
import { setNotify } from "./notifier";

type NotificationItem = {
	id: string;
	type: NotificationType;
	title: string;
	message: string;
	duration: number;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const DEFAULTS: Record<NotificationType, { duration: number }> = {
	success: { duration: 4000 },
	newCredential: { duration: 4000 },
};

export const NotificationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
	const { t } = useTranslation();
	const [items, setItems] = useState<NotificationItem[]>([]);
	const timersRef = useRef<Record<string, number>>({});
	const MAX_STACK = 5;

	const remove = useCallback((id: string) => {
		setItems((prev) => prev.filter((n) => n.id !== id));
		if (timersRef.current[id]) {
			clearTimeout(timersRef.current[id]);
			delete timersRef.current[id];
		}
	}, []);

	const schedule = useCallback(
		(id: string, duration: number) => {
			if (timersRef.current[id]) clearTimeout(timersRef.current[id]);
			timersRef.current[id] = window.setTimeout(() => remove(id), duration) as unknown as number;
		},
		[remove]
	);

	const add = useCallback(
		(type: NotificationType, payload?: NotifyPayload) => {
			const id = uid();
			const d = DEFAULTS[type];

			const title = payload?.title ?? t(`notifications.${type}.title`);
			const message = payload?.message ?? t(`notifications.${type}.message`);
			const duration = payload?.duration ?? d.duration;

			setItems((prev) => [{ id, type, title, message, duration }, ...prev].slice(0, MAX_STACK));

			setTimeout(() => schedule(id, duration), 0);
			return id;
		},
		[schedule]
	);

	const notify = useCallback(
		(type: NotificationType, payload?: NotifyPayload) => add(type, payload),
		[add]
	);

	// Register imperative bridge for non-React usage
	useEffect(() => {
		setNotify((type, payload) => {
			void notify(type, payload);
		});
	}, [notify]);

	// Cleanup timers on unmount
	useEffect(() => {
		return () => {
			Object.values(timersRef.current).forEach((t) => clearTimeout(t));
			timersRef.current = {};
		};
	}, []);

	const api = useMemo(() => ({ notify, remove }), [notify, remove]);

	return (
		<NotificationContext.Provider value={api}>
			{children}
			{createPortal(
				<div className="fixed inset-0 pointer-events-none z-[9999]">
					<div className="absolute top-4 left-4 right-4 flex items-end flex-col gap-2">
						{items.map((n) => (
							<Toast
								key={n.id}
								item={n}
								onClose={() => remove(n.id)}
								onPause={() => {
									if (timersRef.current[n.id]) {
										clearTimeout(timersRef.current[n.id]);
										delete timersRef.current[n.id];
									}
								}}
								onResume={() => schedule(n.id, n.duration)}
							/>
						))}
					</div>
				</div>,
				document.body
			)}
		</NotificationContext.Provider>
	);
};

const Toast: React.FC<{
	item: NotificationItem;
	onClose: () => void;
	onPause: () => void;
	onResume: () => void;
}> = ({ item, onClose, onPause, onResume }) => {
	const [enter, setEnter] = useState(false);

	useEffect(() => {
		// kick off enter animation on mount (next frame so the initial styles apply)
		const id = requestAnimationFrame(() => setEnter(true));
		return () => cancelAnimationFrame(id);
	}, []);

	const base =
		"pointer-events-auto w-[340px] xm:w-full rounded-xl shadow-2xl border p-3 flex gap-2 " +
		"transform transition-all duration-1000 ease-out " +
		(enter ? "translate-y-0 opacity-100" : "-translate-y-60 opacity-0");

	const byType: Record<NotificationType, string> = {
		success: "bg-emerald-50 dark:bg-emerald-700 dark:border-emerald-200 dark:border-white/50 text-emerald-900 dark:text-white",
		newCredential:
			"bg-blue-50 dark:bg-primary-dark border-primary/30 dark:border-white/50 text-primary dark:text-white",
	};

	return (
		<div
			role="status"
			aria-live="polite"
			onMouseEnter={onPause}
			onMouseLeave={onResume}
			className={`${base} ${byType[item.type]}`}
		>
			<div className="flex-1">
				<p className="font-semibold text-sm">{item.title}</p>
				<p className="text-sm">{item.message}</p>
			</div>

			<button
				type="button"
				onClick={onClose}
				aria-label="Dismiss"
				className="shrink-0 rounded-md p-1 hover:bg-black/5"
			>
				<AiOutlineClose size={16} />
			</button>
		</div>
	);
};
