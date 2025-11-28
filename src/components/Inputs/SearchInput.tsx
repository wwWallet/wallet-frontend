import { useRef } from "react";

type SearchInputProps = {
	placeholder: string;
	searchCallback: (query: string) => void;
};

const SearchInput = ({ placeholder, searchCallback }: SearchInputProps) => {
	const inputRef = useRef<HTMLInputElement | null>(null);

	const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const query = event.target.value;
		inputRef.current.value = query;
		searchCallback && searchCallback(query);
	};

	return (
		<input
			ref={inputRef}
			type="text"
			placeholder={placeholder}
			className="w-full px-3 py-2 bg-lm-gray-200 dark:bg-dm-gray-800 border border-lm-gray-400 dark:border-dm-gray-600 dark:text-white rounded-lg dark:inputDarkModeOverride"
			onChange={handleOnChange}
		/>
	);
};

export default SearchInput;
