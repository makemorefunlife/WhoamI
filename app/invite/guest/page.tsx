import { Suspense } from "react";
import GuestInviteClient from "./GuestInviteClient";

export const dynamic = "force-dynamic";

export default function GuestInvitePage() {
  return (
    <Suspense fallback={null}>
      <GuestInviteClient />
    </Suspense>
  );
}
