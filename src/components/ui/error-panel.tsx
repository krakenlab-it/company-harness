import { Panel } from "@/components/ui/panel";

export function ErrorPanel({ message }: { message: string }) {
  return (
    <Panel
      className="border-danger/30 bg-danger/5 text-sm text-danger"
      role="alert"
    >
      {message}
    </Panel>
  );
}
