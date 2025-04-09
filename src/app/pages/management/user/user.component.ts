import { Component, TemplateRef, ViewChild } from '@angular/core';
 import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';
import { GenericStepperComponent, StepConfig } from '../../../shared/components/generic-stepper/generic-stepper.component';
import { UiService } from '../../../layout/service/ui.service';
import { HttpService } from '../../service/http.service';
 
 @Component({
   selector: 'app-user',
   imports: [GenericTableComponent, GenericStepperComponent],
   templateUrl: './user.component.html',
   styleUrl: './user.component.scss'
 })
 export class UserComponent {
 
     @ViewChild('createUpdateUserContent') createUpdateUserContent!: TemplateRef<any>;
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
            title: 'Manage User',
            dataKey: 'id',
            columns: [
                { field: 'name', header: 'User Name', minWidth: '12rem' },
                { field: 'description', header: 'Description', minWidth: '12rem' }
    
            ],
            globalFilterFields: ['name']
        };
    
        tableData = [];
    
        formSteps: StepConfig[] = [
          {
            stepId: 'basic',
            title: 'Basic Information',
            fields: [
              {
                fieldId: 'fname',
                type: 'text',
                label: 'First Name',
                required: true,
                placeholder: 'Enter first name'
              },
              {
                fieldId: 'mname',
                type: 'text',
                label: 'Middle Name',
                required: true,
                placeholder: 'Enter middle name'
              },
              {
                fieldId: 'lname',
                type: 'text',
                label: 'Last Name',
                required: true,
                placeholder: 'Enter last name'
              },
              {
                fieldId: 'emailId',
                type: 'text',
                label: 'Email ID',
                required: true,
                placeholder: 'Enter email address'
              },
              {
                fieldId: 'mobileNo',
                type: 'text',
                label: 'Mobile Number',
                required: true,
                placeholder: 'Enter mobile number'
              },
              {
                fieldId: 'dob',
                type: 'text',
                label: 'Date of Birth',
                required: true,
                placeholder: 'Enter date of birth'
              },
              {
                fieldId: 'department',
                type: 'dropdown',
                apiType: 'department',
                label: 'Select Department',
                required: true,
                placeholder: 'Select a Department',
                dependsOn: null
            },
            {
              fieldId: 'roles',
              type: 'dropdown',
              apiType: 'roles',
              label: 'Select Role',
              required: true,
              placeholder: 'Select a Role',
              dependsOn: null
          },
            ]
          },
          {
            stepId: 'credentials',
            title: 'Credentials',
            fields: [
              {
                fieldId: 'loginId',
                type: 'text',
                label: 'Login ID',
                required: true,
                placeholder: 'Enter login ID'
              },
              {
                fieldId: 'password',
                type: 'text',
                label: 'Password',
                required: true,
                placeholder: 'Enter password'
              },
              {
                fieldId: 'employeeId',
                type: 'text',
                label: 'Employee ID',
                required: true,
                placeholder: 'Enter employee ID'
              }
            ]
          }
        ];
        
    
        constructor(
            private uiService: UiService,
            private http: HttpService
        ) {}
    
        ngOnInit(): void {
            this.fetchUserList();
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
              const response = await this.http.put('geortd/rtduser/modify', this.selectedRowItems[0].id, {...formData, id: this.selectedRowItems[0].id, attributed:{}});
              console.log(response, 'response');
              this.uiService.showToast('success', 'Success', 'User updated successfully');
              this.uiService.closeDrawer(); // Close the drawer after submission
              await this.fetchUserList(); // Refresh the department list after successful submission
            } catch (error) {
              console.error('Error submitting form:', error);
              this.uiService.showToast('error', 'Error', 'Failed to submit form');
            } finally {
              this.uiService.toggleLoader(false);
            }
    
          } else {
            this.uiService.toggleLoader(true);
            try {
              const response = await this.http.post('geortd/rtduser/create', {...formData, attributes:{}});
              console.log(response, 'response');
              this.uiService.showToast('success', 'Success', 'User created successfully');
              this.uiService.closeDrawer(); // Close the drawer after submission
              await this.fetchUserList(); // Refresh the department list after successful submission
            } catch (error) {
              console.error('Error submitting form:', error);
              this.uiService.showToast('error', 'Error', 'Failed to submit form');
            } finally {
              this.uiService.toggleLoader(false);
            }
          }
          // Handle form submission
      }
    
        async fetchUserList(): Promise<void> {
            this.uiService.toggleLoader(true);
            try {
                const response: any = await this.http.get('geortd/rtduser/list');
                console.log(response, 'response');
                this.tableData = response.data; // Assuming the response has a 'data' property containing the list of departments
                // Handle the response data as needed
                this.selectedRowItems = []; // Reset selected items after fetching new data
            } catch (error) {
                console.error('Error fetching user list:', error);
                this.uiService.showToast('error', 'Error', 'Failed to fetch user list');
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
                await this.deleteSelectedUser();
            } else if (event.key === 'edit') {
                await this.handleEditUser();
            }
        }
    
        openNew() {
            this.selectedRowItems = []; // Reset selected items when opening new form
            this.uiService.openDrawer(this.createUpdateUserContent, 'User Management');
        }
    
        async deleteSelectedUser(): Promise<void> {
            this.uiService.toggleLoader(true);
            try {
                const response: any = await this.http.delete('geortd/rtduser/delete', this.selectedRowItems[0].id);
                console.log(response, 'response');
                this.uiService.showToast('success', 'Success', 'Role deleted successfully');
                await this.fetchUserList(); // Refresh the department list after deletion
            } catch (error) {
                console.error('Error deleting role:', error);
                this.uiService.showToast('error', 'Error', 'Failed to delete role');
            } finally {
                this.uiService.toggleLoader(false);
            }
        }
    
        async handleEditUser(): Promise<void> {
            console.log(this.selectedRowItems, 'selectedRowItems');
            this.isEditMode = true;
            this.uiService.toggleLoader(true);
            try {
                const response: any = await this.http.get('geortd/department/GetDepartmentById', {}, this.selectedRowItems[0].id);
                console.log(response, 'response');
                this.editData = response.data; // Assuming the response has a 'data' property containing the department details
                this.uiService.openDrawer(this.createUpdateUserContent, 'Role Management');
            } catch (error) {
                console.error('Error fetching department details:', error);
                this.uiService.showToast('error', 'Error', 'Failed to fetch department details');
            } finally {
                this.uiService.toggleLoader(false);
            }
        }
 
 }