import React, { Component, useState } from "react";
import Loadable from 'react-loadable';
import Spinner from 'react-bootstrap/Spinner'
import get from 'lodash/get'
import axios from 'axios';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Container from 'react-bootstrap/Container';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import './bookfinder.css';


function Bookfinder() {
	const [bookTitle, setBookTitle] = useState("");
	const [selectBooks, setSelectBooks] = useState([]);
	const [findLoading, setFindLoading] = useState(false);
	/**
	 * return the isbn13 for the book
	 * @param {Object} b book returned from google books api
	 * @returns {string} isbn13 or empty string
	 */
	const getISBN13 = b => {
		const isbn13 = get(b, 'volumeInfo.industryIdentifiers', [])
			.filter(i => {
				console.log(i)
				return i.type === 'ISBN_13'
			})
		console.log(isbn13)
		if(isbn13.length) {
			return isbn13[0].identifier
		}
		return ''
	}

	/** search books with given title */
	const findClick = (evt) =>  {
		// evt.preventDefault();
		const url = `https://www.googleapis.com/books/v1/volumes?q=title:${bookTitle}`
    setFindLoading(true)
    setSelectBooks([])
		axios.get(url)
			.then(res => {
       	setSelectBooks(res.data.items.map(b => {
       	  return {
						thumbnail: get(b, 'volumeInfo.imageLinks.smallThumbnail','images/default_book_cover.jpg' ),
						title: get(b,'volumeInfo.title','unknown'),
						authors: get(b,'volumeInfo.authors', []).join(', '),
						isbn13: getISBN13(b)
					}
				})
					.filter( i => {
						return i.isbn13 !== '';
					}))
			})
			.finally( () => setFindLoading(false))
		console.log(`Submitting Title ${bookTitle}`)
	}
	const selectBook = (evt) =>  {
		console.log(evt)
		console.log(evt.currentTarget)
	}
	let findButton
	if(!findLoading) {
		findButton = <Button variant="outline-primary" onClick={e => findClick(e)}>Find</Button>
	} else {
		findButton = <Button variant="primary" disabled>
			<Spinner
				as="span"
				animation="grow"
				size="sm"
				role="status"
				aria-hidden="true"
			/>
			Searching...
		</Button>
	}

	return (
		<Container className="home">
			<h1>Book Finder</h1>
			<section className="book-comparison-top">
					<div className="container-fluid">
						<h2 className="section-title">Book Comparison Engine</h2>
						<div className="book-search">
							<InputGroup className="mb-3">
								<InputGroup.Prepend>
									{findButton}
								</InputGroup.Prepend>
								<FormControl placeholder={"Enter a Book Title"}
														 value={bookTitle}
														 onChange={e => setBookTitle(e.target.value)}
								/>
							</InputGroup>

						</div>
						<div className="comparison-report">
							{ selectBooks.length
							? <h3>Select a Book</h3>
							: ''
							}
              <ListGroup>
							{selectBooks.map((b,idx) => {
								return (
									<ListGroup.Item key={idx} eventKey={b.isbn13} as="button" action onClick={selectBook} className="selected-book">
										<img className="book-cover" src={b.thumbnail}/>
										<div>
											<div className="book-title">{b.title}</div>
											<div className="author">{b.authors}</div>
										</div>
									</ListGroup.Item>

								)
							})}
							</ListGroup>
							<table className="dataTable book-comparison-table">
								<colgroup>
												<col className="amazon"/>
												<col span="2" className="goodreads"/>
												<col className="google"/>
												<col className="google last"/>
								</colgroup>
								<thead>
								<tr>
									<th rowSpan="2">Rank</th>
									<th rowSpan="2">Comp Score</th>
									<th rowSpan="2" className="book-info">Title</th>
									<th><img src="images/logo_amazon.png" alt="Logo: Amazon" className="th-logo"/></th>
									<th colSpan="2"><img src="images/logo_goodreads2.png" alt="Logo: GoodReads" className="th-logo"/></th>
									<th colSpan="2"><img src="images/logo_google.png" alt="Logo: Google" className="th-logo"/></th>
								</tr>
								<tr>
									<th>Sales Rank</th>
									<th>Ratings Count</th>
									<th>Avg. Rating</th>
									<th>Ratings Count</th>
									<th>Avg. Rating</th>
								</tr>
								</thead>
								<tbody>
								<tr>
									<td>1</td>
									<td><span className="comp-score">47</span></td>
									<td className="book-info">
										<img src="http://ecx.images-amazon.com/images/I/515p3OrN1KL._SL75_.jpg"/>
											<div>
												<strong>The Nightingale</strong>
												Kristin Hannah
											</div>
									</td>
											<td>44</td>
											<td>67,346</td>
											<td>4.52</td>
											<td>2,434</td>
											<td>4.5</td>
								</tr>

								<tr>
									<td>2</td>
									<td><span className="comp-score">43</span></td>
									<td className="book-info">
										<img src="http://ecx.images-amazon.com/images/I/51MfO0a70ZL._SL75_.jpg"/>
											<div>
												<strong>All the Light We Cannot See</strong>
												Anthony Doerr
											</div>
									</td>
									<td>22</td>
									<td>208,949</td>
									<td>4.29</td>
									<td>1,482</td>
									<td>4</td>
								</tr>

								<tr>
									<td>3</td>
									<td><span className="comp-score">35</span></td>
									<td className="book-info">
										<img src="http://ecx.images-amazon.com/images/I/51ri3drmQpL._SL75_.jpg"/>
											<div>
												<strong>The Boys in the Boat: Nine...</strong>
												Daniel James Brown
											</div>
									</td>
									<td>63</td>
									<td>1,254</td>
									<td>4.28</td>
									<td>1,635</td>
									<td>4.5</td>
								</tr>

								<tr>
									<td>4</td>
									<td><span className="comp-score">29</span></td>
									<td className="book-info">
										<img src="http://ecx.images-amazon.com/images/I/51ZWha0-eEL._SL75_.jpg"/>
											<div>
												<strong>Orphan Train</strong>
												Christina Baker Kline
											</div>
									</td>
									<td>513</td>
									<td>146,791</td>
									<td>4.1</td>
									<td>1,733</td>
									<td>3.5</td>
								</tr>

								<tr>
									<td>5</td>
									<td><span className="comp-score">24</span></td>
									<td className="book-info">
										<img src="http://ecx.images-amazon.com/images/I/510XLE4eMsL._SL75_.jpg"/>
											<div>
												<strong>Ordinary Grace: A Novel</strong>
												William Kent Krueger
											</div>
									</td>
									<td>1,064</td>
									<td>17,212</td>
									<td>4.11</td>
									<td>53</td>
									<td>4.5</td>
								</tr>

								<tr className="your-book">
									<td>6</td>
									<td><span className="comp-score">23</span></td>
									<td className="book-info">
										<img src="https://d.gr-assets.com/books/1389130765m/20486871.jpg"/>
											<div>
												<strong>The Invention of Wings</strong>
												Sue Monk Kidd
											</div>
									</td>
									<td>1,088</td>
									<td>115,761</td>
									<td>4.22</td>
									<td>32</td>
									<td>4</td>
								</tr>

								<tr>
									<td>7</td>
									<td><span className="comp-score">22</span></td>
									<td className="book-info">
										<img src="http://ecx.images-amazon.com/images/I/51tK3Qdv3pL._SL75_.jpg"/>
											<div>
												<strong>Necessary Lies</strong>
												Diane Chamberlain
											</div>
									</td>
									<td>243,001</td>
									<td>18,945</td>
									<td>4.21</td>
									<td>22</td>
									<td>4.5</td>
								</tr>

								<tr>
									<td>8</td>
									<td><span className="comp-score">17</span></td>
									<td className="book-info">
										<img src="http://ecx.images-amazon.com/images/I/61KaCYPW28L._SL75_.jpg"/>
											<div>
												<strong>The Life We Bury</strong>
												Allen Eskens
											</div>
									</td>
									<td>651</td>
									<td>4,150</td>
									<td>3.88</td>
									<td>272</td>
									<td>4</td>
								</tr>

								<tr>
									<td>9</td>
									<td><span className="comp-score">15</span></td>
									<td className="book-info">
										<img src="http://ecx.images-amazon.com/images/I/51nfPowyuxL._SL75_.jpg"/>
											<div>
												<strong>The Plum Tree</strong>
												Ellen Marie Wiseman
											</div>
									</td>
									<td>4,352</td>
									<td>5,262</td>
									<td>4.01</td>
									<td>388</td>
									<td>4</td>
								</tr>

								<tr>
									<td>10</td>
									<td><span className="comp-score">13</span></td>
									<td className="book-info">
										<img src="http://ecx.images-amazon.com/images/I/51yiSOX7hdL._SL75_.jpg"/>
											<div>
												<strong>Take Me With You</strong>
												Catherine Ryan Hyde
											</div>
									</td>
									<td>2,562</td>
									<td>4,150</td>
									<td>4.11</td>
									<td>34</td>
									<td>4</td>
								</tr>

								</tbody>
							</table>
						</div>
					</div>

				</section>
			</Container>
		);
}

function ZBookfinder() {
  return (
		<>
			<InputGroup className="mb-3">
				<InputGroup.Prepend>
					<Button variant="outline-primary">Button</Button>
				</InputGroup.Prepend>
				<FormControl aria-describedby="basic-addon1" />
			</InputGroup>
		</>
)
}
function XBookfinder() {
	// Declare a new state variable, which we'll call "count"
	const [count, setCount] = useState(0);

	return (

		<div>
			<p>You clicked {count} times</p>
			<button onClick={() => setCount(count + 1)}>
				Click me
			</button>
			<div className="dropdown">
				<button className="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton"
								data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
					Dropdown button
				</button>
				<div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
					<a className="dropdown-item" href="#">Action</a>
					<a className="dropdown-item" href="#">Another action</a>
					<a className="dropdown-item" href="#">Something else here</a>
				</div>
			</div>
		</div>
);
}
export default Bookfinder;
