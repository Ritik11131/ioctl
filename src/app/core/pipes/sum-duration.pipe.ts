// src/app/pipes/sum-duration.pipe.ts

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sumDuration'
})
export class SumDurationPipe implements PipeTransform {
  transform(durations: string[]): string {
  if (!durations || !Array.isArray(durations) || durations.length === 0) return 'N/A';

  let totalHours = 0;
  let totalMins = 0;

  durations.forEach(duration => {
    if (!duration) return;
    const hourMatch = duration.match(/(\d+)\s*hour[s]?/);
    const minMatch = duration.match(/(\d+)\s*min[s]?/);
    totalHours += hourMatch ? parseInt(hourMatch[1], 10) : 0;
    totalMins += minMatch ? parseInt(minMatch[1], 10) : 0;
  });

  totalHours += Math.floor(totalMins / 60);
  totalMins = totalMins % 60;

  if (totalHours > 0 && totalMins > 0) return `${totalHours} hours ${totalMins} mins`;
  if (totalHours > 0) return `${totalHours} hours`;
  if (totalMins > 0) return `${totalMins} mins`;
  return 'N/A';
}

}
