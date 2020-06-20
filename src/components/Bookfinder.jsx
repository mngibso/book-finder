import React, {useState, useEffect} from "react";
import Spinner from 'react-bootstrap/Spinner'
import get from 'lodash/get'
import find from 'lodash/find'
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import FormControl from 'react-bootstrap/FormControl';
import InputGroup from 'react-bootstrap/InputGroup';
import '../Routes/Bookfinder/bookfinder.css';
import GoodreadsService from '../Services/goodreads-service'
import GooglebooksService from '../Services/googlebooks-service'
import IdreambooksService from '../Services/idreambooks-service'
import SimilarBooks from './SimilarBooks.jsx'


/*
// return `true` if b1 and b2 are effectively the same book
const _sameBook = (b1, b2) => {
  if (b1.isbn13 && b1.isbn13 === b2.isbn13) {
    return true
  }
  const a1 = get(b1, 'authors', []).sort()
  const a2 = get(b2, 'authors', []).sort()
  const b1Title = b1.title.toLowerCase().split('(')[0].trim()
  const b2Title = b2.title.toLowerCase().split('(')[0].trim()
  return b1Title === b2Title && a1.join(':') === a2.join(':')
}
*/

/**
 * display form for user to select book
 * @return {*} html to render
 * @constructor
 */
function Bookfinder() {
  const [googleBooksQueries, setGoogleBooksQueries] = useState({})
  const [bookTitle, setBookTitle] = useState("");
  const [selectBooks, setSelectBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [goodreadsBooks, setGoodreadsBooks] = useState([]);
  const [goodreadsLoading, setGoodreadsLoading] = useState(false);
  const [idreambooks, setIdreambooks] = useState([]);
  const [googleBooks, setGoogleBooks] = useState([]);
  const [findLoading, setFindLoading] = useState(false);

  // get google books and idreambooks when we add  goodreadsBooks
  useEffect(() => {
    let mounted = true
    goodreadsBooks.filter( bk1 => !googleBooksQueries[bk1.title] )
    .forEach( b => {
      googleBooksQueries[b.title] = true
      setGoogleBooksQueries(googleBooksQueries)
      const author = (b.authors || []).join(" ")
      getGooglebooksRatings(b.title, author)
      .then( resp => {
        if (!mounted || !resp) return
        setGoogleBooks( googleBooks => [...googleBooks, resp])
      })
      getIdreambooksReview(b.title)
      .then( resp => {
        if (!mounted || !resp) return
        setIdreambooks( idreambooks => [...idreambooks, resp])
      })
    })
  },[goodreadsBooks]);

  /**
   * clear saved books
   * @private
   * @returns {undefined}
   */
  const _reset = () => {
    setSelectedBook(null)
    setSelectBooks([])
    setGoogleBooksQueries({})
    setGoodreadsBooks([])
    setGoogleBooks([])
    setIdreambooks([])
    setGoodreadsLoading(false)
    setFindLoading(false)
  }

  /**
   * search books with given title
   * @param {Object} evt - the click event
   * @returns {undefined}
   */
  const findClick = (evt) => {
    _reset()
    setFindLoading(true)
    GooglebooksService.findBooks(bookTitle)
    .then((sBooks) => {
      setSelectBooks(sBooks)
    })
    .finally(() => setFindLoading(false))
  }

  const getGooglebooksRatings = (title, author) => {
    return GooglebooksService.getBookByTitle(title, author)
  }

  const getIdreambooksReview = title => {
    return IdreambooksService.getBookByTitle(title)
  }

  const getGoodreadsRatings = books => {
    for (const book of books) {
      GoodreadsService.getBookById(book.id)
      .then( (resp) => {
        setGoodreadsBooks( goodreadsBooks => [...goodreadsBooks, resp.book])
      })
    }
  }

  // Get books similar to 'title' from goodreads api
  const getSimilarBooksGoodreads = (title) => {
    setGoodreadsLoading(true)
    setGoodreadsBooks([])
    GoodreadsService.getSimilars(title)
      .then((data) => {
        const books = data.similars
        getGoodreadsRatings(books)
        // get ratings for each similar
        // add the book we're search for to the similars list
        data.book.selected = true
        //books.push(data.book)
        setGoodreadsBooks([data.book])
      })
    .finally( () => {
      setGoodreadsLoading(false)
    })
  }

  // Book is selected to find similars for
  const selectBook = (evt) => {
    const isbn13 = get(evt, 'currentTarget.dataset.rbEventKey', null)
    const selectedBook = find(selectBooks, {isbn13})
    if (!selectedBook) {
      console.warn(`No book found for ${isbn13}`)
    }
    // Only show the selected book
    setSelectBooks(selectBooks.filter(b => b.isbn13 === isbn13))
    getSimilarBooksGoodreads(selectedBook.title)
  }

  let goodreadsSpinner
  if (goodreadsLoading) {
    goodreadsSpinner = <span><Spinner
      className="mt-2"
      as="span"
      animation="border"
      role="status"
      aria-hidden="true"
    /> Loading Similar Books...</span>
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
        <div className="container-fluid">
          <h4 className="section-title">Discover books that reader's of your favorite books enjoy.</h4>
          <div className="book-search">
            <Card className="mb-3">
              <div className="card-body">
                <div className="card-text">Enter the title of a favorite book</div>
                <InputGroup className="mb-3">
                  <InputGroup.Prepend>
                  {findButton}
                  </InputGroup.Prepend>
                  <FormControl placeholder={"Enter a Book Title"}
                           value={bookTitle}
                           onKeyPress={e=> { if(e.key === 'Enter') findClick(e) }}
                           onChange={e => setBookTitle(e.target.value)} />
                </InputGroup>
                <img src="/images/poweredbygoogle.png" />
              </div>
            </Card>
          </div>
        </div>

      {selectBooks.length > 0 &&
      <div className="container-fluid">
        <Card className="mb-3">
          <div className={"card-body"}>
          <div className="card-text">Select your book</div>
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
            {goodreadsSpinner}
          </div>
        </Card>
      </div>
      }
      <SimilarBooks goodreadsBooks={goodreadsBooks} googleBooks={googleBooks} idreambooks={idreambooks}></SimilarBooks>
</Container>
  );
}
export default Bookfinder;
