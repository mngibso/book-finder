/* Here we are binding React (and the client side routing via react-router-dom) to the HTML file to an
 * element with an ID of `root` and setting up
 */

import 'bootstrap/dist/css/bootstrap.min.css';
// import $ from 'jquery';
// import Popper from 'popper.js';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import React from "react";
import ReactDOM from "react-dom";

import { BrowserRouter } from 'react-router-dom'

import "./styles/reset.css";

/* App is the entry point to the React code.*/
import Routes from './Routes/index.jsx';

ReactDOM.render(
	<BrowserRouter basename="/">
		<Routes />
	</BrowserRouter>
	,document.getElementById("root")
);
