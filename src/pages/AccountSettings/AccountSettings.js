import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaTrash } from 'react-icons/fa';

import * as api from '../../api';
import Layout from '../../components/Layout';
import { toBase64Url } from '../../util';


const WebauthnRegistation = ({
	onSuccess,
}) => {
	const [beginData, setBeginData] = useState();
	const [pendingCredential, setPendingCredential] = useState();
	const [nickname, setNickname] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const dialog = useRef();

	const onBegin = useCallback(
		async () => {
			setBeginData();
			setIsSubmitting(true);
			setPendingCredential();

			const beginResp = await api.post('/user/session/webauthn/register-begin', {});
			console.log("begin", beginResp);
			const beginData = beginResp.data;

			if (beginData.challengeId) {
				setBeginData(beginData);

				try {
					const credential = await navigator.credentials.create(beginData.createOptions);
					console.log("created", credential);
					setPendingCredential(credential);
				} catch (e) {
					console.error("Failed to register", e);
					setBeginData();
					setPendingCredential();
				}
				setIsSubmitting(false);
			}
		},
		[],
	);

	const onCancel = () => {
		console.log("onCancel");
		setPendingCredential();
		setBeginData();
		setIsSubmitting(false);
	};

	const onFinish = async (event) => {
		event.preventDefault();
		console.log("onFinish", event);

		if (beginData && pendingCredential) {
			setIsSubmitting(true);

			try {
				await api.post('/user/session/webauthn/register-finish', {
					challengeId: beginData.challengeId,
					nickname,
					credential: {
						type: pendingCredential.type,
						id: pendingCredential.id,
						rawId: pendingCredential.id,
						response: {
							attestationObject: toBase64Url(pendingCredential.response.attestationObject),
							clientDataJSON: toBase64Url(pendingCredential.response.clientDataJSON),
							transports: pendingCredential.response.getTransports(),
						},
						authenticatorAttachment: pendingCredential.authenticatorAttachment,
						clientExtensionResults: pendingCredential.getClientExtensionResults(),
					},
				});
				onSuccess();
				setNickname("");
			} catch (e) {
				console.error("Failed to finish registration", e);
			}
			onCancel();
		} else {
			console.error("Invalid state:", beginData, pendingCredential);
		}
	};

	useEffect(
		() => {
			if (dialog.current) {
				if (beginData) {
					dialog.current.showModal();
				} else {
					dialog.current.close();
				}
			}
		},
		[dialog.current, beginData],
	);

	const registrationInProgress = Boolean(beginData || pendingCredential);

	return (
		<>
			<button
				className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
				onClick={onBegin}
				disabled={registrationInProgress}
			>
				Add passkey
			</button>

			<dialog
				ref={dialog}
				className="p-4 pt-8 text-center rounded"
				style={{ minHeight: '20em', minWidth: '30em' }}
				onCancel={onCancel}
			>
				<form method="dialog" onSubmit={onFinish}>
					{pendingCredential
						? (
							<>
								<h3 className="text-2xl mt-4 mb-2 font-bold text-custom-blue">Success!</h3>
								<p className="mb-2">Give this credential a nickname:</p>
								<input
									type="text"
									className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
									aria-label="Nickname for new credential"
									autoFocus={true}
									disabled={isSubmitting}
									onChange={(event) => setNickname(event.target.value)}
									placeholder="Credential nickname"
									value={nickname}
								/>
							</>
						)
						: (
							<>
								<p>Please interact with your authenticator...</p>
							</>
						)
					}

					<div className="pt-2">
						<button
							type="button"
							className="bg-white px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 mr-2"
							onClick={onCancel}
							disabled={isSubmitting}
						>
							Cancel
						</button>

						{pendingCredential && (
							<button
								type="submit"
								className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
								disabled={isSubmitting}
							>
								Save
							</button>
						)}
					</div>

				</form>
			</dialog>
		</>
	);
};


const WebauthnCredential = ({ credential, onDelete }) => (
	<li
		className="mb-2 pl-4 bg-white px-4 py-2 border border-gray-300 rounded-md"
	>
		<p className="font-bold text-custom-blue">{credential.nickname || credential.id}</p>
		<p>Created: {credential.createTime}</p>
		<p>Last used: {credential.lastUseTime}</p>
		<p>Can encrypt: {credential.prfCapable ? "Yes" : "No"}</p>
		<button
			className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
			type="button"
			onClick={onDelete}
			aria-label={`Delete passkey "${credential.nickname || credential.id}"`}
		>
			<FaTrash />
		</button>
	</li>
);


const Home = () => {
	const [userData, setUserData] = useState();

	const refreshData = useCallback(
		async () => {
			try {
				const response = await api.get('/user/session/account-info');
				setUserData(response.data);
			} catch (error) {
				console.error('Failed to fetch data', error);
			}
		},
		[setUserData],
	);

	useEffect(
		() => {
			refreshData();
		},
		[refreshData],
	);

	const deleteWebauthnCredential = async (id) => {
		await api.del(`/user/session/webauthn/credential/${id}`);
		refreshData();
	};

	return (
		<Layout>
			<div className="px-4 sm:px-6 w-full">

				<h1 className="text-2xl mb-2 font-bold text-custom-blue">Account settings</h1>
				<hr className="mb-2 border-t border-custom-blue/80" />

				{userData && (
					<>
						<p className="pd-2 text-gray-700">Username: {userData.username}</p>
						<p className="pd-2 text-gray-700">Public key: {JSON.stringify(userData.publicKey)}</p>

						<h2 className="text-2xl mt-4 mb-2 font-bold text-custom-blue">Passkeys</h2>

						<WebauthnRegistation onSuccess={() => refreshData()} />

						{userData.webauthnCredentials.length > 0
							? (
								<ul className="mt-4">
									{userData.webauthnCredentials.toSorted((a, b) => new Date(a.createTime) - new Date(b.createTime)).map(cred => (
										<WebauthnCredential
											key={cred.id}
											credential={cred}
											onDelete={() => deleteWebauthnCredential(cred.id)}
										/>
									))}
								</ul>
							)
							: (
								<p className="pd-2 text-gray-700">You have no passkeys.</p>
							)}
					</>
				)}

			</div>
		</Layout>
	);
};

export default Home;
