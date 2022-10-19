import Polyglot from "node-polyglot";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import errorImg from '../../static/icons/wallet-error.webp';
import './Error.css';

const Error: React.FC<{ polyglot: Polyglot }> = ({ polyglot }) => {

	const [searchParams,] = useSearchParams();
	const [code, setCode] = useState("");

	useEffect(() => {
		if (searchParams.get("code") !== null) {
			const errorCode: string = searchParams.get("code")!.toString();
			setCode(errorCode);
		}
	}, []);


	return (
		<div className="gunet-container">
			<div className="error">
				<div className="error-content">
					<h1>{polyglot.t(`Error.error`)}</h1>
					<div>
						<p>{polyglot.t(`Error.${code}`)}</p>
						{code && <p className="error-code">{polyglot.t(`Error.code`)}: {code}</p>}
					</div>
				</div>
				<img className="error-image" src={errorImg} alt='error' />
			</div>
		</div>
	);

		// div(name="clients" id="org-form")
		// 	a.back-link.admin-return#return(href="/")
		// 		i(class="fa fa-arrow-left" aria-hidden="true")
		// 		|  Επιστροφή

		// .error
		// 	h1 Παρουσιάστηκε σφάλμα
		// 	.error-content
		// 		if typeof app_error == 'number'
		// 			.div
		// 				p #{err_text}
		// 				p.gray Κωδικός σφάλματος: #{app_error}
		// 		img.err-image(src="./error.svg" alt='error')
}

export default Error;