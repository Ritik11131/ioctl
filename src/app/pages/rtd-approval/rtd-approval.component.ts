import { Component, TemplateRef, ViewChild } from '@angular/core';
import { UiService } from '../../layout/service/ui.service';
import { HttpService } from '../service/http.service';
import { StepConfig } from '../../shared/components/generic-stepper/generic-stepper.component';
import { GenericTableComponent } from '../../shared/components/generic-table/generic-table.component';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { OrganizationChartModule } from 'primeng/organizationchart';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-rtd-approval',
    imports: [GenericTableComponent, CommonModule, ReactiveFormsModule, OrganizationChartModule, InputTextModule, ButtonModule, TooltipModule],
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

    isAddingMode = false;
    selectedNode: TreeNode | null = null;
    parentNode: TreeNode | null = null;

    approvalForm!: FormGroup;
    nodeForm!: FormGroup;

    // Create direct references to form controls
    get title(): FormControl {
        return this.approvalForm.get('title') as FormControl;
    }

    get description(): FormControl {
        return this.approvalForm.get('description') as FormControl;
    }
    // Sample data for the organization chart
    data: TreeNode[] = [
        {
            label: 'Root',
            expanded: true,
            data: { email: 'root@example.com', role: 'Organization', department: 'Sports' },
            children: [
                {
                    label: 'Parent 1',
                    expanded: true,
                    data: { email: 'parent1@example.com', role: 'Team', department: 'South America' },
                },
                {
                    label: 'Parent 2',
                    expanded: true,
                    data: { email: 'parent2@example.com', role: 'Team', department: 'Europe' },
                }
            ]
        }
    ];

    constructor(
        private uiService: UiService,
        private http: HttpService,
        private fb: FormBuilder
    ) {
      this.approvalForm = this.fb.group({
        title: ['', Validators.required],
        description: ['']
    });

    this.nodeForm = this.fb.group({
        label: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        role: [''],
        department: ['']
    });
    }

    ngOnInit(): void {
        this.fetchRtdApprovalList();
    }

    onStepChange(event: { stepIndex: number; data: any }) {
        console.log('Step changed:', event);
        // Here you could call an API to validate the step if needed
    }

  async submitFormData(): Promise<void> {
    console.log(this.approvalForm.value);
    console.log(this.data);
    if (this.isEditMode) {
      this.uiService.toggleLoader(true);
      try {
        const { title, description } = this.approvalForm.value;
        const response = await this.http.put('geortd/roles/Modify', this.selectedRowItems[0].id,
          {
            name: title,
            description,
            id: this.selectedRowItems[0].id,
            attributes: JSON.stringify(this.data)
          }
        );
        console.log(response, 'response');
        this.uiService.showToast('success', 'Success', 'Approval Flow updated successfully');
        this.uiService.closeDrawer(); // Close the drawer after submission
        await this.fetchRtdApprovalList(); // Refresh the department list after successful submission
      } catch (error) {
        console.error('Error submitting form:', error);
        this.uiService.showToast('error', 'Error', 'Failed to submit form');
      } finally {
        this.uiService.toggleLoader(false);
      }
    } else {
      this.uiService.toggleLoader(true);
      try {
        const { title, description } = this.approvalForm.value
        const response = await this.http.post('geortd/rtdapprovalprocess/create',
          {
            name: title,
            description,
            attributes: JSON.stringify(this.data)
          }
        );
        console.log(response, 'response');
        this.uiService.showToast('success', 'Success', 'Approval Flow created successfully');
        this.uiService.closeDrawer(); // Close the drawer after submission
        await this.fetchRtdApprovalList(); // Refresh the department list after successful submission
      } catch (error) {
        console.error('Error submitting form:', error);
        this.uiService.showToast('error', 'Error', 'Failed to submit form');
      } finally {
        this.uiService.toggleLoader(false);
      }
    }

  }

    async fetchRtdApprovalList(): Promise<void> {
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.get('geortd/rtdapprovalprocess/list');
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
       
        this.uiService.openDrawer(this.createUpdateRtdApprovalContent, 'Rtd Approval', '!w-full md:!w-full lg:!w-full rounded-l-2xl');
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
            const response: any = await this.http.get('geortd/rtdapprovalprocess/getbyid', {}, this.selectedRowItems[0].id);
            console.log(response, 'response');
            this.data = JSON.parse(response?.data?.attributes);
            this.approvalForm.get('title')?.setValue(response?.data?.name);
            this.approvalForm.get('description')?.setValue(response?.data?.description);
            this.editData = response.data; // Assuming the response has a 'data' property containing the department details
            this.uiService.openDrawer(this.createUpdateRtdApprovalContent, 'Rtd Approval','!w-full md:!w-full lg:!w-full rounded-l-2xl');
        } catch (error) {
            console.error('Error fetching department details:', error);
            this.uiService.showToast('error', 'Error', 'Failed to fetch department details');
        } finally {
            this.uiService.toggleLoader(false);
        }
    }

    onNodeSelect(event: any): void {
        if (this.isAddingMode) {
            return; // Don't change selection while adding a new node
        }

        // When a node is selected, populate the form with its data
        const node = event.node;

        this.nodeForm.patchValue({
            label: node.label,
            email: node.data?.email || '',
            role: node.data?.role || '',
            department: node.data?.department || ''
        });
    }

    prepareAddChild(node: TreeNode, event: Event): void {
        // Prevent event propagation to avoid selecting the node
        event.stopPropagation();

        // Set parent node and enter adding mode
        this.parentNode = node;
        this.isAddingMode = true;

        // Reset form with default values
        this.nodeForm.reset({
            label: 'Click to set flow',
            email: '',
            role: '',
            department: ''
        });

        // Select text in label field for easy editing
        setTimeout(() => {
            const labelInput = document.getElementById('nodeLabel');
            if (labelInput) {
                (labelInput as HTMLInputElement).select();
                (labelInput as HTMLInputElement).focus();
            }
        }, 100);
    }

    confirmDeleteNode(node: TreeNode, event: Event): void {
        // Prevent event propagation to avoid selecting the node
        event.stopPropagation();

        if (this.isRootNode(node)) {
            return; // Don't allow deleting the root node
        }

        this.deleteNode(node);
    }

    deleteNode(nodeToDelete: TreeNode): void {
        // Helper function to find and remove a node from the tree
        const removeNodeFromChildren = (children: TreeNode[] | undefined): boolean => {
            if (!children || children.length === 0) {
                return false;
            }

            const index = children.findIndex((child) => child === nodeToDelete);
            if (index !== -1) {
                children.splice(index, 1);
                return true;
            }

            // Search recursively in children
            for (const child of children) {
                if (removeNodeFromChildren(child.children)) {
                    return true;
                }
            }

            return false;
        };

        // Start the removal process from the root
        removeNodeFromChildren(this.data);

        // Create a new reference to trigger change detection
        this.data = [...this.data];

        // Reset selection if the deleted node was selected
        if (this.selectedNode === nodeToDelete) {
            this.selectedNode = null;
            this.nodeForm.reset();
        }
    }

    saveChanges(): void {
        if (this.nodeForm.valid) {
            const formValues = this.nodeForm.value;

            if (this.isAddingMode && this.parentNode) {
                // Add new child node
                const newNode: TreeNode = {
                    label: formValues.label,
                    data: {
                        email: formValues.email,
                        role: formValues.role,
                        department: formValues.department
                    },
                    children: []
                };

                // Initialize children array if it doesn't exist
                if (!this.parentNode.children) {
                    this.parentNode.children = [];
                }

                // Add the new node
                this.parentNode.children.push(newNode);

                // Ensure parent is expanded
                this.parentNode.expanded = true;

                // Exit adding mode
                this.isAddingMode = false;
                this.parentNode = null;
            } else if (this.selectedNode) {
                // Update existing node
                this.selectedNode.label = formValues.label;

                // Ensure data object exists
                if (!this.selectedNode.data) {
                    this.selectedNode.data = {};
                }

                // Update data properties
                this.selectedNode.data.email = formValues.email;
                this.selectedNode.data.role = formValues.role;
                this.selectedNode.data.department = formValues.department;
            }

            // Create a new reference to trigger change detection
            this.data = [...this.data];

            // Optional: Show success message
            console.log('Changes saved successfully');
        }
    }

    cancelEdit(): void {
        if (this.isAddingMode) {
            this.isAddingMode = false;
            this.parentNode = null;
        }

        // Reset form if node is still selected
        if (this.selectedNode) {
            this.nodeForm.patchValue({
                label: this.selectedNode.label,
                email: this.selectedNode.data?.email || '',
                role: this.selectedNode.data?.role || '',
                department: this.selectedNode.data?.department || ''
            });
        } else {
            this.nodeForm.reset();
        }
    }

    isRootNode(node: TreeNode): boolean {
        // Check if this is the root node (no parent)
        return this.data.includes(node);
    }
}
