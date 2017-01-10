import gql from 'graphql-tag'
import React from 'react'
import {graphql} from 'react-apollo'

const Book = ({name, author, year}) => {
  return <div>Name: {name} - Author: {author} - Year: {year}</div>
}
Book.propTypes = {
  author: React.PropTypes.string,
  name: React.PropTypes.string,
  year: React.PropTypes.number,
}

const Library = ({data: {books}}) => {
  return (
    <div>
      <h1>Books</h1>
      {books.map(book => <Book key={book.id} {...book} />)}
    </div>
  )
}

Library.propTypes = {
  data: React.PropTypes.object,
}

const query = gql`
{
  books {
    id,
    name,
    author,
    year
  }
}
`
export default graphql(query)(Library)
