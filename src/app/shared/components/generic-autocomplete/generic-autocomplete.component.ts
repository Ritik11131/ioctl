// generic-autocomplete.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { HttpClient } from '@angular/common/http';
import { HttpService } from '../../../pages/service/http.service';

@Component({
  selector: 'app-generic-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule, AutoCompleteModule],
  template: `
    <p-autoComplete 
    inputStyleClass="w-full"
      appendTo="body"
      [(ngModel)]="selectedItem"
      [suggestions]="suggestions"
      [field]="displayField"
      [showEmptyMessage]="true"
      [emptyMessage]="emptyMessage"
      [delay]="delay"
      [minLength]="minLength"
      [placeholder]="placeholder"
      [style]="style"
      [inputStyle]="inputStyle"
      [panelStyle]="panelStyle"
      (completeMethod)="search($event)"
      (onSelect)="onItemSelect($event)"
      (onClear)="onClear()"
      [dropdown]="dropdown"
      [showClear]="showClear">
    </p-autoComplete>
  `
})
export class GenericAutocompleteComponent implements OnInit {
  // Input properties
  @Input() apiEndpoint: string = ''; // The API endpoint to fetch data from
  @Input() displayField: string = 'name'; // Field to display in the dropdown
  @Input() minLength: number = 1; // Minimum length before triggering search
  @Input() delay: number = 300; // Delay before triggering search
  @Input() placeholder: string = 'Search...';
  @Input() style: any = { width: '100%' };
  @Input() inputStyle: any = {};
  @Input() panelStyle: any = {};
  @Input() emptyMessage: string = 'No results found';
  @Input() dropdown: boolean = false;
  @Input() showClear: boolean = true;
  @Input() queryParam: string = 'query'; // Name of the query parameter to send to API

  // Output events
  @Output() itemSelected = new EventEmitter<any>();
  @Output() cleared = new EventEmitter<void>();

  // Component properties
  selectedItem: any;
  suggestions: any[] = [];
  loading: boolean = false;
  private searchTimeout: any = null;
  
  constructor(private http: HttpService) {}

  ngOnInit() {}

  async search(event: { query: string }) {
    const query = event.query;
    
    // Clear any pending timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // If query is too short, don't search
    if (query.length < this.minLength) {
      this.suggestions = [];
      return;
    }
    
    // Set loading state
    this.loading = true;
    
    // Implement debounce using setTimeout
    this.searchTimeout = setTimeout(async () => {
      try {
        // Construct the URL with query parameter
        const url = `${this.apiEndpoint}/${encodeURIComponent(query)}`;
        
        // Fetch data using async/await
        const results:any = await this.fetchData(url);
        this.suggestions = results?.data;
      } catch (error) {
        console.error('Error fetching autocomplete data:', error);
        this.suggestions = [];
      } finally {
        this.loading = false;
      }
    }, this.delay);
  }
  
  private async fetchData(url: string): Promise<any[]> {
    try {
      const response =  await this.http.get<any[]>(url);
      return response;
    } catch (error) {
      console.error('HTTP request failed:', error);
      throw error;
    }
  }

  onItemSelect(item: any) {
    this.itemSelected.emit(item);
  }

  onClear() {
    this.cleared.emit();
  }
}