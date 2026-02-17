import { POLICY_LINKS } from "@/config";

const PolicyLinks = () => {
	if (typeof POLICY_LINKS !== 'string') {
		return;
	}

	const linksList = POLICY_LINKS
		.split(",")
		.map(item => {
			const [label, href] = item.split("::").map(str => str.trim());

			return label && href ? { label, href } : null;
		})
		.filter(link => link !== null)
		.map(({label, href}, idx, { length }) => (
			<>
				<a className="underline" href={href} target="_blank" rel="noreferrer">{label}</a>
				{length - idx > 2 && <>, </>}
				{length - idx === 2 && <> and </>}
			</>
		));

	if (linksList.length < 1) {
		return;
	}

	return (
		<span>
			{linksList}
		</span>
	)
};

export default PolicyLinks;
