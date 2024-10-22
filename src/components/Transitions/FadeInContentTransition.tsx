import React, { useRef } from 'react';
import { CSSTransition } from 'react-transition-group';


export default function FadeInContentTransition({
	children,
	reanimateKey,
}: {
	appear?: boolean,
	children?: React.ReactNode,
	reanimateKey?: any,
}) {
	const nodeRef = useRef(null);
	return (
		<CSSTransition
			appear
			in={true}
			timeout={400}
			classNames="content-fade-in"
			nodeRef={nodeRef}
			key={reanimateKey}
		>
			<div ref={nodeRef}>
				{children}
			</div>
		</CSSTransition>
	);
};
