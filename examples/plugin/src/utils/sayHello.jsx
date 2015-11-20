import React from 'react';

export default (name) => {

    let message = `Hello, ${name}!`;

    return <div id="message">{message}</div>

};