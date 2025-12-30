// Date display component for showing current date across dashboard pages

import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function DateDisplay() {
    const today = new Date();
    const formattedDate = format(today, 'EEEE, MMMM d, yyyy');

    return (
        <div className="flex items-center gap-2 text-sm font-black uppercase text-zinc-600 tracking-wider">
            <Calendar className="h-4 w-4 text-[#FF5E00]" />
            {formattedDate}
        </div>
    );
}
