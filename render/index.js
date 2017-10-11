import { App } from './components'
import { QueryForm } from './containers'
import { Search } from './components'

const Example = () => (
  <App>
    <QueryForm
      titleId="store-graphql.products-example"
      QueryComponent={Search}
      fields={[
        {
          key: 'query',
          value: 'test',
          intl: {
            name: 'store-graphql.forms.query.name',
            optional: 'store-graphql.forms.optional',
            desc: 'store-graphql.forms.query.desc',
          },
        }
      ]}
    />
    {/* <QueryForm
      titleId="store-graphql.categories-example"
      QueryComponent={Categories}
    /> */}
  </App>
)

export default Example
