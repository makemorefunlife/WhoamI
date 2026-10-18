/**
 * Plain site address vs invite / connect entry (2026-10-17).
 * A token left in localStorage by an earlier invite must not send the plain
 * home address (/ or /kr) into the invite flow; real invite links and the
 * flow's own hand-offs still resume it.
 *
 * Run: npx tsx tests/unit/invite-entry.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { INVITE_CONTINUE_HOME, homeInviteTokens, isInviteEntry } from "../../lib/invite/inviteEntry";
import { localizedPath } from "../../lib/i18n/locale";
import { continueHref, sanitizeReturnPath } from "../../lib/auth/returnPath";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const q = (s: string) => new URLSearchParams(s);
const store = (o: Record<string, string>) => ({ getItem: (k: string) => o[k] ?? null });
const stale = store({ inviteToken: "old-invite", connectToken: "old-connect" });
let passed = 0;
const ok = (n: string) => {
  passed++;
  console.log(`ok - ${n}`);
};

// plain address (incl. the ?start / utm style params home already uses)
for (const s of ["", "start=self", "start=choice", "utm_source=kakao", "fbclid=x"]) {
  assert.equal(isInviteEntry(q(s)), false, s);
  assert.deepEqual(homeInviteTokens(isInviteEntry(q(s)), stale), { inviteToken: "", connectToken: "" }, s);
}
assert.equal(isInviteEntry(null), false);
assert.equal(isInviteEntry(q("token=")), false, "empty token is not an entry");
assert.equal(isInviteEntry(q("continue=other")), false);
ok("plain / and /kr (with or without unrelated params) ignore tokens left from an earlier invite");

assert.equal(isInviteEntry(q("token=abc")), true);
assert.equal(isInviteEntry(q("connectToken=abc")), true);
assert.equal(isInviteEntry(q("continue=invite")), true);
assert.deepEqual(homeInviteTokens(true, stale), { inviteToken: "old-invite", connectToken: "old-connect" });
assert.deepEqual(homeInviteTokens(true, null), { inviteToken: "", connectToken: "" });
ok("invite link (?token), connect link (?connectToken) and the flow's own hand-off (?continue=invite) resume it");

assert.equal(INVITE_CONTINUE_HOME, "/?continue=invite");
assert.equal(localizedPath(INVITE_CONTINUE_HOME, "ko-KR"), "/kr?continue=invite");
assert.equal(localizedPath(INVITE_CONTINUE_HOME, "en-US"), "/?continue=invite");
assert.equal(sanitizeReturnPath("/kr?continue=invite"), "/kr?continue=invite", "survives the sign-in return check");
assert.match(continueHref("/kr?continue=invite"), /to=%2Fkr%3Fcontinue%3Dinvite$/);
ok("hand-off path keeps its marker through locale prefixing and the Clerk sign-in return");

const home = readFileSync(resolve(root, "app/homecontent.tsx"), "utf8");
assert.doesNotMatch(home, /localStorage\.getItem\("(inviteToken|connectToken)"\)/, "home never reads stored tokens directly");
assert.match(home, /isInviteEntry\(searchParams\)/);
const birth = readFileSync(resolve(root, "app/invite-birth/page.tsx"), "utf8");
assert.match(birth, /<HomeAuthSignInPanel fallbackRedirectPath=\{INVITE_CONTINUE_HOME\} \/>/, "existing-member sign-in returns into the invite");
assert.equal((birth.match(/localize\(INVITE_CONTINUE_HOME\)/g) ?? []).length, 2, "both hand-offs to home carry the marker");
const invite = readFileSync(resolve(root, "app/invite/InviteContent.tsx"), "utf8");
assert.match(invite, /\/\?token=\$\{encodeURIComponent\(token\)\}/, "invite page still hands off with ?token");
const connect = readFileSync(resolve(root, "app/connect/ConnectContent.tsx"), "utf8");
assert.match(connect, /\/\?connectToken=\$\{encodeURIComponent\(token\)\}/, "connect page still hands off with ?connectToken");
ok("home reads tokens only through the entry rule; every invite/connect hand-off into home carries an entry marker");

console.log(`\ninvite-entry: ${passed} passed`);
