"use client";

import { use } from "react";
import { JournalEntryForm } from "../_form";

export default function EditJournalEntryPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  return <JournalEntryForm entryId={params.id} />;
}
