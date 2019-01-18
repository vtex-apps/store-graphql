import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed, join } from 'ramda'

interface Address {
  id: string
  userId: string
  receiverName?: string
  complement?: string
  neighborhood?: string
  country?: string
  state?: string
  number?: string
  street?: string
  postalCode?: string
  city?: string
  reference?: string
  addressName?: string
  addressType?: string
  geoCoordinate?: string
}

export class ProfileDataSource extends RESTDataSource<Context> {
  public getProfileInfo = (userEmail: string, customFields?) => {
    return this.get(join(',', [`CL/search?email=${userEmail}&_fields=userId,id,firstName,lastName,birthDate,gender,homePhone,businessPhone,document,email,isCorporate,tradeName,corporateName,stateRegistration,corporateDocument,profilePicture`, customFields]))
    .then((data) => data[0])
  }

  public updateProfileInfo = (profile) => {
    return this.patch(`CL/documents/${profile.id}`, profile)
  }

  public getAddress = (addressId: string) => {
    return this.get(`AD/documents/${addressId}`)
  }

  public updateAddress = (address: Address) => {
    return this.patch(`AD/documents/${address.id}`, address)
  }

  public deleteAddress = (addressId: string) => {
    return this.delete(`AD/documents/${addressId}`)
  }

  public getUserAddresses = (userId: string) => {
    return this.get(`AD/search?userId=${userId}&_fields=userId,id,receiverName,complement,neighborhood,country,state,number,street,postalCode,city,reference,addressName,addressType,geoCoordinate`)
  }

  get baseURL() {
    const { vtex: { account } } = this.context

    return `http://api.vtex.com/${account}/dataentities`
  }

  protected willSendRequest(request: RequestOptions) {
    const { vtex: { authToken } } = this.context

    forEachObjIndexed(
      (value: string, header) => request.headers.set(header, value),
      {
        'Proxy-Authorization': authToken,
        'VtexIdclientAutCookie': authToken,
        'X-Vtex-Proxy-To': `https://api.vtex.com`,
      }
    )
  }
}
