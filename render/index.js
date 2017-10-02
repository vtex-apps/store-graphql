import { App } from './components'
import { QueryForm } from './containers'
import { Products, Categories } from './components'

const Example = () => (
  <App>
    <QueryForm
      titleId="store-graphql.products-example"
      QueryComponent={Products}
      fields={[
        {
          key: 'query',
          value: 'test',
          intl: {
            name: 'store-graphql.forms.query.name',
            optional: 'store-graphql.forms.optional',
            desc: 'store-graphql.forms.query.desc',
          },
        },
        {
          key: 'pageSize',
          value: 12,
          type: 'number',
          intl: {
            name: 'store-graphql.forms.page-size.name',
            optional: 'store-graphql.forms.optional',
            desc: 'store-graphql.forms.page-size.desc',
          },
        },
        {
          key: 'category',
          value: '',
          intl: {
            name: 'store-graphql.forms.category.name',
            optional: 'store-graphql.forms.optional',
            desc: 'store-graphql.forms.category.desc',
          },
        },
        {
          key: 'brand',
          value: '',
          intl: {
            name: 'store-graphql.forms.brand.name',
            optional: 'store-graphql.forms.optional',
            desc: 'store-graphql.forms.brand.desc',
          },
        },
        {
          key: 'collection',
          value: '',
          intl: {
            name: 'store-graphql.forms.collection.name',
            optional: 'store-graphql.forms.optional',
            desc: 'store-graphql.forms.collection.desc',
          },
        },
        {
          key: 'availableOnly',
          value: false,
          type: 'checkbox',
          inputClassName: 'mr2 mb4',
          intl: {
            name: 'store-graphql.forms.available.name',
            optional: 'store-graphql.forms.optional',
            desc: 'store-graphql.forms.available.desc',
          },
        },
      ]}
    />
    <QueryForm
      titleId="store-graphql.categories-example"
      QueryComponent={Categories}
    />
  </App>
)

export default Example
