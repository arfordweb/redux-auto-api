// TODO: Flesh out optimistic POST
export const OPT_POST_START = { OPT_POST_START: Function.prototype }
export const OPT_POST_SUCCESS = { OPT_POST_SUCCESS: Function.prototype }
export const OPT_POST_FAIL = { OPT_POST_FAIL: Function.prototype }

export const OPT_POST_ALL = { ...OPT_POST_START, ...OPT_POST_SUCCESS, ...OPT_POST_FAIL }
