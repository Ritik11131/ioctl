import { Component, TemplateRef, ViewChild } from '@angular/core';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';
import { UiService } from '../../../layout/service/ui.service';
import { GenericStepperComponent, StepConfig } from '../../../shared/components/generic-stepper/generic-stepper.component';
import { HttpService } from '../../service/http.service';

@Component({
  selector: 'app-role',
  imports: [GenericTableComponent, GenericStepperComponent],
  templateUrl: './role.component.html',
  styleUrl: './role.component.scss'
})
export class RoleComponent {

   @ViewChild('createUpdateRoleContent') createUpdateRoleContent!: TemplateRef<any>;
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
          title: 'Manage Role',
          dataKey: 'id',
          columns: [
              { field: 'name', header: 'Role Name', minWidth: '12rem' },
              { field: 'description', header: 'Description', minWidth: '12rem' }
  
          ],
          globalFilterFields: ['name']
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
                      label: 'Role Name',
                      required: true,
                      placeholder: 'Enter department name'
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
          this.fetchRoleList();
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
            const response = await this.http.put('geortd/roles/Modify', this.selectedRowItems[0].id, {...formData, id: this.selectedRowItems[0].id, attributes:{}});
            console.log(response, 'response');
            this.uiService.showToast('success', 'Success', 'Department updated successfully');
            this.uiService.closeDrawer(); // Close the drawer after submission
            await this.fetchRoleList(); // Refresh the department list after successful submission
          } catch (error) {
            console.error('Error submitting form:', error);
            this.uiService.showToast('error', 'Error', 'Failed to submit form');
          } finally {
            this.uiService.toggleLoader(false);
          }
  
        } else {
          this.uiService.toggleLoader(true);
          try {
            const response = await this.http.post('geortd/roles/create', {...formData, attributes:{}});
            console.log(response, 'response');
            this.uiService.showToast('success', 'Success', 'Role created successfully');
            this.uiService.closeDrawer(); // Close the drawer after submission
            await this.fetchRoleList(); // Refresh the department list after successful submission
          } catch (error) {
            console.error('Error submitting form:', error);
            this.uiService.showToast('error', 'Error', 'Failed to submit form');
          } finally {
            this.uiService.toggleLoader(false);
          }
        }
        // Handle form submission
    }
  
      async fetchRoleList(): Promise<void> {
          this.uiService.toggleLoader(true);
          try {
              const response: any = await this.http.get('geortd/roles/list');
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
          this.selectedRowItems = []; // Reset selected items when opening new form
          this.uiService.openDrawer(this.createUpdateRoleContent, 'Role Management');
      }
  
      async deleteSelectedRole(): Promise<void> {
          this.uiService.toggleLoader(true);
          try {
              const response: any = await this.http.delete('geortd/roles/delete', this.selectedRowItems[0].id);
              console.log(response, 'response');
              this.uiService.showToast('success', 'Success', 'Role deleted successfully');
              await this.fetchRoleList(); // Refresh the department list after deletion
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
              const response: any = await this.http.get('geortd/department/GetDepartmentById', {}, this.selectedRowItems[0].id);
              console.log(response, 'response');
              this.editData = response.data; // Assuming the response has a 'data' property containing the department details
              this.uiService.openDrawer(this.createUpdateRoleContent, 'Role Management');
          } catch (error) {
              console.error('Error fetching department details:', error);
              this.uiService.showToast('error', 'Error', 'Failed to fetch department details');
          } finally {
              this.uiService.toggleLoader(false);
          }
      }

}
