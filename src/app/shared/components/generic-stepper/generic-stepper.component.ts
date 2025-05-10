import { Component, Input, OnInit, Output, EventEmitter, ViewChild, OnChanges, SimpleChanges, ContentChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StepsModule } from 'primeng/steps';
import { MenuItem } from 'primeng/api';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { GenericGoogleMapComponent } from '../generic-google-map/generic-google-map.component';
import { environment } from '../../../../environments/environment.prod';
import { GenericLocationSearchComponent } from '../generic-location-search/generic-location-search.component';
import { GenericDropdownComponent } from '../generic-dropdown/generic-dropdown.component';
import { GenericGmAddressComponent } from '../generic-gm-address/generic-gm-address.component';
import { GenericAutocompleteComponent } from '../generic-autocomplete/generic-autocomplete.component';
import { GenericMultiselectComponent } from '../generic-multiselect/generic-multiselect.component';
import { HttpService } from '../../../pages/service/http.service';
import { UiService } from '../../../layout/service/ui.service';

export interface StepFieldConfig {
    fieldId: string;
    type: 'text' | 'dropdown' | 'map' | 'place' | 'textarea' | 'number' | 'autocomplete' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'time' | 'fileupload';
    label: string;
    apiType?: string; // For API integration
    dependsOn?: any; // For conditional rendering\
    mode?: any;
    autoFetch?: boolean; // For dependent dropdowns
    options?: { name: string; id: any }[]; // For dropdowns
    validators?: any[];
    defaultValue?: any;
    required?: boolean;
    placeholder?: string;
    selectionMode?: any;
    dateFormat?: any; // For date fields
    hasLinkedCheckbox?: boolean;      // Whether this field has a checkbox beside its label
    checkboxLabel?: any;           // Label for the checkbox (defaults to field label if not provided)
    linkedFieldId?: any;           // The ID of another field that this checkbox links to
    sourceFieldId?: any;
    fileUploadConfig?: {
        url?: string;               // URL to upload to (if server-side upload)
        accept?: string;            // Accepted file types (e.g., 'image/*')
        maxFileSize?: number;       // Max file size in bytes
        multiple?: boolean;         // Allow multiple file selection
        auto?: boolean;             // Auto upload on file selection
        customUpload?: boolean;     // Use custom upload handler vs server upload
        fileLimit?: number;         // Max number of files
    };    
}

export interface StepConfig {
    stepId: string;
    title: string;
    fields: StepFieldConfig[];
    customTemplate?: boolean; // Flag to indicate if this step uses a custom template
}

@Component({
    selector: 'app-generic-stepper',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        StepsModule,
        InputTextModule,
        TextareaModule,
        SelectModule,
        CheckboxModule,
        ButtonModule,
        FileUploadModule,
        DatePickerModule,
        InputNumberModule,
        GenericLocationSearchComponent,
        GenericDropdownComponent,
        GenericAutocompleteComponent,
        GenericGmAddressComponent,
        GenericMultiselectComponent
    ],
    template: `
        <div class="w-full">
            <!-- Only show steps if there are multiple steps -->
            @if (steps.length > 1) {
                <p-steps [model]="items" [activeIndex]="activeIndex"></p-steps>
            }

            <div class="mt-4">
                <h2 class="text-xl font-semibold mb-4">{{ steps[activeIndex].title }}</h2>

                <!-- Custom template step -->
                @if (steps[activeIndex].customTemplate) {
                    <!-- Render custom template using content projection -->
                    <ng-container *ngTemplateOutlet="customStepTemplate; context: { $implicit: activeIndex, data: getStepData() }"></ng-container>

                    <!-- Navigation buttons for custom template step -->
                    <div class="flex justify-between mt-6">
                        <button pButton type="button" label="Previous" [disabled]="activeIndex === 0" (click)="prevStep()" class="p-button-outlined"></button>
                        <button pButton type="button" label="{{ isLastStep ? 'Submit' : 'Next' }}" (click)="onCustomStepContinue()" class="p-button-primary"></button>
                    </div>
                } @else {
                    <!-- Default form-based step -->
                    <form [formGroup]="formGroup" (ngSubmit)="onStepSubmit()">
                        <div [class]="formClass">
                            <ng-container>
                                @for (field of currentStepFields; track field.fieldId) {
                                    <div [ngClass]="getFieldColumnClass(field)">
                                        <div class="flex items-center justify-between mb-2">
                                            <!-- Field Label -->
                                            <label [for]="field.fieldId" class="font-medium">
                                                {{ field.label }}
                                                <span *ngIf="field.required" class="text-red-500">*</span>
                                            </label>

                                            <!-- Linked Checkbox using PrimeNG 19 (if applicable) -->
                                            @if (field.hasLinkedCheckbox) {
                                                <div class="flex items-center">
                                                    <p-checkbox
                                                        [inputId]="field.fieldId + '_checkbox'"
                                                        [formControlName]="field.fieldId + '_checkbox'"
                                                        [binary]="true"
                                                        (onChange)="onCheckboxChange($event, field.sourceFieldId, field.linkedFieldId || field.fieldId)"
                                                    ></p-checkbox>
                                                    <label [for]="field.fieldId + '_checkbox'" class="ml-2 text-sm text-gray-700">
                                                        {{ field.checkboxLabel || 'Same as ' + field.sourceFieldId }}
                                                    </label>
                                                </div>
                                            }
                                        </div>
                                        @switch (field.type) {
                                            @case ('map') {
                                                @if (field.mode === 'address') {
                                                    <app-generic-gm-address
                                                        #mapComponent
                                                        [apiKey]="googleMapsApiKey"
                                                        [geofenceRadius]="locationState.radius || 100"
                                                        [initialLatitude]="locationState.lat"
                                                        [initialLongitude]="locationState.lng"
                                                        [existingAddress]="locationState"
                                                        (mapReady)="onMapReady($event, field.fieldId)"
                                                        (addressSelected)="onAddressSelected($event, field.fieldId)"
                                                    >
                                                    </app-generic-gm-address>
                                                }
                                            }
                                            @case ('text') {
                                                <input pInputText [id]="field.fieldId" [formControlName]="field.fieldId" [placeholder]="field.placeholder || 'Enter text'" class="w-full p-2" />
                                            }
                                            @case ('number') {
                                                <p-inputnumber
                                                    [id]="field.fieldId"
                                                    [formControlName]="field.fieldId"
                                                    inputId="minmaxfraction"
                                                    mode="decimal"
                                                    [minFractionDigits]="2"
                                                    [maxFractionDigits]="10"
                                                    [placeholder]="field.placeholder || 'Enter text'"
                                                    class="w-full p-2"
                                                />
                                            }
                                            @case ('dropdown') {
                                                <app-generic-dropdown
                                                    [id]="field.fieldId"
                                                    [type]="field.apiType"
                                                    [params]="dropdownParams[field.fieldId]"
                                                    [placeholder]="field.placeholder || 'Select'"
                                                    [autoFetch]="field.autoFetch"
                                                    [editMode]="editMode"
                                                    [selectedValue]="formGroup.get(field.fieldId)?.value"
                                                    [staticOptions]="field.options || []"
                                                    (selected)="onDropdownSelect($event, field.fieldId)"
                                                />
                                            }
                                            @case ('multiselect') {
                                                <app-generic-multiselect
                                                    [id]="field.fieldId"
                                                    [type]="field.apiType"
                                                    [params]="dropdownParams[field.fieldId]"
                                                    [placeholder]="field.placeholder || 'Select multiple'"
                                                    [autoFetch]="field.autoFetch"
                                                    [editMode]="editMode"
                                                    [selectedValue]="formGroup.get(field.fieldId)?.value"
                                                    [staticOptions]="field.options || []"
                                                    (selected)="onMultiselectSelect($event, field.fieldId)"
                                                />
                                            }
                                            @case ('place') {
                                                <app-generic-location-search
                                                    #searchComponent
                                                    [apiKey]="googleMapsApiKey"
                                                    [placeholder]="field.placeholder || 'Search location'"
                                                    (placeSelected)="onPlaceSelected($event, field.fieldId)"
                                                    [searchText]="placeDisplayValues[field.fieldId]"
                                                />
                                            }

                                            @case ('textarea') {
                                                <textarea pTextarea [id]="field.fieldId" [formControlName]="field.fieldId" [placeholder]="field.placeholder || 'Enter text'" rows="5" cols="30" class="w-full p-2"></textarea>
                                            }

                                            @case ('autocomplete') {
                                                <app-generic-autocomplete [id]="field.fieldId" [apiEndpoint]="field.apiType" displayField="name" [placeholder]="field.placeholder" (itemSelected)="onAutoCompleteSelected($event, field.fieldId)">
                                                </app-generic-autocomplete>
                                            }

                                            @case ('date') {
                                                <p-datepicker
                                                    [id]="field.fieldId"
                                                    [formControlName]="field.fieldId"
                                                    [iconDisplay]="'input'"
                                                    [showIcon]="true"
                                                    inputId="icondisplay"
                                                    [selectionMode]="field?.selectionMode"
                                                    [dateFormat]="field?.dateFormat"
                                                    styleClass="w-full"
                                                />
                                            }
                                            
                                            @case ('fileupload') {
                                                <p-fileUpload
                                                    [id]="field.fieldId"
                                                    [name]="field.fieldId"
                                                    [url]="field.fileUploadConfig?.url || ''"
                                                    [accept]="field.fileUploadConfig?.accept || '*'"
                                                    [maxFileSize]="field.fileUploadConfig?.maxFileSize || 10000000"
                                                    [multiple]="field.fileUploadConfig?.multiple || false"
                                                    [auto]="field.fileUploadConfig?.auto || false"
                                                    [fileLimit]="field.fileUploadConfig?.fileLimit"
                                                    [customUpload]="field.fileUploadConfig?.customUpload || false"
                                                    (uploadHandler)="onFileUpload($event, field.fieldId)"
                                                    (onSelect)="onFileSelect($event, field.fieldId)"
                                                    (onRemove)="onFileRemove($event, field.fieldId)"
                                                    (onClear)="onFileClear(field.fieldId)"
                                                    [showCancelButton]="true"
                                                    chooseLabel="Browse"
                                                    cancelLabel="Cancel"
                                                    uploadLabel="Upload"
                                                    styleClass="w-full"
                                                >
                        
                                                </p-fileUpload>
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
                }
            </div>
        </div>
    `
})
export class GenericStepperComponent implements OnInit, OnChanges {
    @ViewChild('mapComponent') mapComponent!: GenericGoogleMapComponent;
    @ViewChild('searchComponent') searchComponent!: GenericLocationSearchComponent;
    @ContentChild('customStep') customStepTemplate!: TemplateRef<any>;

    @Input() steps: StepConfig[] = [];
    @Input() validateFromApi = false;
    @Input() formClass: string = 'grid grid-cols-1 md:grid-cols-2 gap-4';
    @Input() editMode = false;
    @Input() editData: any = null;
    @Input() customStepData: any = {}; // Data for custom template steps

    @Output() stepChange = new EventEmitter<{ stepIndex: number; data: any }>();
    @Output() autoCompleteValue = new EventEmitter<any>();
    @Output() formSubmit = new EventEmitter<any>();
    @Output() customStepContinue = new EventEmitter<{ stepIndex: number; data: any }>();
    @Output() fileUploadEvent = new EventEmitter<{ fieldId: string; files: File[], action: 'select' | 'upload' | 'remove' | 'clear' }>();

    [key: string]: any;

    activeIndex = 0;
    items: MenuItem[] = [];
    formGroup!: FormGroup;
    isLastStep = false;
    googleMapsApiKey = environment.googleMapsApiKey;
    linkedCheckboxes: { [key: string]: boolean } = {};

    // Location state object to manage location related properties
    locationState = {
        lat: environment.intialLat,
        lng: environment.initialLng,
        radius: 50
    };

    currentCommonLocation = {
        lat: environment.intialLat,
        lng: environment.initialLng,
        radius: 50
    };
    private mapInstances: Map<string, any> = new Map();

    mapInitialized = false;
    dropdownParams: { [key: string]: any } = {};
    placeDisplayValues: { [key: string]: string } = {};
    fieldColumnClasses: { [key: string]: string } = {};
    
    // File upload storage
    uploadedFiles: { [key: string]: File[] } = {};

    constructor(private fb: FormBuilder, private http:HttpService, private uiService:UiService) {}

    ngOnInit() {
        this.initializeForm();
        this.buildMenuItems();
        this.updateStepState();
        this.initializeFieldClasses();

        if (this.editMode && this.editData) {
            this.populateFormWithEditData();
        }

        // Setup linked field subscriptions after form initialization
        this.setupLinkedFieldSubscriptions();
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
            if (!step.customTemplate) {
                step.fields.forEach((field) => {
                    const validators = [];

                    if (field.required) {
                        validators.push(Validators.required);
                    }

                    if (field.validators) {
                        validators.push(...field.validators);
                    }

                    formGroupConfig[field.fieldId] = [field.defaultValue || '', validators];

                    // Add checkbox controls for fields with linkedCheckbox functionality
                    if (field.hasLinkedCheckbox) {
                        formGroupConfig[`${field.fieldId}_checkbox`] = [false];
                        // Initialize linkedCheckboxes tracking object
                        this.linkedCheckboxes[field.linkedFieldId || field.fieldId] = false;
                    }
                    
                    // Initialize fileUpload storage if it's a file upload field
                    if (field.type === 'fileupload') {
                        this.uploadedFiles[field.fieldId] = [];
                    }
                });
            }
        });

        this.formGroup = this.fb.group(formGroupConfig);

        // Initialize dropdown params
        this.steps.forEach((step) => {
            if (!step.customTemplate) {
                step.fields.forEach((field) => {
                    if (field.type === 'dropdown') {
                        this.dropdownParams[field.fieldId] = {};
                    }

                    if (field.type === 'place') {
                        this.placeDisplayValues[field.fieldId] = '';
                    }
                });
            }
        });
    }

    /**
     * Sets up subscriptions to watch source field values and update target fields
     * when linked checkboxes are checked
     */
    private setupLinkedFieldSubscriptions() {
        // Find all fields with linkedCheckbox configuration
        this.steps.forEach((step) => {
            if (!step.customTemplate) {
                step.fields.forEach((field: any) => {
                    if (field.hasLinkedCheckbox && field.sourceFieldId && field.linkedFieldId) {
                        // Get the checkbox control
                        const checkboxControl = this.formGroup.get(`${field.fieldId}_checkbox`);

                        // Get the source field control
                        const sourceControl = this.formGroup.get(field.sourceFieldId);

                        if (checkboxControl && sourceControl) {
                            // Watch checkbox changes
                            checkboxControl.valueChanges.subscribe((isChecked) => {
                                this.linkedCheckboxes[field.linkedFieldId] = isChecked;

                                if (isChecked) {
                                    // Copy source value to target field
                                    const sourceValue = sourceControl.value;
                                    this.formGroup.get(field.linkedFieldId)?.setValue(sourceValue);

                                    // Optional: disable the target field
                                    // this.formGroup.get(field.linkedFieldId)?.disable();
                                } else {
                                    // Optional: re-enable the target field
                                    // this.formGroup.get(field.linkedFieldId)?.enable();
                                }
                            });

                            // Watch source field changes to keep target field in sync
                            sourceControl.valueChanges.subscribe((value) => {
                                // If checkbox is checked, update linked field
                                if (this.linkedCheckboxes[field.linkedFieldId]) {
                                    this.formGroup.get(field.linkedFieldId)?.setValue(value);
                                }
                            });
                        }
                    }
                });
            }
        });
    }

    /**
     * Handles checkbox change events
     * @param event Change event from checkbox
     * @param sourceFieldId ID of the source field to copy value from
     * @param targetFieldId ID of the target field to copy value to
     */
    onCheckboxChange(event: any, sourceFieldId: string, targetFieldId: string) {
        const isChecked = event.target.checked;
        this.linkedCheckboxes[targetFieldId] = isChecked;

        if (isChecked) {
            // Copy value from source field to target field
            const sourceValue = this.formGroup.get(sourceFieldId)?.value;
            this.formGroup.get(targetFieldId)?.setValue(sourceValue);

            // Optional: disable the target field when checkbox is checked
            // this.formGroup.get(targetFieldId)?.disable();
        } else {
            // Optional: clear value and re-enable field
            // this.formGroup.get(targetFieldId)?.setValue('');
            // this.formGroup.get(targetFieldId)?.enable();
        }
    }

    private initializeFieldClasses() {
        // Pre-compute CSS classes for fields
        this.steps.forEach((step) => {
            if (!step.customTemplate) {
                step.fields.forEach((field) => {
                    this.fieldColumnClasses[field.fieldId] = field.type === 'map' ? 'col-span-2' : 'col-span-1';
                });
            }
        });
    }

    getFieldColumnClass(field: StepFieldConfig): string {
        return this.fieldColumnClasses[field.fieldId] || 'col-span-1';
    }

    private populateFormWithEditData() {
        if (!this.editData) return;

        // Loop through all form fields and set values from editData
        Object.keys(this.formGroup.controls).forEach((controlName) => {
            // Skip checkbox controls when populating from edit data
            if (controlName.endsWith('_checkbox')) return;

            if (this.editData[controlName] !== undefined) {
                this.formGroup.get(controlName)?.setValue(this.editData[controlName]);

                // Set place display values for place fields
                if (this.placeDisplayValues.hasOwnProperty(controlName)) {
                    console.log(controlName, this.editData);

                    this.updatePlaceDisplayValue(controlName, this.editData[controlName]);
                }
                
                // Handle file upload data if present
                if (this.uploadedFiles.hasOwnProperty(controlName) && Array.isArray(this.editData[controlName])) {
                    // For file uploads, we might have file metadata in editData
                    // We can't restore actual File objects but we can display their info
                    this.handleEditModeFileData(controlName, this.editData[controlName]);
                }
            }
        });

        // Handle dependent dropdowns
        this.setupDependentDropdowns();

        // Handle location data for map
        this.setupLocationData();

        // Handle linked checkboxes in edit mode
        this.setupLinkedCheckboxesForEditMode();
    }
    
    /**
     * Handles file data in edit mode
     * Since we can't restore actual File objects from data, we'll store metadata
     */
    private handleEditModeFileData(fieldId: string, fileData: any[]) {
        if (!Array.isArray(fileData)) return;
        
        // Create placeholder File objects or handle metadata
        // This depends on how your backend sends file data
        // For now, we'll just log it
        console.log(`File data for ${fieldId}:`, fileData);
        
        // Set form value with file metadata for reference
        this.formGroup.get(fieldId)?.setValue(fileData);
    }

    /**
     * Sets up linked checkboxes based on edit data
     * If fields with the same values are found, check the checkbox
     */
    private setupLinkedCheckboxesForEditMode() {
        this.steps.forEach((step) => {
            if (!step.customTemplate) {
                step.fields.forEach((field) => {
                    if (field.hasLinkedCheckbox && field.sourceFieldId && field.linkedFieldId) {
                        const sourceValue = this.editData[field.sourceFieldId];
                        const targetValue = this.editData[field.linkedFieldId];

                        // If values match and not empty, check the checkbox
                        if (sourceValue && targetValue && JSON.stringify(sourceValue) === JSON.stringify(targetValue)) {
                            this.formGroup.get(`${field.fieldId}_checkbox`)?.setValue(true);
                            this.linkedCheckboxes[field.linkedFieldId] = true;
                        }
                    }
                });
            }
        });
    }

    private setupDependentDropdowns() {
        this.steps.forEach((step) => {
            if (!step.customTemplate) {
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
            }
        });
    }

    private setupLocationData() {
        const locationData = this.findLocationData();
        if (locationData) {
            this.locationState = {
                ...locationData,
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
        return this.steps[this.activeIndex]?.fields || [];
    }

    isStepValid(): boolean {
        // If this is a custom template step, no validation needed
        if (this.steps[this.activeIndex]?.customTemplate) {
            return true;
        }

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

    onCustomStepContinue() {
        // Emit event with custom step data
        this.customStepContinue.emit({
            stepIndex: this.activeIndex,
            data: this.customStepData
        });

        if (this.isLastStep) {
            // Combine form data with custom step data
            const finalData = {
                ...this.formGroup.value,
                ...this.customStepData
            };

            // Emit the final combined data
            this.formSubmit.emit(finalData);
        } else {
            this.nextStep();
        }
    }

    emitStepChange() {
        if (this.steps[this.activeIndex]?.customTemplate) {
            // For custom template steps, emit the custom data
            this.stepChange.emit({
                stepIndex: this.activeIndex,
                data: this.customStepData
            });
        } else {
            // For regular steps, extract form data
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
    }

    // Method to get current step data for template context
    getStepData(): any {
        return this.customStepData;
    }

    onMapReady(map: any, fieldId: string) {
        console.log(`Map ready for field ${fieldId}`);
        this.mapInstances.set(fieldId, map);

        // Connect map to corresponding search component
        if (this.searchComponent) {
            this.searchComponent.setupSearchFunctionality(map);
        }
    }

    onAddressSelected(addressData: { position: { lat: number; lng: number }; radius: number }, fieldId: string) {
        console.log(`Address selected for field ${fieldId}:`, addressData);

        // Update currentCommonLocation
        this.currentCommonLocation = {
            ...this.locationState,
            lat: addressData.position.lat,
            lng: addressData.position.lng,
            radius: addressData.radius
        };

        this.formGroup.get(fieldId)?.setValue(this.currentCommonLocation);
        this.formGroup.get(fieldId)?.markAsDirty();

        this.formGroup.get('locationPlace1')?.setValue(this.currentCommonLocation);
    }

    onPlaceSelected(place: any, fieldId: string) {
        // Update form value with place object
        this.formGroup.get(fieldId)?.setValue(place || {});

        // Update place display value
        this.updatePlaceDisplayValue(fieldId, place);

        // Update location state and map marker
        if (place && place.lat && place.lng) {
            this.locationState = {
                ...place,
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

    onDropdownSelect(selectedValue: any, fieldId: string) {
        // Set form value - store the complete selected object
        this.formGroup.get(fieldId)?.setValue(selectedValue);

        // Handle dependent dropdowns
        this.updateDependentFields(fieldId, selectedValue);
    }

    onMultiselectSelect(value: any, fieldId: string): void {
        // Set the value in the form control
        this.formGroup.get(fieldId)?.setValue(value);
    }

    onAutoCompleteSelected(selectedValue: any, fieldId: string) {
        const { value } = selectedValue;
        this.formGroup.get(fieldId)?.setValue(value);
        this.autoCompleteValue.emit({ value, fieldId });
    }

    updateDependentFields(fieldId: string, selectedValue: any) {
        // Extract the ID from the selected value
        console.log(selectedValue, fieldId);

        let paramValue: any = null;

        if (selectedValue) {
            // Handle different object structures
            if (typeof selectedValue === 'object') {
                paramValue = selectedValue.id || selectedValue.value;
            } else {
                paramValue = selectedValue;
            }
        }

        // Find fields that depend on this field
        this.steps.forEach((step) => {
            if (!step.customTemplate) {
                step.fields.forEach((f) => {
                    if (f.dependsOn === fieldId) {
                        // Reset the dependent form control
                        this.formGroup.get(f.fieldId)?.reset();

                        // Set API params for the dependent dropdown
                        if (paramValue) {
                            // Use the original fieldId as parameter name
                            this.dropdownParams[f.fieldId] = { [fieldId]: paramValue };
                        } else {
                            // Clear params when parent value is cleared
                            this.dropdownParams[f.fieldId] = {};
                        }

                        // Clear any nested dependents recursively
                        this.updateDependentFields(f.fieldId, null);
                    }
                });
            }
        });
    }

    // File upload methods
    async onFileUpload(event: any, fieldId: string): Promise<void> {
        console.log(event, fieldId);
        this.uiService.toggleLoader(true)
        try {
            const fileData = new FormData();
            fileData.append('file', event.files[0]); // selectedFile is a File object
            const response: any = await this.http.postFile('geortd/file/upload', fileData);
            console.log('File uploaded successfully:', response);
            this.formGroup.get(fieldId)?.setValue(response?.data?.fileUrl);
        } catch (error) {
            console.error('File upload failed:', error);
        } finally{
            this.uiService.toggleLoader(false)
        }


        // Handle file upload
        this.fileUploadEvent.emit({
            fieldId,
            files: event.files,
            action: 'upload'
        });
    }

    async onFileSelect(event: any, fieldId: string): Promise<void> {
        console.log(event, fieldId);
        
        // Store selected files
        this.uploadedFiles[fieldId] = event.currentFiles;        
        // Update form control
        // this.formGroup.get(fieldId)?.setValue(event?.currentFiles);
        
        // Emit event to parent
        this.fileUploadEvent.emit({
            fieldId,
            files: event.currentFiles,
            action: 'select'
        });
    }

    onFileRemove(event: any, fieldId: string) {
        // Remove file from stored files
        const fileIndex = this.uploadedFiles[fieldId].findIndex(
            (f: File) => f.name === event.file.name
        );
        
        if (fileIndex !== -1) {
            this.uploadedFiles[fieldId].splice(fileIndex, 1);
            
            // Update form control
            this.formGroup.get(fieldId)?.setValue(this.uploadedFiles[fieldId]);
        }
        
        // Emit event to parent
        this.fileUploadEvent.emit({
            fieldId,
            files: [event.file],
            action: 'remove'
        });
    }

    onFileClear(fieldId: string) {
        // Clear files
        this.uploadedFiles[fieldId] = [];
        
        // Update form control
        this.formGroup.get(fieldId)?.setValue([]);
        
        // Emit event to parent
        this.fileUploadEvent.emit({
            fieldId,
            files: [],
            action: 'clear'
        });
    }

    hasUploadedFiles(fieldId: string): boolean {
        return this.uploadedFiles[fieldId] && this.uploadedFiles[fieldId].length > 0;
    }

    getUploadedFiles(fieldId: string): File[] {
        return this.uploadedFiles[fieldId] || [];
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}