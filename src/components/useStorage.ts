import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary } from '../util';

type ClearHandle = () => void;
export type UseStorageHandle<T> = [T, Dispatch<SetStateAction<T>>, ClearHandle];
type UseStorageEvent = { storageArea: Storage };
type SetValueEvent<T> = UseStorageEvent & { name: string, value: T };

function makeUseStorage<T>(
	storage: Storage,
	description: string,
): (name: string, initialValue: T) => UseStorageHandle<T> {
	if (!storage) {
		throw new Error(`${description} is not available.`);
	}

	return (name: string, initialValue: T) => {
		const [initValue,] = useState(initialValue);

		const getCurrentValue = useCallback(
			() => {
				const storedValueStr = storage.getItem(name);
				try {
					if (storedValueStr !== null) {
						return jsonParseTaggedBinary(storedValueStr);
					}
				} catch (e) {
					// Fall back to initValue
					storage.removeItem(name);
				}
				return initValue;
			},
			[initValue, name],
		);

		const [currentValue, setValue] = useState(getCurrentValue);

		const updateValue = useCallback(
			(action: SetStateAction<T>): void => {
				const newValue =
					action instanceof Function
					? action(getCurrentValue())
					: action;
				try {
					storage.setItem(name, jsonStringifyTaggedBinary(newValue));
				} catch (e) {
					console.error(`Failed to update storage "${name}"`, e);
				}
				window.dispatchEvent(
					new CustomEvent<SetValueEvent<T>>('useStorage.set', {
						detail: {
							storageArea: storage,
							name,
							value: newValue,
						},
					})
				);
			},
			[getCurrentValue, name],
		);

		const clearValue = useCallback(
			(): void => {
				try {
					storage.removeItem(name);
				} catch (e) {
					console.error(`Failed to remove storage "${name}"`, e);
				}
				window.dispatchEvent(
					new CustomEvent<SetValueEvent<T>>('useStorage.set', {
						detail: {
							storageArea: storage,
							name,
							value: initValue,
						},
					})
				);
			},
			[initValue, name],
		);

		useEffect(
			() => {
				// Listen to storage events sent by the browser. These events are
				// triggered when the storage is changed in another tab, or when edited
				// manually by the user. Storage.setItem() and .removeItem() calls in
				// the same Document do not trigger these events, so we cannot use them
				// to synchronize state between useStorage hook instances.
				const listener = (event: StorageEvent) => {
					if (event.storageArea === storage) {
						if (event.key === name) { // Storage.setItem(name, value)
							setValue(jsonParseTaggedBinary(event.newValue));

						} else if (event.key === null) { // Storage.clear()
							setValue(initValue);
						}
					}
				};
				window.addEventListener('storage', listener);

				return () => {
					window.removeEventListener('storage', listener);
				};
			},
			[initValue, name]
		);

		useEffect(
			() => {
				// Listen to synthetic events sent when a useStorage hook updates its
				// state. This causes all useStorage instances with the same name to
				// update their state, including the instance that caused the change.
				const listener = (event: CustomEvent<SetValueEvent<T>>) => {
					if (event.detail.storageArea === storage && event.detail.name === name) {
						setValue(event.detail.value);
					}
				};
				window.addEventListener('useStorage.set', listener);
				return () => {
					window.removeEventListener('useStorage.set', listener);
				};
			},
			[name],
		);

		return [currentValue, updateValue, clearValue];
	};
}

export const useLocalStorage: <T>(name: string, initialValue: T) => UseStorageHandle<T> =
	makeUseStorage(window.localStorage, "Local storage");

export const useSessionStorage: <T>(name: string, initialValue: T) => UseStorageHandle<T> =
	makeUseStorage(window.sessionStorage, "Session storage");

export const useClearStorages: (...clearHandles: ClearHandle[]) => ClearHandle =
	(...clearHandles: ClearHandle[]) => useCallback(
		() => {
			clearHandles.forEach(clear => clear());
		},
		[...clearHandles], // eslint-disable-line react-hooks/exhaustive-deps -- Arrays are not stable under Object.is, so we have to use spread operator here
	);
