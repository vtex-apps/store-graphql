import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'

const DEFAULT_WIDTH = 50
const DEFAULT_HEIGHT = 50

const baseUrlRegex = new RegExp(/.+ids\/(\d+)(?:-(\d+)-(\d+)|)\//)
const sizeRegex = new RegExp(/-(\d+)-(\d+)/)

class ProductImage extends PureComponent {
  cleanImageUrl(url) {
    let resizedImageUrl = url
    const result = baseUrlRegex.exec(url)
    if (result.length > 0) {
      if (
        result.length === 4 &&
        result[2] !== undefined &&
        result[3] !== undefined
      ) {
        resizedImageUrl = result[0].replace(sizeRegex, '')
      } else {
        resizedImageUrl = result[0]
      }
      return resizedImageUrl
    }
    return undefined
  }

  changeImageUrlSize(url, width, height) {
    if (!url || !width || !height) return undefined
    const resizedImageUrl = url.slice(0, -1) // Remove last "/"
    return `${resizedImageUrl}-${width}-${height}`
  }

  render() {
    return (
      <img
        width={this.props.width} height={this.props.height}
        className={this.props.className}
        alt={this.props.alt}
        src={this.changeImageUrlSize(
          this.cleanImageUrl(this.props.url),
          this.props.width,
          this.props.height,
        )} />
    )
  }
}

ProductImage.defaultProps = {
  width: DEFAULT_WIDTH,
  height: DEFAULT_HEIGHT,
}

ProductImage.propTypes = {
  width: PropTypes.string,
  heigth: PropTypes.string,
  className: PropTypes.string,
  url: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
}

export default ProductImage
