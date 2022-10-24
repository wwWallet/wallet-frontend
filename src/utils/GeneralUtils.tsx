export const removeElementFromStringArray = (array: string[], elem: string): string[] => {
	const index: number = array.indexOf(elem);
	let newArray: string[] = array.slice(); // copy array
	newArray.splice(index, 1);	// remove that element
	return newArray;
}