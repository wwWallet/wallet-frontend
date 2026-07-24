import React, { useRef, useState } from 'react';
import Modal from 'react-modal';

const DEFAULT_DISMISS_THRESHOLD_PX = 100;

const BottomSheet = ({
	isOpen,
	onClose,
	contentLabel,
	children,
	dismissThresholdPx = DEFAULT_DISMISS_THRESHOLD_PX,
	shouldCloseOnOverlayClick = true,
}: {
	isOpen: boolean,
	onClose: () => void,
	contentLabel: string,
	children: React.ReactNode,
	dismissThresholdPx?: number,
	shouldCloseOnOverlayClick?: boolean,
}) => {
	const [dragY, setDragY] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	const dragStartYRef = useRef(0);

	if (!isOpen) {
		return null;
	}

	const onHandlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		event.currentTarget.setPointerCapture(event.pointerId);
		dragStartYRef.current = event.clientY;
		setIsDragging(true);
	};

	const onHandlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
		if (!isDragging) return;
		setDragY(Math.max(0, event.clientY - dragStartYRef.current));
	};

	const onHandlePointerUp = () => {
		setIsDragging(false);
		if (dragY > dismissThresholdPx) {
			onClose();
		}
		setDragY(0);
	};

	return (
		<Modal
			isOpen={true}
			onRequestClose={onClose}
			shouldCloseOnOverlayClick={shouldCloseOnOverlayClick}
			contentLabel={contentLabel}
			className="w-full max-h-[85dvh] flex flex-col bg-lm-gray-100 dark:bg-dm-gray-900 rounded-t-2xl shadow-2xl p-6 pt-3 outline-none"
			overlayClassName="fixed inset-0 z-50 flex items-end justify-center bg-lm-gray-900/50 dark:bg-dm-gray-500/50 backdrop-blur-xs"
			bodyOpenClassName="overflow-hidden"
			style={{
				content: {
					transform: `translateY(${dragY}px)`,
					transition: isDragging ? 'none' : 'transform 0.2s ease-out',
				},
			}}
		>
			<div
				aria-hidden="true"
				className="mx-auto mb-2 h-1.5 w-10 shrink-0 rounded-full bg-lm-gray-400 dark:bg-dm-gray-600 cursor-grab active:cursor-grabbing touch-none"
				onPointerDown={onHandlePointerDown}
				onPointerMove={onHandlePointerMove}
				onPointerUp={onHandlePointerUp}
				onPointerCancel={onHandlePointerUp}
			/>
			{children}
		</Modal>
	);
};

export default BottomSheet;
