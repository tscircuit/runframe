/**
 * The RunFrame run effect can observe an empty `fsMap` even after
 * `isLoadingFiles` has flipped to false — the "initial files loaded" signal and
 * the store's file map are populated by separate updates, so there is a short
 * window where files are still en route while the map is momentarily empty.
 *
 * When a specific file has been requested (an entrypoint or a main component,
 * e.g. from a `#file=`/`main_component=` URL hash), an empty map almost always
 * means "still loading" rather than "genuinely no files". In that case we should
 * defer the "No files provided" error and let the loading state render instead
 * of flashing a misleading error.
 */
export const shouldDeferNoFilesError = (opts: {
  entrypoint?: string | null
  mainComponentPath?: string | null
}): boolean => Boolean(opts.entrypoint || opts.mainComponentPath)

/**
 * How long to wait, once loading has apparently settled and no file was
 * explicitly requested, before treating an empty `fsMap` as a hard error. This
 * debounce absorbs the remaining loading-race window without hiding a genuinely
 * empty project for long.
 */
export const EMPTY_FSMAP_ERROR_DELAY_MS = 500
