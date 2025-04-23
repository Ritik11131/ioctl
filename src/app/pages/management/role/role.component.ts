import { Component, TemplateRef, ViewChild } from '@angular/core';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';
import { UiService } from '../../../layout/service/ui.service';
import { GenericStepperComponent, StepConfig } from '../../../shared/components/generic-stepper/generic-stepper.component';
import { HttpService } from '../../service/http.service';
import { PanelMenuModule } from 'primeng/panelmenu';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-role',
  imports: [GenericTableComponent, GenericStepperComponent, PanelMenuModule, CheckboxModule, FormsModule],
  templateUrl: './role.component.html',
  styleUrl: './role.component.scss'
})


export class RoleComponent {

   @ViewChild('createUpdateRoleContent') createUpdateRoleContent!: TemplateRef<any>;
   @ViewChild('assignRoleToUsers') assignRoleToUsers!: TemplateRef<any>;
      isEditMode = false;
      editData: any = null;
      selectedRowItems: any[] = [];

      menuItems = [
        {
          label: 'Approval',
          icon: 'pi pi-fw pi-sitemap',
          permissions: { read: false, write: false },
        },
        {
          label: 'Management',
          icon: 'pi pi-fw pi-warehouse',
          permissions: { read: false, write: false },
          items: [
            {
              label: 'User',
              icon: 'pi pi-fw pi-users',
              permissions: { read: false, write: false },
            },
            {
              label: 'Department',
              icon: 'pi pi-fw pi-building',
              permissions: { read: false, write: false },
            },
            {
              label: 'Address',
              icon: 'pi pi-fw pi-address-book',
              permissions: { read: false, write: false },
            },
            {
              label: 'Routes',
              icon: 'pi pi-fw pi-map',
              permissions: { read: false, write: false },
            },
            {
              label: 'Role',
              icon: 'pi pi-fw pi-user',
              permissions: { read: false, write: false },
            },
            {
              label: 'Tolls',
              icon: 'pi pi-fw pi-map-marker',
              permissions: { read: false, write: false },
            }
          ]
        }
      ];
  
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
        },
        {
            key: 'assignUsers',
            label: 'Assign Users',
            icon: 'pi pi-reply',
            severity: 'secondary',
            outlined: false,
            dependentOnRow: true
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
          },
          {
            stepId: 'custom',
            title: 'Permissions',
            fields: [], // No fields as we will use custom template
            customTemplate: true // Mark this step as using a custom template
          }
          
      ];


      assignRoleformSteps: StepConfig[] = [
        {
            stepId: 'assignRole',
            title: '',
            fields: [
                {
                    fieldId: 'users',
                    type: 'multiselect',
                    apiType: 'geortd/rtduser/list',
                    label: 'Users',
                    required: true,
                    placeholder: 'Select Users',
                    dependsOn: null,
                    autoFetch:true
                },
            ]
        }
      ]
  
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

      async onAssignUserFormSubmit(formData: any): Promise<void> {
        console.log(formData);
        const { users } = formData;
        const payload = {
            roleId: this.selectedRowItems[0]?.id,
            userIds: users.map((user: any)=>{return user?.id})
        }
        this.uiService.toggleLoader(true);
        try {
            const response = await this.http.post('geortd/roles/bulkupdaterole', payload);
            console.log(response);
            this.uiService.showToast('success', 'Success', 'Department updated successfully');
            this.uiService.closeDrawer(); // Close the drawer after submission
            await this.fetchRoleList(); // Refresh the department list after successful submission
        } catch (error) {
            console.error('Error submitting form:', error);
            this.uiService.showToast('error', 'Error', 'Failed to submit form');
          } finally {
            this.uiService.toggleLoader(false);
          }
        
      }
  
      async onFormSubmit(formData: any): Promise<void> {
        console.log('Form submitted with data:', formData);
        if(this.isEditMode) {
          this.uiService.toggleLoader(true);
          try {
            const response = await this.http.put('geortd/roles/Modify', this.selectedRowItems[0].id, {...formData, id: this.selectedRowItems[0].id, users:[], attributes:JSON.stringify(this.menuItems)});
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
            const response = await this.http.post('geortd/roles/create', {...formData,users:[], attributes:JSON.stringify(this.menuItems)});
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
          } else if (event.key === 'assignUsers'){
            await this.handleAssignRoleToUsers()
          }
      }

      async handleAssignRoleToUsers(): Promise<void> {
        this.uiService.openDrawer(this.assignRoleToUsers, 'Assign Users')
      }
  
      openNew() {
        this.isEditMode = false;
        this.editData = null;
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
              const response: any = await this.http.get('geortd/roles/getbyid', {}, this.selectedRowItems[0].id);
              console.log(response, 'response');
              this.editData = response.data; // Assuming the response has a 'data' property containing the department details
              const {attributes} = response?.data;
              this.menuItems = JSON.parse(attributes)
              this.uiService.openDrawer(this.createUpdateRoleContent, 'Role Management');
          } catch (error) {
              console.error('Error fetching department details:', error);
              this.uiService.showToast('error', 'Error', 'Failed to fetch role details');
          } finally {
              this.uiService.toggleLoader(false);
          }
      }

    /**
   * Update all child permissions when parent is toggled
   */
  updateChildPermissions(parentItem: any, permissionType: 'read' | 'write'): void {
    if (!parentItem.items || parentItem.items.length === 0) {
      return;
    }

    // Set all children to match parent's permission value
    const permValue = parentItem.permissions[permissionType];
    
    parentItem.items.forEach((item: any) => {
      item.permissions[permissionType] = permValue;
    });
  }

  /**
   * Update parent permission status based on children
   */
  updateParentPermissions(parentItem: any): void {
    if (!parentItem.items || parentItem.items.length === 0) {
      return;
    }

    // Check if all children have the same read permission
    const allChildrenRead = parentItem.items.every((item: any) => item.permissions.read);
    const anyChildrenRead = parentItem.items.some((item: any) => item.permissions.read);
    
    // Check if all children have the same write permission
    const allChildrenWrite = parentItem.items.every((item: any) => item.permissions.write);
    const anyChildrenWrite = parentItem.items.some((item: any) => item.permissions.write);

    // Update parent permissions based on children
    // Only set parent as checked if ALL children are checked
    parentItem.permissions.read = allChildrenRead;
    parentItem.permissions.write = allChildrenWrite;
  }

}
