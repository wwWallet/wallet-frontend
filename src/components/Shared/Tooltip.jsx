import './tooltip.css'

import React, { forwardRef } from 'react'
import { Tooltip as ReactTooltip } from 'react-tooltip';

function Tooltip({ 
    text,
    id,
    offset=0,
    place="top",
    element,
    globalEventOff,
    clickable,
    afterHide=() => {},
    afterShow=() => {},
    className,
    reverseColor,
    delayShow=0,
    openOnClick,
    openEvents,
    closeEvents,
    disabled,
}, ref) {
    if (disabled) {
        return null
    }

    return (
        <ReactTooltip
        ref={ref}
        opacity={1}

        className={`tooltip-container ${reverseColor && "reverseColor"} ${className} ${text && "max-width"}`}
        
        anchorSelect={`#${id}`} 
        place={place}
        offset={offset}
        delayShow={delayShow}

        openOnClick={openOnClick}
        openEvents={openEvents}
        closeEvents={closeEvents}
        globalCloseEvents={globalEventOff ? { clickOutsideAnchor: true } : undefined}
        clickable={clickable}

        afterHide={afterHide} 
        afterShow={afterShow} 
        >
            {text && <p>{text}</p>}
            {element && element}
        </ReactTooltip>
    )
}

export default forwardRef(Tooltip)