import { createOnlineRuntime } from "./online"

const onlineRuntime = createOnlineRuntime()

/** Backwards-compatible default for the existing online entrypoints. */
export const getDefaultRuntime = () => onlineRuntime
