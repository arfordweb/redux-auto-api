import * as R from 'ramda'

import { flattenFuncMap } from './utils'


/**
 * @description
 * Generates resource-specific actions based on specially-designed actions that accept arguments:
 *   - namespace {string}
 *   - endpoint {string}
 *   - options {object}
 *   - ...as well as any other arguments that will be supplied when the action is dispatched
 *
 * @param {object} namespace        Redux namespace to prepend to action types
 * @param {object} operationActions Object of operation action function.  The indexes at which
 *                                  these functions are supplied will be the indexes in the
 *                                  resulting object full of dispatchable actions.
 * @param {string} endpoint         Api endpoint  Ex: '/campaigns'
 * @param {object} options          Options used by the generalized actions; Any unrecognized
 *                                  options are ignored
 *
 * @return {object}                 An object populated with action functions that can be
 *                                  dispatched to perform API requests
 */
const generateActions = (defaultOptions = {}) => {
  const {
    GET: defaultGet, POST: defaultPost, PATCH: defaultPatch, DELETE: defaultDelete,
    ...defaultRest
  } = defaultOptions
  return (
    namespace,
    operationActions,
    endpoint,
    options = {},
  ) => {
    const {
      GET: optionsGet, POST: optionsPost, PATCH: optionsPatch, DELETE: optionsDelete,
      ...optionsRest
    } = options
    const actionsFuncMap = flattenFuncMap(operationActions)
    return R.fromPairs(
      R.map(
        ([actionName, actionFunc]) => ([
          actionName,
          (...args) => (dispatch) => {
            const computedOptions = {
              ...defaultRest,
              ...optionsRest,
              GET: { ...defaultGet, ...optionsGet },
              POST: { ...defaultPost, ...optionsPost },
              PATCH: { ...defaultPatch, ...optionsPatch },
              DELETE: { ...defaultDelete, ...optionsDelete },
            }
            dispatch(actionFunc(
              namespace,
              endpoint,
              computedOptions,
              ...args,
            ))
          },
        ]), R.toPairs(actionsFuncMap),
      ),
    )
  }
}

export default generateActions
