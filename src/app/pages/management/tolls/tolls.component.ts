import { Component, TemplateRef, ViewChild } from '@angular/core';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';
import { UiService } from '../../../layout/service/ui.service';
import { GenericStepperComponent, StepConfig } from '../../../shared/components/generic-stepper/generic-stepper.component';
import { HttpService } from '../../service/http.service';

// Define action types for better type safety
type TollPriceActionType = 'setTollPrice' | 'updateTollPrice' | 'deleteTollPrice';

// Define the structure of each menu item
interface SplitButtonItem {
    id: string;
    label: string;
    icon?: string;
    disabled?: boolean;
    command: () => void;
}

// Define the structure of a toolbar action
interface ToolbarSplitAction {
    label: string;
    key: string;
    items: SplitButtonItem[];
}

@Component({
    selector: 'app-tolls',
    imports: [GenericTableComponent, GenericStepperComponent],
    templateUrl: './tolls.component.html',
    styleUrl: './tolls.component.scss'
})
export class TollsComponent {
    @ViewChild('createUpdateTollsContent') createUpdateTollsContent!: TemplateRef<any>;
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
        }
    ];

    toolBarSplitActions: ToolbarSplitAction[] = [
        {
            label: 'Toll Price Manager',
            key: 'tollPriceManager',
            items: [
                {
                    id: 'setTollPrice',
                    label: 'Set Toll Price',
                    // icon: 'pi pi-plus-circle',
                    command: () => this.handleTollPriceAction('setTollPrice')
                },
                {
                    id: 'updateTollPrice',
                    label: 'Update Toll Price',
                    // icon: 'pi pi-pencil',
                    command: () => this.handleTollPriceAction('updateTollPrice')
                },
                {
                    id: 'deleteTollPrice',
                    label: 'Delete Toll Price',
                    // icon: 'pi pi-trash',
                    command: () => this.handleTollPriceAction('deleteTollPrice')
                }
            ]
        }
    ];

    tableConfig = {
        title: 'Manage Tolls Route Wise',
        dataKey: 'id',
        columns: [
            { field: 'name', header: 'Name', minWidth: '12rem' },
            { field: 'latitude', header: 'Latitude', minWidth: '12rem' },
            { field: 'longitude', header: 'Longitude', minWidth: '12rem' },
            { field: 'description', header: 'Description', minWidth: '12rem' },
            { field: 'rtd', header: 'Route', minWidth: '10rem', subfield: 'name' }
        ],
        globalFilterFields: ['name'],
        filterTableDrpdown: {
            fieldId: 'rtd',
            type: 'dropdown',
            apiType: 'rtd',
            required: true,
            placeholder: 'Select a Route to see Tolls',
            dependsOn: null,
            autoFetch: true
        }
    };

    tableData = [];
    routeId!: number;

    formSteps: StepConfig[] = [
        {
            stepId: 'basic',
            title: 'Basic Details',
            fields: [
                {
                    fieldId: 'name',
                    type: 'text',
                    label: 'Toll Name',
                    required: true,
                    placeholder: 'Enter toll name'
                },
                {
                    fieldId: 'exCode',
                    type: 'text',
                    label: 'External Code',
                    required: true,
                    placeholder: 'Enter code'
                },
                {
                    fieldId: 'rtd',
                    type: 'dropdown',
                    apiType: 'rtd',
                    label: 'Route',
                    required: true,
                    placeholder: 'Select a Route',
                    dependsOn: null
                },
                {
                    fieldId: 'rtdDirection',
                    type: 'dropdown',
                    options: [
                        { name: 'Sorce To Destination', value: 'sourceToDestination' },
                        { name: 'Destination To Source', value: 'destinationToSource' }
                    ],
                    label: 'Route Type',
                    required: true,
                    placeholder: 'Select a Route Type'
                },
                {
                    fieldId: 'latitude',
                    type: 'number',
                    label: 'Latitude',
                    required: true,
                    placeholder: 'Enter toll latitude'
                },
                {
                    fieldId: 'longitude',
                    type: 'number',
                    label: 'Longitude',
                    required: true,
                    placeholder: 'Enter tol longitude'
                },
                {
                    fieldId: 'description',
                    type: 'textarea',
                    label: 'Description',
                    required: false,
                    placeholder: 'Enter description'
                }
            ]
        }
    ];

    constructor(
        private uiService: UiService,
        private http: HttpService
    ) {}

    ngOnInit(): void {}

    onStepChange(event: { stepIndex: number; data: any }) {
        console.log('Step changed:', event);
        // Here you could call an API to validate the step if needed
    }

    async onFormSubmit(formData: any): Promise<void> {
        console.log('Form submitted with data:', formData);
        if (this.isEditMode) {
            this.uiService.toggleLoader(true);
            const { name, latitude, longitude, rtd, exCode, rtdDirection, description } = formData;
            const payload = {
                id: this.selectedRowItems[0]?.id,
                name,
                exCode,
                latitude,
                longitude,
                description,
                rtdId: rtd?.id,
                rtdDirection: rtdDirection?.value
            };
            try {
                const response = await this.http.put('geortd/rtdtoll/modify', this.selectedRowItems[0].id, payload);
                console.log(response, 'response');
                this.uiService.showToast('success', 'Success', 'Toll updated successfully');
                this.uiService.closeDrawer(); // Close the drawer after submission
                await this.fetchTollsListRouteWise(this.routeId); // Refresh the department list after successful submission
            } catch (error) {
                console.error('Error submitting form:', error);
                this.uiService.showToast('error', 'Error', 'Failed to submit form');
            } finally {
                this.uiService.toggleLoader(false);
            }
        } else {
            this.uiService.toggleLoader(true);
            const { name, latitude, longitude, rtd, rtdDirection, exCode, description } = formData;
            const payload = {
                name,
                exCode,
                latitude,
                longitude,
                description,
                rtdId: rtd?.id,
                rtdDirection: rtdDirection?.value
            };
            try {
                const response = await this.http.post('geortd/rtdtoll/create', payload);
                console.log(response, 'response');
                this.uiService.showToast('success', 'Success', 'Toll created successfully');
                this.uiService.closeDrawer(); // Close the drawer after submission
                await this.fetchTollsListRouteWise(this.routeId); // Refresh the department list after successful submission
            } catch (error) {
                console.error('Error submitting form:', error);
                this.uiService.showToast('error', 'Error', 'Failed to submit form');
            } finally {
                this.uiService.toggleLoader(false);
            }
        }
        // Handle form submission
    }

    async fetchTollsListRouteWise(routeId: number): Promise<void> {
        console.log(routeId);

        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.get('geortd/rtdtoll/list', {}, routeId);
            console.log(response, 'response');
            this.tableData = response.data; // Assuming the response has a 'data' property containing the list of departments
            // Handle the response data as needed
            this.selectedRowItems = []; // Reset selected items after fetching new data
        } catch (error) {
            console.error('Error fetching role list:', error);
            this.tableData = [];
            this.uiService.showToast('error', 'Error', 'Failed to fetch tolls list');
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
        this.uiService.openDrawer(this.createUpdateTollsContent, 'Toll Management');
    }

    async deleteSelectedRole(): Promise<void> {
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.delete('geortd/roles/delete', this.selectedRowItems[0].id);
            console.log(response, 'response');
            this.uiService.showToast('success', 'Success', 'Role deleted successfully');
            // await this.fetchTollsListRouteWise(); // Refresh the department list after deletion
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
            const response: any = await this.http.get(`geortd/rtdtoll/getbyid/${this.routeId}`, {}, this.selectedRowItems[0].id);
            console.log(response, 'response');
            this.editData = response.data; // Assuming the response has a 'data' property containing the department details
            this.uiService.openDrawer(this.createUpdateTollsContent, 'Toll Management');
        } catch (error) {
            console.error('Error fetching department details:', error);
            this.uiService.showToast('error', 'Error', 'Failed to fetch department details');
        } finally {
            this.uiService.toggleLoader(false);
        }
    }

    async handleTableDropDownFilter(event: any): Promise<void> {
        console.log(event);
        this.routeId = event?.id;
        await this.fetchTollsListRouteWise(this.routeId);
    }

    // Type-safe action handler with defined action types
    handleTollPriceAction(actionType: TollPriceActionType): void {
        // Type-safe object mapping
        const actionHandlers: Record<TollPriceActionType, () => void> = {
            setTollPrice: () => {
                console.log('Setting toll price');
                this.setTollPrice();
            },
            updateTollPrice: () => {
                console.log('Updating toll price');
                this.updateTollPrice();
            },
            deleteTollPrice: () => {
                console.log('Deleting toll price');
                this.deleteTollPrice();
            }
        };

        // Using the type-safe action handlers
        actionHandlers[actionType]();
    }

    // Individual action methods with explicit return types
    private setTollPrice(): void {
        // Logic for setting toll price
    }

    private updateTollPrice(): void {
        // Logic for updating toll price
    }

    private deleteTollPrice(): void {
        // Logic for deleting toll price
    }
}
