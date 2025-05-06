import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faAngleLeft, faAngleRight } from '@fortawesome/pro-regular-svg-icons'

export default function AnimatedArrow({ 
		lineClassName="",
    chevronClassName="", 
    className="", 
    size="small", // "small" || "mid" || "large"
    direction="right", // "right" || "left"
    customMargin=null,
}) {

    let lineSizeClass = '';
    let chevronSizeClass = '';
    switch (size) {
        case 'small':
            lineSizeClass = 'scale-85';
            chevronSizeClass = 'text-md'; // approx 16px
            break;
        case 'mid':
            lineSizeClass = 'scale-95';
            chevronSizeClass = 'text-xl'; // approx 20px
            break;
        case 'large':
            lineSizeClass = 'scale-110'; // scale-110 is closer to 1.12 than scale-100 or scale-125
            chevronSizeClass = 'text-2xl'; // approx 24px
            break;
    }

    const wrapperMargin = direction === 'right' 
        ? { marginRight: customMargin !== null ? customMargin : '-10px' }
        : { marginLeft: customMargin !== null ? customMargin : '-10px' };

    const chevronTranslate = direction === 'left' ? 'group-hover:translate-x-[-5px]' : 'group-hover:translate-x-[5px]';

    const lineClasses = `
        w-0 h-[2px] rounded-full opacity-0 
        transition-[width,opacity] duration-150 ease-[cubic-bezier(0.215,0.61,0.355,1)] 
        group-hover:w-[18px] group-hover:opacity-100 group-hover:ease-[cubic-bezier(.03,.98,.03,.99)] 
        ${lineSizeClass} 
        ${lineClassName}
    `.replace(/\s+/g, ' ').trim();

    const chevronClasses = `
        translate-x-0 transition-transform duration-150 ease-[cubic-bezier(0.215,0.61,0.355,1)] 
        ${chevronTranslate} 
        ${chevronSizeClass} 
        ${chevronClassName}
    `.replace(/\s+/g, ' ').trim();

    return (
        <div 
            className={`relative flex items-center justify-center ${className}`}
            style={wrapperMargin}
        >
            <div className='absolute flex items-center justify-center w-[25px] h-[120px] overflow-hidden'>
                <div 
                    className={lineClasses}
                />
            </div>

            <FontAwesomeIcon 
                icon={direction === "left" ? faAngleLeft : faAngleRight} 
                className={chevronClasses}
                fixedWidth
            />
        </div>
    )
}
