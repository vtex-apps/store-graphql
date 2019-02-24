export const resolvers = {
  OrderFormItem: {
    assemblyOptions: ({ assemblyOptionsData: { childs, index, orderForm, hasAttachments }, ...item }) => ({ item, childs, index, orderForm, hasAttachments }),
    listPrice: ({ listPrice }) => listPrice / 100,
    price: ({ price }) => price / 100,
    sellingPrice: ({ sellingPrice }) => sellingPrice / 100,
  }
}
