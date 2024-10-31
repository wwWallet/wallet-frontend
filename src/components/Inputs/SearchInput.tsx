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
			className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:inputDarkModeOverride"
			onChange={handleOnChange}
		/>
	);
};

export default SearchInput;
