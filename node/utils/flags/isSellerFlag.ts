import { sellerFlag } from "./sellerFlag";

export function isSellerFlagged(sellerName: string) {
    return sellerFlag.includes(sellerName);
}
