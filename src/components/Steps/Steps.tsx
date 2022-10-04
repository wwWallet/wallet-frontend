import React from 'react';
import './Steps.css';

export interface StepsInterface {
    active: number
    steps: string[]
}

const Steps: React.FC<StepsInterface> = ({steps, active}) => {

    return(
        <div className="Steps">
            {steps.map((step: string, index: number) => (
                <div
                    key={step}
                    className={`step ${active === index + 1 ? 'active' : ''}`}
                >
                    <div className="content">{step}</div>
                </div>
            ))}
        </div>
    );
}

export default Steps;
