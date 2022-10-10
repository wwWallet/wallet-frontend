import React, { useRef, useState } from 'react';
import moment from 'moment';
import Tooltip from './Tooltip';

import './Form.css';
import '../../App.css';

interface FormProps {
	className: string,
	onSubmit(): void,
	children: JSX.Element;
}
export const Form: React.FC<FormProps> = ({ className, onSubmit, children }) => {
	return (<form className={`Form ${className}`} onSubmit={onSubmit}>{children}</form>)
};

export const FormGroup: React.FC<{ children: JSX.Element }> = ({ children }) => {
	return (<div className="Group">{children}</div>);
};

export const InputGroup: React.FC<{ children: JSX.Element }> = ({ children }) => {
	return (<div className="input-group">{children}</div>);
};

interface LabelProps {
	id: string,
	tooltip: string,
	label: string;
}
export const Label: React.FC<LabelProps> = ({ id, tooltip, label }) => {
	return (
		<React.Fragment>
			{tooltip ?
				<label htmlFor={id}>
					<Tooltip tip={tooltip}>
						<span className="tooltip-label">{label}</span>
					</Tooltip>
				</label>
				:
				<label htmlFor={id}>{label}</label>
			}
		</React.Fragment>
	);
};

interface TextInputProps {
	id: string,
	label: string,
	tooltip: string,
	type?: string,
	value: string,
	onChange(): void,
	onBlur(): void,
	minLength: number,
	maxLength: number;
}
export const TextInput: React.FC<TextInputProps> = ({ id, label, tooltip, type, value, onChange, onBlur, minLength, maxLength }) => {

	return (
		<InputGroup>
			<React.Fragment>
				{label && (
					<Label tooltip={tooltip} id={id} label={label} />
				)}
				<input
					data-tip={tooltip}
					id={id}
					className={label ? 'labeled' : ''}
					type={type != undefined ? type : 'text'}
					value={value}
					onChange={onChange}
					onBlur={onBlur}
					maxLength={maxLength}
					minLength={minLength}
				/>
			</React.Fragment>
		</InputGroup>
	);
};

interface DropdownProps {
	id: string,
	label: string,
	tooltip: string,
	placeholder: string,
	onChange(): void,
	options: { value: string, label: string }[];
}
export const Dropdown: React.FC<DropdownProps> = ({ id, label, tooltip, placeholder, onChange, options }) => {

	return (
		<InputGroup>
			<React.Fragment>
				{label && (
					<Label tooltip={tooltip} id={id} label={label} />
				)}
				<select
					onChange={onChange}
					className={label ? 'labeled' : ''}
				>
					<option value="" className="placeholder" selected disabled>
						{placeholder}
					</option>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</React.Fragment>
		</InputGroup>
	);
};

interface DateInputProps {
	id: string,
	label: string,
	tooltip: string,
	pDay: string,
	pMonth: string,
	pYear: string,
	handleError(error: boolean): void;
}
export const DateInput: React.FC<DateInputProps> = ({ id, label, tooltip, pDay, pMonth, pYear, handleError }) => {

	const monthRef = useRef<HTMLInputElement>(null);
	const yearRef = useRef<HTMLInputElement>(null);

	const [day, setDay] = useState(pDay);
	const [month, setMonth] = useState(pMonth);
	const [year, setYear] = useState(pYear);

	const handleDay = (e: any) => {
		const target = e.currentTarget;
		const value = target.value.replace(/\D/g, '');
		setDay(value);
		if (parseInt(value) > 0 && value.length === 2 && parseInt(value) <= 31 && monthRef.current !== null) {
			monthRef.current.focus();
			monthRef.current.select();
		}
	};

	const handleMonth = (e: any) => {
		const target = e.currentTarget;
		const value = target.value.replace(/\D/g, '');
		setMonth(value);
		if (parseInt(value) > 0 && value.length === 2 && parseInt(value) <= 12 && yearRef.current !== null) {
			yearRef.current.focus();
			yearRef.current.select();
		}
	};

	const handleYear = (e: any) => {
		const target = e.currentTarget;
		const value = target.value.replace(/\D/g, '');
		setYear(value);
	};

	const dayIsValid = () => parseInt(day) > 0 && parseInt(day) <= 31;

	const monthIsValid = () =>
		parseInt(month) > 0 && parseInt(month) <= 12;

	const yearIsValid = () =>
		parseInt(year) > 0 &&
		parseInt(year) <= new Date().getFullYear();

	const dateIsValid = () => {
		const validDay = dayIsValid();
		const validMonth = monthIsValid();
		const validYear = yearIsValid();
		let dateIsValid = validDay && validMonth && validYear;
		if (dateIsValid) {
			const date = moment(`${year}-${month}-${day}`);
			dateIsValid = date.isValid();
		}
		return dateIsValid;
	};

	const handleDate = () => {
		let isValid = true;
		if (day && month && year) {
			isValid = dateIsValid();
		}
		handleError(!isValid);
	};

	const formatDay = (e: any) => {
		const target = e.currentTarget;
		let day = target.value;
		if (day.length === 1 && parseInt(day) >= 1 && parseInt(day) <= 9) {
			day = `0${day}`;
		}
		setDay(day);
		handleDay(day);
		handleDate();
	};

	const formatMonth = (e: any) => {
		const target = e.currentTarget;
		let month = target.value;
		if (month.length === 1 && parseInt(month) >= 1 && parseInt(month) <= 9) {
			month = `0${month}`;
		}
		setMonth(month);
		handleMonth(month);
		handleDate();
	};

	const formatYear = (e: any) => {
		const target = e.currentTarget;
		let year = target.value;
		if (year.length === 2) {
			const currentYear = new Date().getFullYear().toString();
			if (year.slice(-2) < currentYear.slice(-2)) {
				year = `20${year}`;
			} else {
				year = `19${year}`;
			}
		}
		setYear(year);
		handleYear(year);
		handleDate();
	};

	return (
		<InputGroup>
			<React.Fragment>
				{label && (
					<Label tooltip={tooltip} id={id} label={label} />
				)}
				<input
					className="date"
					type="text"
					value={day}
					onChange={handleDay}
					onBlur={formatDay}
				/>
				<label className="small">/</label>
				<input
					ref={monthRef}
					className="date"
					type="text"
					value={month}
					onChange={handleMonth}
					onBlur={formatMonth}
				/>
				<label className="small">/</label>
				<input
					ref={yearRef}
					className="date"
					type="text"
					value={year}
					onChange={handleYear}
					onBlur={formatYear}
				/>
			</React.Fragment>
		</InputGroup>
	);
};