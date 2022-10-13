import './CustomButton.css';

type ButtonProps = {
    text: string;
    style?: Object;
    onClick?: () => void;
    children?: JSX.Element;
    buttonDisabled:boolean;
}


const CustomButton = (props: ButtonProps) => {
  return (
    <button
      disabled={props.buttonDisabled}
      className={!props.buttonDisabled ? "small login-button ui fancy button" : "small disabled login-button ui fancy button"}
      onClick={props.onClick}>
        {props.text}
        {props.children}
    </button>
  )
}

export default CustomButton;
