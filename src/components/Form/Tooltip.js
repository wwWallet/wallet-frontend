import React from 'react';
import './Tooltip.css';

export const Tooltip = (props) => (
  <span data-tip={props.tip} className="Tooltip">
    {props.children}
  </span>
);
