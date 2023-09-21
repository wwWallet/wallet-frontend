import { Dispatch, SetStateAction, useCallback, useEffect, useId, useState } from 'react';
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary } from '../util';

type UseStateHandle<T> = [T, Dispatch<SetStateAction<T>>];

function makeUseGlobalState<T>(): (name: string, [value, setValue]: UseStateHandle<T>) => UseStateHandle<T> {
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
const useGlobalState: <T>(name: string, [value, setValue]: UseStateHandle<T>) => UseStateHandle<T> = makeUseGlobalState();

function makeUseStorage<T>(storage: Storage, description: string): (name: string, initialValue: T) => UseStateHandle<T> {
	if (!storage) {
		throw new Error(`${description} is not available.`);
	}

	return (name: string, initialValue: T) => {
		const storedValueStr = storage.getItem(name);
		let storedValue = initialValue;
		try {
			if (storedValueStr !== null) {
				storedValue = jsonParseTaggedBinary(storedValueStr);
			}
		} catch (e) {
			// Fall back to initialValue
			storage.removeItem(name);
		}
		const [currentValue, setValue] = useState(storedValue);

		useEffect(
			() => {
				try {
					if (!(currentValue === initialValue && storage.getItem(name) === null)) {
						storage.setItem(name, jsonStringifyTaggedBinary(currentValue));
					}
				} catch (e) {
					console.error(`Failed to update storage "${name}"`, e);
				}
			},
			[currentValue, initialValue, name]
		);

		useEffect(
			() => {
				const listener = (event: StorageEvent) => {
					if (event.key === name && event.storageArea === storage) {
						setValue(jsonParseTaggedBinary(event.newValue));
					}
				};
				window.addEventListener('storage', listener);

				return () => {
					window.removeEventListener('storage', listener);
				};
			},
			[name]
		);

		// Browser storage is global state, so update all useState hooks whenever
		// one of them changes.
		return useGlobalState(name, [currentValue, setValue]);
	};
}

export const useLocalStorage: <T>(name: string, initialValue: T) => UseStateHandle<T> =
	makeUseStorage(window.localStorage, "Local storage");

export const useSessionStorage: <T>(name: string, initialValue: T) => UseStateHandle<T> =
	makeUseStorage(window.sessionStorage, "Session storage");

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
