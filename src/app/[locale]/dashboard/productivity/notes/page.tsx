import { getNotes } from '@/app/actions/productivity';
import NotesBoard from '@/components/productivity/NotesBoard';

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <NotesBoard initialNotes={notes} />
    </div>
  );
}
