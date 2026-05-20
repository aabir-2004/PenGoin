import {
  DEFAULT_PRESENTATION_STATE,
  PresentationState,
} from "@/store/useNotesStore";

type JsonLikeObject = Record<string, unknown>;

export function getPresentationStateFromMeta(
  meta: unknown
): PresentationState {
  const raw =
    meta &&
    typeof meta === "object" &&
    "presentation" in (meta as JsonLikeObject) &&
    typeof (meta as JsonLikeObject).presentation === "object"
      ? ((meta as JsonLikeObject).presentation as JsonLikeObject)
      : null;

  if (!raw) return DEFAULT_PRESENTATION_STATE;

  return {
    active:
      typeof raw.active === "boolean"
        ? raw.active
        : DEFAULT_PRESENTATION_STATE.active,
    currentPageId:
      typeof raw.currentPageId === "string" ? raw.currentPageId : null,
    isScreenLocked:
      typeof raw.isScreenLocked === "boolean"
        ? raw.isScreenLocked
        : DEFAULT_PRESENTATION_STATE.isScreenLocked,
    presenterId:
      typeof raw.presenterId === "string" ? raw.presenterId : null,
  };
}

export function withPresentationState(
  meta: Record<string, unknown>,
  presentationState: PresentationState
) {
  return {
    ...meta,
    presentation: {
      active: presentationState.active,
      currentPageId: presentationState.currentPageId,
      isScreenLocked: presentationState.isScreenLocked,
      presenterId: presentationState.presenterId,
    },
  };
}
