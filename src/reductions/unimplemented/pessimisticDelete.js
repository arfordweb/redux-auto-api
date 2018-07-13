// TODO: Flesh out pessimistic DELETE; This means it doesn't remove items until the API responds
export const PESS_DELETE_START = { PESS_DELETE_START: Function.prototype }
export const PESS_DELETE_SUCCESS = { PESS_DELETE_SUCCESS: Function.prototype }
export const PESS_DELETE_FAIL = { PESS_DELETE_FAIL: Function.prototype }

export const PESS_DELETE_ALL = { ...PESS_DELETE_START, ...PESS_DELETE_SUCCESS, ...PESS_DELETE_FAIL }
