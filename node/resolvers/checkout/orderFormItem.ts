import { AssemblyOption } from './types'

interface Params extends OrderFormItem{
  assemblyOptionsData: {
    childs: OrderFormItem[]
    index: number
    assemblyOptionsMap: Record<string, AssemblyOption[]>
    orderForm: any
  }
}

export const resolvers = {
  OrderFormItem: {
    assemblyOptions: ({ assemblyOptionsData: { childs, index, orderForm, assemblyOptionsMap }, ...item }: Params) => ({ item, childs, index, orderForm, assemblyOptionsMap }),
    listPrice: ({ listPrice }: Params) => listPrice / 100,
    price: ({ price }: Params) => price / 100,
    sellingPrice: ({ sellingPrice }: Params) => sellingPrice / 100,
  }
}
