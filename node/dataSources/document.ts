import { RESTDataSource } from 'apollo-datasource-rest'

export class DocumentDataSource extends RESTDataSource<ServiceContext> {
    constructor() {
        super()
    }

    get baeURL() {
        const { vtex: { account } } = this.context
        return `http://api.vtex.com/${account}/dataentities/`
    }
}