import * as R from 'ramda'

import { mapIndexed } from '../functional'
import { createDebugLog } from '../utils'


/**
 * If any of the following are not specified in `options` coming in to `patchResources`, these
 * defaults will be used
 */
export const defaultOptions = {
  debug: false,
  handlePatchFailure: Function.prototype,
  patchOptimistic: true,
  patchResponsesToData: (options, patchData = []) => patchData,
  patchTargetsToRequestDataArray: (
    options,
    targetResources,
    targetNewProperties,
  ) => [mapIndexed( // Returns an array with one item: an array of resource patches
    (target, i) => ({ ...target, ...targetNewProperties[i] }),
    targetResources,
  )],
  patchRequestDataToDataArray: (options, requestData = []) => requestData,
}

/**
 * @description
 * Redux thunk action that accepts a single resource and new properties to patch it with
 * and attempts to patch the resource in the API
 *
 * @param {object} namespace      Supplied to generateActions: Redux namespace
 * @param {string} endpoint       Supplied by generateActions: Api endpoint  Ex: '/products'
 * @param {object} options        Supplied by generateActions: Options
 *                                  - {boolean} debug - Set to `true` if you wish to see debug
 *                                    messages associated with your resources patching
 *
 *                                  - {function} handlePatchFailure - (Default to a noop)
 *                                      A function that accepts arguments:
 *                                        - {Array} data - Objects that failed to patch
 *                                        - {Error} error - The error that was thrown
 *                                        - {any} requestData - The data sent to the server in the
 *                                          body of the `PATCH` request
 *                                        - {function} dispatch - The Redux `dispatch` function
 *                                        - {function} getState - A function that gets the current
 *                                          state from the Redux store
 *                                      Any values returned by this function will be ignored
 *
 *                                  - {function} patchFunc - (Required) A function that accepts
 *                                    the arguments (endpoint, params) and returns a Promise
 *
 *                                  - {boolean} patchOptimistic - (Defaults to `true`) Set to
 *                                    `false` if the PATCH should be pessimistic
 *
 *                                  - {function} patchResponsesToData - (Defaults to a function
 *                                    that returns all the patch data without changes)
 *                                      A function that accepts arguments:
 *                                        - {object} options - Same options passed to this function,
 *                                          which can be extended when calling `generateActions`
 *                                        - {Array} patchData - objects containing the ID of the
 *                                          resource to patch and the key/value pairs to modify
 *                                        - {object} response - The API response
 *                                      ...and returns an object with two keys:
 *                                        - {Array} successData - The successfully executed patches
 *                                          (Note that this is not the full patched resource, but
 *                                          will likely contain the resource's ID and the properties
 *                                          that were changed)
 *                                        - {Array} failureData - The patches that failed.
 *                                          (Note that this doesn't need to contain data returned by
 *                                          the server, only the identifier and the key/value pairs
 *                                          of the fields that were being changed)
 *
 *                                  - {function} patchTargetsToRequestDataArray - (Defaults to
 *                                    a function that returns a single Array of resource patch
 *                                    objects)
 *                                      A function that accepts arguments:
 *                                        - {object} options - Same options passed to this function,
 *                                          which can be extended when calling `generateActions`
 *                                        - {Array|object} targetResources - The existing resources
 *                                          to be patched
 *                                        - {Array|object} newProperties - An array of the same size
 *                                          as `targetResources` containing mappings of fields
 *                                          to be updated to the new values of those fields
 *                                      ...and returns an Array of values to be sent as the body of
 *                                      any number of PATCH requests to the API
 *
 *                                  - {function} patchRequestDataToDataArray - (Defaults to a
 *                                    a function that returns the request data, unchanged)
 *                                      A function that accepts arguments:
 *                                        - {object} options - Same options passed to this function
 *                                        - {any} requestData - Request data for a single request
 *
 *
 * @param {object} curResources   Supplied when dispatched: A resource or an array of resources
 *                                to be modified.  Should entire resource object, not just IDs.
 * @param {object} newProperties  Supplied when dispatched: An object or array of objects
 *                                containing new properties for each of the resources specified
 *                                in the `curResources` object or array.  Indexes match up
 *                                with `curResources` to dictate which resources are updated
 *                                with what new properties.
 */
function patchResources(
  namespace,
  endpoint,
  options,
  // params specific to this action
  curResources,
  newProperties,
) {
  return async (dispatch, getState) => {
    const computedOptions = {
      ...defaultOptions,
      ...options,
      ...(options || {}).PATCH,
    }
    const {
      debug,
      handlePatchFailure,
      patchFunc,
      patchOptimistic,
      patchRequestDataToDataArray,
      patchResponsesToData,
      patchTargetsToRequestDataArray,
    } = computedOptions
    const debugLog = createDebugLog(debug)
    debugLog('DEBUG autoReduxApi: `patchResources` (1 of 3) arguments:', {
      namespace, endpoint, options, curResources, newProperties, computedOptions,
    })
    if (typeof patchFunc !== 'function') {
      throw new Error('In `autoReduxApi`, `patchFunc` not specified; Must be a function')
    }
    const getActionType = phase => `${namespace}/${patchOptimistic
      ? 'OPT'
      : 'PESS'
    }_PATCH_${phase}`
    const targetResources = curResources instanceof Array ? curResources : [curResources]
    const targetNewProperties = curResources instanceof Array ? newProperties : [newProperties]

    const requestDataObjs = patchTargetsToRequestDataArray(
      computedOptions, targetResources, targetNewProperties,
    )
    debugLog('DEBUG autoReduxApi: `patchResources` (2 of 3) computedValues:', { requestDataObjs })

    R.forEach(async (requestData) => {
      const data = patchRequestDataToDataArray(computedOptions, requestData)
      dispatch({ data, requestData, type: getActionType('START') })
      // handle error within this Redux slice in case rollbacks need to happen
      const handleError = (failureData, error, requestData) => {
        dispatch({
          data: failureData, error, requestData, type: getActionType('FAIL'),
        })
      }
      try {
        const response = await patchFunc(endpoint, requestData)
        const { successData, failureData } = patchResponsesToData(computedOptions, data, response)
        debugLog('DEBUG autoReduxApi: `patchResources` (3 of 3)', { successData, failureData })

        if (failureData.length) {
          handleError(failureData, null, requestData)
          handlePatchFailure(computedOptions, null, requestData, response, dispatch, getState)
        }
        if (successData.length) {
          dispatch({
            data: successData,
            requestData,
            responseData: response.data,
            type: getActionType('SUCCESS'),
          })
        }
      } catch (error) {
        // full failure
        handleError(data, error)
        handlePatchFailure(computedOptions, error, requestData, null, dispatch, getState)
      }
    }, R.values(requestDataObjs))
  }
}
export default { patchResources }
