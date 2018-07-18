import {
  forEach, fromPairs, map, toPairs,
} from 'ramda'


/**
 * @description
 * Reducer that deleted resources from `data` in state optimistically, but keeps the old
 * version of each resource that is deleted in case we need to roll the change back in
 * case the delete fails.
 *
 * NOTE: If the user is able to delete the same resource instance (ex: product with id
 * "193850913805913") against before a previous delete has concluded, strange things can occur.
 * The developer building the UI is responsible for preventing this.  They can determine if a
 * resource is being deleted or not by seeing if it exists in `preDeleteResources`.
 *
 * @param {object} state   Previous state of the sliver this reducer is applied to
 * @param {object} action  The action with type like `OPT_DELETE_${resourceName}_START` and
 *                         containing a `data` array property that contains the resources
 *                         to be deleted
 * @param {object} options idKey: The name of the identifying property of the resource type
 *                         being deleted
 *
 * @return {object}        New state
 */
function deleteStartReducer(state, { data: initialDeletes }, { idKey }) {
  const { data: oldData, preDeleteResources: oldPreDeleteResources } = state
  const preDeleteResources = { ...oldPreDeleteResources } // copy so we can mutate
  // TODO: If nothing will pass a single resource as `data`, do away with this check
  const deletes = initialDeletes instanceof Array ? initialDeletes : [initialDeletes]
  const deletesMap = fromPairs(map(d => [d[idKey], d], deletes))
  const data = {}
  forEach(([id, resource]) => {
    if (deletesMap[id]) {
      // In case a duplicate delete is attempted
      preDeleteResources[id] = resource || preDeleteResources[id]
    } else {
      data[id] = resource
    }
  }, toPairs(oldData || {}))
  return {
    ...state,
    data,
    preDeleteResources,
  }
}
export const OPT_DELETE_START = {
  OPT_DELETE_START: deleteStartReducer,
}


/**
 * @description
 * Reducer that forgets preDelete versions of resources that were successfully deleted.
 *
 * NOTE: Does not bother removing ids from `order`
 *
 * @param {object} state  Previous state of the sliver this reducer is applied to
 * @param {object} action The action with type like `OPT_DELETE_${resourceName}_SUCCESS`
 *  and containing a `data` array property that contains the resources that were deleted
 * @param {object} options idKey: The name of the identifying property of the resource type
 *                         being deleted
 * @return {object}       New state
 */
function deleteSuccessReducer(state, { data: deletes }, { idKey }) {
  const { preDeleteResources: oldPreDeleteResources } = state
  const preDeleteResources = { ...oldPreDeleteResources } // copy so we can mutate
  forEach((deletion) => {
    const id = deletion[idKey]
    delete preDeleteResources[id]
  }, deletes)
  return {
    ...state,
    preDeleteResources,
  }
}
export const OPT_DELETE_SUCCESS = {
  OPT_DELETE_SUCCESS: deleteSuccessReducer,
}


/**
 * @description
 * Reducer that forgets preDelete versions of resources that were successfully deleted.
 *
 * @param {object} state    Previous state of the sliver this reducer is applied to
 * @param {object} action   The action with type like `OPT_DELETE_${resourceName}_SUCCESS` and
 *                          containing a `data` array property that contains the resources that
 *                          were deleted
 * @param {object} options  idKey: The name of the identifying property of the resource type
 *                          being deleted
 * @return {object}         New state
 */
function deleteFailReducer(state, { data: deletes }, { idKey }) {
  const { data: oldData, preDeleteResources: oldPreDeleteResources } = state
  const data = { ...oldData }
  const deletesMap = fromPairs(map(d => [d[idKey], d], deletes))
  const preDeleteResources = {}
  forEach(([id, oldResource]) => {
    if (!oldResource) {
      return
    }
    if (deletesMap[id]) {
      data[id] = oldResource
    } else {
      preDeleteResources[id] = oldResource
    }
  }, (toPairs(oldPreDeleteResources || {})))
  return {
    ...state,
    data,
    preDeleteResources,
  }
}
export const OPT_DELETE_FAIL = {
  OPT_DELETE_FAIL: deleteFailReducer,
}


export const OPT_DELETE_ALL = {
  ...OPT_DELETE_START,
  ...OPT_DELETE_SUCCESS,
  ...OPT_DELETE_FAIL,
}
