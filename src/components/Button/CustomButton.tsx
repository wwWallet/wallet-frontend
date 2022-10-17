import './CustomButton.css';

type ButtonProps = {
    text: string;
    style?: Object;
    onClick?: () => void;
    children?: JSX.Element;
    buttonDisabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
}


const CustomButton = (props: ButtonProps) => {
  return (
    <button
      disabled={props.buttonDisabled? props.buttonDisabled : false}
			type={props.type? props.type : 'button'}
      className={!props.buttonDisabled ? "small login-button ui fancy button" : "small disabled login-button ui fancy button"}
      onClick={props.onClick}>
        {props.text}
        {props.children}
    </button>
  )
}

export default CustomButton;
