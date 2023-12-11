import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { jsonParseTaggedBinary, jsonStringifyTaggedBinary } from '../util';

type ClearHandle = () => void;
type UseStorageHandle<T> = [T, Dispatch<SetStateAction<T>>, ClearHandle];
type UseStorageEvent = { storageArea: Storage };
type ClearEvent = UseStorageEvent;
type SetValueEvent<T> = UseStorageEvent & { name: string, value: T };

function makeUseStorage<T>(
	storage: Storage,
	description: string,
): (name: string, initialValue: T) => UseStorageHandle<T> {
	if (!storage) {
		throw new Error(`${description} is not available.`);
	}

	return (name: string, initialValue: T) => {
		const getCurrentValue = useCallback(
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
			},
			[],
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
			[],
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
							value: initialValue,
						},
					})
				);
			},
			[],
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
							setValue(initialValue);
						}
					}
				};
				window.addEventListener('storage', listener);

				return () => {
					window.removeEventListener('storage', listener);
				};
			},
			[]
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
			[],
		);

		useEffect(
			() => {
				// Listen to synthetic events sent by the useClearLocalStorage and
				// useClearSessionStorage hooks. Storage.clear() does not send "storage"
				// events in the same Document.
				const listener = (event: CustomEvent<ClearEvent>) => {
					if (event.detail.storageArea === storage) {
						setValue(initialValue);
					}
				};
				window.addEventListener('useStorage.clear', listener);
				return () => {
					window.removeEventListener('useStorage.clear', listener);
				};
			},
			[],
		);

		return [currentValue, updateValue, clearValue];
	};
}

function makeUseClearStorage(storage: Storage, description: string): () => ClearHandle {
	if (!storage) {
		throw new Error(`${description} is not available.`);
	}

	return () => useCallback(
		() => {
			storage.clear();
			window.dispatchEvent(new CustomEvent<ClearEvent>('useStorage.clear', {
				detail: { storageArea: storage },
			}));
		},
		[],
	);
}

export const useLocalStorage: <T>(name: string, initialValue: T) => UseStorageHandle<T> =
	makeUseStorage(window.localStorage, "Local storage");

export const useSessionStorage: <T>(name: string, initialValue: T) => UseStorageHandle<T> =
	makeUseStorage(window.sessionStorage, "Session storage");

export const useClearLocalStorage: () => ClearHandle = makeUseClearStorage(window.localStorage, "Local storage");
export const useClearSessionStorage: () => ClearHandle = makeUseClearStorage(window.sessionStorage, "Session storage");

export const useClearStorages: (...clearHandles: ClearHandle[]) => ClearHandle =
	(...clearHandles: ClearHandle[]) => useCallback(
		() => {
			clearHandles.forEach(clear => clear());
		},
		[...clearHandles],
	);
