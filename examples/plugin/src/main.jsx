import React from 'react';
import ReactDom from 'react-dom';
import sayHello from './utils/sayHello.jsx!';

ReactDom.render(sayHello('World'), document.getElementById('target'));
ReactDom.render(<div>Hello from React!</div>, document.getElementById('target2'));