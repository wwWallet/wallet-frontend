import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { BsPlusCircle } from 'react-icons/bs';

import * as api from '../../api';
import { UserData, WebauthnCredential } from '../../api/types';
import Layout from '../../components/Layout';
import { compareBy, toBase64Url } from '../../util';


const WebauthnRegistation = ({
	onSuccess,
}: {
	onSuccess: () => void,
}) => {
	const [beginData, setBeginData] = useState(null);
	const [pendingCredential, setPendingCredential] = useState(null);
	const [nickname, setNickname] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const dialog = useRef<HTMLDialogElement>();

	const onBegin = useCallback(
		async () => {
			setBeginData(null);
			setIsSubmitting(true);
			setPendingCredential(null);

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
					setBeginData(null);
					setPendingCredential(null);
				}
				setIsSubmitting(false);
			}
		},
		[],
	);

	const onCancel = () => {
		console.log("onCancel");
		setPendingCredential(null);
		setBeginData(null);
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
		[dialog, beginData],
	);

	const registrationInProgress = Boolean(beginData || pendingCredential);

	return (
		<>
			<button
            className="px-2 py-2 mb-2 text-white bg-custom-blue hover:bg-custom-blue-hover focus:ring-4 focus:outline-none focus:ring-custom-blue font-medium rounded-lg text-sm px-4 py-2 text-center dark:bg-custom-blue-hover dark:hover:bg-custom-blue-hover dark:focus:ring-custom-blue-hover"
						onClick={onBegin}
				disabled={registrationInProgress}
			>
				<div className="flex items-center">
					<BsPlusCircle size={20} className="text-white mr-2 sm:inline" />
					Addpasskey
				</div>
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

// Correct the types for DateTimeFormatOptions
const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  };
  return new Date(dateString).toLocaleString(undefined, options);
};


const WebauthnCredentialItem = ({
  credential,
  onDelete,
  showDelete = true,  // new prop to control the visibility of the delete button
}: {
  credential: WebauthnCredential,
  onDelete: () => void,
  showDelete?: boolean, // make it optional so existing usage won't break

	
}
) => (
  <div className="mb-2 pl-4 bg-white px-4 py-2 border border-gray-300 rounded-md">
    <p className="font-bold text-custom-blue">{credential.nickname || credential.id}</p>
		<p>Created: {formatDate(credential.createTime)}</p>
    <p>Last used: {formatDate(credential.lastUseTime)}</p>
    <p>Can encrypt: {credential.prfCapable ? "Yes" : "No"}</p>
    {showDelete && (
      <button
        className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        type="button"
        onClick={onDelete}
        aria-label={`Delete passkey "${credential.nickname || credential.id}"`}
      >
        <FaTrash />
      </button>
    )}
  </div>
);



const Home = () => {
	const [userData, setUserData] = useState<UserData>(null);

	const refreshData = useCallback(
		async () => {
			try {
				const response = await api.get('/user/session/account-info');
				console.log(response.data);
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

	const deleteWebauthnCredential = async (id: string) => {
		await api.del(`/user/session/webauthn/credential/${id}`);
		refreshData();
	};

	// Determine the logged-in passkey
	const loggedInPasskey = userData?.webauthnCredentials
	.filter(cred => cred.lastUseTime !== cred.createTime)
	.sort((a, b) => new Date(b.lastUseTime).getTime() - new Date(a.lastUseTime).getTime())[0]
	|| userData?.webauthnCredentials
	.sort((a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime())[0];

	return (
		<Layout>
			<div className="sm:px-6 w-full">
				{userData && (
					<>
						<h1 className="text-2xl mb-2 font-bold text-custom-blue">Account settings : {userData.displayName} </h1>
						<hr className="mb-2 border-t border-custom-blue/80" />
        		<p className="italic pd-2 text-gray-700">View acount informations and manage passkeys</p>

						<div className="mt-2 mb-2 py-2">
            	<h1 className="text-lg mt-2 mb-2 font-bold text-custom-blue">Logged in passkey</h1>
            	<hr className="mb-2 border-t border-gray-300"/>
							{loggedInPasskey && (
								<WebauthnCredentialItem
									key={loggedInPasskey.id}
									credential={loggedInPasskey}
									onDelete={() => {}}
									showDelete={false}  // Set showDelete to false
								
								/>
							)}
          	</div>
						<div className="mt-2 mb-2 py-2">
						<div className="flex justify-between items-center">
							<h1 className="text-lg mt-2 mb-2 font-bold text-custom-blue">Other Passkeys</h1>
							<WebauthnRegistation onSuccess={() => refreshData()} />
						</div>
            	<hr className="mb-2 border-t border-gray-500"/>

							<ul className="mt-4">
							{userData.webauthnCredentials
								.filter(cred => !loggedInPasskey || cred.id !== loggedInPasskey.id)
								.sort(compareBy((cred: WebauthnCredential) => new Date(cred.createTime)))
								.map(cred => (
									<WebauthnCredentialItem
										key={cred.id}
										credential={cred}
										onDelete={() => deleteWebauthnCredential(cred.id)}
										showDelete={true}  // Set showDelete to false

									/>
								))}
						</ul>
						</div>

					</>
				)}
			</div>
		</Layout>
	);
};

export default Home;
