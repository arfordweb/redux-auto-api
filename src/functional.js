import * as R from 'ramda'


/**
 * Functional utilities, like function created with Ramda functions that are frequently
 * used together
 */


/**
 * @description
 * Returns a new list without the specified value.  Composed from Ramda functions, so this
 * function is curried
 * @param {any} val       The value to not include in the resulting list
 * @param {Array} list    The new list not containing the excluded value
 *
 * @return {Array}        New list without the specified value
 */
export const without = (val, list) => R.reject(R.equals(val), list)

/**
 * @description
 * Returns true if all props of the map are truthy
 *
 * This function is curried
 *
 * @param  {Array|string} props    Array of string prop names or a single string prop name
 * @param  {object} map     The map with props that may be truthy or not
 *
 * @return {boolean}        True if all the props from map are truthy
 */
export const allPropsTruthy = R.curry((props, map) => R.compose(
  R.all(R.identity),
  R.props(props instanceof Array ? props : [props]),
)(map))

/**
 * @description
 * Does a dumb merge of two objects or two Arrays.  If objects, values from the second object
 * will override those of the first.  If Arrays, concatenates the two.  Otherwise, returns one
 * of the two, favoring truthiness, then favoring the second value if both are truthy.
 *
 * // TODO: (darnell) Needs unit tests
 *
 * @param  {any} valA
 * @param  {any} valB
 *
 * @return {any}        A merged object or Array, or one of the two values; see description above
 */
export const dumbMerge = (valA, valB) => {
  if (valA instanceof Array && valB instanceof Array) {
    return [...valA, ...valB]
  } if (typeof valA === 'object' && typeof valB === 'object') {
    return { ...valA, ...valB }
  } if (
    (valB === null || valB === undefined)
        && (valA instanceof Array || typeof valA === 'object')) {
    // `valB` can't override `valA`, so just return `valA`
    return valA
  } if (
    (valA === null || valA === undefined)
        && (valB instanceof Array || typeof valB === 'object')) {
    return valB
  } if (valB) {
    // can't merge, but we can return a truthy `valB`, which is given first chance since
    // `valB` values override `valA` values in an object; this is analagous to that
    return valB
  } if (valA) {
    // can't merge, but we can return a truthy `valA`
    return valA
  }
  // ok, fine;  just return `valB`
  return valB
}

/**
 * @description
 * Merges two Arrays or objects.  If the result is equal to the initial value in a deep comparison,
 * the original value is returned so it passes an equality test.
 *
 * Note: The comparison done when evaluating whether to return the initial value is deep, but
 *       the merge is shallow.
 *
 * This is especially valuable when creating new state in a reducer.  If you're merging data
 * into state, and that state is equal according to a deep comparison, the old state doesn't get
 * replaced with a new instance.  So, unnecessary re-renders can be avoided.
 *
 * // TODO: (darnell) Needs unit tests
 *
 * @param  {any} initialValue       Initial Array or object
 * @param  {any} updates            Updates to apply to the initial value or values to be
 *                                  concatenated
 *
 * @return {any}                    A merged value, possibly the same as the initial value
 */
export const shallowMergeStable = (initialValue, updates) => {
  const tmpValue = dumbMerge(initialValue, updates)
  return R.equals(initialValue, tmpValue)
    ? initialValue
    : tmpValue
}

/**
 * @description
 * Similar to `R.forEach`, except the supplied function should take a second argument, which
 * will receive the index of the item being iterated.
 * @example
 * forEachIndexed((value, index) => {
 *     logToConsole(`The value is ${value} at index ${index}`)
 * }, ['foo', 'bar'])
 * // Will log:
 * // 'The value is foo at index 0'
 * // 'The value is bar at index 1'
 * @param {function} singleIterationFunc    A function that takes (value, index) and will be
 *                                          executed for every item in `targetList`
 * @param {Array} targetList                A list on which to iterate
 */
export const forEachIndexed = R.addIndex(R.forEach)

/**
 * @description
 * Maps over values of a list, but with the list item's index provided to the iterating function
 * @example
 * logToConsole(
 *     mapIndexed(
 *         (value, index) => `The value is ${value} at index ${index}`,
 *         ['baz', 'quux']
 *     )
 * )
 * // Will log:
 * // [
 * //     'The value is baz at index 0',
 * //     'The value is quux at index 1',
 * // ]
 * @param {function} singleIterationFunc    A function that takes (value, index) and will be
 *                                          executed for every item in `targetList`
 * @param {Array} targetList                A list on which to iterate
 *
 * @return {Array}                          A new array of mapped values
 */
export const mapIndexed = R.addIndex(R.map)
