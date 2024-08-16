import React, { useState, useEffect, useRef } from 'react';
import { CSSTransition } from 'react-transition-group';


export default function FadeInContentTransition({
	appear,
	children,
	reanimateKey,
}: {
	appear?: boolean,
	children?: React.ReactNode,
	reanimateKey?: any,
}) {
	const [isContentVisible, setIsContentVisible] = useState(false);
	const nodeRef = useRef(null);

	useEffect(() => {
		setIsContentVisible(false);
		const timer = setTimeout(() => {
			setIsContentVisible(true);
		}, 0);
		return () => clearTimeout(timer);
	}, [reanimateKey]); // Only runs when reanimateKey changes

	return (
		<CSSTransition
			in={isContentVisible}
			timeout={400}
			classNames="content-fade-in"
			appear={appear}
			nodeRef={nodeRef}
		>
			<div ref={nodeRef}>
				{children}
			</div>
		</CSSTransition>
	);
};
