/**
 * Whether THIS visit to the home page belongs to an invite / connect flow.
 *
 * The invite pages keep the token in localStorage ("inviteToken" /
 * "connectToken") so the flow survives sign-in / sign-up round trips. That
 * storage outlives the flow: a person who once opened an invite link and
 * never finished it still has the token next week. Before 2026-10-17 the
 * home page acted on any stored token, so opening the plain site address
 * (https://www.ahaitsme.com/ or /kr) sent them to /invite-birth (signed
 * out) or silently accepted the old invite (signed in).
 *
 * Rule now: the home page uses a stored token only when the URL says the
 * visit is part of the flow --
 *   ?token=...         (invite link -> /invite -> home, sign-in return)
 *   ?connectToken=...  (personal connect link -> /connect -> home)
 *   ?continue=invite   (hand-offs from /invite-birth, incl. Clerk sign-in)
 * The plain address never carries these, so it always shows the home page.
 * Stored tokens are left as they are; opening the invite link again resumes.
 */
export const INVITE_CONTINUE_PARAM = "continue";
export const INVITE_CONTINUE_VALUE = "invite";
/** Locale-agnostic home path that resumes a stored invite / connect flow. */
export const INVITE_CONTINUE_HOME = `/?${INVITE_CONTINUE_PARAM}=${INVITE_CONTINUE_VALUE}`;

type Params = { get(name: string): string | null };

export function isInviteEntry(params: Params | null | undefined): boolean {
  if (!params) return false;
  return Boolean(
    params.get("token")?.trim() ||
      params.get("connectToken")?.trim() ||
      params.get(INVITE_CONTINUE_PARAM) === INVITE_CONTINUE_VALUE,
  );
}

type Store = { getItem(key: string): string | null };

/** Stored tokens the home page may act on for this visit ("" = none). */
export function homeInviteTokens(
  entry: boolean,
  storage: Store | null | undefined,
): { inviteToken: string; connectToken: string } {
  if (!entry || !storage) return { inviteToken: "", connectToken: "" };
  return {
    inviteToken: storage.getItem("inviteToken")?.trim() ?? "",
    connectToken: storage.getItem("connectToken")?.trim() ?? "",
  };
}
