import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { HttpService } from '../../../pages/service/http.service';

@Component({
  selector: 'app-generic-dropdown',
  standalone: true,
  imports: [SelectModule, FormsModule],
  template: `
    <p-select
      class="w-full"
      [id]="id"
      [options]="options"
      [(ngModel)]="selectedItem"
      optionLabel="name"
      [placeholder]="placeholder"
      [virtualScroll]="true"
      [virtualScrollItemSize]="30"
      [filter]="true"
      [showClear]="true"
      [loading]="loading"
      (onShow)="onDropdownOpen()"
      (onChange)="onChange($event.value)"
    >
    </p-select>
  `,
})
export class GenericDropdownComponent implements OnChanges {
  @Input() id: any = null;
  @Input() type!: any;
  @Input() params: Record<string, any> = {};
  @Input() placeholder: string = 'Select';
  @Input() autoFetch: boolean = false; // 👈 special case for dependent dropdown
  @Output() selected = new EventEmitter<any>();

  options: any[] = [];
  selectedItem: any;
  loading = false;
  dataFetched = false;

  constructor(private http: HttpService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['params'] && !changes['params'].firstChange) {
      this.dataFetched = false;
      if (this.autoFetch) {
        this.fetchData();
      }
    }
  }

  onDropdownOpen() {
    if (!this.dataFetched && !this.autoFetch) {
      this.fetchData();
    }
  }

  async fetchData(): Promise<void> {
    this.loading = true;

    const apiMap: Record<string, string> = {
      country: 'geortd/country/list',
      state: `geortd/state/list/${this.params['countryId']}`,
      // Add more types as needed
    };

    const url = apiMap[this.type];

    if (!url) {
      console.error(`Unsupported type: ${this.type}`);
      this.loading = false;
      return;
    }

    try {
      const response: any = await this.http.get(url);
      this.options = response?.data || [];
      this.dataFetched = true;
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    } finally {
      this.loading = false;
    }
  }

  onChange(value: any) {
    this.selected.emit(value);
  }
}