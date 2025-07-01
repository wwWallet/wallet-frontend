import { useEffect, useState } from "react";
import { useHttpProxy } from "@/lib/services/HttpProxy/HttpProxy";

export const useProxiedImage = (uri?: string | null) => {
	const proxy = useHttpProxy();
	const [src, setSrc] = useState<string | null>(null);

	useEffect(() => {
		if (!uri || typeof uri !== "string" || !uri.trim()) {
			setSrc(null);
			return;
		}

		// Handle data URIs directly (e.g. data:image/svg+xml;base64,...)
		if (uri.startsWith("data:")) {
			setSrc(uri);
			return;
		}

		// Handle HTTPS or HTTP fetch via proxy
		if (uri.startsWith("http")) {
			proxy
				.get(uri, {}, { useCache: true })
				.then((res) => {
					if (res.status === 200 && typeof res.data === "string") {
						const contentType = String(res.headers?.["content-type"] || "");

						if (contentType.includes("svg")) {
							const svgText = res.data;
							const encoded = btoa(
								new TextEncoder()
									.encode(svgText)
									.reduce((data, byte) => data + String.fromCharCode(byte), "")
							);
							setSrc(`data:image/svg+xml;base64,${encoded}`);
						} else {
							setSrc(res.data);
						}
					}
				})
				.catch(() => setSrc(null));
		} else {
			console.warn("Unsupported logo URI scheme:", uri);
			setSrc(null);
		}
	}, [uri, proxy]);

	return src;
};
