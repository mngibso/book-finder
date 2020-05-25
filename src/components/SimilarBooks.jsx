import React, {Component, useState, useEffect} from "react";
import Loadable from 'react-loadable';
import Spinner from 'react-bootstrap/Spinner'
import get from 'lodash/get'
import find from 'lodash/find'
import uniqWith from 'lodash/uniqWith'
import axios from 'axios';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import Container from 'react-bootstrap/Container';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import '../Routes/Bookfinder/bookfinder.css';
import GoodreadsService from '../Services/goodreads-service'
import GooglebooksService from '../Services/googlebooks-service'


const _sameBook = (b1, b2) => {
  if (b1.isbn13 === b2.isbn13) {
    return true
  }
  const a1 = get(b1, 'authors', []).sort()
  const a2 = get(b2, 'authors', []).sort()
  const b1Title = b1.title.toLowerCase().split('(')[0].trim()
  const b2Title = b2.title.toLowerCase().split('(')[0].trim()
  return b1Title === b2Title && a1.join(':') === a2.join(':')
}


function SimilarBooks(props) {
  const {goodreadsBooks=[], googleBooks=[], amazonBooks=[]} = props
  const [similarBooks, setSimilarBooks] = useState([]);
  console.log(`NOT use effect sb = ${similarBooks.length} gr = ${goodreadsBooks.length} gb = ${googleBooks.length}, ab = ${amazonBooks.length}`)

  useEffect(() => {
    // if (amazonBooks.length || goodreadsBooks.length || googleBooks.length) { _merge() }
    if (goodreadsBooks.length || googleBooks.length) { _merge() }
  },[goodreadsBooks, googleBooks]);

  const _merge = () => {
    const sims = []
    let count = 0
    for (const gr of goodreadsBooks) {
      count++
      const googleBook = find(googleBooks, gb => {
        return _sameBook(gb, gr)
      }) || { averageRating: 'N/A', ratingsCount: 'N/A'}
      const amazonBook = find(amazonBooks, ab => {
        return _sameBook(ab, gr)
      }) || { salesRank: 'N/A'}
      let title = gr.title
      if (gr.subTitle) {
        title = `${title} : ${gr.subTitle}`
      }
      sims.push( {
        authors: gr.authors.join(', '),
        count,
        title,
        isbn13: gr.isbn13,
        googleBook,
        amazonBook,
        goodreadsBook: gr,
      })
    }
    setSimilarBooks(sims)
  }
  return (
    <div>{googleBooks.length}<br/>

  {goodreadsBooks.length}
      {similarBooks.length > 0 &&
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
        {similarBooks.map(book => (
          <tr key={book.count}>
            <td>{book.count}</td>
            <td><span className="comp-score">47</span></td>
            <td className="book-info">
              <img src={book.goodreadsBook.thumbnail}/>
              <div>
                <strong>{book.title}</strong>
                {book.authors}
              </div>
            </td>
            <td>{book.amazonBook.salesRank}</td>
            <td>{book.goodreadsBook.ratingsCount}</td>
            <td>{book.goodreadsBook.averageRating}</td>
            <td>{book.googleBook.ratingsCount}</td>
            <td>{book.googleBook.averageRating}</td>
          </tr>
        ))}

        </tbody>
      </table>
      }
    </div>
  );
}
export default SimilarBooks;
