import {
  concat, fromPairs, keys, map,
} from 'ramda'


/**
 * @description
 * Reducer that notes when we are posting another
 *
 * @param {object} state   Previous state of the sliver this reducer is applied to
 * @return {object}        New state
 */
function postStartReducer(state) {
  return {
    ...state,
    numPosting: state.numPosting + 1,
  }
}
export const PESS_POST_START = { PESS_POST_START: postStartReducer }


/**
 * @description
 * Reducer that notes we are no longer posting the resource and places the newly-created
 * resources in `data` and their ids in `order`
 *
 * @param {object} state  Previous state of the sliver this reducer is applied to
 * @param {object} action The action with type like `PESS_POST_${resourceName}_SUCCESS` and
 *  containing a `data` array property that contains the posts that were applied
 * @param {object} options idKey: The name of the identifying property of the resource type
 *                         being posted
 * @return {object}       New state
 */
function postSuccessReducer(state, {
  data: postedData,
}, { idKey }) {
  const newData = fromPairs(map(resource => [resource[idKey], resource], postedData))
  return {
    ...state,
    data: { ...state.data, ...newData },
    numPosting: state.numPosting - 1,
    order: concat(state.order, keys(newData)),
  }
}
export const PESS_POST_SUCCESS = { PESS_POST_SUCCESS: postSuccessReducer }


/**
 * @description
 * Reducer that notes we are no longer posting the resource
 *
 * @param {object} state  Previous state of the sliver this reducer is applied to
 * @return {object}       New state
 */
function postFailReducer(state) {
  return {
    ...state,
    numPosting: state.numPosting - 1,
  }
}
export const PESS_POST_FAIL = {
  PESS_POST_FAIL: postFailReducer,
}


export const PESS_POST_ALL = {
  ...PESS_POST_START,
  ...PESS_POST_SUCCESS,
  ...PESS_POST_FAIL,
}
