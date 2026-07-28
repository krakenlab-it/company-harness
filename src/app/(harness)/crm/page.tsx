import { Topbar } from "@/components/layout/topbar";
import { CrmBoard } from "@/components/crm/crm-board";

export default function CrmPage() {
  return (
    <>
      <Topbar
        title="CRM"
        description="Contacts, deals, and pipeline insights powered by Hermes."
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <CrmBoard />
      </div>
    </>
  );
}
