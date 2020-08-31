import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Snake from './Snake';

ReactDOM.render(<Snake columnRowRatio={20} widthHeightRatio = {30} expansionRate = {2} foodPoints = {1}/>, document.getElementById('root'));