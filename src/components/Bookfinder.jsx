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
import SimilarBooks from './SimilarBooks.jsx'


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

function Bookfinder() {
  const [bookTitle, setBookTitle] = useState("");
  const [selectBooks, setSelectBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState([]);
  const [goodreadsBooks, setGoodreadsBooks] = useState([]);
  const [googleBooks, setGoogleBooks] = useState([]);
  const [findLoading, setFindLoading] = useState(false);
  console.log(`process.env.APP_URI=${process.env.APP_URI}`)
  console.log(GoodreadsService)

  let oldGoodreadsBooks = ''
  useEffect(() => {
    // Get ratings for googlebooks
    const promises = goodreadsBooks.filter( bk1 => {
      return googleBooks.findIndex( (bk2) => {
        return _sameBook(bk1, bk2)
      }) === -1
    })
    .map( b => {
      return GooglebooksService.getBook(b.isbn13)
    })
    Promise.all(promises)
    .then(( gglBooks ) => {
      setGoogleBooks(gglBooks)
    })
  },[goodreadsBooks]);

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
    if (isbn13.length) {
      return isbn13[0].identifier
    }
    return ''
  }

  /**
   * search books with given title
   * @param {Object} evt - the click event
   * @returns {undefined}
   */
  const findClick = (evt) => {
    setFindLoading(true)
    setSelectedBook(null)
    setSelectBooks([])
    GooglebooksService.findBook(bookTitle)
    .then((sBooks) => {
      setSelectBooks(sBooks)
    })
    .finally(() => setFindLoading(false))

    /*
    const url = `https://www.googleapis.com/books/v1/volumes?q=title:${bookTitle}`
    axios.get(url)
      .then(res => {
        const sb = res.data.items.map(b => {
          return {
            thumbnail: get(b, 'volumeInfo.imageLinks.smallThumbnail', 'images/default_book_cover.jpg'),
            title: get(b, 'volumeInfo.title', 'unknown'),
            authors: get(b, 'volumeInfo.authors', []).join(', '),
            isbn13: getISBN13(b)
          }
        })
        .filter(i => {
          return i.isbn13 !== '';
        })

        // Don't include > 1 book with same title and author
        setSelectBooks(uniqWith(sb, (a, b) =>
          a.title === b.title && a.authors === b.authors
        ))
      })
      .finally(() => setFindLoading(false))

     */
  }

  const getSimilarBooksGoodreads = (isbn13) => {
    GoodreadsService.getSimilars(isbn13)
      .then((data) => {
        console.log('blah blah')
        console.log(data)
        const books = data.similars
        data.book.selected = true
        books.push(data.book)
        console.log('set goodreads book')
        setGoodreadsBooks(books)
      })
  }

  const selectBook = (evt) => {
    console.log(evt)
    console.log(evt.currentTarget)
    const isbn13 = get(evt, 'currentTarget.dataset.rbEventKey', null)
    const selectedBook = find(selectBooks, {isbn13})
    if (!selectedBook) {
      console.warn(`No book found for ${isbn13}`)
    }
    setSelectBooks(selectBooks.filter(b => b.isbn13 === isbn13))

    // get goodreads
    getSimilarBooksGoodreads(isbn13)
    // get amazon
  }

  let selectedBookItem
  if (selectedBook) {
    selectedBookItem =
      <div className="selected-book">
        <img className="book-cover" src={selectedBook.thumbnail}/>
        <div>
          <div className="book-title">{selectedBook.title}</div>
          <div className="author">{selectedBook.authors}</div>
        </div>
      </div>
  }

  let findButton
  if (!findLoading) {
    findButton = <Button variant="outline-primary" className="find" onClick={e => findClick(e)}> Find </Button>
  } else {
    findButton = <Button className="find" variant="primary" disabled>
      <Spinner
        as="span"
        animation="grow"
        size="sm"
        role="status"
        aria-hidden="true"
      />Searching...</Button>
  }

  return (
    <Container className="home">
      <h1>Book Finder</h1>
      -{process.env.GOODREADS_USER_ID}-
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
            {selectBooks.length
              ? <h3>Select a Book</h3>
              : ''
            }
            <ListGroup>
              {selectBooks.map((b, idx) => {
                return (
                  <ListGroup.Item key={idx} eventKey={b.isbn13} as="button" action onClick={selectBook}
                                  className="selected-book">
                    <img className="book-cover" src={b.thumbnail}/>
                    <div>
                      <div className="book-title">{b.title}</div>
                      <div className="author">{b.authors}</div>
                    </div>
                  </ListGroup.Item>
                )
              })}
            </ListGroup>
            {selectedBookItem}
            <div>
            <SimilarBooks goodreadsBooks={goodreadsBooks} googleBooks={googleBooks}></SimilarBooks>
            </div>
          </div>
        </div>

      </section>
    </Container>
  );
}
export default Bookfinder;
