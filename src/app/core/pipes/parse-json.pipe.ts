import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'parseJson',
    standalone: true
})
export class ParseJsonPipe implements PipeTransform {
    transform(value: any): any[] {
        try {
            if (!value) return [];
            
            // If it's already an array, return it
            if (Array.isArray(value)) {
                return value;
            }
            
            // If it's a string, try to parse it
            if (typeof value === 'string') {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            }
            
            return [];
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return [];
        }
    }
}

