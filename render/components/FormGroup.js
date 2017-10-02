import { FormattedMessage } from 'react-intl'

const FormGroup = ({
  intl: { name, optional, desc },
  inputClassName = 'input-reset ba b--black-20 pa2 mb2 db w-100',
  value,
  onChange,
  type = 'text',
}) => (
  <div className="measure-narrow ph2 flex-auto">
    <label htmlFor="name" className="f6 b db mb2">
      <FormattedMessage id={name} />{' '}
      {optional && (
        <span className="normal black-60">
          <FormattedMessage id={optional} />
        </span>
      )}
    </label>
    <input
      id={name}
      className={inputClassName}
      aria-describedby={desc ? `${name}-desc` : false}
      {...{ value, onChange, type }}
    />
    {desc && (
      <small id={`${name}-desc`} className="f6 black-60 db mb2">
        <FormattedMessage id={desc} />
      </small>
    )}
  </div>
)

export default FormGroup
