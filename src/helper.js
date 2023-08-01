  /**
   * Apply styles packed in object. key: style name, val: style value
   * @param {Element|String} el Element to apply styles or tag name to create
   * @param {Object} styles Styles object
   * @return {Element} Element with applied styles
   */
export function setStyles(el, styles) {
  if (!el || !styles) {return null}

  el = typeof el === 'string' ? document.createElement(el) : el
  const elStyle = el.style

  // eslint-disable-next-line no-restricted-syntax
  for (const style in styles) {
    if (styles.hasOwnProperty(style)) {
      elStyle[style] = styles[style]
    }
  }
  return el
}
