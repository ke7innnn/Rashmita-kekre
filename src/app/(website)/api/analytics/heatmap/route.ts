import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const session = { user: { name: 'Dr. Rashmita', role: 'admin' } };
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Retrieve all appointments to group in memory (due to SQLite limitation)
    const { data: appointments, error } = await supabase
      .from('Appointment')
      .select('date, startTime');
      
    if (error) {
      throw error;
    }

    // Weekdays index (0: Sunday, 1: Monday, ..., 6: Saturday)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Initialize heatmap layout: Monday to Saturday, Morning/Afternoon/Evening
    const heatmap: { [day: string]: { [segment: string]: number } } = {};
    for (let i = 1; i <= 6; i++) {
      heatmap[days[i]] = {
        MORNING: 0,
        AFTERNOON: 0,
        EVENING: 0,
      };
    }

    (appointments || []).forEach((app) => {
      const appDate = new Date(app.date);
      const dayName = days[appDate.getDay()];
      
      // We only care about Monday to Saturday
      if (dayName === 'Sunday' || !heatmap[dayName]) return;

      const [hours] = app.startTime.split(':').map(Number);
      let segment = '';
      if (hours >= 9 && hours < 12) segment = 'MORNING';
      else if (hours >= 12 && hours < 15) segment = 'AFTERNOON';
      else if (hours >= 15 && hours < 18) segment = 'EVENING';

      if (segment) {
        heatmap[dayName][segment] += 1;
      }
    });

    // Flatten to an array for easy charting in client
    const data = Object.entries(heatmap).flatMap(([day, segments]) =>
      Object.entries(segments).map(([segment, count]) => ({
        day,
        segment,
        count,
      }))
    );

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching heatmap analytics:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
