import { createDebugLog } from '../utils'


export const defaultOptions = {
  debug: false,
  handleGetSuccess: Function.prototype,
}

/**
 * @description
 * Redux thunk action that fetches a reource, using query params to request that the API
 * narrow down results
 *
 * @param {object} namespace        Supplied to generateActions: Redux namespace
 * @param {string} endpoint         Supplied by generateActions: Api endpoint  Ex: '/products'
 * @param {object} options          Supplied by generateActions: Options
 *
 *                                    - {function} getFunc - (Required) A function that accepts
 *                                      the arguments (endpoint, params) and returns a Promise.
 *                                      Compatible with `axios` package.
 *
 *                                    - {function} handleGetSuccess - (Optional) Accepts arguments
 *                                      (response, params, dispatch, getState) and allows you
 *                                      to perform another task on GET success, including
 *                                      dispatching other actions
 *
 * @param {object} params         Query parameters
 */
function getResources(
  namespace,
  endpoint,
  options,
  // params specific to this action
  params,
) {
  return async (dispatch, getState) => {
    const computedOptions = {
      ...options,
      ...(options || {}).GET,
    }
    const {
      debug,
      getFunc,
      handleGetSuccess,
    } = computedOptions
    const debugLog = createDebugLog(debug)
    debugLog('DEBUG autoReduxApi: `getResources` (1 of 1) arguments:', {
      namespace, endpoint, options, params, computedOptions,
    })
    if (typeof getFunc !== 'function') {
      throw new Error('In `autoReduxApi`, `getFunc` not specified; Must be a function')
    }
    const getActionType = phase => `${namespace}/PESS_GET_${phase}`
    dispatch({
      params,
      type: getActionType('START'),
    })
    try {
      const response = await getFunc(endpoint, { params })
      dispatch({
        type: getActionType('SUCCESS'),
        data: response.data,
        // the following are for debugging
        params,
      })
      handleGetSuccess(response, params, dispatch, getState)
    } catch (error) {
      dispatch({
        type: getActionType('FAIL'),
        // for debugging
        error,
        params,
      })
    }
  }
}
export default { getResources }
