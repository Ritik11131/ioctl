import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../../../pages/service/http.service';

@Component({
    selector: 'app-generic-dropdown',
    imports: [SelectModule, FormsModule],
    template: ` <p-select class="w-full" [id]="id" [options]="options" [(ngModel)]="selectedItem" optionLabel="name" [placeholder]="placeholder" (onChange)="onChange($event.value)" [virtualScroll]="true" [virtualScrollItemSize]="30" [filter]="true" [showClear]="true"> </p-select> `
})
export class GenericDropdownComponent implements OnInit, OnChanges {
    @Input() id: any = null;
    @Input() params: Record<string,any> = {};
    @Input() type!: any; // add more types as needed
    @Input() placeholder: string = 'Select';
    @Output() selected = new EventEmitter<any>();

    options: any[] = [];
    selectedItem: any;

    constructor(private http: HttpService) {}

    ngOnInit(): void {
        this.fetchData();
    }

    ngOnChanges(changes: SimpleChanges): void {
      if (changes['params'] && !changes['params'].firstChange) {
        console.log('yes',this.params);
        
        this.fetchData();
      }
    }

    async fetchData(): Promise<void> {
        const apiMap: Record<string, string> = {
            country: 'geortd/country/list',
            state: `geortd/state/list/${this.params['countryId']}`,
        };

        const url = apiMap[this.type];

        if (url) {
          const response: any = await this.http.get(url);
          this.options = response?.data || [];
        } else {
            console.error(`Unsupported type: ${this.type}`);
        }
    }

    onChange(value: any) {
        this.selected.emit(value);
    }
}
