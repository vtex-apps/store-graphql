import { RequestOptions, RESTDataSource } from 'apollo-datasource-rest'
import { forEachObjIndexed, join } from 'ramda'

interface Address {
  id: String
  userId: String
  receiverName?: String
  complement?: String 
  neighborhood?: String
  country?: String
  state?: String 
  number?: String
  street?: String
  postalCode?: String
  city?: String
  reference?: String
  addressName?: String
  addressType?: String
  geoCoordinate?: String
}

export class ProfileDataSource extends RESTDataSource<Context> {
  public getProfileInfo = (userEmail: String, customFields?) => {
    return this.get(join(',', [`CL/search?email=${userEmail}&_fields=userId,id,firstName,lastName,birthDate,gender,homePhone,businessPhone,document,email,isCorporate,tradeName,corporateName,stateRegistration,corporateDocument,profilePicture`, customFields]))
    .then((data) => data[0])
  }

  public updateProfileInfo = (profile) => {
    return this.patch(`CL/documents/${profile.id}`, profile) 
  }

  public getAddress = (addressId: String) => {
    return this.get(`AD/documents/${addressId}`)
  }

  public updateAddress = (address: Address) => {
    return this.patch(`AD/documents/${address.id}`, address)
  }

  public deleteAddress = (addressId: String) => {
    return this.delete(`AD/documents/${addressId}`)
  }

  public getUserAddresses = (userId: String) => {
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
