import { getNotes } from '@/app/actions/productivity';
import NotesBoard from '@/components/productivity/NotesBoard';
import { auth } from '@/lib/auth';

export default async function NotesPage() {
  const notes = await getNotes();
  const session = await auth();

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
      <NotesBoard initialNotes={notes} currentUserId={session?.user?.id || ''} />
    </div>
  );
}
