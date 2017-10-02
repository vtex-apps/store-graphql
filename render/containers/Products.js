import { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import { Form, FormGroup, Products } from '../components'

class ProductsControl extends Component {
  constructor(props) {
    super(props)

    this.state = {
      fields: {
        query: 'test',
        pageSize: 12,
        category: '',
        brands: '',
        collection: '',
        availableOnly: false,
        sort: '',
      },
    }
  }

  onChangeField(key, { currentTarget }) {
    const { fields } = this.state
    fields[key] =
      currentTarget.type === 'checkbox'
        ? currentTarget.checked
        : currentTarget.value
    this.setState({ fields })
  }

  render() {
    const {
      query,
      pageSize,
      category,
      brands,
      collection,
      availableOnly,
      sort,
    } = this.state.fields

    return (
      <section>
        <div>
          <h1 className="font-display f3 f2-ns fw6 mb2">
            <FormattedMessage id="store-graphql.products-example" />
          </h1>
        </div>
        <Form>
          <FormGroup
            intl={{
              name: 'store-graphql.forms.query.name',
              optional: 'store-graphql.forms.optional',
              desc: 'store-graphql.forms.query.desc',
            }}
            onChange={this.onChangeField.bind(this, 'query')}
            value={query}
          />
          <FormGroup
            intl={{
              name: 'store-graphql.forms.page-size.name',
              optional: 'store-graphql.forms.optional',
              desc: 'store-graphql.forms.page-size.desc',
            }}
            onChange={this.onChangeField.bind(this, 'pageSize')}
            value={pageSize}
            type="number"
          />
          <FormGroup
            intl={{
              name: 'store-graphql.forms.category.name',
              optional: 'store-graphql.forms.optional',
              desc: 'store-graphql.forms.category.desc',
            }}
            onChange={this.onChangeField.bind(this, 'category')}
            value={category}
          />
          <FormGroup
            intl={{
              name: 'store-graphql.forms.brand.name',
              optional: 'store-graphql.forms.optional',
              desc: 'store-graphql.forms.brand.desc',
            }}
            onChange={this.onChangeField.bind(this, 'brands')}
            value={brands}
          />
          <FormGroup
            intl={{
              name: 'store-graphql.forms.collection.name',
              optional: 'store-graphql.forms.optional',
              desc: 'store-graphql.forms.collection.desc',
            }}
            onChange={this.onChangeField.bind(this, 'collection')}
            value={collection}
          />
          <FormGroup
            intl={{
              name: 'store-graphql.forms.available.name',
              optional: 'store-graphql.forms.optional',
              desc: 'store-graphql.forms.available.desc',
            }}
            type="checkbox"
            inputClassName="mr2 mb4"
            onChange={this.onChangeField.bind(this, 'availableOnly')}
            value={availableOnly}
          />
        </Form>
        <Products
          {...{ query, pageSize, category, brands, collection, availableOnly }}
        />
      </section>
    )
  }
}
//query, category, brands, collection, pageSize, availableOnly, sort
export default ProductsControl
