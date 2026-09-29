import { useEffect, useRef, useState } from 'react';

const SNOWFLAKE_COUNT = 50;

const randomBetween = (min, max) => Math.random() * (max - min) + min;

const SnowfallCanvas = () => {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas?.getContext('2d');

		if (!canvas || !context) return undefined;

		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		let animationFrame;
		let width = 0;
		let height = 0;
		let previousTime = 0;
		let snowColor = '100, 116, 139';

		const updateSnowColor = () => {
			snowColor = document.documentElement.classList.contains('dark')
				? '255, 255, 255'
				: '100, 116, 139';
		};

		const themeObserver = new MutationObserver(updateSnowColor);

		const snowflakes = Array.from({ length: SNOWFLAKE_COUNT }, () => ({
			x: Math.random(),
			y: Math.random(),
			radius: randomBetween(1, 3.5),
			speed: randomBetween(25, 70),
			wind: randomBetween(-8, 8),
			sway: randomBetween(0, Math.PI * 2),
			opacity: randomBetween(0.25, 0.6),
		}));

		const resize = () => {
			const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
			width = window.innerWidth;
			height = window.innerHeight;
			canvas.width = Math.round(width * pixelRatio);
			canvas.height = Math.round(height * pixelRatio);
			context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
		};

		const draw = (time) => {
			const elapsed = Math.min((time - previousTime) / 1000, 0.05);
			previousTime = time;
			context.clearRect(0, 0, width, height);

			const visibleSnowflakeCount = width <= 640
				? Math.ceil(SNOWFLAKE_COUNT / 2)
				: SNOWFLAKE_COUNT;

			for (let index = 0; index < visibleSnowflakeCount; index += 1) {
				const snowflake = snowflakes[index];
				const x = snowflake.x * width;
				const y = snowflake.y * height;

				context.beginPath();
				context.arc(x, y, snowflake.radius, 0, Math.PI * 2);
				context.fillStyle = `rgba(${snowColor}, ${snowflake.opacity})`;
				context.fill();

				snowflake.x += (
					snowflake.wind + Math.sin(time / 900 + snowflake.sway) * 10
				) * elapsed / Math.max(width, 1);
				snowflake.y += snowflake.speed * elapsed / Math.max(height, 1);

				if (snowflake.y > 1.02) {
					snowflake.y = -0.02;
					snowflake.x = Math.random();
				}

				if (snowflake.x > 1.02) snowflake.x = -0.02;
				if (snowflake.x < -0.02) snowflake.x = 1.02;
			}

			animationFrame = window.requestAnimationFrame(draw);
		};

		const updateAnimation = () => {
			window.cancelAnimationFrame(animationFrame);
			context.clearRect(0, 0, width, height);

			if (!reducedMotion.matches) {
				previousTime = performance.now();
				animationFrame = window.requestAnimationFrame(draw);
			}
		};

		updateSnowColor();
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class'],
		});
		resize();
		updateAnimation();
		window.addEventListener('resize', resize);
		reducedMotion.addEventListener('change', updateAnimation);

		return () => {
			window.cancelAnimationFrame(animationFrame);
			themeObserver.disconnect();
			window.removeEventListener('resize', resize);
			reducedMotion.removeEventListener('change', updateAnimation);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden="true"
			style={{
				position: 'fixed',
				inset: 0,
				width: '100vw',
				height: '100vh',
				pointerEvents: 'none',
				zIndex: 9999,
			}}
		/>
	);
};

const Snowfalling = () => {
	const [isChristmasSeason, setIsChristmasSeason] = useState(false);

	useEffect(() => {
		const today = new Date();
		const month = today.getMonth();
		const day = today.getDate();

		setIsChristmasSeason(
			(month === 11 && day >= 20) || (month === 0 && day <= 6),
		);
	}, []);

	return !isChristmasSeason ? <SnowfallCanvas /> : null;
};

export default Snowfalling;
