import { Component } from 'react'
import { FormattedMessage } from 'react-intl'
import { Form, FormGroup } from '../components'

class QueryForm extends Component {
  constructor(props) {
    super(props)

    const state = {}
    for (const { key, value } of props.fields) state[key] = value
    this.state = state
  }

  onChangeField(key, { currentTarget }) {
    const state = Object.assign({}, this.state)
    state[key] =
      currentTarget.type === 'checkbox'
        ? currentTarget.checked
        : currentTarget.value
    this.setState(state)
  }

  render() {
    const self = this
    const { titleId, fields, QueryComponent } = this.props

    return (
      <section>
        {titleId && (
          <h1 className="font-display f3 f2-ns fw6 mb2">
            <FormattedMessage id={titleId} />
          </h1>
        )}
        <Form>
          {fields.map(({ key, type, intl, inputClassName }) => (
            <FormGroup
              value={self.state[key]}
              onChange={self.onChangeField.bind(self, key)}
              {...{ intl, type, key, inputClassName }}
            />
          ))}
        </Form>
        <QueryComponent {...this.state} />
      </section>
    )
  }
}

QueryForm.defaultProps = { fields: [] }

export default QueryForm
