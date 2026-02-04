import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../functions/DateFormat";
import { reverse, compareBy } from "@/util";
import CredentialsContext from "@/context/CredentialsContext";
import { useOpenID4VCIHelper } from "@/lib/services/OpenID4VCIHelper";
import useFilterItemByLang from "@/hooks/useFilterItemByLang";
import { H1 } from "../../components/Shared/Heading";
import PageDescription from "../../components/Shared/PageDescription";
import { PiClockCounterClockwiseBold } from "react-icons/pi";

const Pending = () => {
	const { t } = useTranslation();
	const { pendingTransactions } = useContext(CredentialsContext);
	const helper = useOpenID4VCIHelper();
	const filterItemByLang = useFilterItemByLang();

	const [issuerMd, setIssuerMd] = useState({});

	useEffect(() => {
		if (!pendingTransactions?.length) return;

		const issuers = [...new Set(pendingTransactions.map(pt => pt.credentialIssuerIdentifier))];

		Promise.all(
			issuers.map(async id => {
				try {
					const { metadata } = await helper.getCredentialIssuerMetadata(id);
					return [id, metadata];
				} catch {
					return [id, null];
				}
			})
		).then(entries => {
			const next = {};
			for (const [id, md] of entries) if (md) next[id] = md;
			setIssuerMd(next);
		});
	}, [pendingTransactions, helper]);

	if (!pendingTransactions?.length) {
		return (
			<div className="px-6 sm:px-12 w-full">
				<H1 heading={t("pagePending.title")} />
				<PageDescription description={t("pagePending.description")} />
				<p className="text-gray-700 dark:text-white mt-4">
					{t("pagePending.noFound")}
				</p>
			</div>
		);
	}

	return (
		<div className="px-6 sm:px-12 w-full">
			<H1 heading={t("pagePending.title")} />
			<PageDescription description={t("pagePending.description")} />

			<div className="py-2 w-full">
				<div className="overflow-auto space-y-2" style={{ maxHeight: "85vh" }}>
					{[...pendingTransactions]
						.sort(reverse(compareBy(pt => pt.created)))
						.map(pt => {
							const md = issuerMd[pt.credentialIssuerIdentifier];
							const cfg = md?.credential_configurations_supported?.[pt.credentialConfigurationId];
							const issuer = md ? filterItemByLang(md.display, "locale")?.name : null;
							const cred = cfg ? filterItemByLang(cfg.display, "locale")?.name : null;

							return (
								<div
									key={pt.credentialEndpoint.transactionId}
									className="text-sm px-4 py-2 dark:text-white border border-gray-300 shadow-sm dark:border-gray-600 rounded-md w-full text-left"
								>
									<div className="flex gap-2 items-center">

										<PiClockCounterClockwiseBold className="h-8 w-8 text-orange-500" />
										<div className="w-px h-12 bg-gray-300 dark:bg-gray-600" />
										<div>
											<p className="font-semibold">{`${cred}`}</p>
											<p className="font-semibold">{`${issuer}`}</p>
											<p>{formatDate(pt.created)}</p>
										</div>
									</div>
								</div>
							);
						})}
				</div>
			</div>
		</div>
	);
};

export default Pending;
