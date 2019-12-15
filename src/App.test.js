/**
 * Tests can be added here if needed. More information can be found at the link below:
 * 
 * https://facebook.github.io/create-react-app/docs/running-tests
 */
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});
