import { Topbar } from "@/components/layout/topbar";
import { ProjectBoard } from "@/components/projects/project-board";

export default function ProjectsPage() {
  return (
    <>
      <Topbar
        title="Projects"
        description="Track goals, timelines, and progress across KrakenLab products."
      />
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <ProjectBoard />
      </div>
    </>
  );
}
