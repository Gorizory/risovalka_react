import React from 'react';

import './Spinner.css';

// Example call of Spinner-component with mix: <Spinner className="toolbar__spinner" />
// In result we'll give className: 'spinner toolbar__spinner'
export default function Spinner() {
    // We call the spinner-component either with a `position` prop or with a `className` prop or both. No other way.
    // In the future, there may be other modifiers
    return (
        <div className={'spinner'} />
    );
}