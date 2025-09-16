import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment.prod';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-generic-dropdown',
  standalone: true,
  imports: [CommonModule, SelectModule, ReactiveFormsModule],
  template: `
      <p-select
        [id]="id"
        [options]="options"
        [placeholder]="placeholder"
        [formControl]="control"
        optionLabel="name"
        [showClear]="true"
        [virtualScroll]="true"
        [virtualScrollItemSize]="30"
        [filter]="true"
        filterBy="name"
        (onChange)="onSelectionChange($event)"
        class="w-full"
        appendTo="body"
        [loading]="loading"
      >
      </p-select>
  `
})
export class GenericDropdownComponent implements OnInit, OnChanges, OnDestroy {
  @Input() id!: string;
  @Input() type!: any;
  @Input() params: any = {};
  @Input() placeholder: string = 'Select';
  @Input() autoFetch: any = false;
  @Input() editMode: boolean = false;
  @Input() selectedValue: any = null;
  @Input() disabled: boolean = false;
  @Input() staticOptions: any[] = [];

  @Output() selected = new EventEmitter<any>();

  control = new FormControl();
  options: any[] = [];
  loading: boolean = false;
  error: string = '';
  
  private apiEndpoint = environment.apiUrl;
  private subscriptions: Subscription = new Subscription();
  private initialized: boolean = false;
  private fetchInProgress: boolean = false;
  private lastParamsHash: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Initial setup of the dropdown
    this.setupControl();
    
    // Monitor control value changes to emit selected events
    this.subscriptions.add(
      this.control.valueChanges.subscribe(value => {
        console.log(value,'controlvalueeeeeeeee');
        
        
        // Only emit if fully initialized to avoid initial value emissions
        if (this.initialized && !this.autoFetch) {
          console.log(value,'subscribevalkue');
          this.selected.emit(value);
        }
      })
    );

    // If autoFetch is true, load data immediately if not dependent on other fields
    // or if we already have the required params (for edit mode)
    if (this.autoFetch && (!this.isDependentDropdown() || this.hasRequiredParams())) {
      this.fetchOptions();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // If params change and we have an API type, refetch options
    if (changes['params'] && this.type) {
      const newParamsHash = JSON.stringify(this.params || {});
      
      // Only fetch if params actually changed
      if (newParamsHash !== this.lastParamsHash) {
        this.lastParamsHash = newParamsHash;
        
        if (this.hasRequiredParams()) {
          this.fetchOptions();
        } else if (this.isDependentDropdown()) {
          // Clear options when parent value is cleared
          this.options = [];
          this.control.setValue(null);
        }
      }
    }
    
    // If selectedValue changes in edit mode
    if (changes['selectedValue']) {
      this.handleSelectedValueChange();
    }

    // If static options are provided
    if (changes['staticOptions'] && this.staticOptions?.length > 0) {
      this.options = [...this.staticOptions];
      this.initialized = true;
      
      // Set the control value if selectedValue is provided
      if (this.selectedValue) {
        this.setControlValue();
      }
    }
  }

  private setupControl(): void {
    // If we're in edit mode and have a selected value, set it
    if (this.editMode && this.selectedValue) {
      this.setControlValue();
    }
  }

  private handleSelectedValueChange(): void {
    console.log(this.selectedValue, 'selectedValue in handleSelectedValueChange');
    
    if (this.selectedValue) {
      this.setControlValue();
      
      // If we don't have options yet but have selectedValue
      // we need to fetch options to ensure correct display
      if (this.options.length === 0 && this.type) {
        this.fetchOptions();
      }
    } else {
      this.control.setValue(null);
    }
  }

  compareFn = (option: any, value: any): boolean => {
    return option && value && option.id === value.id;
  };

  private setControlValue(): void {
    if (!this.selectedValue || !this.options?.length) return;
    
    let matched;
    
    // Check if selectedValue is a string or an object with id
    if (typeof this.selectedValue === 'string') {
      // For static options where selectedValue is just a string ID
      matched = this.options.find(opt => opt.id === this.selectedValue);
    } else {
      // For API options where selectedValue is an object with id property
      matched = this.options.find(opt => opt.id === this.selectedValue.id);
    }
    
    console.log(matched, this.selectedValue);
    
    this.control.setValue(matched || this.selectedValue); // fallback if not found
  }

  private isDependentDropdown(): boolean {
    // Check if this dropdown depends on params from other fields
    return !!Object.keys(this.params || {}).length;
  }

  private hasRequiredParams(): boolean {
    // Check if we have all required params for dependent dropdowns
    if (!this.params) return false;
    
    // For dependent dropdowns, check if parent values are set
    for (const key in this.params) {
      if (this.params[key] === null || this.params[key] === undefined || this.params[key] === '') {
        return false;
      }
    }
    
    return true;
  }

  fetchOptions(): void {
    // Skip if we don't have a type or are using static options
    if (!this.type || this.staticOptions.length > 0) return;
    
    // Prevent multiple simultaneous fetches
    if (this.fetchInProgress) return;
    
    this.loading = true;
    this.error = '';
    this.fetchInProgress = true;
    
    this.subscriptions.add(
      this.getOptionsFromApi().pipe(
        finalize(() => {
          this.loading = false;
          this.initialized = true;
          this.fetchInProgress = false;
        })
      ).subscribe({
        next: (data) => {
          this.options = data;

          // If not in edit mode and no selectedValue, default to first option
          if (!this.editMode && !this.selectedValue && this.options.length > 0) {
            this.control.setValue(this.options[0]);
            this.selected.emit(this.options[0]);
          }

          
          // If we have a selectedValue and it's not in the control yet, set it now
          if (this.editMode && this.selectedValue && (this.control.value === null || this.control.value === undefined)) {
            this.setControlValue();
          }
        },
        error: (err) => {
          console.error(`Error fetching options for ${this.type}:`, err);
          this.error = 'Failed to load options';
          this.options = [];
        }
      })
    );
  }

  private getOptionsFromApi(): Observable<{ label: string, value: any }[]> {
    // Build API URL based on type with proper endpoint
    let endpoint = 'geortd/'+this.type;
    
    // Make sure endpoints end with '/list'
    if (!endpoint.endsWith('/list')) {
      endpoint = `${endpoint}/list`;
    }
    
    let url = `${this.apiEndpoint}/${endpoint}`;
    
    // Add query params if any
    if (this.params && Object.keys(this.params).length > 0) {
      console.log(this.type, 'type');
      
      console.log(this.params, 'params');
      for (const key in this.params) {
        if (this.params[key] !== null && this.params[key] !== undefined) {
          // Add 'Id' suffix for the API if not already present
          url += `/${this.params[key]}`;
        }
      }
    }

    console.log(`Fetching ${this.type} options from: ${url}`);

    return this.http.get<any[]>(url).pipe(
      map((response: any) => response?.data || []),
      catchError(error => {
        console.error(`API error fetching ${this.type}:`, error);
        return of([]);
      })
    );
    
  }

  onSelectionChange(event: any): void {
    // Find the full option object
    const selectedOption = this.options.find(opt => opt.id === event.value.id);
    
    // Emit the selected object or value
    this.selected.emit(selectedOption);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.unsubscribe();
  }
}