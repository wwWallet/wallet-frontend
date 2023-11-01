import { Dispatch, SetStateAction, useCallback, useEffect, useId, useState } from 'react';
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary } from '../util';

type UseStateHandle<T> = [T, Dispatch<SetStateAction<T>>];
type UseGlobalStateHook<T> = (name: string, [value, setValue]: UseStateHandle<T>) => UseStateHandle<T>;

function makeUseGlobalState<T>(): UseGlobalStateHook<T> {
	const setValueHandles = {};
	return (name: string, [value, setValue]: UseStateHandle<T>) => {
		const handleId = useId();

		const setAllValues = useCallback(
			(setValueArg: SetStateAction<any>) => {
				Object.values(setValueHandles[name]).forEach((setValueHandle: Dispatch<SetStateAction<T>>) => {
					setValueHandle(setValueArg);
				});
			},
			[name],
		);

		useEffect(
			() => {
				if (!setValueHandles[name]) {
					setValueHandles[name] = {};
				}
				setValueHandles[name][handleId] = setValue;

				return () => {
					delete setValueHandles[name][handleId];
				};
			},
			[handleId, name, setValue]
		);

		return [value, setAllValues];
	};
}

function makeUseStorage<T>(
	storage: Storage,
	description: string,
	useGlobalState: UseGlobalStateHook<T>,
): (name: string, initialValue: T) => UseStateHandle<T> {
	if (!storage) {
		throw new Error(`${description} is not available.`);
	}

	return (name: string, initialValue: T) => {
		const [currentValue, setValue] = useState(
			() => {
				const storedValueStr = storage.getItem(name);
				try {
					if (storedValueStr !== null) {
						return jsonParseTaggedBinary(storedValueStr);
					}
				} catch (e) {
					// Fall back to initialValue
					storage.removeItem(name);
				}
				return initialValue;
			}
		);

		// Browser storage is global state, so update all useState hooks with the
		// same name whenever one of them changes. The storage event is not fired
		// when storage.setItem is called in the same Document.
		const [, setAllValues] = useGlobalState(name, [currentValue, setValue]);

		const updateValue = useCallback(
			(action: SetStateAction<T>): void => {
				const newValue =
					action instanceof Function
					? action(currentValue)
					: action;
				try {
					storage.setItem(name, jsonStringifyTaggedBinary(newValue));
				} catch (e) {
					console.error(`Failed to update storage "${name}"`, e);
				}
				setAllValues(newValue);
			},
			[currentValue, name, setAllValues],
		);

		useEffect(
			() => {
				const listener = (event: StorageEvent) => {
					if (event.storageArea === storage) {
						if (event.key === name) { // Storage.setItem(name, value)
							setValue(jsonParseTaggedBinary(event.newValue));

						} else if (event.key === null) { // Storage.clear()
							setValue(initialValue);
						}
					}
				};
				window.addEventListener('storage', listener);

				return () => {
					window.removeEventListener('storage', listener);
				};
			},
			[name]
		);

		return [currentValue, updateValue];
	};
}

export const useLocalStorage: <T>(name: string, initialValue: T) => UseStateHandle<T> =
	makeUseStorage(window.localStorage, "Local storage", makeUseGlobalState());

export const useSessionStorage: <T>(name: string, initialValue: T) => UseStateHandle<T> =
	makeUseStorage(window.sessionStorage, "Session storage", makeUseGlobalState());

export const useClearLocalStorage = () => useCallback(
	() => {
		if (window.localStorage) {
			window.localStorage.clear();
		}
	},
	[],
);

export const useClearSessionStorage = () => useCallback(
	() => {
		if (window.sessionStorage) {
			window.sessionStorage.clear();
		}
	},
	[],
);
