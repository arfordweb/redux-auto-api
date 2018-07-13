import { createSelector } from 'reselect'
import * as R from 'ramda'


/**
 * @description
 * Given a Redux namespace string for a slice in which `autoReduxApi` was used to generate
 * actions and reducers for API interactions, this function generates selectors that can
 * be used to access resources received from the server.
 * @param  {string} namespace   The namespace of the slice  Ex: `model/keywords`
 *
 * @return {object}             An object with a few selectors mapped within it:
 *                               resourceDataMapSelector - map of IDs to data resource objects
 *                               resourceOrderArraySelector - Array of resource Ids in order
 *                               orderedResourcesArraySelector - Array of resource objects,
 *                                  in order
 */
const generateSelectors = (namespace) => {
  const resourceDataMapSelector = R.path([namespace, 'data'])
  const resourceOrderArraySelector = R.path([namespace, 'order'])
  const orderedResourcesArraySelector = createSelector(
    resourceDataMapSelector,
    resourceOrderArraySelector,
    (resources, resourceOrder) => R.compose(
      R.filter(R.identity), // get rid of undefined (probably deleted) search terms
      R.map(R.prop(R.__, resources)), // returns an array of search term objects
    )(resourceOrder),
  )
  return {
    resourceDataMapSelector,
    resourceOrderArraySelector,
    orderedResourcesArraySelector,
  }
}

export default generateSelectors
