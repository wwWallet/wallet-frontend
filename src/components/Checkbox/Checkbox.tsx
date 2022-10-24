import './Checkbox.css';

const Checkbox: React.FC<{ id: string, checked: boolean, onChange(): void }> = ({ id, checked, onChange }) => {

	return (
		<div className="custom-checkbox">
			<input type="checkbox" checked={checked} id={id} onChange={onChange} />
			<label htmlFor="checkbox"></label>
		</div>
	);
}

export default Checkbox;