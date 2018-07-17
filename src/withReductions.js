import { identity } from 'ramda'

import { flattenFuncMap } from './utils'


/*
 * Terminology:
 * - namespace - A Redux slice identifier that can be prepended to Redux actions to namespace
 *   them, helping to avoid action name conflicts.
 * - resource - A resource stored in the API, like a specific campaign, adGroup, etc.
 * - resource type - The general concept of the resources being stored, like the general
 *   idea of a campaign, adGroup, etc.
 */


/*
 * To do while applying this module:
 * 1. rename all `updatedObjectHistory` instances to `prePatchResources`
 * 2. rename all `UPDATE_*` actions used with this module to `PATCH_*`
 */


/**
 * Helper function to validate inputs to `withReductions`
 * @param  {function} reducer         The original reducer function
 * @param  {object} operationReducers The reducer functions to modify state for
 */
const validateHorParams = (reducer, operationReducers) => {
  if (typeof reducer !== 'function') {
    throw new Error(
      `The first argument of \`withReductions\` must be a reducer function; Supplied value: ${
        JSON.stringify(reducer)}`,
    )
  }
  if (typeof operationReducers !== 'object' && !(operationReducers instanceof Array)) {
    throw new Error(
      `The second argument of \`withReductions\` must be an object; Supplied value: ${
        JSON.stringify(operationReducers)}`,
    )
  }
}


/**
 * @description
 * A Higher Order Reducer (HOR) factory that:
 *   1. Automatically initializes state for a resource
 *   2. Reduces state of that resource in response to actions specified by the call to this HOR
 *   3. Does so optimistically, modifying the resource's data immmediately, but stores old
 *      values in case a rollback is necessary
 *
 * Redux state properties used (and initialized) by this HOR:
 *   - data - Array of resource objects
 *   - numPosting - Number stating how many resources of the current type are posting
 *   - preDeleteResources - Id-indexed map of resource objects that are currently being deleted.
 *     If a delete fails for a resource, it will be restored from this map.
 *   - prePatchResources - Id-indexed map of pre-patch resource objects for resources that are
 *     currently being patched.  If a patch for a resource fails, it will be restored from this
 *     map.
 *   - order - Array of ids, so we can produce an ordered array of objects if we wish.  This
 *     may contain ids for resources that were deleted, so:
 *       - Don't use the count of items from this array for anything
 *       - Be sure to account for this array containing ids that aren't in `data` (meaning you
 *         can't simply map ids in this array to an array of resources, unless you then filter
 *         out the undefined values)
 *
 * See `./reductions/*.js` to see which operations are currently supported
 *
 * @param {string} namespace    Redux namespace for the resource
 * @param {object} operationReducers Object of reducer functions; For now, see `./reductions`
 * @param {object} options      Options that can be used to customize the behavior of the
 *                              resulting reducer function.
 * @param {function} reducer    (Optional) Not actually a 4th parameter.  Calling this function
 *                              with the above parameters returns a HOR factory to be called
 *                              with this reducer as its only parameter.  This is the base reducer.
 *                              This optional base reducer is acting on the state *after* the
 *                              reducers applied with `withReductions` are applied to it.
 *
 * @return {nextState}          Next store state for this slice
 */
const withReductions = (
  namespace,
  operationReducers,
  options = {},
) => (baseReducer = identity) => {
  validateHorParams(baseReducer, operationReducers)
  const reducerFuncMap = flattenFuncMap(operationReducers, namespace)

  return (state, action) => {
    const baseInitialState = baseReducer(undefined, action)
    if (!state) {
      return {
        data: {},
        numGetsInProgress: 0,
        getSucceeded: false,
        getFailed: false,
        numPosting: 0,
        order: [],
        preDeleteResources: {},
        prePatchResources: {},
        ...baseInitialState,
      }
    }
    const reducerFunc = reducerFuncMap[action.type]
    const autoReducedState = typeof reducerFunc === 'function'
      ? reducerFunc(state, action, options)
      : state
    return baseReducer(autoReducedState, action)
  }
}

export default withReductions
