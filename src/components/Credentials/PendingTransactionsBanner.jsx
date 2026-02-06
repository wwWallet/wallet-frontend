import React from "react";
import { useTranslation } from "react-i18next";
import Button from "../Buttons/Button";
import { History } from "lucide-react";

export default function PendingTransactionsBanner({ pendingTransactions = [], onView }) {
	const { t } = useTranslation();

	const count = pendingTransactions?.length ?? 0;
	if (!count) return null;

	return (
		<div
			className={`text-base group relative overflow-hidden rounded-xl border border-orange-500/20 dark:border-orange-500/20 bg-orange-100/50 dark:bg-orange-500/5 px-2 sm:px-5 py-2 shadow-md my-2`}
		>
			<div className="flex items-center gap-2">
				<History className="h-8 w-8 text-orange-500" />
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2 flex-wrap">
						<p className="font-medium text-sm sm:text-base">
							{t("pendingTransactions.title", { count })}
						</p>
					</div>
					<span className="hidden sm:inline-flex items-center gap-1 text-xs rounded-full border px-2 py-0.5 border-orange-300 dark:border-orange-500/30 text-orange-600 dark:text-orange-400">
						{t("pendingTransactions.subtitle")}
					</span>
				</div>

				<Button
					id="navigate-pending"
					variant="primary"
					onClick={onView}
				>
					{t("pendingTransactions.view")}
				</Button>
			</div>
		</div>
	);
}
