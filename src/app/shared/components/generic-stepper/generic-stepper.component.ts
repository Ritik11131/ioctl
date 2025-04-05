import { Component, Input, OnInit, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StepsModule } from 'primeng/steps';
import { MenuItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { GenericGoogleMapComponent } from '../generic-google-map/generic-google-map.component';
import { environment } from '../../../../environments/environment.prod';
import { GenericLocationSearchComponent } from '../generic-location-search/generic-location-search.component';
import { GenericDropdownComponent } from "../generic-dropdown/generic-dropdown.component";

export interface StepFieldConfig {
    fieldId: string;
    type: 'text' | 'dropdown' | 'map' | 'place' | 'textarea' | 'number' | 'checkbox' | 'radio' | 'date' | 'time';
    label: string;
    apiType?: string; // For API integration
    dependsOn?: any; // For conditional rendering
    autoFetch?: boolean; // For dependent dropdowns
    options?: { label: string; value: any }[]; // For dropdowns
    validators?: any[];
    defaultValue?: any;
    required?: boolean;
    placeholder?: string;
}

export interface StepConfig {
    stepId: string;
    title: string;
    fields: StepFieldConfig[];
}

@Component({
    selector: 'app-generic-stepper',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, StepsModule, InputTextModule, SelectModule, ButtonModule, GenericGoogleMapComponent, GenericLocationSearchComponent, GenericDropdownComponent],
    template: `
        <div class="w-full">
            <!-- Only show steps if there are multiple steps -->
            @if (steps.length > 1) {
                <p-steps [model]="items" [activeIndex]="activeIndex"></p-steps>
            }

            <div class="mt-4">
                <h2 class="text-xl font-semibold mb-4">{{ steps[activeIndex].title }}</h2>
                <form [formGroup]="formGroup" (ngSubmit)="onStepSubmit()">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <ng-container>
                            @for (field of currentStepFields; track field.fieldId) {
                                <div [ngClass]="getFieldColumnClass(field)">
                                    <label [for]="field.fieldId" class="block mb-2 font-medium">
                                        {{ field.label }}
                                        @if (field.required) {
                                            <span class="text-red-500">*</span>
                                        }
                                    </label>
                                    @switch (field.type) {
                                        @case ('map') {
                                            <app-generic-google-map
                                                #mapComponent
                                                [apiKey]="googleMapsApiKey"
                                                [height]="400"
                                                [initialLatitude]="locationState.lat"
                                                [initialLongitude]="locationState.lng"
                                                [initialZoom]="18"
                                                (mapReady)="onMapReady($event)"
                                                (mapClick)="onMapClick($event, field.fieldId)"
                                                (radiusChanged)="onRadiusChanged($event)"
                                                (markerMoved)="onMarkerMoved($event, field.fieldId)"
                                            />
                                        }
                                        @case ('text') {
                                            <input pInputText [id]="field.fieldId" [formControlName]="field.fieldId" [placeholder]="field.placeholder || 'Enter text'" class="w-full p-2" />
                                        }
                                        @case ('dropdown') {
                                            <app-generic-dropdown
                                                [id]="field.fieldId"
                                                [type]="field.apiType"
                                                [params]="dropdownParams[field.fieldId]"
                                                [placeholder]="field.placeholder"
                                                [autoFetch]="field.autoFetch"
                                                [editMode]="editMode"
                                                [selectedValue]="formGroup.get(field.fieldId)?.value"
                                                (selected)="onDropdownSelect($event, field.fieldId)"
                                            />
                                        }
                                        @case ('place') {
                                            <app-generic-location-search
                                                #searchComponent
                                                [apiKey]="googleMapsApiKey"
                                                [placeholder]="'Search'"
                                                (placeSelected)="onPlaceSelected($event, field.fieldId)"
                                                [searchText]="placeDisplayValues[field.fieldId]"
                                            />
                                        }
                                    }
                                </div>
                            }
                        </ng-container>
                    </div>

                    <div class="flex justify-between mt-6">
                        <button pButton type="button" label="Previous" [disabled]="activeIndex === 0" (click)="prevStep()" class="p-button-outlined"></button>

                        <button pButton type="submit" [label]="isLastStep ? 'Submit' : 'Next'" [disabled]="!isStepValid()" class="p-button-primary"></button>
                    </div>
                </form>
            </div>
        </div>
    `
})
export class GenericStepperComponent implements OnInit, OnChanges {
    @ViewChild('mapComponent') mapComponent!: GenericGoogleMapComponent;
    @ViewChild('searchComponent') searchComponent!: GenericLocationSearchComponent;

    @Input() steps: StepConfig[] = [];
    @Input() validateFromApi = false;
    @Input() editMode = false;
    @Input() editData: any = null;
    @Output() stepChange = new EventEmitter<{ stepIndex: number; data: any }>();
    @Output() formSubmit = new EventEmitter<any>();

    [key: string]: any;

    activeIndex = 0;
    items: MenuItem[] = [];
    formGroup!: FormGroup;
    isLastStep = false;
    googleMapsApiKey = environment.googleMapsApiKey;

    // Location state object to manage location related properties
    locationState = {
        lat: 40.73061,
        lng: -73.935242,
        radius: 50
    };

    mapInitialized = false;
    dropdownParams: { [key: string]: any } = {};
    placeDisplayValues: { [key: string]: string } = {};
    fieldColumnClasses: { [key: string]: string } = {};

    constructor(private fb: FormBuilder) {}

    ngOnInit() {
        this.initializeForm();
        this.buildMenuItems();
        this.updateStepState();
        this.initializeFieldClasses();

        if (this.editMode && this.editData) {
            this.populateFormWithEditData();
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        // When editData changes and we're in edit mode
        if (changes['editData'] && this.editMode && this.editData && this.formGroup) {
            this.populateFormWithEditData();
        }
    }

    private initializeForm() {
        const formGroupConfig: any = {};

        // Create form controls for all fields across all steps
        this.steps.forEach((step) => {
            step.fields.forEach((field) => {
                const validators = [];

                if (field.required) {
                    validators.push(Validators.required);
                }

                if (field.validators) {
                    validators.push(...field.validators);
                }

                formGroupConfig[field.fieldId] = [field.defaultValue || '', validators];
            });
        });

        this.formGroup = this.fb.group(formGroupConfig);

        // Initialize dropdown params
        this.steps.forEach((step) => {
            step.fields.forEach((field) => {
                if (field.type === 'dropdown') {
                    this.dropdownParams[field.fieldId] = {};
                }

                if (field.type === 'place') {
                    this.placeDisplayValues[field.fieldId] = '';
                }
            });
        });
    }

    private initializeFieldClasses() {
        // Pre-compute CSS classes for fields
        this.steps.forEach((step) => {
            step.fields.forEach((field) => {
                this.fieldColumnClasses[field.fieldId] = field.type === 'map' ? 'col-span-2' : 'col-span-1';
            });
        });
    }

    getFieldColumnClass(field: StepFieldConfig): string {
        return this.fieldColumnClasses[field.fieldId] || 'col-span-1';
    }

    private populateFormWithEditData() {
        if (!this.editData) return;

        // Loop through all form fields and set values from editData
        Object.keys(this.formGroup.controls).forEach((controlName) => {
            if (this.editData[controlName] !== undefined) {
                this.formGroup.get(controlName)?.setValue(this.editData[controlName]);

                // Set place display values for place fields
                if (this.placeDisplayValues.hasOwnProperty(controlName)) {
                    console.log(controlName, this.editData);

                    this.updatePlaceDisplayValue(controlName, this.editData[controlName]);
                }
            }
        });

        // Handle dependent dropdowns
        this.setupDependentDropdowns();

        // Handle location data for map
        this.setupLocationData();
    }

    private setupDependentDropdowns() {
        this.steps.forEach((step) => {
            step.fields.forEach((field) => {
                if (field.type === 'dropdown' && field.dependsOn) {
                    const parentField = field.dependsOn;
                    if (this.editData[parentField]) {
                        const paramKey = `${parentField}Id`;
                        const parentValue = this.editData[parentField]?.id || this.editData[parentField];
                        this.dropdownParams[field.fieldId] = parentValue ? { [paramKey]: parentValue } : {};
                    }
                }
            });
        });
    }

    private setupLocationData() {
        const locationData = this.findLocationData();
        if (locationData) {
            this.locationState = {
                ...this.locationState,
                lat: locationData.lat,
                lng: locationData.lng
            };

            // Update map if it's already initialized
            if (this.mapComponent && this.mapInitialized) {
                setTimeout(() => {
                    this.mapComponent.updateMarkerPosition({
                        lat: locationData.lat,
                        lng: locationData.lng
                    });
                });
            }
        }
    }

    private updatePlaceDisplayValue(fieldId: string, value: any) {
        console.log(fieldId, value);

        if (!value) return;

        if (value.address) {
            this.placeDisplayValues[fieldId] = value.address;
        } else if (value.name) {
            this.placeDisplayValues[fieldId] = value.name;
        }
    }

    private findLocationData(): any {
        // Look for any field in editData that might contain location information
        if (!this.editData) return null;

        // First check for specific location fields
        const locationFields = ['locationPlace1', 'locationMap'];
        for (const field of locationFields) {
            if (this.editData[field] && this.editData[field].lat && this.editData[field].lng) {
                return this.editData[field];
            }
        }

        // If no specific field found, look for any object with lat/lng properties
        for (const key in this.editData) {
            const value = this.editData[key];
            if (value && typeof value === 'object' && value.lat && value.lng) {
                return value;
            }
        }

        return null;
    }

    private buildMenuItems() {
        this.items = this.steps.map((step) => ({
            label: step.title
        }));
    }

    get currentStepFields(): StepFieldConfig[] {
        return this.steps[this.activeIndex].fields;
    }

    isStepValid(): boolean {
        if (this.validateFromApi) {
            // In real implementation, this would call an API or service
            return true;
        }

        // Check if all fields in the current step are valid
        let isValid = true;

        this.currentStepFields.forEach((field) => {
            const control = this.formGroup.get(field.fieldId);
            if (control && control.invalid) {
                isValid = false;
                control.markAsTouched();
            }
        });

        return isValid;
    }

    nextStep() {
        if (this.activeIndex < this.steps.length - 1) {
            this.activeIndex++;
            this.updateStepState();

            // Emit current step data
            this.emitStepChange();
        }
    }

    prevStep() {
        if (this.activeIndex > 0) {
            this.activeIndex--;
            this.updateStepState();

            // Emit current step data
            this.emitStepChange();
        }
    }

    updateStepState() {
        this.isLastStep = this.activeIndex === this.steps.length - 1;
    }

    onStepSubmit() {
        if (this.isStepValid()) {
            if (this.isLastStep) {
                // Form is complete, emit the final form data
                this.formSubmit.emit(this.formGroup.value);
            } else {
                this.nextStep();
            }
        }
    }

    emitStepChange() {
        const stepData: any = {};

        // Extract only the data relevant to the current step
        this.currentStepFields.forEach((field) => {
            stepData[field.fieldId] = this.formGroup.get(field.fieldId)?.value;
        });

        this.stepChange.emit({
            stepIndex: this.activeIndex,
            data: stepData
        });
    }

    onMapReady(map: google.maps.Map) {
        this.mapInitialized = true;

        // If we have location data, update the marker
        if (this.locationState.lat && this.locationState.lng) {
            setTimeout(() => {
                this.mapComponent.updateMarkerPosition({
                    lat: this.locationState.lat,
                    lng: this.locationState.lng
                });
            });
        }

        // Connect the search component to the map
        if (this.searchComponent) {
            this.searchComponent.setupSearchFunctionality(map);
        } else {
            // If search component isn't ready yet, try again in a tick
            setTimeout(() => {
                if (this.searchComponent) {
                    this.searchComponent.setupSearchFunctionality(map);
                }
            });
        }
    }

    onPlaceSelected(place: any, fieldId: string) {
        // Update form value with place object
        this.formGroup.get(fieldId)?.setValue(place || {});

        // Update place display value
        this.updatePlaceDisplayValue(fieldId, place);

        // Update location state and map marker
        if (place && place.lat && place.lng) {
            this.locationState = {
                ...this.locationState,
                lat: place.lat,
                lng: place.lng
            };

            // Update the map marker
            if (this.mapComponent) {
                this.mapComponent.updateMarkerPosition({
                    lat: place.lat,
                    lng: place.lng
                });
            }
        }
    }

    onMapClick(coords: google.maps.LatLngLiteral, fieldId: string) {
        // Create location object
        const location = {
            lat: coords.lat,
            lng: coords.lng,
            name: 'Custom location',
            address: ''
        };

        // Update form value
        this.formGroup.get(fieldId)?.setValue(location);

        // Update location state
        this.locationState = {
            ...this.locationState,
            lat: coords.lat,
            lng: coords.lng
        };
    }

    onMarkerMoved(coords: google.maps.LatLngLiteral, fieldId: string) {
        // Get current value or create new object
        const currentValue = this.formGroup.get(fieldId)?.value || {};

        // Update with new coordinates
        const updatedLocation = {
            ...currentValue,
            lat: coords.lat,
            lng: coords.lng,
            name: currentValue.name || 'Custom location',
            address: currentValue.address || ''
        };

        // Update form value
        this.formGroup.get(fieldId)?.setValue(updatedLocation);

        // Update location state
        this.locationState = {
            ...this.locationState,
            lat: coords.lat,
            lng: coords.lng
        };
    }

    onRadiusChanged(radius: number) {
        this.locationState.radius = radius;
    }

    onDropdownSelect(selectedValue: any, fieldId: string) {
        // Set form value
        this.formGroup.get(fieldId)?.setValue(selectedValue || {});

        // Handle dependent dropdowns
        this.clearDependentFields(fieldId, selectedValue);
    }

    clearDependentFields(fieldId: string, selectedValue: any) {
        const paramValue = selectedValue?.id ?? null;

        this.steps.forEach((step) => {
            step.fields.forEach((f) => {
                if (f.dependsOn === fieldId) {
                    // Reset the dependent form control
                    this.formGroup.get(f.fieldId)?.reset();

                    // Set API params for the dependent dropdown
                    const paramKey = `${fieldId}Id`;
                    this.dropdownParams[f.fieldId] = paramValue ? { [paramKey]: paramValue } : {};

                    // Clear any nested dependents
                    this.clearDependentFields(f.fieldId, null);
                }
            });
        });
    }
}