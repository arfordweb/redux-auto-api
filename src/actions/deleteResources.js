import * as R from 'ramda'

import { createDebugLog } from '../utils'


/**
 * If any of the following are not specified in `options` coming in to `deleteResources`, these
 * defaults will be used
 */
export const defaultOptions = {
  debug: false,
  deleteOptimistic: true,
  /**
     * @description
     * The default translation of request data to the data array needed by our reducers.  Expects an
     * array of IDs as the `requestData`.  So, it just returns a new array of resource objects that
     * have been mapped from those IDs.
     * @param {object} options              Requires only an `idKey`, which is not required in the
     *                                      `deleteResources` options.  But it is required if the
     *                                      developer is using this default option function.
     * @param {object} targetResourcesMap   A map of resource IDs to resources;  May contain more
     *                                      resources than we have IDs in `requestData`
     * @param {Array} requestData           An Array of IDs of resources to be deleted.  Note that
     *                                      the default case expects an Array, but this may be an
     *                                      object in custom implementations
     *
     * @return {Array}                      Array of resources objects to be deleted
     */
  deleteRequestDataToDataArray: ({ idKey }, targetResources, requestData) => {
    const targetResourcesMap = R.fromPairs(R.map(r => [r[idKey], r], targetResources))
    return R.map(
      R.prop(R.__, targetResourcesMap),
      requestData,
    )
  },
  /**
     * @description
     * The default case is an array of IDs of resources to delete
     * @param {object} options                  Requires only an `idKey`, which is not required
     *                                          in the `deleteResources` options.  But it is
     *                                          required if the developer is using this default
     *                                          option function.
     * @param  {Array} arrayResourcesToDelete   An Array of resources instances we wish to delete
     *
     * @return {Array}                          An Array containing a single Array of IDs of the
     *                                          resources to delete
     */
  deleteTargetsToRequestDataArray: ({ idKey }, arrayResourcesToDelete) => [
    R.map(R.prop(idKey), arrayResourcesToDelete),
  ],
  handleDeleteFailure: Function.prototype,
  idKey: 'id',
  namespaceSeparator: '/',
}

/**
 * @description
 * Redux thunk action that accepts an array of resources to be deleted, then deletes them from
 * the api and dispatches actions for start, success, or failure.
 *
 * @param {object} namespace        Supplied to generateActions: Redux namespace
 * @param {string} endpoint         Supplied to generateActions: Api endpoint  Ex: '/products'
 * @param {object} options          Supplied to generateActions: Options object
 *
 *                                    - {boolean} debug - Set to `true` to get debug messages
 *
 *                                    - {string} idKey - (Optional) Defaults to 'id'; The key of the
 *                                      resource's identifying property.  Only needed if you will
 *                                      use it in a custom function option or if you use the
 *                                      defaults.  But, not necessary if your custom
 *                                      `deleteRequestDataToDataArray` and
 *                                      `deleteTargetsToRequestDataArray` don't require it
 *
 *                                    - {function} deleteFunc - (Required) A function that accepts
 *                                      the arguments (endpoint, params) and returns a Promise.
 *                                      Compatible with `axios` package.
 *
 *                                    - {boolean} deleteOptimistic - (Defaults to true) Whether to
 *                                      use the optimistic Redux action types; Otherwise, uses
 *                                      pessimistic action types
 *
 *                                    - {function} deleteTargetsToRequestDataArray - (Default to
 *                                      a function that returns a single Array of resource IDs)
 *                                      A function that accepts the arguments
 *                                        - {object} options - Same options passed to this function
 *                                        - {Array} arrayResourcesToDelete - An Array of resources
 *                                          to be deleted
 *                                      and returns any value to be sent as the body of the
 *                                      DELETE request
 *
 *                                    - {function} defaultDeleteRequestDataToDataArray - (Defaults
 *                                      to a function that returns an Array of resources mapped from
 *                                      the resource IDs from `deleteTargetsToRequestDataArray`)
 *                                      A function that accepts the arguments
 *                                        - {object} options - Same options passed in to this
 *                                          function
 *                                        - {object} targetResourcesMap - A mapping of resource
 *                                          IDs to resource objects
 *                                        - {any} requestData - The output of
 *                                          `deleteTargetsToRequestDataArray`
 *                                      and returns an Array of resource objects to be considered
 *                                      as deleted or not deleted by our reducers
 *
 *                                    - {function} handleDeleteFailure - (Defaults to a noop)
 *                                      A function you can specify if you'd like to do something in
 *                                      response to a DELETE failure, like show an error to the user
 *
 *                                    - {string} namespaceSeparator - (Defaults to '/')
 *                                      Separator between the namespace and the action type name
 *
 *                                    - Other - If a custom `deleteTargetsToRequestDataArray`
 *                                      function requires options, they can also be specified
 *
 * @param {object|Array} resourcesToDelete
 *                                  Supplied when dispatched: The resource objects to be deleted
 */
function deleteResources(
  namespace,
  endpoint,
  options,
  // params specific to this action
  resourcesToDelete,
) {
  return async (dispatch, getState) => {
    const computedOptions = {
      ...defaultOptions,
      ...options,
      ...(options || {}).DELETE,
    }
    const {
      debug,
      deleteFunc,
      deleteOptimistic,
      deleteTargetsToRequestDataArray,
      deleteRequestDataToDataArray,
      handleDeleteFailure,
      namespaceSeparator,
    } = computedOptions
    const debugLog = createDebugLog(debug)
    debugLog('DEBUG autoReduxApi: `deleteResources` (1 of 2) arguments:', {
      namespace, endpoint, options, resourcesToDelete, computedOptions,
    })
    if (typeof deleteFunc !== 'function') {
      throw new Error('In `autoReduxApi`, `deleteFunc` not specified; Must be a function')
    }
    const getActionType = phase => `${namespace}${namespaceSeparator}${deleteOptimistic
      ? 'OPT'
      : 'PESS'
    }_DELETE_${phase}`

    // get Array of resources targeted for deletion
    const targetResources = resourcesToDelete instanceof Array
      ? resourcesToDelete
      : [resourcesToDelete]
    const requestDataObjs = deleteTargetsToRequestDataArray(computedOptions, targetResources)
    debugLog('DEBUG autoReduxApi: `deleteResources` (2 of 2) computed values:', {
      requestDataObjs, targetResources,
    })

    requestDataObjs.forEach(async (requestData) => {
      const data = deleteRequestDataToDataArray(computedOptions, targetResources, requestData)
      dispatch({ data, requestData, type: getActionType('START') })
      try {
        const { data: responseData } = await deleteFunc(endpoint, { data: requestData })
        // NOTE: Not currently separating DELETE operations into partial successes and failures
        dispatch({
          data,
          requestData,
          responseData,
          type: getActionType('SUCCESS'),
        })
      } catch (error) {
        dispatch({
          data, error, requestData, type: getActionType('FAIL'),
        })
        handleDeleteFailure(computedOptions, error, requestData, null, dispatch, getState)
      }
    })
  }
}
export default { deleteResources }
