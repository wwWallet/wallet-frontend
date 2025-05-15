import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { highlightBestSequence } from "./highlightBestSequence";

import { getElementPropValue, sanitizeId } from "../../util";

import Button from "../Buttons/Button";
import SearchInput from "../Inputs/SearchInput";

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
	//General
	const { t } = useTranslation();
	
	//State
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [filteredList, setFilteredList] = useState<T[]>(list);
	const [recentList, setRecentList] = useState<string[]>(recent);
	const [recentCredentialConfigurations, setRecentCredentialConfigurations] = useState([]);
	
	//Effects
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

	//Handlers
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

	//Render
	return (
		<div className="mt-11">
			<SearchInput
				placeholder={t(translationPrefix + ".searchPlaceholder")}
				searchCallback={handleSearch}
			/>

			{!searchQuery &&
				<>
					{recentCredentialConfigurations.length > 0 && recentList.length > 0 &&
						<h3 className="font-semibold text-xl text-c-lm-gray-900 dark:text-c-dm-gray-100 mt-6 pb-4 border-b border-c-lm-gray-300 dark:border-c-dm-gray-700 mb-6">
							{t("queryableList.recent")}
						</h3>
					}

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{recentCredentialConfigurations.map((el) => (
							<Button
								id={`querylist-recent-${sanitizeId(getElementPropValue(el, identifierField as string) as string)}`}
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
								square
								size="xl"
							>
								{"displayNode" in el && typeof el.displayNode === "function"
									? el.displayNode("") // 👈 no highlight for recent
									: getElementPropValue(el, queryField) ?? "Unknown"}
							</Button>
						))}
					</div>
				</>
			}
			
			<div className="mt-6">
				{recentCredentialConfigurations.length > 0 && recentList.length > 0 && !searchQuery && 
					<h3 className="font-semibold text-xl text-c-lm-gray-900 dark:text-c-dm-gray-100 pb-4 border-b border-c-lm-gray-300 dark:border-c-dm-gray-700 mb-6">
						{t("queryableList.all")}
					</h3>
				}
				
				{filteredList.length === 0 ? 
					<p className="text-c-lm-gray-700 dark:text-c-dm-gray-300 p-32 border border-c-lm-gray-300 dark:border-c-dm-gray-700 rounded-xl text-center">
						{t(translationPrefix + ".noFound")}
					</p>
				:
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{filteredList.map((el) => (
							<Button
								id={`querylist-all-${sanitizeId(getElementPropValue(el, identifierField as string) as string)}`}
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
								square
								size="xl"
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
				}
			</div>
		</div>
	);
};

export default QueryableList;
