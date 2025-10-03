// components/History/HistoryList.jsx
import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useScreenType from '../../hooks/useScreenType';
import { formatDate } from '../../functions/DateFormat';
import { H3 } from '../Shared/Heading';
import HistoryDetailPopup from '../Popups/HistoryDetailPopup';

// Context
import SessionContext from '@/context/SessionContext';
import useFetchPresentations from '@/hooks/useFetchPresentations';
import { reverse, compareBy } from '@/util';

/** ------------------ Pure view (NO data fetching here) ------------------ */
function HistoryListView({ batchId = null, title = '', limit = null, history = {} }) {
	const navigate = useNavigate();
	const screenType = useScreenType();

	// normalize in case history is [] (some callers return [] on empty)
	const normalized = (history && !Array.isArray(history)) ? history : {};
	const groups = useMemo(() => Object.values(normalized), [normalized]);

	const [isImageModalOpen, setImageModalOpen] = useState(false);
	const [selectedByBatch, setSelectedByBatch] = useState(null);
	const [selectedByTx, setSelectedByTx] = useState(null);

	useEffect(() => {
		if (batchId !== null && groups.length > 0) setSelectedByBatch(groups[0]);
		else setSelectedByBatch(null);
	}, [batchId, groups]);

	const handleHistoryItemClick = (item) => {
		const transactionId = item[0].presentation.transactionId;
		if (screenType === 'mobile') navigate(`/history/${transactionId}`);
		else {
			setSelectedByTx(item);
			setImageModalOpen(true);
		}
	};

	const sorted = useMemo(
		() =>
			groups
				.slice()
				.sort(
					reverse(compareBy(item => item[0].presentation.presentationTimestampSeconds))
				),
		[groups]
	);

	return (
		<>
			<div className="py-2 w-full">
				{title && groups.length > 0 && <H3 heading={title} />}
				<div className="overflow-auto space-y-2" style={{ maxHeight: '85vh' }}>
					{(limit ? sorted.slice(0, limit) : sorted).map(item => (
						<button
							id={`credential-history-item-${item[0].presentation.transactionId}`}
							key={item[0].presentation.transactionId}
							className="bg-gray-50 dark:bg-gray-800 text-sm px-4 py-2 dark:text-white border border-gray-200 shadow-sm dark:border-gray-600 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 break-words w-full text-left"
							style={{ wordBreak: 'break-all' }}
							onClick={() => handleHistoryItemClick(item)}
						>
							<div className="font-bold">{item[0].presentation.audience}</div>
							<div>{formatDate(item[0].presentation.presentationTimestampSeconds)}</div>
						</button>
					))}
				</div>
			</div>

			<HistoryDetailPopup
				isOpen={isImageModalOpen}
				onClose={() => setImageModalOpen(false)}
				historyItem={selectedByBatch ?? selectedByTx ?? []}
			/>
		</>
	);
}

function HistoryListFetcher({ batchId = null, title = '', limit = null }) {
	const { keystore } = useContext(SessionContext);
	const history = useFetchPresentations(keystore, batchId, null);
	return <HistoryListView batchId={batchId} title={title} limit={limit} history={history} />;
}

/** If `history` prop is provided → no hook call. Otherwise fetcher calls the hook. */
export default function HistoryList({ batchId = null, title = '', limit = null, history = null }) {
	if (history) {
		return <HistoryListView batchId={batchId} title={title} limit={limit} history={history} />;
	}
	return <HistoryListFetcher batchId={batchId} title={title} limit={limit} />;
}
