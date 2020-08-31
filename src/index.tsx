import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Snake from './Snake';

ReactDOM.render(
  <React.StrictMode>
    <Snake gameDimension={30} cellPx = {15} expansionRate={3} foodPoints={10}/>
  </React.StrictMode>,
  document.getElementById('root')
);