import React, { useEffect, useState } from "react";
import SearchInput from "../Inputs/SearchInput";
import Button from "../Buttons/Button";
import { useTranslation } from "react-i18next";
import { getElementPropValue } from "../../util";
import { H3 } from "../Shared/Heading";
import { highlightBestSequence } from "./highlightBestSequence";

type QueryableListProps<T> = {
	list: T[];
	recent?: string[];
	queryField: string;
	isOnline: boolean;
	translationPrefix: string;
	onClick?: (identifier: string | number) => void;
	identifierField?: keyof T;
};

const defaultRecent: any[] = [];

const QueryableList = <T extends object>({
	list,
	recent = defaultRecent, // Default to an empty array if not provided
	queryField,
	isOnline,
	translationPrefix,
	onClick,
	identifierField,
}: QueryableListProps<T>) => {
	const { t } = useTranslation();
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [filteredList, setFilteredList] = useState<T[]>(list);
	const [recentList, setRecentList] = useState<string[]>(recent);
	const [recentCredentialConfigurations, setRecentCredentialConfigurations] = useState([]);

	const handleSearch = (inputQuery: string) => {
		setSearchQuery(inputQuery);

		const filtered = list.filter((el) => {
			const friendlyName =
				(getElementPropValue(el, queryField) as string) ?? "Unknown";
			const query = inputQuery.toLowerCase().trimStart();
			return friendlyName.toLowerCase().includes(query);
		});

		setFilteredList(filtered);
	};

	useEffect(() => {
		setFilteredList([...list]);
	}, [list]);

	useEffect(() => {
		setRecentList([...recent]);
	}, [recent]);

	useEffect(() => {
		const recentConfigs = recentList
			.map(recentItem =>
				filteredList.find(config =>
					getElementPropValue(config, identifierField as string) === recentItem
				)
			)
			.filter(Boolean) // This ensures undefined entries are removed
			.slice(0, 3); // This limits the array to the first two entries

		setRecentCredentialConfigurations(recentConfigs);
	}, [recentList, filteredList, identifierField]);

	return (
		<>
			<div className="my-4">
				<SearchInput
					placeholder={t(translationPrefix + ".searchPlaceholder")}
					searchCallback={handleSearch}
				/>
				<div className="my-2">
					{recentCredentialConfigurations && recentList.length > 0 && !searchQuery && <H3 heading={t("queryableList.recent")} />}
					<div
						className="space-y-2 mb-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
					>
						{!searchQuery && recentCredentialConfigurations.map((el) => (
							<Button
								variant="outline"
								additionalClassName="break-words w-full text-left"
								key={getElementPropValue(el, identifierField as string)}
								{...(onClick &&
									identifierField && {
									onClick: () =>
										onClick(getElementPropValue(el, identifierField as string)),
								})}
								disabled={!isOnline}
								title={!isOnline ? t("common.offlineTitle") : ""}
							>
								{"displayNode" in el && typeof el.displayNode === "function"
									? el.displayNode("") // 👈 no highlight for recent
									: getElementPropValue(el, queryField) ?? "Unknown"}
							</Button>
						))}
					</div>
				</div>
			</div>
			{recentCredentialConfigurations && recentList.length > 0 && !searchQuery && <H3 heading={t("queryableList.all")} />}
			{filteredList.length === 0 ? (
				<p className="text-gray-700 dark:text-gray-300 mt-4">
					{t(translationPrefix + ".noFound")}
				</p>
			) : (
				<div
				className="max-h-screen-80 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
				style={{ maxHeight: "80vh" }}
				>
					{filteredList.map((el) => (
						<Button
							variant="outline"
							additionalClassName="break-words w-full text-left"
							key={getElementPropValue(el, identifierField as string)}
							{...(onClick &&
								identifierField && {
								onClick: () =>
									onClick(getElementPropValue(el, identifierField as string)),
							})}
							disabled={!isOnline}
							title={!isOnline ? t("common.offlineTitle") : ""}
						>
							{"displayNode" in el && typeof el.displayNode === "function"
								? el.displayNode(searchQuery)
								: highlightBestSequence(
									getElementPropValue(el, queryField) ?? "Unknown",
									searchQuery
								)}
						</Button>
					))}
				</div>
			)}
		</>
	);
};

export default QueryableList;
