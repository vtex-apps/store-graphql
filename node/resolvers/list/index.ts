import { UserInputError } from '@vtex/api'
import { concat, groupBy, last, map, nth, path } from 'ramda'

import { Catalog } from '../../clients/catalog'
import { MasterData } from '../../clients/masterdata'
import {
  acronymList,
  acronymListProduct,
  fields,
  fieldsListProduct,
  Item,
  validateItems,
} from './util'

const getListItemsWithProductInfo = (items: Item[], catalog: Catalog) =>
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
  catalog: Catalog,
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
  const { DocumentId } = (await masterdata.createDocument(
    acronymListProduct,
    item
  )) as DocumentResponse

  return DocumentId
}

const addItems = async (
  // eslint-disable-next-line @typescript-eslint/default-param-last
  items: Item[] = [],
  { clients, clients: { masterdata } }: Context
) => {
  validateItems(items, clients)
  const promises = map(async (item) => addListItem(item, masterdata), items)

  return Promise.all(promises)
}

const deleteItems = (items: Item[], masterdata: MasterData) =>
  items &&
  Promise.all(
    items.map((item: Item) =>
      masterdata.deleteDocument(
        acronymListProduct,
        path(['id'], item) as string
      )
    )
  )

const updateItems = async (items: Item[], masterdata: MasterData) => {
  const itemsWithoutDuplicated = Object.values(
    groupBy(({ skuId }) => skuId, items)
  ).map((itemArray) => last(itemArray)) as Item[]

  const itemsToBeDeleted = itemsWithoutDuplicated.filter(
    (item) => item?.id && item?.quantity === 0
  )

  const itemsToBeAdded = itemsWithoutDuplicated.filter((item) => !item?.id)
  const itemsToBeUpdated = itemsWithoutDuplicated.filter(
    (item) => item?.id && item?.quantity > 0
  )

  deleteItems(itemsToBeDeleted, masterdata)

  const itemsIdAdded = await Promise.all(
    map(async (item: Item) => addListItem(item, masterdata), itemsToBeAdded)
  )

  const itemsIdUpdated = map((item: Item) => {
    masterdata.updateDocument(
      acronymListProduct,
      path(['id'], item) ?? '',
      item
    )

    return path(['id'], item)
  }, itemsToBeUpdated)

  return concat(itemsIdAdded, itemsIdUpdated)
}

export const queries = {
  list: async (
    _: any,
    { id }: any,
    { clients: { masterdata, catalog } }: Context
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
      clients: { masterdata },
    } = context

    const lists = (await masterdata.searchDocuments<any>(
      acronymList,
      ['id'],
      `owner=${owner}`,
      { page, pageSize }
    )) as any[]

    const listsWithProducts = map(
      (list) => queries.list(_, { id: list.id }, context),
      lists
    )

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
      const itemsId = await addItems(items, context)
      const { DocumentId } = (await masterdata.createDocument(acronymList, {
        ...list,
        items: itemsId,
      })) as DocumentResponse

      return queries.list(_, { id: DocumentId }, context)
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
      clients: { masterdata },
    } = context

    try {
      const itemsUpdatedId = await updateItems(items, masterdata)

      await masterdata.updateDocument(acronymList, id, {
        ...list,
        items: itemsUpdatedId,
      } as any)

      return queries.list(_, { id }, context)
    } catch (error) {
      throw new UserInputError(`Cannot update the list: ${error}`)
    }
  },
}
