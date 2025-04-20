// app-generic-multiselect.component.ts
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { HttpService } from '../../../pages/service/http.service';

@Component({
  selector: 'app-generic-multiselect',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MultiSelectModule],
  template: `
    <p-multiSelect
      [id]="id"
      [options]="options"
      [formControl]="control"
      [optionLabel]="optionLabel"
      [placeholder]="placeholder"
      [maxSelectedLabels]="3"
      [showClear]="true"
      styleClass="w-full"
      (onChange)="onSelectionChange($event)"
    ></p-multiSelect>
  `,
})
export class GenericMultiselectComponent implements OnInit, OnChanges {
  @Input() id!: string;
  @Input() type!: any; // API endpoint type
  @Input() params: any = {};
  @Input() placeholder: string = 'Select options';
  @Input() autoFetch: any = true;
  @Input() editMode: boolean = false;
  @Input() selectedValue: any = [];
  @Input() staticOptions: any[] = [];
  @Input() optionLabel: string = 'name';

  @Output() selected = new EventEmitter<any>();

  options: any[] = [];
  control = new FormControl([]);

  constructor(private http: HttpService) {}

  ngOnInit(): void {
    if (this.autoFetch && this.type) {
      this.fetchOptions();
    } else if (this.staticOptions && this.staticOptions.length > 0) {
      this.options = this.staticOptions;
    }

    if (this.selectedValue) {
      this.control.setValue(this.selectedValue);
    }

    this.control.valueChanges.subscribe(value => {
      this.selected.emit(value);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedValue'] && !changes['selectedValue'].firstChange) {
      this.control.setValue(changes['selectedValue'].currentValue);
    }

    if (changes['staticOptions'] && !changes['staticOptions'].firstChange) {
      this.options = changes['staticOptions'].currentValue || [];
    }

    // if ((changes['type'] || changes['params']) && this.autoFetch && this.type) {
    //   this.fetchOptions();
    // }
  }

  async fetchOptions(): Promise<void> {
    try {
      const response: any = await this.http.get(this.type, this.params || {});
      
      if (response && response.data) {
        // Transform the data to match the expected format
        this.options = response.data;
      }
    } catch (error) {
      console.error('Error fetching options for multiselect:', error);
      this.options = [];
    }
  }

  onSelectionChange(event: any): void {
    this.selected.emit(event.value);
  }
}