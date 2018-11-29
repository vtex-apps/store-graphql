import { RESTDataSource } from 'apollo-datasource-rest'

export class DocumentDataSource extends RESTDataSource<ServiceContext> {
    constructor() {
        super()
    }

    public getDocument = (acronym, id, fields) => this.get(
        `${acronym}/documents/${id}?_fields=${fields}`
    )
    
    public searchDocuments = (acronym, fields, where) => this.get(
        `${acronym}/search?_fields=${fields}${where ? `&_where=${encodeURIComponent(where)}` : ''}`
    )

    get baseURL() {
        const { vtex: { account } } = this.context
        return `http://api.vtex.com/${account}/dataentities/`
    }

    willSendRequest(request) {
        request.headers.set('Authorization', this.context.vtex.authToken)
        request.headers.set('Accept', 'application/vnd.vtex.ds.v10+json')
    }
}