import React, {useState, useEffect} from "react";
import Spinner from 'react-bootstrap/Spinner'
import uniq from 'lodash/uniq'
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

// find books similar to the book selected
function Bookfinder() {
  const [googleBooksQueries, setGoogleBooksQueries] = useState({})
  const [bookTitle, setBookTitle] = useState("");
  const [selectBooks, setSelectBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [goodreadsBooks, setGoodreadsBooks] = useState([]);
  const [goodreadsLoading, setGoodreadsLoading] = useState(false);
  // const [idreambooks, setIdreambooksLoading] = useState(false);
  const [idreambooks, setIdreambooks] = useState([]);
  const [googleBooks, setGoogleBooks] = useState([]);
  const [findLoading, setFindLoading] = useState(false);

  // When we obtain goodreadsBooks, get ratings for googlebooks
  useEffect(() => {
    let mounted = true
    console.log(`useEffect ${goodreadsBooks.length}  ${googleBooks.length} ${idreambooks.length}`)
    console.log(`GoogleBooks ${googleBooks.length}`)
    goodreadsBooks.filter( bk1 => !googleBooksQueries[bk1.title] )
    .forEach( b => {
      console.log(`useEffect ${b.title}`)
      googleBooksQueries[b.title] = true
      setGoogleBooksQueries(googleBooksQueries)
      const author = (b.authors || []).join(" ")
      getGooglebooksRatings(b.title, author)
      .then( resp => {
        console.log(`useEffect googlebooks ${b.title}`)
        if (!mounted || !resp) return
        //googleBooks.push(resp)
        //setGoogleBooks([...googleBooks])
        setGoogleBooks( googleBooks => [...googleBooks, resp])
      })
      getIdreambooksReview(b.title)
      .then( resp => {
        console.log(idreambooks.length)
        console.log(`useEffect idreambooks ${b.title}`)
        if (!mounted || !resp) return
        const idb = idreambooks
        // idb.push(resp)
        console.log(idb)
        // setState(state => ({ ...state, a: props.a }));
        setIdreambooks( idreambooks => [...idreambooks, resp])
      })
    })

    /*
    return () => {
      console.log('UNMOUNT')
      mounted = false;
    }
     */
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
    // setIdreambooksLoading(false)
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
    console.log(`getGooglebooksRatings ${title}`)
    return GooglebooksService.getBookByTitle(title, author)
  }

  const getIdreambooksReview = title => {
    console.log(`getIdreambooksRatings ${title}`)
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

  // Get books similar to 'title' from amazon api
  /*
  const getSimilarBooksIdreambooks = (title) => {
    //setIdreamBooksLoading(true)
    setIdreambooksBooks([])
    IdreambooksService.getSimilars(title)
    .then((data) => {
      const books = data.similars
      // add the book we're search for to the similars list
      data.book.selected = true
      books.push(data.book)
      setGoodreadsBooks(books)
    })
    .finally( () => {
      setGoodreadsLoading(false)
    })
  }

   */

  // Book is selected to find similars for
  const selectBook = (evt) => {
    const isbn13 = get(evt, 'currentTarget.dataset.rbEventKey', null)
    const selectedBook = find(selectBooks, {isbn13})
    if (!selectedBook) {
      console.warn(`No book found for ${isbn13}`)
    }
    // Only show the selected book
    setSelectBooks(selectBooks.filter(b => b.isbn13 === isbn13))
    // get goodreads
    getSimilarBooksGoodreads(selectedBook.title)
    //getDreambooks(selectedBook.title)
    // ToDo: get amazon -
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
        <Spinner
          as="span"
          animation="grow"
          size="sm"
          role="status"
          aria-hidden="true"
        />Searching...
      </div>
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
        <div>
        <SimilarBooks goodreadsBooks={goodreadsBooks} googleBooks={googleBooks} idreambooks={idreambooks}></SimilarBooks>
        </div>
</Container>
  );
}
export default Bookfinder;
