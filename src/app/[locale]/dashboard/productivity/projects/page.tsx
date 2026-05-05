import { getProjects } from '@/app/actions/productivity';
import ProjectsBoard from '@/components/productivity/ProjectsBoard';

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <ProjectsBoard initialProjects={projects} />
    </div>
  );
}
