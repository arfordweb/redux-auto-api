import * as R from 'ramda'


/**
 * Functional utilities, like function created with Ramda functions that are frequently
 * used together
 */

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
