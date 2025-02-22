import { fromBase64 } from '@/util';

export const extractPresentations = (item: { presentation: string }): string[] => {
	if (item.presentation.startsWith("b64:") && (new TextDecoder().decode(fromBase64(item.presentation.replace("b64:", "")))).includes("[")) {
		return JSON.parse(new TextDecoder().decode(fromBase64(item.presentation.replace("b64:", ""))));
	}
	else if (item.presentation.startsWith("b64:")) {
		return [new TextDecoder().decode(fromBase64(item.presentation.replace("b64:", "")))];
	}
	else {
		return [item.presentation];
	}
}
