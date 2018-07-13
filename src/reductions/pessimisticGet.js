import { fromPairs, map } from 'ramda'


/**
 * @description
 * Reducer that notes when we are performing another GET
 *
 * @param {object} state   Previous state of the sliver this reducer is applied to
 * @return {object}        New state
 */
function getStartReducer(state) {
  return {
    ...state,
    data: {},
    getFailed: false,
    getSucceeded: false,
    order: [],
    numGetsInProgress: state.numGetsInProgress + 1,
  }
}
export const PESS_GET_START = { PESS_GET_START: getStartReducer }


/**
 * @description
 * Reducer that notes we are no longer getting the resource and populates our `data`
 * and `order` with the data retrieved from the API
 *
 * @param {object} state   Previous state of the sliver this reducer is applied to
 * @param {object} action  The action with type like `PESS_GET_${resourceName}_SUCCESS` and
 *                         containing a `data` array property that contains the resource
 *                         objects retrieved
 * @param {object} options idKey: The name of the identifying property of the resource type
 *                         being queried
 * @return {object}        New state
 */
function getSuccessReducer(state, {
  data: rawData,
}, { idKey }) {
  const idResourcePairs = map(resource => [resource[idKey], resource], rawData)
  const order = map(pair => pair[0], idResourcePairs)
  const data = fromPairs(idResourcePairs)
  return {
    ...state,
    data,
    getSucceeded: true,
    numGetsInProgress: state.numGetsInProgress - 1,
    order,
  }
}
export const PESS_GET_SUCCESS = { PESS_GET_SUCCESS: getSuccessReducer }


/**
 * @description
 * Reducer that notes we are no longer getting the resource
 *
 * @param {object} state  Previous state of the sliver this reducer is applied to
 * @return {object}       New state
 */
function getFailReducer(state) {
  return {
    ...state,
    getFailed: true,
    numGetsInProgress: state.numGetsInProgress - 1,
  }
}
export const PESS_GET_FAIL = {
  PESS_GET_FAIL: getFailReducer,
}


export const PESS_GET_ALL = {
  ...PESS_GET_START,
  ...PESS_GET_SUCCESS,
  ...PESS_GET_FAIL,
}
