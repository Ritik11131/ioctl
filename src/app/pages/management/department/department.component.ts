import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';
import { GenericStepperComponent, StepConfig } from '../../../shared/components/generic-stepper/generic-stepper.component';
import { UiService } from '../../../layout/service/ui.service';
import { HttpService } from '../../service/http.service';

@Component({
    selector: 'app-department',
    imports: [GenericTableComponent, GenericStepperComponent],
    templateUrl: './department.component.html',
    styleUrl: './department.component.scss'
})
export class DepartmentComponent implements OnInit {
    @ViewChild('createUpdateDepartmentContent') createUpdateDepartmentContent!: TemplateRef<any>;
    isEditMode = false;
    editData: any = null;
    selectedRowItems: any[] = [];

    toolBarStartActions = [
        {
            key: 'new',
            label: 'New',
            icon: 'pi pi-plus',
            severity: 'primary',
            outlined: false,
            dependentOnRow: false

        },
        {
          key: 'edit',
          label: 'Edit',
          icon: 'pi pi-pen-to-square',
          severity: 'secondary',
          outlined: false,
            dependentOnRow: true

      },
        {
            key: 'delete',
            label: 'Delete',
            icon: 'pi pi-trash',
            severity: 'danger',
            outlined: true,
            dependentOnRow: true

        }
    ];

    tableConfig = {
        title: 'Manage Departments',
        dataKey: 'id',
        columns: [
            { field: 'name', header: 'Department Name', minWidth: '12rem' },
            { field: 'email', header: 'Email', minWidth: '12rem' },
            { field: 'telephone', header: 'Telephone', minWidth: '12rem' },
            { field: 'fax', header: 'Fax', minWidth: '12rem' },
            { field: 'description', header: 'Description', minWidth: '12rem' }

        ],
        globalFilterFields: ['name', 'email', 'telephone', 'fax']
    };

    tableData = [];

    formSteps: StepConfig[] = [
        {
            stepId: 'basic',
            title: '',
            fields: [
                {
                    fieldId: 'name',
                    type: 'text',
                    label: 'Department Name',
                    required: true,
                    placeholder: 'Enter department name'
                },
                {
                    fieldId: 'code',
                    type: 'text',
                    label: 'Department Code',
                    required: true,
                    placeholder: 'Enter department name'
                },
                {
                    fieldId: 'email',
                    type: 'text',
                    label: 'Department Email',
                    required: true,
                    placeholder: 'Enter department email'
                },
                {
                    fieldId: 'telephone',
                    type: 'text',
                    label: 'Department Telephone',
                    required: true,
                    placeholder: 'Enter department telephone'
                },
                {
                    fieldId: 'fax',
                    type: 'text',
                    label: 'Department Fax',
                    required: true,
                    placeholder: 'Enter department fax'
                },
                {
                  fieldId: 'description',
                  type: 'textarea',
                  label: 'Description',
                  required: true,
                  placeholder: 'Enter description'
              }
            ]
        }
    ];

    constructor(
        private uiService: UiService,
        private http: HttpService
    ) {}

    ngOnInit(): void {
        this.fetchDepartmentList();
    }

    onStepChange(event: { stepIndex: number; data: any }) {
        console.log('Step changed:', event);
        // Here you could call an API to validate the step if needed
    }

    async onFormSubmit(formData: any): Promise<void> {
      console.log('Form submitted with data:', formData);
      if(this.isEditMode) {
        this.uiService.toggleLoader(true);
        try {
          const response = await this.http.put('geortd/department/Modify', this.selectedRowItems[0].id, {...formData, id: this.selectedRowItems[0].id});
          console.log(response, 'response');
          this.uiService.showToast('success', 'Success', 'Department updated successfully');
          this.uiService.closeDrawer(); // Close the drawer after submission
          await this.fetchDepartmentList(); // Refresh the department list after successful submission
        } catch (error: any) {
            console.error('Error submitting form:', error);
            this.uiService.showToast('error', 'Error', error?.error?.data);
          } finally {
          this.uiService.toggleLoader(false);
        }

      } else {
        this.uiService.toggleLoader(true);
        try {
          const response = await this.http.post('geortd/department/create', formData);
          console.log(response, 'response');
          this.uiService.showToast('success', 'Success', 'Department created successfully');
          this.uiService.closeDrawer(); // Close the drawer after submission
          await this.fetchDepartmentList(); // Refresh the department list after successful submission
        } catch (error: any) {
            console.error('Error submitting form:', error);
            this.uiService.showToast('error', 'Error', error?.error?.data);
          } finally {
          this.uiService.toggleLoader(false);
        }
      }
      // Handle form submission
  }

    async fetchDepartmentList(): Promise<void> {
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.get('geortd/department/list');
            console.log(response, 'response');
            this.tableData = response.data; // Assuming the response has a 'data' property containing the list of departments
            // Handle the response data as needed
            this.selectedRowItems = []; // Reset selected items after fetching new data
        } catch (error: any) {
            console.error('Error submitting form:', error);
            this.uiService.showToast('error', 'Error', error?.error?.data);
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
            await this.deleteSelectedDepartment();
        } else if (event.key === 'edit') {
            await this.handleEditDepartment();
        }
    }

    openNew() {
        this.isEditMode = false;
        this.editData = null
          this.selectedRowItems = []; // Reset selected items when opening new form
        this.uiService.openDrawer(this.createUpdateDepartmentContent, 'department Management');
    }

    async deleteSelectedDepartment(): Promise<void> {
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.delete('geortd/department/delete', this.selectedRowItems[0].id);
            console.log(response, 'response');
            this.uiService.showToast('success', 'Success', 'Department deleted successfully');
            await this.fetchDepartmentList(); // Refresh the department list after deletion
        } catch (error: any) {
            console.error('Error submitting form:', error);
            this.uiService.showToast('error', 'Error', error?.error?.data);
          } finally {
            this.uiService.toggleLoader(false);
        }
    }

    async handleEditDepartment(): Promise<void> {
        console.log(this.selectedRowItems, 'selectedRowItems');
        this.isEditMode = true;
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.get('geortd/department/GetDepartmentById', {}, this.selectedRowItems[0].id);
            console.log(response, 'response');
            this.editData = response.data; // Assuming the response has a 'data' property containing the department details
            this.uiService.openDrawer(this.createUpdateDepartmentContent, 'Department Management');
        } catch (error: any) {
            console.error('Error submitting form:', error);
            this.uiService.showToast('error', 'Error', error?.error?.data);
        } finally {
            this.uiService.toggleLoader(false);
        }
    }
}
