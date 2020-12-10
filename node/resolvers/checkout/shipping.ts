export const fieldResolvers = {
  ShippingSLA: {
    friendlyName: ({ name, pickupStoreInfo, deliveryChannel }: SLA) => {
      if (deliveryChannel === 'pickup-in-point') {
        return pickupStoreInfo.friendlyName
      }

      return name
    },
  },
}
