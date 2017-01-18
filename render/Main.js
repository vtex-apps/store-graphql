import gql from 'graphql-tag'
import React from 'react'
import {graphql} from 'react-apollo'

const Product = ({name, slug, description}) => {
  return (
    <div>
      <h3>{name}</h3>
      <div>Slug: {slug}</div>
      <div>Description: {description}</div>
    </div>
  )
}
Product.propTypes = {
  slug: React.PropTypes.string,
  name: React.PropTypes.string,
  description: React.PropTypes.string,
}

const Library = ({data: {profile, products, orders}}) => {
  return (
    <div>
      <h1>{profile.firstName} {profile.lastName}</h1>

      <h2>Products</h2>
      {products.map(book => <Product key={book.slug} {...book} />)}

      <h2>Orders</h2>
      <div>
        {orders.map(order => {
          return (
            <div key={order.orderId}>
              <h3>{order.orderId}</h3>
              <div>{order.items.map(item => item.name).join(', ')}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

Library.propTypes = {
  data: React.PropTypes.object,
}

const query = gql`{
  products {
    name,
    slug,
    description
  },
  orders {
    orderId,
    items {
      name
    }
  },
  profile {
    firstName,
    lastName
  }
}
`
export default graphql(query)(Library)
