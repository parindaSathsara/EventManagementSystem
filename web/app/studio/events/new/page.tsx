import { StudioGuard } from '@/components/studio-guard';
import { EventEditor } from '@/components/event-editor';

export default function NewEventPage() { return <StudioGuard><div className="editor-shell"><EventEditor /></div></StudioGuard>; }
