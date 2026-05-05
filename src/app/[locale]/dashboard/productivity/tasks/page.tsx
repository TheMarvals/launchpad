import { getTasks, getProjects } from '@/app/actions/productivity';
import TasksBoard from '@/components/productivity/TasksBoard';

export default async function TasksPage() {
  const tasks = await getTasks();
  const projects = await getProjects();

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <TasksBoard initialTasks={tasks} projects={projects} />
    </div>
  );
}
