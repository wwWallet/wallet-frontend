import { useRef } from "react";
import { faSearch } from "@fortawesome/pro-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type SearchInputProps = {
	placeholder: string;
	searchCallback: (query: string) => void;
};

const SearchInput = ({ placeholder, searchCallback }: SearchInputProps) => {
	//Refs
	const inputRef = useRef<HTMLInputElement | null>(null);

	//Handlers
	const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const query = event.target.value;
		inputRef.current.value = query;
		searchCallback && searchCallback(query);
	};

	//Render
	return (
		<div className="w-full relative">
			<label className="block" htmlFor={"search"}>
				<FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-[0.812rem] z-10 text-c-lm-gray-700 dark:text-c-dm-gray-300" />
			</label>

			<input
				ref={inputRef}
				type="text"
				placeholder={placeholder}
				className={`
					bg-c-lm-gray-200 dark:bg-c-dm-gray-800 border border-c-lm-gray-300 dark:border-c-dm-gray-700 
					dark:inputDarkModeOverride text-c-lm-gray-900 dark:text-c-dm-gray-100 rounded-lg w-full py-2 pl-10 pr-4
					outline-none focus:ring-2 ring-c-lm-blue dark:ring-c-dm-blue transition-shadow duration-200
					placeholder:text-c-lm-gray-700 dark:placeholder:text-c-dm-gray-300
				`}
				onChange={handleOnChange}
			/>
		</div>
	);
};

export default SearchInput;
