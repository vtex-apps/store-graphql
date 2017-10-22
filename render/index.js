import { App } from './components'
import { QueryForm } from './containers'
import { Products } from './components'

const Example = () => (
  <App>
    <QueryForm
      titleId="store-graphql.products-example"
      QueryComponent={Products}
      fields={[
        {
          key: 'query',
          value: 'test',
          optional: true,
          intl: {
            name: 'store-graphql.forms.query.name',
            desc: 'store-graphql.forms.query.desc',
          },
        },
        {
          key: 'category',
          value: '',
          optional: true,
          intl: {
            name: 'store-graphql.forms.category.name',
            desc: 'store-graphql.forms.category.desc',
          }
        },
        {
          key: 'specificationFilters',
          value: '',
          optional: true,
          intl: {
            name: 'store-graphql.forms.spec.name',
            desc: 'store-graphql.forms.spec.desc',
          }
        },
        {
          key: 'priceRange',
          value: '',
          optional: true,
          intl: {
            name: 'store-graphql.forms.price.name',
            desc: 'store-graphql.forms.price.desc',
          }
        },
        {
          key: 'collection',
          value: '',
          optional: true,
          intl: {
            name: 'store-graphql.forms.collection.name',
            desc: 'store-graphql.forms.collection.desc',
          }
        },
        {
          key: 'orderBy',
          type: 'select',
          value: 'OrderByPriceDESC',
          options: [
            'OrderByPriceDESC',
            'OrderByPriceASC',
            'OrderByTopSaleDESC',
            'OrderByReviewRateDESC',
            'OrderByNameASC',
            'OrderByNameDESC',
            'OrderByReleaseDateDESC',
            'OrderByBestDiscountDESC'
          ],
          intl: {
            name: 'store-graphql.forms.order.name',
            desc: 'store-graphql.forms.order.desc',
          }
        },
        {
          key: 'from',
          value: 0,
          type: 'number',
          optional: true,
          intl: {
            name: 'store-graphql.forms.pagingFrom.name',
            desc: 'store-graphql.forms.pagingFrom.desc',
          }
        },
        {
          key: 'to',
          value: 9,
          type: 'number',
          intl: {
            name: 'store-graphql.forms.pagingTo.name',
            desc: 'store-graphql.forms.pagingTo.desc',
          }
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
