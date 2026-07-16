import type { Locale } from "@/lib/i18n/locale";
import { messagesEnUS, type MessageCatalog } from "./en-US";
import { messagesKoKR } from "./ko-KR";

export type { MessageCatalog };

/** Load UI messages for one locale only (no eager dual-bundle at call sites that tree-shake). */
export function getMessages(locale: Locale): MessageCatalog {
  return locale === "ko-KR" ? messagesKoKR : messagesEnUS;
}
