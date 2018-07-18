import 'babel-polyfill'


export {
  default as getResources,
  defaultOptions as defaultOptionsGet,
} from './actions/getResources'
export {
  default as patchResources,
  defaultOptions as defaultOptionsPost,
} from './actions/patchResources'
export {
  default as postResources,
  defaultOptions as defaultOptionsPatch,
} from './actions/postResources'
export {
  default as deleteResources,
  defaultOptions as defaultOptionsDelete,
} from './actions/deleteResources'

export {
  PESS_GET_ALL,
  PESS_GET_START,
  PESS_GET_SUCCESS,
  PESS_GET_FAIL,
} from './reductions/pessimisticGet'

export {
  OPT_DELETE_START,
  OPT_DELETE_SUCCESS,
  OPT_DELETE_FAIL,
  OPT_DELETE_ALL,
} from './reductions/optimisticDelete'

export {
  OPT_PATCH_START,
  OPT_PATCH_SUCCESS,
  OPT_PATCH_FAIL,
  OPT_PATCH_ALL,
} from './reductions/optimisticPatch'

export {
  PESS_POST_ALL,
  PESS_POST_START,
  PESS_POST_SUCCESS,
  PESS_POST_FAIL,
} from './reductions/pessimisticPost'

export {
  default as generateActions,
} from './generateActions'

export {
  default as withReductions,
} from './withReductions'

export {
  default as generateSelectors,
} from './generateSelectors'
