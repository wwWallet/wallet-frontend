import { Card } from "react-bootstrap";
import './ConnectedServices.css';

export interface ConnectedServiceCardProps {
	logo: any;
	title: string;
	subtitle?: string;
	action(): void;
}

const ConnectedServiceCard: React.FC<ConnectedServiceCardProps> = ({ logo, title, subtitle, action }) => {

	return (
		<Card className='mb-2 anims redirectCard mrgn2 enhanced' onClick={action}>
			<Card.Body>
				<Card.Text>
					<img className="service-thumbnail" src={logo}></img>
					<strong>{title}</strong>
					<br />
					<span className="card-subtitle">{subtitle}</span>
				</Card.Text>
			</Card.Body>
		</Card>
	);
}

export default ConnectedServiceCard;