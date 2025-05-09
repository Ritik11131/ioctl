import { Component, TemplateRef, ViewChild, signal } from '@angular/core';
import { UiService } from '../../layout/service/ui.service';
import { HttpService } from '../service/http.service';
import { MenuItem, MessageService } from 'primeng/api';
import { GenericTableComponent } from '../../shared/components/generic-table/generic-table.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { MultiSelectModule } from 'primeng/multiselect';

import { StepsModule } from 'primeng/steps';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { DragDropModule } from 'primeng/dragdrop';
import { OrderListModule } from 'primeng/orderlist';
import { SelectModule } from 'primeng/select';

// Update the interface to include transitions
interface PermissionField {
    id: string | number;
    name: string;
    user: string | number;
    allowedActions: string[];
    email: boolean;
    alert: boolean;
    notification: boolean;
}

interface StepTransition {
    stepId: string | number;
    nextSteps: (string | number)[];
}

@Component({
    selector: 'app-rtd-approval',
    imports: [
        GenericTableComponent,
        CommonModule,
        ReactiveFormsModule,
        OrganizationChartModule,
        InputTextModule,
        ButtonModule,
        TooltipModule,
        StepsModule,
        MultiSelectModule,
        CardModule,
        SelectModule,
        CheckboxModule,
        TableModule,
        DragDropModule,
        OrderListModule
    ],
    templateUrl: './rtd-approval.component.html',
    styleUrl: './rtd-approval.component.scss'
})
export class RtdApprovalComponent {
    @ViewChild('createUpdateRtdApprovalContent') createUpdateRtdApprovalContent!: TemplateRef<any>;
    isEditMode = false;
    editData: any = null;
    selectedRowItems: any[] = [];

    toolBarStartActions = [
        {
            key: 'new',
            label: 'New',
            icon: 'pi pi-plus',
            severity: 'primary',
            outlined: false
        },
        {
            key: 'edit',
            label: 'Edit',
            icon: 'pi pi-pen-to-square',
            severity: 'secondary',
            outlined: false
        },
        {
            key: 'delete',
            label: 'Delete',
            icon: 'pi pi-trash',
            severity: 'danger',
            outlined: true
        }
    ];

    tableConfig = {
        title: 'Rtd Approval',
        dataKey: 'id',
        columns: [
            { field: 'name', header: 'Name', minWidth: '12rem' },
            { field: 'description', header: 'Description', minWidth: '12rem' }
        ],
        globalFilterFields: ['name']
    };

    tableData = [];

    activeIndex = signal(0);
    formSteps: MenuItem[] = [{ label: 'Basic Details' }, { label: 'Permission Configuration' }, { label: 'Transition' }];

    permissionForm!: FormGroup;

    // Add these properties to your component class
    transitionSelections: any[] = [];
    draggedPermission: any = null;

    users = [
        { label: 'Admin', value: 'admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'User', value: 'user' },
        { label: 'Guest', value: 'guest' }
    ];

    allowedActionOptions = [
        { label: 'Add', value: 'add' },
        { label: 'Edit', value: 'edit' },
        { label: 'Delete', value: 'delete' },
        { label: 'View', value: 'view' },
        { label: 'Approve', value: 'approve' },
    ];

    constructor(
        private uiService: UiService,
        private http: HttpService,
        private fb: FormBuilder
    ) {
        this.permissionForm = this.fb.group({
            basicDetails: this.fb.group({
                name: ['', [Validators.required]],
                description: ['']
            }),
            steps: this.fb.array([]),
            transitions: this.fb.array([])
        });

        // Add default permission field
        this.addPermissionField();
    }

    ngOnInit(): void {
        this.init();
    }

    private async init(): Promise<void> {
        await Promise.all([this.fetchRtdApprovalList(), this.fetchUsersList()]);
    }

    async fetchUsersList(): Promise<void> {
        try {
            const response: any = await this.http.get('geortd/rtduser/list');
            console.log(response);
            this.users = response.data.map((user: any) => ({
                label: [user.fName, user.mName, user.lName].filter(Boolean).join(' '),
                value: user.id
            }));
            console.log(this.users);
        } catch (error) {}
    }

    onStepChange(event: { stepIndex: number; data: any }) {
        console.log('Step changed:', event);
        // Here you could call an API to validate the step if needed
    }

    async fetchRtdApprovalList(): Promise<void> {
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.get('geortd/RtdApproval/list');
            console.log(response, 'response');
            this.tableData = response.data; // Assuming the response has a 'data' property containing the list of departments
            // Handle the response data as needed
            this.selectedRowItems = []; // Reset selected items after fetching new data
        } catch (error) {
            console.error('Error fetching role list:', error);
            this.uiService.showToast('error', 'Error', 'Failed to fetch role list');
        } finally {
            this.uiService.toggleLoader(false);
        }
    }

    handleRowSelectionChange(event: any): void {
        console.log(event);
        this.selectedRowItems = event;
    }

    async handleToolBarActions(event: any): Promise<void> {
        if (event.key === 'new') {
            this.openNew();
        } else if (event.key === 'delete') {
            await this.deleteSelectedRole();
        } else if (event.key === 'edit') {
            await this.handleEditRole();
        }
    }

    openNew() {
        this.isEditMode = false;
        this.editData = null;
        this.selectedRowItems = []; // Reset selected items when opening new form

        this.uiService.openDrawer(this.createUpdateRtdApprovalContent, 'Rtd Approval', '!w-[80vw] md:!w-[80vw] lg:!w-[80vw] rounded-l-2xl');
    }

    async deleteSelectedRole(): Promise<void> {
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.delete('geortd/rtdapprovalprocess/delete', this.selectedRowItems[0].id);
            console.log(response, 'response');
            this.uiService.showToast('success', 'Success', 'Role deleted successfully');
            await this.fetchRtdApprovalList(); // Refresh the department list after deletion
        } catch (error) {
            console.error('Error deleting role:', error);
            this.uiService.showToast('error', 'Error', 'Failed to delete role');
        } finally {
            this.uiService.toggleLoader(false);
        }
    }

    async handleEditRole(): Promise<void> {
        console.log(this.selectedRowItems, 'selectedRowItems');
        this.isEditMode = true;
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.get('geortd/RtdApproval/getbyid', {}, this.selectedRowItems[0]?.id);
            console.log(response);
            if (response?.data) {
                const { steps, ...rest } = response.data;
                this.editData = {
                    ...rest,
                    steps: typeof steps === 'string' ? JSON.parse(steps) : steps
                };
            }
            this.uiService.openDrawer(this.createUpdateRtdApprovalContent, 'Rtd Approval', '!w-[80vw] md:!w-[80vw] lg:!w-[80vw] rounded-l-2xl');
            this.populateForm();
        } catch (error) {
        } finally {
            this.uiService.toggleLoader(false);
        }
    }

    // Update the populateForm method
    populateForm() {
        if (this.editData) {
            // Parse steps and transitions if they are strings
            let stepsData = typeof this.editData.steps === 'string' ? JSON.parse(this.editData.steps) : this.editData.steps;

            let transitionsData = typeof this.editData.transitions === 'string' ? JSON.parse(this.editData.transitions) : this.editData.transitions || [];

            // Patch basic details
            this.permissionForm.patchValue({
                basicDetails: {
                    name: this.editData.name,
                    description: this.editData.description
                }
            });

            // Clear existing arrays
            while (this.steps.length) {
                this.steps.removeAt(0);
            }

            while (this.transitions.length) {
                this.transitions.removeAt(0);
            }

            // Add steps from existing data
            stepsData.forEach((field: PermissionField) => {
                this.steps.push(
                    this.fb.group({
                        id: [field.id],
                        name: [field.name, Validators.required],
                        user: [field.user, Validators.required],
                        allowedActions: [field.allowedActions],
                        email: [field.email],
                        alert: [field.alert],
                        notification: [field.notification]
                    })
                );

                // Add corresponding transition form group
                const existingTransition = transitionsData.find((t: any) => t.stepId === field.id);
                this.transitions.push(
                    this.fb.group({
                        stepId: [field.id],
                        nextSteps: [existingTransition?.nextSteps || []]
                    })
                );
            });
        }
    }

    get steps() {
        return this.permissionForm.get('steps') as FormArray;
    }

    // Add getter for transitions FormArray
    get transitions() {
        return this.permissionForm.get('transitions') as FormArray;
    }

    // Update the addPermissionField method
    addPermissionField(): void {
        const index = this.steps.length;

        // Add step form group
        const permissionField = this.fb.group({
            id: [index],
            name: ['', Validators.required],
            user: ['', Validators.required],
            allowedActions: [[]],
            email: [false],
            alert: [false],
            notification: [false]
        });
        this.steps.push(permissionField);

        // Add corresponding transition form group
        const transitionField = this.fb.group({
            stepId: [index],
            nextSteps: [[]]
        });
        this.transitions.push(transitionField);
    }

    // Update the removePermissionField method
    removePermissionField(index: number) {
        if (this.steps.length > 1) {
            this.steps.removeAt(index);
            this.transitions.removeAt(index);

            // Update the IDs of remaining fields if necessary
            this.updateFieldIds();
        } else {
            this.uiService.showToast('info', 'Info', 'At least one permission field is required.');
        }
    }

    // Add method to update field IDs after removal
    updateFieldIds() {
        this.steps.controls.forEach((control, index) => {
            control.get('id')?.setValue(index);
            this.transitions.at(index).get('stepId')?.setValue(index);
        });
    }

    // PrimeNG drag and drop methods
    dragStart(index: number) {
        this.draggedPermission = { index, data: this.steps.at(index).value };
    }

    dragEnd() {
        this.draggedPermission = null;
    }

    // Update the drop method for drag and drop
    drop(event: any, dropIndex: number) {
        if (this.draggedPermission !== null) {
            const dragIndex = this.draggedPermission.index;

            if (dragIndex !== dropIndex) {
                // Get all current form values
                const stepsValues = this.steps.value;
                const transitionsValues = this.transitions.value;

                // Remove dragged items
                const draggedStep = stepsValues.splice(dragIndex, 1)[0];
                const draggedTransition = transitionsValues.splice(dragIndex, 1)[0];

                // Insert at drop position
                stepsValues.splice(dropIndex, 0, draggedStep);
                transitionsValues.splice(dropIndex, 0, draggedTransition);

                // Reset form arrays with new order
                this.resetPermissionFields(stepsValues, transitionsValues);
                this.uiService.showToast('success', 'Reordered', 'Permission field order updated');
            }
        }
    }

    // Reset form array with new order
    // Update reset method to handle transitions too
    resetPermissionFields(steps: PermissionField[], transitions: StepTransition[]) {
        // Clear existing fields
        while (this.steps.length) {
            this.steps.removeAt(0);
        }

        while (this.transitions.length) {
            this.transitions.removeAt(0);
        }

        // Add fields in new order with updated ids
        steps.forEach((field, index) => {
            const updatedField = { ...field, id: index };
            this.steps.push(
                this.fb.group({
                    id: [updatedField.id],
                    name: [updatedField.name, Validators.required],
                    user: [updatedField.user, Validators.required],
                    allowedActions: [updatedField.allowedActions],
                    email: [updatedField.email],
                    alert: [updatedField.alert],
                    notification: [updatedField.notification]
                })
            );

            const transition = transitions[index] || { stepId: index, nextSteps: [] };
            const updatedTransition = { ...transition, stepId: index };
            this.transitions.push(
                this.fb.group({
                    stepId: [updatedTransition.stepId],
                    nextSteps: [updatedTransition.nextSteps]
                })
            );
        });
    }

    // Navigation methods
    nextStep() {
        if (this.activeIndex() === 0) {
            // Validate basic details form
            const basicDetailsForm = this.permissionForm.get('basicDetails');
            if (basicDetailsForm?.invalid) {
                this.uiService.showToast('error', 'Validation Error', 'Please fill in all required fields.');
                return;
            }
        } else if (this.activeIndex() === 1) {
            // Validate permission fields
            if (this.steps.invalid) {
                this.uiService.showToast('error', 'Validation Error', 'Please fill in all required fields in the permission configuration.');
                return;
            }
        }

        if (this.activeIndex() < 2) {
            this.activeIndex.set(this.activeIndex() + 1);
        }
    }

    prevStep() {
        if (this.activeIndex() > 0) {
            this.activeIndex.set(this.activeIndex() - 1);
        }
    }

    // Update the onSubmit method to include transitions
    onSubmit() {
        if (this.permissionForm.invalid) {
            // Validation error
            this.uiService.showToast('error', 'Validation Error', 'Please fill in all required fields.');
            return;
        }
        const stepsWithUsername = this.permissionForm.value.steps.map((step: any) => {
            const user = this.users.find((user) => user.value === step.user);
            return {
                ...step,
                userName: user ? user.label : step.user // Use label if user is found
            };
        }
        );
        console.log(stepsWithUsername,'usernamess');
        
        // Format data for submission
        const formData = {
            ...this.permissionForm.value.basicDetails,
            steps: JSON.stringify(stepsWithUsername),
            transitions: JSON.stringify(this.permissionForm.value.transitions)
        };

        console.log('Form submitted:', this.permissionForm.value.steps);

        const payload = {
            ...formData,
            stepCount:formData?.steps?.length,
            active:true,
            type:'test'
        }

        this.submitFormData(payload);
    }
    
    // Add method to submit form data to API
    async submitFormData(formData: any): Promise<void> {
      this.uiService.toggleLoader(true);
      try {
        let response;
        if (this.isEditMode) {
          response = await this.http.put('geortd/RtdApproval/Modify', this.selectedRowItems[0]?.id, {...formData, id:this.selectedRowItems[0]?.id});
        } else {
          response = await this.http.post('geortd/RtdApproval/create', formData);
        }
        
        this.uiService.showToast('success', 'Success', 
          `Approval ${this.isEditMode ? 'updated' : 'created'} successfully!`);

          // Reset form to default state
    this.resetForm();
    
        this.uiService.closeDrawer();
        await this.fetchRtdApprovalList();
      } catch (error) {
        console.error('Error submitting form:', error);
        this.uiService.showToast('error', 'Error', 
          `Failed to ${this.isEditMode ? 'update' : 'create'} approval.`);
      } finally {
        this.uiService.toggleLoader(false);
      }
    }

    // Method to safely format allowed actions
    formatAllowedActions(actions: any): string {
        if (!actions) return 'None';
        if (Array.isArray(actions)) {
            return actions.join(', ');
        }
        return String(actions);
    }

    // Add this method to your component class
    // Method to get step options for a specific step
    getStepOptions(currentIndex: number): any[] {
        // Create options from all steps except the current one
        return this.steps.controls
            .map((control, index) => {
                if (index !== currentIndex) {
                    return {
                        label: control.get('name')?.value,
                        value: control.get('id')?.value
                    };
                }
                return null;
            })
            .filter((option) => option !== null);
    }

    // Add a method to reset the form
resetForm(): void {
    // Reset to initial state
    this.permissionForm.reset();
    
    // Clear all steps and transitions
    while (this.steps.length) {
      this.steps.removeAt(0);
    }
    
    while (this.transitions.length) {
      this.transitions.removeAt(0);
    }
    
    // Reset active index to first step
    this.activeIndex.set(0);
    
    // Reset edit mode
    this.isEditMode = false;
    this.editData = null;
    
    // Add a default empty permission field if needed
    // Uncomment the next line if you want a default field
    // this.addPermissionField();
    
    // Set defaults for basic details if needed
    this.permissionForm.get('basicDetails')?.patchValue({
      name: '',
      description: ''
    });
  }
}
