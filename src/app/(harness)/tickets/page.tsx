import { Topbar } from "@/components/layout/topbar";
import { TicketBoard } from "@/components/tickets/ticket-board";

export default function TicketsPage() {
  return (
    <>
      <Topbar
        title="Tickets"
        description="Kanban board for tracking work across projects and sprints."
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <TicketBoard />
      </div>
    </>
  );
}
