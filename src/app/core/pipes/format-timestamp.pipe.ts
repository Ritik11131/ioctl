import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'formatTimestamp',
    standalone: true
})
export class FormatTimestampPipe implements PipeTransform {
    transform(timestamp: string): string {
        if (!timestamp) return '--';
        try {
            const date = new Date(timestamp);
            return date.toLocaleString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return timestamp;
        }
    }
}

