import Polyglot from "node-polyglot";
import React, { useEffect, useState } from "react";
import { SelectElement } from "../../interfaces/SelectProps";
import FilterAuditRecordsModal from "../Modals/FilterAuditRecordsModal";
import './Audit.css';

interface RecordEntity {
	id: number;
	presentation: string;
	format: 'jwt_vp' | 'ldp_vp';
	createdAt: string; // iso string probably
}



const Audit: React.FC<{polyglot: Polyglot}> = ({polyglot}) => {
	
	const [records, setRecords] = useState<RecordEntity[]>([]);


	// modal
	const [modalSettings, setModalSettings] = useState<boolean>(false);
	const handleOpenModal = () => {
		setModalSettings(true);
	}
	const handleCloseModal = () => {
		setModalSettings(false);
	}

	// define the credential types that exist on the VPs
	const [credentialTypes, setCredentialTypes] = useState<SelectElement[]>([]);
	const [selectedCredentialTypes, setSelectedCredentialTypes] = useState<SelectElement[]>([]);


	useEffect(() => {
		const list: RecordEntity[] = [
			{id: 1, createdAt: new Date().toDateString(), presentation: "", format: 'jwt_vp'},
			{id: 2, createdAt: new Date().toDateString(), presentation: "", format: 'jwt_vp'},
			{id: 3, createdAt: new Date().toDateString(), presentation: "", format: 'jwt_vp'},
			{id: 4, createdAt: new Date().toDateString(), presentation: "", format: 'jwt_vp'},
		];

		setRecords(list);
	}, []);

	const handleSelectTypes = (types: SelectElement[]) => {
		setSelectedCredentialTypes(types);
		handleCloseModal();
	}

	return (<div className="gunet-container">
		<div id="Audit">
			<h4>Audit log</h4>
			<div className='filter-vp'>
				<span className="hamburger fa fa-bars" onClick={handleOpenModal}/>
			</div>
			<div className="applications-table">
				<table className="striped">
					<thead className="thead">
						<tr className="tr fixed">
							<th className="th idCol"></th>
							<th className="th" scope="col">id</th>
							<th className="th" scope="col">Created</th>
						</tr>
					</thead>
					<tbody className="tbody">
						{records.map((R, index) => {
							return <tr key={index} className="tr" id="record">
								<td className="td idCol" id={"record-id-" + R.id}>{R.id}</td>
								<td className="td" id={"record-identifier-" + R.id}>{R.id}</td>
								<td className="td" id={"record-created-" + R.id}>{R.createdAt}</td>
							</tr>
						})}
					</tbody>
				</table>
			</div>
		</div>
		<FilterAuditRecordsModal isOpen={modalSettings}
				handleClose={handleCloseModal} handleSelect={handleSelectTypes}
				credentialTypes={credentialTypes} selectedCredentialTypes={selectedCredentialTypes}
				polyglot={polyglot}/>
	</div>);
}

export default Audit;