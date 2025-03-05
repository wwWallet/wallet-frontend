import React, { useEffect, useState } from "react";
import SearchInput from "./Inputs/SearchInput";
import Button from "../components/Buttons/Button";
import { useTranslation } from "react-i18next";
import { getElementPropValue } from "../util";

function highlightBestSequence(issuer: any, search: any) {
	if (typeof issuer !== "string" || typeof search !== "string") {
		return issuer;
	}

	const searchRegex = new RegExp(search, "gi");
	const highlighted = issuer.replace(
		searchRegex,
		'<span class="font-bold text-primary dark:text-primary-light">$&</span>'
	);

	return highlighted;
}

type QueryableListProps<T> = {
	list: T[];
	queryField: string;
	isOnline: boolean;
	translationPrefix: string;
	onClick?: (identifier: string | number) => void;
	identifierField?: keyof T;
};

const QueryableList = <T,>({
	list,
	queryField,
	isOnline,
	translationPrefix,
	onClick,
	identifierField,
}: QueryableListProps<T>) => {
	const { t } = useTranslation();
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [filteredList, setFilteredList] = useState<T[]>(list);

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


	return (
		<>
			<div className="my-4">
				<SearchInput
					placeholder={t(translationPrefix + ".searchPlaceholder")}
					searchCallback={handleSearch}
				/>
			</div>
			{filteredList.length === 0 ? (
				<p className="text-gray-700 dark:text-gray-300 mt-4">
					{t(translationPrefix + ".noFound")}
				</p>
			) : (
				<div
					className="max-h-screen-80 overflow-y-auto space-y-2"
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
							<div
								dangerouslySetInnerHTML={{
									__html: highlightBestSequence(
										getElementPropValue(el, queryField) ?? "Unknown",
										searchQuery.trimStart()
									),
								}}
							/>
						</Button>
					))}
				</div>
			)}
		</>
	);
};

export default QueryableList;
