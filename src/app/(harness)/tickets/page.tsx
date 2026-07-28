import { redirect } from "next/navigation";

export default function TicketsRedirect() {
  redirect("/work?tab=tickets");
}
