import { Component, OnInit, TemplateRef, viewChild, ViewChild } from '@angular/core';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';
import { GenericStepperComponent, StepConfig } from '../../../shared/components/generic-stepper/generic-stepper.component';
import { UiService } from '../../../layout/service/ui.service';
import { FormsModule } from '@angular/forms';
import { GenericGmRouteComponent } from "../../../shared/components/generic-gm-route/generic-gm-route.component";
import { environment } from '../../../../environments/environment.prod';
import { HttpService } from '../../service/http.service';
import { GenericViewOnMapComponent } from '../../../shared/components/generic-view-on-map/generic-view-on-map.component';

@Component({
    selector: 'app-routes',
    imports: [GenericTableComponent, FormsModule, GenericGmRouteComponent, GenericStepperComponent, GenericViewOnMapComponent],
    templateUrl: './routes.component.html',
})
export class RoutesComponent implements OnInit {
    @ViewChild('createUpdateRouteContent') createUpdateRouteContent!: TemplateRef<any>;
    @ViewChild('checkRouteTollsContent') checkRouteTollsContent!:TemplateRef<any>;

    selectedRowItems: any[] = [];
    isEditMode = false;

    editData: any = null;

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
            key: 'checkTolls',
            label: 'Check Tolls',
            icon: 'pi pi-map-marker',
            severity: 'primary',
            outlined: true,
            dependentOnRow: true
        }
    ];

    currentRoute: any = null;

    tableConfig = {
        title: 'Manage Routes',
        columns: [
            { field: 'name', header: 'Name', minWidth: '12rem' },
            { field: 'source', header: 'Source Name', subfield: 'name', minWidth: '15rem' },
            { field: 'destination', header: 'Destination Name', subfield: 'name', minWidth: '15rem' },
            { field: 'sourceDept', header: 'Source Dept', subfield: 'name', minWidth: '15rem' },
            { field: 'destinationDept', header: 'Destination Name', subfield: 'name', minWidth: '15rem' },
            { field: 'startDate', header: 'Start Date', minWidth: '15rem' },
            { field: 'endDate', header: 'End Date', minWidth: '15rem' },
        ],
        globalFilterFields: [],
        dataKey: 'id'
    };

    formSteps: StepConfig[] = [
        {
            stepId: 'route_management',
            title: '',
            fields: [
                {
                    fieldId: 'name',
                    type: 'text',
                    label: 'Route Name',
                    required: true,
                    placeholder: 'Enter a name'
                },
                {
                    fieldId: 'source_address',
                    type: 'autocomplete',
                    apiType: 'geortd/address/SearchAddress',
                    label: 'Source Address',
                    required: true,
                    placeholder: 'Select a Address'
                },
                {
                    fieldId: 'destination_address',
                    type: 'autocomplete',
                    apiType: 'geortd/address/SearchAddress',
                    label: 'Destination Address',
                    required: true,
                    placeholder: 'Select a Address'
                },
                {
                    fieldId: 'source_department',
                    type: 'dropdown',
                    apiType: 'department',
                    label: 'Source Department',
                    required: true,
                    placeholder: 'Select a Department',
                    dependsOn: null
                },
                {
                    fieldId: 'destination_department',
                    type: 'dropdown',
                    apiType: 'department',
                    label: 'Department Department',
                    required: true,
                    placeholder: 'Select a Department',
                    dependsOn: null
                },
                {
                    fieldId: 'startDate',
                    type: 'text',
                    label: 'Start Date',
                    required: true,
                    placeholder: 'Enter a date'
                },
                {
                    fieldId: 'endDate',
                    type: 'text',
                    label: 'End Date',
                    required: true,
                    placeholder: 'Enter a date'
                }
            ]
        }
    ];

    tableData = [];

    mapObject:any = null

    constructor(
        private uiService: UiService,
        private http: HttpService
    ) {}

    ngOnInit(): void {
        //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
        //Add 'implements OnInit' to the class.
        this.fetchRtdList();
    }

    async handleToolBarActions(event: any): Promise<void> {
      if (event.key === 'new') {
        this.openNew();
      } else if (event.key === 'delete') {
        await this.deleteSelectedRoute();
      } else if (event.key === 'edit') {
        await this.handleEditRoute();
      } else if (event.key === 'checkTolls') {
        await this.handleRouteWithTolls();
      }
    }

    async handleRouteWithTolls(): Promise<void> {
        this.uiService.toggleLoader(true);
        try {
          // First get the route data
          const routeResponse: any = await this.http.get('geortd/rtd/GetById', {}, this.selectedRowItems[0].id);
          const { source, destination, attributes } = routeResponse.data;
          
          // Then get the tolls data
          const tollsResponse: any = await this.http.get('geortd/rtdtoll/list', {}, this.selectedRowItems[0]?.id);
          
          // Combine all data into mapObject
          this.mapObject = {
            source,
            destination,
            routeData: JSON.parse(attributes),
            tolls: tollsResponse?.data
          };
          
          // Open drawer with combined data
          this.uiService.openDrawer(this.checkRouteTollsContent, 'View Route', '!w-[98vw] md:!w-[98vw] lg:!w-[98vw] rounded-l-2xl');
          
        } catch (error) {
          this.uiService.showToast('error', 'Error', 'Failed to fetch route or toll details');
        } finally {
          this.uiService.toggleLoader(false);
        }
      }

    async handleEditRoute(): Promise<void> {
      this.formSteps = [
        {
            stepId: 'route_management',
            title: '',
            fields: [
                {
                    fieldId: 'name',
                    type: 'text',
                    label: 'Route Name',
                    required: true,
                    placeholder: 'Enter a name'
                },
                {
                    fieldId: 'source_department',
                    type: 'dropdown',
                    apiType: 'department',
                    label: 'Source Department',
                    required: true,
                    placeholder: 'Select a Department',
                    dependsOn: null
                },
                {
                    fieldId: 'destination_department',
                    type: 'dropdown',
                    apiType: 'department',
                    label: 'Department Department',
                    required: true,
                    placeholder: 'Select a Department',
                    dependsOn: null
                },
                {
                    fieldId: 'startDate',
                    type: 'text',
                    label: 'Start Date',
                    required: true,
                    placeholder: 'Enter a date'
                },
                {
                    fieldId: 'endDate',
                    type: 'text',
                    label: 'End Date',
                    required: true,
                    placeholder: 'Enter a date'
                }
            ]
        }
    ];
      this.isEditMode = true;
      this.uiService.toggleLoader(true);
      try {
        const response: any = await this.http.get('geortd/rtd/GetById', {}, this.selectedRowItems[0].id);
        const { source,destination,sourceDept, destinationDept, name, attributes, id, startDate, endDate } = response.data;
        this.selectedSource = source;
        this.selectedDestination = destination;
        const route = JSON.parse(attributes)
        
        this.currentRoute = route?.route
        this.editData = {
         name,
         source_address:source,
         destination_address: destination,
         destination_department: destinationDept,
         source_department: sourceDept,
         endDate,
         startDate
        };
        this.uiService.openDrawer(this.createUpdateRouteContent, 'Route Management', '!w-[98vw] md:!w-[98vw] lg:!w-[98vw] rounded-l-2xl');
        
      } catch (error) {
        this.uiService.showToast('error', 'Error', 'Failed to fetch address details');
      }   finally {
        this.uiService.toggleLoader(false);
      }

    }

    async deleteSelectedRoute(): Promise<void> {
      this.uiService.toggleLoader(true);
      try {
        const response: any = await this.http.delete('geortd/rtd/delete', this.selectedRowItems[0].id);
        this.uiService.showToast('success', 'Success', 'Route deleted successfully');
        await this.fetchRtdList(); // Refresh the address list after deletion
      } catch (error) {
        this.uiService.showToast('error', 'Error', 'Failed to delete address');
      } finally {
        this.uiService.toggleLoader(false);
      }
    }

    async fetchRtdList(): Promise<void> {
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.get('geortd/rtd/list');
            this.tableData = response.data; // Assuming the response has a 'data' property containing the list of departments
            // Handle the response data as needed
            this.selectedRowItems = []; // Reset selected items after fetching new data
        } catch (error) {
            this.uiService.showToast('error', 'Error', 'Failed to fetch role list');
        } finally {
            this.uiService.toggleLoader(false);
        }
    }

    openNew() {
        this.selectedRowItems = []; // Reset selected items when opening new form\
        this.isEditMode = false;
        this.selectedSource = null;
        this.selectedDestination = null;
        this.currentRoute = null;
        this.formSteps = [
            {
                stepId: 'route_management',
                title: '',
                fields: [
                    {
                        fieldId: 'name',
                        type: 'text',
                        label: 'Route Name',
                        required: true,
                        placeholder: 'Enter a name'
                    },
                    {
                        fieldId: 'source_address',
                        type: 'autocomplete',
                        apiType: 'geortd/address/SearchAddress',
                        label: 'Source Address',
                        required: true,
                        placeholder: 'Select a Address'
                    },
                    {
                        fieldId: 'destination_address',
                        type: 'autocomplete',
                        apiType: 'geortd/address/SearchAddress',
                        label: 'Destination Address',
                        required: true,
                        placeholder: 'Select a Address'
                    },
                    {
                        fieldId: 'source_department',
                        type: 'dropdown',
                        apiType: 'department',
                        label: 'Source Department',
                        required: true,
                        placeholder: 'Select a Department',
                        dependsOn: null
                    },
                    {
                        fieldId: 'destination_department',
                        type: 'dropdown',
                        apiType: 'department',
                        label: 'Department Department',
                        required: true,
                        placeholder: 'Select a Department',
                        dependsOn: null
                    },
                    {
                        fieldId: 'startDate',
                        type: 'text',
                        label: 'Start Date',
                        required: true,
                        placeholder: 'Enter a date'
                    },
                    {
                        fieldId: 'endDate',
                        type: 'text',
                        label: 'End Date',
                        required: true,
                        placeholder: 'Enter a date'
                    }
                ]
            }
        ];
        this.editData = null;
        this.uiService.openDrawer(this.createUpdateRouteContent, 'Route Management', '!w-[98vw] md:!w-[98vw] lg:!w-[98vw] rounded-l-2xl');
    }

    onStepChange(event: { stepIndex: number; data: any }) {
        // Here you could call an API to validate the step if needed
    }

    async onFormSubmit(formData: any): Promise<void> {
      if(this.isEditMode) {
        this.uiService.toggleLoader(true);
        const { name, startDate, endDate, destination_department, source_department } = formData;
        const payload = {
          id: this.selectedRowItems[0].id,
          name,
          startDate,
          endDate,
          sourceId:this.editData.source_address?.id,
          destinationId: this.editData.destination_address?.id,
          sourceDeptId:source_department?.id,
          destinationDeptId: destination_department?.id,
          reason: "test reason",
          attributes: JSON.stringify( { route: this.currentRoute } )
        }
        
        try {
          const response = await this.http.put('geortd/rtd/modify', this.selectedRowItems[0].id, payload);
          this.uiService.showToast('success', 'Success', 'Route updated successfully');
          this.uiService.closeDrawer(); // Close the drawer after submission
          await this.fetchRtdList(); // Refresh the department list after successful submission
        } catch (error) {
          this.uiService.showToast('error', 'Error', 'Failed to submit form');
        } finally {
          this.uiService.toggleLoader(false);
        }

      } else {
        this.uiService.toggleLoader(true);
        const { name, startDate, endDate, destination_address, destination_department, source_address, source_department } = formData;
        const payload = {
          name,
          startDate,
          endDate,
          sourceId:source_address?.id,
          destinationId: destination_address?.id,
          sourceDeptId:source_department?.id,
          destinationDeptId: destination_department?.id,
          reason: "test reason",
          attributes:JSON.stringify({route:this.currentRoute})
        }

          try {
              const response = await this.http.post('geortd/rtd/create', payload);
              this.uiService.showToast('success', 'Success', 'Route created successfully');
              this.uiService.closeDrawer(); // Close the drawer after submission
              await this.fetchRtdList(); // Refresh the department list after successful submission
          } catch (error) {
              this.uiService.showToast('error', 'Error', 'Failed to submit form');
          } finally {
              this.uiService.toggleLoader(false);
          }
      }
    }

    handleRowSelectionChange(event: any): void {
        this.selectedRowItems = event;
    }

    selectedSource: any = null;
    selectedDestination: any = null;
    googleMapsApiKey = environment.googleMapsApiKey;

    onLocationChange(): void {
        // The route will be automatically created by the GoogleMapsComponent
        // when both source and destination coordinates are provided
    }

    onRouteCreated(route: any): void {
        this.currentRoute = route;
    }

    onRouteSelected(route: any): void {
        this.currentRoute = route;
    }

    handleStepperAutoComplete({ value, fieldId }: any) {
        if (fieldId === 'source_address') {
            this.selectedSource = value;
        } else {
            this.selectedDestination = value;
        }
    }
}
