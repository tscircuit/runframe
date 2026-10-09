import { getDefaultRuntime } from "lib/runtime/default-runtime"

export const loadEasyedaBrowser = (runtime = getDefaultRuntime()) =>
  runtime.modules.load("easyeda")
