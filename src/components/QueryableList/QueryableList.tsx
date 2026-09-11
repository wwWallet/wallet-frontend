// External libraries
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// Utilities
import { highlightBestSequence } from '@/components/QueryableList/highlightBestSequence';
import { getElementPropValue, sanitizeId } from '@/util';

// Components
import Button from '@/components/Buttons/Button';
import SearchInput from '@/components/Inputs/SearchInput';
import { H3 } from '@/components/Shared/Heading';

type QueryableListProps<T> = {
	list: T[];
	portalList?: T[];
	recent?: string[];
	queryField: string;
	isOnline: boolean;
	translationPrefix: string;
	onClick?: (identifier: string | number) => void;
	identifierField?: keyof T;
};

const defaultRecent: any[] = [];
const defaultPortalList: any[] = [];

const QueryableList = <T extends object>({
	list,
	portalList,
	recent = defaultRecent, // Default to an empty array if not provided
	queryField,
	isOnline,
	translationPrefix,
	onClick,
	identifierField,
}: QueryableListProps<T>) => {
	const { t } = useTranslation();
	const resolvedPortalList = portalList ?? defaultPortalList;
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [filteredList, setFilteredList] = useState<T[]>(list);
	const [filteredPortalList, setFilteredPortalList] = useState<T[]>(resolvedPortalList);
	const [recentList, setRecentList] = useState<string[]>(recent);
	const [recentCredentialConfigurations, setRecentCredentialConfigurations] = useState([]);
	const showSectionHeadings = filteredPortalList.length > 0 && filteredList.length > 0;

	const handleSearch = (inputQuery: string) => {
		const normalizedQuery = inputQuery.trim();
		setSearchQuery(normalizedQuery);

		const filter = (el: T) => {
			const friendlyName =
				(getElementPropValue(el, queryField) as string) ?? "Unknown";
			const query = normalizedQuery.toLowerCase();
			return friendlyName.toLowerCase().includes(query);
		};

		setFilteredList(list.filter(filter));
		setFilteredPortalList(resolvedPortalList.filter(filter));
	};

	useEffect(() => {
		setFilteredList([...list]);
	}, [list]);

	useEffect(() => {
		setFilteredPortalList([...resolvedPortalList]);
	}, [resolvedPortalList]);

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

	const renderListItem = (el: T, idPrefix: string, itemSearchQuery = searchQuery) => {
		const identifier = getElementPropValue(el, identifierField as string) as string | number;

		return (
			<Button
				id={`querylist-${idPrefix}-${sanitizeId(identifier)}`}
				variant="outline"
				additionalClassName="wrap-break-word w-full text-left"
				key={identifier}
				{...(onClick && identifierField && {
					onClick: () => onClick(identifier),
				})}
				disabled={!isOnline}
				title={!isOnline ? t("common.offlineTitle") : ""}
			>
				{"displayNode" in el && typeof el.displayNode === "function"
					? el.displayNode(itemSearchQuery)
					: highlightBestSequence(
						String(getElementPropValue(el, queryField) ?? "Unknown"),
						itemSearchQuery
					)}
			</Button>
		);
	};

	return (
		<>
			<div className="my-4">
				<SearchInput
					placeholder={t(translationPrefix + ".searchPlaceholder")}
					searchCallback={handleSearch}
				/>
				<div className="my-2">
					{recentCredentialConfigurations.length > 0 && recentList.length > 0 && !searchQuery && <H3 heading={t("queryableList.recent")} />}
					<div
						className="mb-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"
					>
						{!searchQuery && recentCredentialConfigurations.map((el) => renderListItem(el, "recent", ""))}
					</div>
				</div>
			</div>
			{showSectionHeadings && <H3 heading={t("queryableList.trustedIssuers")} />}
			{filteredPortalList.length > 0 && (
				<div className="mb-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
					{filteredPortalList.map((el) => renderListItem(el, "portal"))}
				</div>
			)}
			{showSectionHeadings && <H3 heading={t("queryableList.featuredCredentials")} />}
			{filteredList.length === 0 && filteredPortalList.length === 0 ? (
				<p className="text-lm-gray-800 dark:text-dm-gray-200 mt-4">
					{t(translationPrefix + ".noFound")}
				</p>
			) : filteredList.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
					{filteredList.map((el) => renderListItem(el, "main"))}
				</div>
			) : null}
		</>
	);
};

export default QueryableList;
