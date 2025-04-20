import { Component, TemplateRef, ViewChild } from '@angular/core';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';
import { UiService } from '../../../layout/service/ui.service';
import { GenericStepperComponent, StepConfig } from '../../../shared/components/generic-stepper/generic-stepper.component';
import { HttpService } from '../../service/http.service';
import { CommonModule } from '@angular/common';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';

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

interface VehicleType {
    id: number;
    name: string;
  }
  
  interface Toll {
    id: number;
    name: string;
  }
  
  interface TollPriceApiResponse {
    tollId: number;
    vehicleTypeId: number;
    price: number;
    toll: Toll;
    vehicleType: VehicleType;
  }
  
  interface TollPriceItem {
    id: string;                    // Local tracking ID
    tollId: number;                // Foreign key to toll
    vehicleTypeId: number | null;  // Foreign key to vehicle type
    price: number | null;          // Price amount
    selectedVehicleType: number | null; // Selected vehicle type for dropdown
    isNew: boolean;                // Flag to track if this is a new record
  }
  

@Component({
    selector: 'app-tolls',
    imports: [GenericTableComponent, GenericStepperComponent, CommonModule, SelectModule, FormsModule, InputNumberModule, ButtonModule],
    templateUrl: './tolls.component.html',
    styleUrl: './tolls.component.scss'
})
export class TollsComponent {
    @ViewChild('createUpdateTollsContent') createUpdateTollsContent!: TemplateRef<any>;
    @ViewChild('setUpdateDeleteTollPrice') setUpdateDeleteTollPrice!: TemplateRef<any>;
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
            key: 'setTollPrice',
            label: 'Set Toll Price',
            icon: 'pi pi-sync',
            severity: 'secondary',
            outlined: true,
            dependentOnRow: true
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
                    placeholder: 'Select a Route Type',
                    autoFetch: false
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

    vehicleTypes = [
        { id: 1, name: 'AMBULANCE' },
        { id: 2, name: 'BUS' },
        { id: 3, name: 'CAR' },
        { id: 4, name: 'HEAVY TRUCK' },
        { id: 5, name: 'LIGHT TRUCK' },
        { id: 6, name: 'MOTORBIKE' }
      ];

      tollPriceItems: TollPriceItem[] = [];
  
  // Track already assigned vehicle types to prevent duplicates
  assignedVehicleTypeIds: Set<number> = new Set();

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
        } else if(event.key === 'setTollPrice') {
            console.log(event);
            await this.setTollPrice()
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

    // Individual action methods with explicit return types
    private async setTollPrice(): Promise<void> {
        this.uiService.openDrawer(this.setUpdateDeleteTollPrice, 'Set Toll Price', '!w-[35vw] md:!w-[35vw] lg:!w-[35vw] rounded-l-2xl');
        await this.loadTollPrices()
        // Logic for setting toll price
    }

    async loadTollPrices(): Promise<void> {

        try {
            const response: any = await this.http.get(`geortd/rtdtoll/getbyid/${this.routeId}`, {}, this.selectedRowItems[0]?.id);
            const {tollPriceVehicleTypes} = response?.data
            this.processTollPricesResponse(tollPriceVehicleTypes);
        } catch (error) {
            this.uiService.showToast('error','Error','Failed To get toll')
        }
      }
      
      processTollPricesResponse(data: TollPriceApiResponse[]): void {
        // Clear existing items
        this.tollPriceItems = [];
        this.assignedVehicleTypeIds.clear();
        
        // Process each item from API
        data.forEach(item => {
          this.assignedVehicleTypeIds.add(item.vehicleTypeId);
          
          this.tollPriceItems.push({
            id: crypto.randomUUID(),
            tollId: item.tollId,
            vehicleTypeId: item.vehicleTypeId,
            price: item.price,
            selectedVehicleType: item.vehicleTypeId,
            isNew: false
          });
        });
        
        // Always add an empty row at the end if needed
        if (this.tollPriceItems.length === 0) {
          this.addNewTollPriceItem();
        }
      }
    
      addNewTollPriceItem(): void {
        this.tollPriceItems.push({
          id: crypto.randomUUID(),
          tollId: this.selectedRowItems[0]?.id,
          vehicleTypeId: null,
          selectedVehicleType: null,
          price: null,
          isNew: true
        });
      }
    



    removeTollPriceItem(index: number): void {
        const item = this.tollPriceItems[index];
        
        // If removing a selected vehicle type, remove from tracking set
        if (item.vehicleTypeId !== null) {
          this.assignedVehicleTypeIds.delete(item.vehicleTypeId);
        }
        
        this.tollPriceItems.splice(index, 1);
      }
      
      onVehicleTypeChange(item: TollPriceItem): void {
        // Remove old vehicle type from tracking if it existed
        if (item.vehicleTypeId !== null) {
          this.assignedVehicleTypeIds.delete(item.vehicleTypeId);
        }
        
        // Update the vehicleTypeId with the selected value
        item.vehicleTypeId = item.selectedVehicleType;
        
        // Add new vehicle type to tracking
        if (item.vehicleTypeId !== null) {
          this.assignedVehicleTypeIds.add(item.vehicleTypeId);
        }
      }
    
      async saveTollPrices(): Promise<void> {
        // Validate data
        const incompleteItems = this.tollPriceItems.filter(
          item => item.selectedVehicleType === null || item.price === null
        );
        
        if (incompleteItems.length > 0) {
            this.uiService.showToast('warn','Incomplete Data','Please complete all vehicle type and price fields')
          return;
        }
        
        // Check for duplicate vehicle types
        const uniqueVehicleTypes = new Set(
          this.tollPriceItems.map(item => item.vehicleTypeId).filter(id => id !== null)
        );
        
        if (uniqueVehicleTypes.size !== this.tollPriceItems.length) {
            this.uiService.showToast('error','Duplicate Vehicle Types','Each vehicle type can only have one price entry')
          return;
        }
        
        // Prepare data for API
        const priceUpdates = this.tollPriceItems
          .filter(item => item.vehicleTypeId !== null && item.price !== null)
          .map(item => ({
            tollId: this.selectedRowItems[0]?.id,
            vehicleTypeId: item.vehicleTypeId,
            price: item.price
          }));
        
        console.log('Saving toll prices:', priceUpdates);

        try {
            const {id, name, rtdDirection} = this.selectedRowItems[0];
            const payload = {
                id,
                name,
                rtdDirection,
                tollPriceVehicleTypes: priceUpdates
            }
            const response = await this.http.post('geortd/rtdtoll/UpdateTollPrice', payload);
            this.uiService.closeDrawer();
            this.uiService.showToast('success','Success','Toll prices updated successfully');
            await this.fetchTollsListRouteWise(this.routeId); // Refresh the department list after successful submission
        } catch (error) {
            this.uiService.showToast('error','Error','Failed to update toll prices')
        }
      }
}
