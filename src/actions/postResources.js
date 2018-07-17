import * as R from 'ramda'

import { mapIndexed } from '../functional'
import { createDebugLog } from '../utils'


// helpers
let fakeIdNum = 0
const getFakeIdStr = () => {
  fakeIdNum += 1
  return `autoReduxApi_prepos_${fakeIdNum}`
}

/**
 * If any of the following are not specified in `options` coming in to `postResources`, these
 * defaults will be used
 */
export const defaultOptions = {
  handlePatchFailure: Function.prototype,
  idKey: 'id',
  newResourceCombiner: ({ idKey }, newResource, apiResponseResource) => ({
    ...newResource,
    [idKey]: String(apiResponseResource[idKey]),
  }),
  postOptimistic: true,
  postRequestDataToDataArray: ({ idKey }, rawResources, requestData) => R.map(
    R.assoc(idKey, getFakeIdStr()),
    requestData,
  ),
  postResponsesToData: ({ idKey }, data = [], response = []) => ({
    successData: mapIndexed(
      (resourceResponse, i) => ({
        ...data[i],
        [idKey]: resourceResponse[idKey],
      }),
      response,
    ),
    failureData: [],
  }),
  postResourcesToRequestDataArray: (options, newResources) => newResources,
}

/**
 * @description
 * Redux thunk action that accepts a single new resource to be created and attempts to create it
 * in the API.
 *
 * NOTE: If it is undesirable to post more than one resource at a time, it is responsibility
 *       of the developer dispatching this action to make sure none are currently posting
 *       before dispatching it.
 *
 * @param {object} namespace        Supplied to generateActions: Redux namespace
 * @param {string} endpoint         Supplied by generateActions: Api endpoint  Ex: '/products'
 * @param {object} options          Supplied by generateActions: Options
 *
 *                                      - {boolean} debug - Set to `true` if you wish to see debug
 *                                        messages associated with your resources posting
 *
 *                                      - {function} handlePatchFailure - (Optional, default to
 *                                        noop)
 *                                          A function that accepts arguments:
 *
 *                                            - {object} options - Same options passed to
 *                                              `postResources`
 *
 *                                            - {Error} error - (Optional)
 *
 *                                            - {any} requestData - The request body being sent to
 *                                              the server
 *
 *                                            - {object} response - The response object coming from
 *                                              the server
 *
 *                                            - {function} dispatch - Redux's `dispatch` function
 *
 *                                            - {function} getState - A function to get the current
 *                                              full Redux state
 *
 *                                          Any returned value is ignored
 *
 *                                      - {function} patchFunc - (Required) A function that accepts
 *                                        the arguments (endpoint, params) and returns a Promise
 *
 *                                      - {boolean} postOptimistic - (Defaults to true) Whether to
 *                                        use the optimistic Redux action types; Otherwise, uses
 *                                        pessimistic action types
 *
 *                                      - {function} postResponsesToData TODO: NOW
 *
 *                                      - {function} postResourcesToDataArrays TODO: NOW
 *
 *                                      - {function} postResourcesToRequestDataArray TODO: NOW
 *
 * @param {Array} newResources      Supplied when dispatched: The new properties to patch the
 *                                  resource with
 */
function postResources(
  namespace,
  endpoint,
  options,
  // params specific to this action
  newResources,
) {
  return async (dispatch, getState) => {
    const computedOptions = {
      ...defaultOptions,
      ...options,
      ...(options || {}).POST,
    }
    const {
      debug,
      handlePatchFailure,
      postFunc,
      postOptimistic,
      postRequestDataToDataArray,
      postResponsesToData,
      postResourcesToRequestDataArray,
    } = computedOptions
    const debugLog = createDebugLog(debug)
    debugLog('DEBUG autoReduxApi: `postResources` (1 of 3) arguments:', {
      namespace, endpoint, options, newResources, computedOptions,
    })
    if (typeof postFunc !== 'function') {
      throw new Error('In `autoReduxApi`, `postFunc` not specified; Must be a function')
    }
    const getActionType = phase => `${namespace}/${postOptimistic ? 'OPT' : 'PESS'}_POST_${phase}`

    const rawResources = newResources instanceof Array ? newResources : [newResources]
    const requestDataObjs = postResourcesToRequestDataArray(computedOptions, rawResources)
    debugLog('DEBUG autoReduxApi: `postResources` (2 of 3)', {
      computedValues: { requestDataObjs },
    })

    R.forEach(async (requestData) => {
      // This data may optimistically contain IDs which won't be set to the server
      const data = postRequestDataToDataArray(computedOptions, rawResources, requestData)
      dispatch({ data, requestData, type: getActionType('START') })

      // error handling helper
      const handleError = (failureData, error, requestData) => {
        dispatch({
          data: failureData, error, requestData, type: getActionType('FAIL'),
        })
      }

      try {
        const response = await postFunc(endpoint, requestData)
        const { successData, failureData } = postResponsesToData(computedOptions, data, response)
        debugLog('DEBUG autoReduxApi: `postResources` (3 of 3)', { successData, failureData })

        if (failureData.length) {
          handleError(failureData, null, requestData)
          handlePatchFailure(computedOptions, null, requestData, response, dispatch, getState)
        }
        if (successData.length) {
          dispatch({
            data: successData,
            requestData,
            responseData: successData,
            type: getActionType('SUCCESS'),
          })
        }
      } catch (error) {
        dispatch({
          data, error, requestData, type: getActionType('FAIL'),
        })
        handlePatchFailure(computedOptions, error, requestData, null, dispatch, getState)
      }
    }, R.values(requestDataObjs))
  }
}
export default { postResources }
