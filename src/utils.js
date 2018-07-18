import { forEach, toPairs } from 'ramda'


/**
 * @description
 * Helper function that creates a flat object of reducer functions indexed by Redux action types
 * from a possibly nested set of objects with reducer functions referenced by action names.
 * @param  {object} operationReducers May have nested objects indexed by any key or reducer
 *                                    functions indexed by action names
 * @param  {string} prefix            The prefix to prepend to the action type string
 * @return {object}                   Array of reducer functions, indexed by Redux action types
 */
export function flattenFuncMap(deepFuncMap, prefix = '') {
  let outFuncMap = {}
  forEach(([actionName, funcOrMap]) => {
    if (typeof funcOrMap === 'function') {
      outFuncMap[`${prefix}${actionName}`] = funcOrMap
    } else if (typeof funcOrMap === 'object') {
      outFuncMap = {
        ...outFuncMap,
        ...flattenFuncMap(funcOrMap, prefix),
      }
    }
  }, toPairs(deepFuncMap))
  return outFuncMap
}


/**
 * @description
 * When `debug` is set as an option given to `autoReduxApi`, this function returns a function
 * that can be used by `autoReduxApi` to log helpful messages to the console
 *
 * @param  {boolean} debug  Whether to log debuggin messages.  If this is `false`, the returned
 *                          function won't log to console.  It will be a noop instead.
 *
 * @return {function}       A function to which you can pass any number of arguments to be logged
 */
export const createDebugLog = debug => (debug && process.env.NODE_ENV !== 'production'
// eslint-disable-next-line no-console
  ? console.log.bind(console)
  : Function.prototype)
