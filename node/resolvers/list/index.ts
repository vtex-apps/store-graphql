import { UserInputError } from '@vtex/api'
import {
  concat,
  filter,
  groupBy,
  last,
  map,
  nth,
  path,
  prop,
  values,
} from 'ramda'

import { MasterData } from '../../clients/masterdata'
import { mapKeyValues } from '../../utils/object'
import { CatalogDataSource } from './../../dataSources/catalog'
import {
  acronymList,
  acronymListProduct,
  fields,
  fieldsListProduct,
  validateItems,
  Item,
} from './util'

const getListItemsWithProductInfo = (
  items: Item[],
  catalog: CatalogDataSource
) =>
  Promise.all(
    map(async (item: Item) => {
      const productsResponse = await catalog.productBySku([
        path(['skuId'], item) as string,
      ])
      const product = nth(0, productsResponse)
      return { ...item, product }
    }, items)
  )

const getListItems = async (
  itemsId: string[],
  catalog: CatalogDataSource,
  masterdata: MasterData
) => {
  const items: Item[] = itemsId
    ? ((await Promise.all(
        map(
          (id: string) =>
            masterdata.getDocument(acronymListProduct, id, fieldsListProduct),
          itemsId
        )
      )) as Item[])
    : []
  return getListItemsWithProductInfo(items, catalog)
}

const addListItem = async (item: Item, masterdata: MasterData) => {
  const { Id } = (await masterdata.createDocument(
    acronymListProduct,
    mapKeyValues({ ...item }) as any
  )) as DocumentResponse

  return Id
}

const addItems = async (items: Item[] = [], masterdata: MasterData) => {
  validateItems(items, masterdata)
  const promises = map(async item => addListItem(item, masterdata), items)
  return Promise.all(promises)
}

const deleteItems = (items: Item[], masterdata: MasterData) =>
  items &&
  Promise.all(
    items.map((item: Item) =>
      masterdata.deleteDocument(acronymListProduct, path(
        ['id'],
        item
      ) as string)
    )
  )

const updateItems = async (items: Item[], dataSources: any) => {
  const { document } = dataSources
  const itemsWithoutDuplicated = map(
    (item: any) => last(item),
    values(groupBy(prop('skuId') as any, items))
  )
  const itemsToBeDeleted = filter(
    (item: Item) => path<any>(['id'], item) && path(['quantity'], item) === 0,
    itemsWithoutDuplicated
  )
  const itemsToBeAdded = filter(
    (item: Item) => !path(['id'], item),
    itemsWithoutDuplicated
  )
  const itemsToBeUpdated = filter(
    (item: Item) =>
      path<any>(['id'], item) && path<any>(['quantity'], item) > 0,
    itemsWithoutDuplicated
  )

  deleteItems(itemsToBeDeleted, document)

  const itemsIdAdded = await Promise.all(
    map(async (item: Item) => await addListItem(item, document), itemsToBeAdded)
  )

  const itemsIdUpdated = map((item: Item) => {
    document.updateDocument(
      acronymListProduct,
      path(['id'], item),
      mapKeyValues(item)
    )
    return path(['id'], item)
  }, itemsToBeUpdated)

  return concat(itemsIdAdded, itemsIdUpdated)
}

export const queries = {
  list: async (
    _: any,
    { id }: any,
    { dataSources: { catalog }, clients: { masterdata } }: Context
  ) => {
    const list = await masterdata.getDocument<any>(acronymList, id, fields)
    const items = await getListItems(list.items, catalog, masterdata)
    return { id, ...list, items }
  },

  listsByOwner: async (
    _: any,
    { owner, page, pageSize }: any,
    context: Context
  ) => {
    const {
      dataSources: { catalog },
      clients: { masterdata },
    } = context

    const lists = (await masterdata.searchDocuments<any>(
      acronymList,
      fields,
      `owner=${owner}`,
      { page, pageSize }
    )) as any[]

    const listsWithProducts = map(async list => {
      const items = await getListItems(
        path(['items'], list) || [],
        catalog,
        masterdata
      )
      return { ...list, items }
    }, lists)

    return Promise.all(listsWithProducts)
  },
}

export const mutation = {
  createList: async (
    _: any,
    { list, list: { items } }: any,
    context: Context
  ) => {
    const {
      clients: { masterdata },
    } = context
    try {
      const itemsId = await addItems(items, masterdata)

      const { Id } = (await masterdata.createDocument(acronymList, mapKeyValues(
        {
          ...list,
          items: itemsId,
        }
      ) as any)) as DocumentResponse

      return queries.list(_, { id: Id }, context)
    } catch (error) {
      throw new UserInputError(`Cannot create list: ${error}`)
    }
  },

  deleteList: async (
    _: any,
    { id }: any,
    { clients: { masterdata } }: Context
  ) => {
    const { items } = await masterdata.getDocument<any>(acronymList, id, fields)

    await deleteItems(items, masterdata)

    return masterdata.deleteDocument(acronymList, id)
  },

  /**
   * Update the list informations and its items.
   * If the item given does not have the id, add it as a new item in the list
   * If the item given has got an id, but its quantity is 0, remove it from the list
   * Otherwise, update it.
   */
  updateList: async (
    _: any,
    { id, list, list: { items } }: any,
    context: Context
  ) => {
    const {
      dataSources,
      clients: { masterdata },
    } = context
    try {
      const itemsUpdatedId = await updateItems(items, dataSources)
      await masterdata.updateDocument(acronymList, id, mapKeyValues({
        ...list,
        items: itemsUpdatedId,
      }) as any)
      return queries.list(_, { id }, context)
    } catch (error) {
      throw new UserInputError(`Cannot update the list: ${error}`)
    }
  },
}
