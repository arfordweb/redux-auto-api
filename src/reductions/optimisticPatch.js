import {
  forEach, fromPairs, map, prop, toPairs,
} from 'ramda'


/**
 * @description
 * Reducer that applies patch to `data` in state optimistically, but keeps the old
 * version of each resource that is patched in case we need to roll the change back in
 * case the patch fails and we have to roll back.
 *
 * NOTE: If the user is able to patch the same resource instance (ex: product with id
 * "193850913805913"), race conditions can occur and cause strange issues.  The developer
 * building the UI and actions is responsible for preventing this.  They can determine
 * if a resource is being patched or not by seeing if it exists in `prePatchResources`.
 *
 * @param {object} state   Previous state of the sliver this reducer is applied to
 * @param {object} action  The action with type like `OPT_PATCH_${resourceName}_START` and
 *                         containing a `data` array property that contains the patches to be
 *                         applied
 * @param {object} options idKey: The name of the identifying property of the resource type
 *                         being patched
 * @return {object}        New state
 */
function patchStartReducer(state, {
  data: patches,
}, { idKey }) {
  const { data: oldData, prePatchResources: oldPrePatchResources } = state
  const prePatchResources = { ...oldPrePatchResources } // copy so we can mutate
  const patchesMap = fromPairs(map(p => [p[idKey], p], patches))
  const data = fromPairs(
    map(([id, resource]) => {
      if (patchesMap[id]) {
        prePatchResources[id] = resource
        return [id, { ...resource, ...patchesMap[id] }]
      }
      return [id, resource]
    }, toPairs(oldData || {})),
  )
  return {
    ...state,
    data,
    prePatchResources,
  }
}
export const OPT_PATCH_START = { OPT_PATCH_START: patchStartReducer }


/**
 * @description
 * Reducer that forgets succuessfully patched resources' histories
 *
 * @param {object} state   Previous state of the sliver this reducer is applied to
 * @param {object} action  The action with type like `OPT_PATCH_${resourceName}_SUCCESS` and
 *                         containing a `data` array property that contains the patches that
 *                         were applied
 * @param {object} options idKey: The name of the identifying property of the resource type
 *                         being patched
 * @return {object}        New state
 */
function patchSuccessReducer(state, {
  data: patches,
}, { idKey }) {
  const prePatchResources = { ...state.prePatchResources }
  forEach((id) => {
    delete prePatchResources[id]
  }, map(prop(idKey), patches))
  return {
    ...state,
    prePatchResources,
  }
}
export const OPT_PATCH_SUCCESS = { OPT_PATCH_SUCCESS: patchSuccessReducer }


/**
 * @description
 * Reducer that restores pre-patch resources from state, since there was a failure while
 * attempting to patch those resources.  The affected resources will no longer appear as
 * being in the process of being patched.
 *
 * @param {object} state   Previous state of the sliver this reducer is applied to
 * @param {object} action  The action with type like `OPT_PATCH_${resourceName}_FAIL` and
 *                         containing a `data` array property that contains the patches we
 *                         attempted to apply
 * @param {object} options idKey: The name of the identifying property of the resource type
 *                         being patched
 * @return {object}        New state
 */
function patchFailReducer(state, {
  data: patches,
  error,
}, { idKey }) {
  Function.prototype(error) // noop, since we receive `error` for debugging here
  const { data: oldData, prePatchResources: oldPrePatchResources } = state
  const prePatchResources = { ...oldPrePatchResources } // copy so we can mutate
  const patchesMap = fromPairs(map(p => [p[idKey], p], patches))
  const data = fromPairs(map(([id, resource]) => {
    if (patchesMap[id]) {
      delete prePatchResources[id]
      return [id, oldPrePatchResources[id]]
    }
    return [id, resource]
  }, toPairs(oldData || {})))
  return {
    ...state,
    data,
    prePatchResources,
  }
}
export const OPT_PATCH_FAIL = { OPT_PATCH_FAIL: patchFailReducer }


export const OPT_PATCH_ALL = {
  ...OPT_PATCH_START,
  ...OPT_PATCH_SUCCESS,
  ...OPT_PATCH_FAIL,
}
