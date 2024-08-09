import React from 'react';


interface DefaultableProps {
	flexAlignItems?: "start" | "end" | "center" | "baseline" | "stretch",
	flexJustifyContent?: "normal" | "start" | "end" | "center" | "between" | "around" | "evenly" | "stretch",
}

interface Props extends DefaultableProps {
	children?: React.ReactNode,
	heading: React.ReactNode,
}


const defaults: DefaultableProps = {
	flexAlignItems: "center",
	flexJustifyContent: "between",
}


function withDefaults(defaults: DefaultableProps, Component: React.ComponentType<Props>): React.ComponentType<Props> {
	return (props: Props) => {
		const p = { ...defaults, ...props };
		return <Component {...p} />;
	};
}


export const H1 = withDefaults(defaults, (props: Props) => (
	<>
		<div className={`flex justify-${props.flexJustifyContent} items-${props.flexAlignItems}`}>
			<h1 className="text-2xl mb-2 font-bold text-primary dark:text-white">
				{props.heading}
			</h1>
			{props.children}
		</div>
		<hr className="mb-2 border-t border-primary/80 dark:border-white/80" />
	</>
));

export const H2 = withDefaults(defaults, (props: Props) => (
	<>
		<div className={`flex justify-${props.flexJustifyContent} items-${props.flexAlignItems}`}>
			<h2 className="text-lg mt-2 mb-2 font-bold text-primary dark:text-primary-light">
				{props.heading}
			</h2>
			{props.children}
		</div>
		<hr className="mb-2 border-t border-primary/80 dark:border-primary-light/80" />
	</>
));

export const H3 = withDefaults(defaults, (props: Props) => (
	<>
		<div className={`flex justify-${props.flexJustifyContent} items-${props.flexAlignItems}`}>
			<h3 className="font-semibold my-2 text-gray-700 dark:text-gray-400">
				{props.heading}
			</h3>
			{props.children}
		</div>
		<hr className="mb-2 border-t border-gray-700/80 dark:border-gray-400/80" />
	</>
));
