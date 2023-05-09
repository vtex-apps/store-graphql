import { partition, propEq } from 'ramda'

import { getPositionInOrderForm } from './attachmentsHelper'

interface Params extends OrderFormItem {
  assemblyOptionsData: {
    childs: OrderFormItem[]
    index: number
    assemblyOptionsMap: Record<string, AssemblyOption[]>
    orderForm: OrderForm
  }
}

const getPriceForItem = (
  children: OrderFormItem[],
  fatherIndex: number,
  fatherItem: OrderFormItem,
  orderForm: OrderForm
): number => {
  const [itemChildren, others] = partition(
    propEq('parentItemIndex', fatherIndex),
    children
  )

  return itemChildren.reduce(
    (sum, currentChildren) =>
      sum +
      getPriceForItem(
        others,
        getPositionInOrderForm(orderForm, currentChildren),
        currentChildren,
        orderForm
      ),
    fatherItem.sellingPrice * fatherItem.quantity
  )
}

export const resolvers = {
  OrderFormItem: {
    assemblyOptions: ({
      assemblyOptionsData: { childs, index, orderForm, assemblyOptionsMap },
      ...item
    }: Params) => ({ item, childs, index, orderForm, assemblyOptionsMap }),
    cartIndex: ({ assemblyOptionsData: { index } }: Params) => index,
    canHaveAttachment: ({ attachmentOfferings }: OrderFormItem) => {
      return attachmentOfferings && attachmentOfferings.length > 0
    },
    imageUrl: ({ imageUrl }: Params) =>
      imageUrl?.replace('http://', 'https://'),
    listPrice: ({ listPrice }: Params) => listPrice / 100,
    price: ({ price }: Params) => price / 100,
    sellingPrice: ({ sellingPrice }: Params) => sellingPrice / 100,
    sellingPriceWithAssemblies: ({
      assemblyOptionsData: { childs, index, orderForm },
      ...item
    }: Params) => {
      if (childs.length === 0) {
        return item.sellingPrice / 100
      }

      return (
        getPriceForItem(childs, index, item, orderForm) / item.quantity / 100
      )
    },
  },
}
