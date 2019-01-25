import { ID, Int } from '../primitive'
import { Product } from '../catalog/product'

/* List of Products */
export interface List {
    /* List's id */
    id?: ID
    /* The list's name */
    name?: string
    /* Flag that indicates if the list is public or not */
    isPublic?: boolean
    /* List's owner */
    owner?: string
    /* Creation date */
    createdIn?: string
    /* Update date */
    updatedIn?: string
    /* List items */
    items?: ListItem[]
}

export interface ListItem {
    /* Item id */
    id?: ID
    /* Product id */
    productId?: ID
    /* Sku id */
    skuId?: ID
    /* The quantity of the item */
    quantity?: Int
    /* The product's informations */
    product?: Product
    /* Date when it was added */
    createdIn?: string
}

/**
 * @graphql input
 */
export interface ListInput {
    /* The list's name */
    name: string
    /* Flag that indicates if the list is public or not */
    isPublic?: boolean
    /* List's owner */
    owner?: string
    /* List items */
    items?: ListItemInput[]
}

/**
 * @graphql input
 */
export interface ListItemInput {
    /* List item id */
    itemId?: ID
    /* Product id */
    productId: ID
    /* Sku id */
    skuId: ID
    /* The quantity of the item */
    quantity?: Int
}
