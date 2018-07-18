// TODO: Flesh out pessimistic PATCH; This means it doesn't modify items until the API responds
export const PESS_PATCH_START = { PESS_PATCH_START: Function.prototype }
export const PESS_PATCH_SUCCESS = { PESS_PATCH_SUCCESS: Function.prototype }
export const PESS_PATCH_FAIL = { PESS_PATCH_FAIL: Function.prototype }

export const PESS_PATCH_ALL = { ...PESS_PATCH_START, ...PESS_PATCH_SUCCESS, ...PESS_PATCH_FAIL }
