import React from 'react';

/*
	"small" || // Small is perfect for 14px text in bold weight, or 16px text in normal weight
	"mid" || // Mid is perfect for 16px text in bold weight, or 18px text in normal weight
	"large" || // Large is perfect for 20px text in bold weight, or 22px text in normal weight
	"regular-small"  // Regular-small is perfect for 14px text in normal weight
*/
type AnimatedLinkTextSize = 'small' | 'mid' | 'large' | 'regular-small';

interface AnimatedLinkTextProps {
    text: React.ReactNode;
    className?: string;
    size?: AnimatedLinkTextSize;
    [key: string]: any; // For additional props
}

export default function AnimatedLinkText({
    text,
    className = "",
    size = "mid",
    ...props
}: AnimatedLinkTextProps) {

    let sizeClasses = '';
    switch (size) {
        case 'regular-small':
            sizeClasses = 'before:bottom-[-3px] before:scale-y-[0.6]';
            break;
        case 'small':
            sizeClasses = 'before:bottom-[-3px] before:scale-y-[0.7]';
            break;
        case 'large':
            sizeClasses = 'before:bottom-0 before:scale-y-[1.1]';
            break;
        case 'mid': // default
        default:
            sizeClasses = 'before:bottom-[-3px] before:scale-y-[0.85]';
            break;
    }

    // Base styles, ::before styles, hover effect, and size-specific styles
    const tailwindClasses = `
        relative no-underline
        before:content-[''] before:absolute before:block before:w-full before:h-[2px] before:left-0
        before:bg-current before:origin-top-left
        before:transition-transform before:duration-250 before:ease-[cubic-bezier(.215,.61,.355,1)]
        before:scale-x-0 group-hover:before:scale-x-100
        ${sizeClasses}
        ${className}
    `.replace(/\s+/g, ' ').trim(); // Clean up whitespace for the className string

    return (
        <span
            className={tailwindClasses}
            {...props}
        >
            {text}
        </span>
    );
}
