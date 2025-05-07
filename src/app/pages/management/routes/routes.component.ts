import { Component, OnInit, TemplateRef, viewChild, ViewChild } from '@angular/core';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';
import { GenericStepperComponent, StepConfig } from '../../../shared/components/generic-stepper/generic-stepper.component';
import { UiService } from '../../../layout/service/ui.service';
import { FormsModule } from '@angular/forms';
import { GenericGmRouteComponent } from "../../../shared/components/generic-gm-route/generic-gm-route.component";
import { environment } from '../../../../environments/environment.prod';
import { HttpService } from '../../service/http.service';
import { GenericViewOnMapComponent } from '../../../shared/components/generic-view-on-map/generic-view-on-map.component';
import { PdfService } from '../../service/pdf.service';
import { DatePipe, CurrencyPipe } from '@angular/common';

@Component({
    selector: 'app-routes',
    imports: [GenericTableComponent, FormsModule,DatePipe,CurrencyPipe, GenericGmRouteComponent, GenericStepperComponent, GenericViewOnMapComponent],
    templateUrl: './routes.component.html',
})
export class RoutesComponent implements OnInit {
    @ViewChild('createUpdateRouteContent') createUpdateRouteContent!: TemplateRef<any>;
    @ViewChild('checkRouteTollsContent') checkRouteTollsContent!: TemplateRef<any>;
    @ViewChild('linkRtdAproval') linkRtdAproval!: TemplateRef<any>;
    @ViewChild('approveRtdContent') approveRtdContent!: TemplateRef<any>;

    selectedRowItems: any[] = [];
    isEditMode = false;
    editData: any = null;
    selectedRouteJson: any = null;
    tableData: any[] = [];
    mapObject: any = null;
    editRouteJson: any = null;
    selectedSource: any = null;
    selectedDestination: any = null;
    currentSelectedTableFilterStatus: any = 'all'; 
    googleMapsApiKey = environment.googleMapsApiKey;
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
            key: 'approve',
            label: 'Approve',
            icon: 'pi pi-check-circle',
            severity: 'primary',
            outlined: true,
            dependentOnRow: true
        },
        {
            key: 'checkTolls',
            label: 'View',
            icon: 'pi pi-eye',
            severity: 'primary',
            outlined: true,
            dependentOnRow: true
        },
        {
            key: 'linkApproval',
            label: 'Link Rtd',
            icon: 'pi pi-link',
            severity: 'primary',
            outlined: true,
            dependentOnRow: true
        },
        {
          key: 'op46Download',
          label: 'Download',
          icon: 'pi pi-download',
          severity: 'primary',
          outlined: true,
          dependentOnRow: true
      }
    ];

    tableConfig = {
        title: 'Manage RTD',
        columns: [
            { field: 'name', header: 'Name', minWidth: '12rem' },
            { field: 'source', header: 'Source Name', subfield: 'name', minWidth: '15rem' },
            { field: 'destination', header: 'Destination Name', subfield: 'name', minWidth: '15rem' },
            { field: 'sourceDept', header: 'Source Dept', subfield: 'name', minWidth: '15rem' },
            { field: 'destinationDept', header: 'Destination Name', subfield: 'name', minWidth: '15rem' },
            { field: 'startDate', header: 'Start Date', minWidth: '15rem', date: true },
            { field: 'endDate', header: 'End Date', minWidth: '15rem', date: true },
        ],
        globalFilterFields: [],
        dataKey: 'id'
    };

    tableFilterByStatusConfig = [{ label: 'All', value: 'all' },{ label: 'Pending', value: 'pending' },{ label: 'Completed', value: 'completed' }];

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
                  type: 'date',
                  selectionMode: 'single',
                  dateFormat: 'yy-mm-dd',
                  label: 'Start Date',
                  required: true,
                  placeholder: 'Enter a date'
              },
              {
                  fieldId: 'endDate',
                  type: 'date',
                  selectionMode: 'single',
                  dateFormat: 'yy-mm-dd',
                  label: 'End Date',
                  required: true,
                  placeholder: 'Enter a date'
              },
              {
                fieldId: 'reason',
                type: 'dropdown',
                options: [
                    { name: 'First Time Geo-RTD', id: 'First Time Geo-RTD' },
                    { name: 'Renew of Geo-RTD', id: 'Renew of Geo-RTD' },
                    { name: 'Route Not utilized for 1 year or more', id: 'Route Not utilized for 1 year or more' },
                    { name: 'New Route Identified', id: 'New Route Identified' },
                    { name: 'Any Other', id: 'Any Other' }

                ],
                label: 'Reason for New RTD',
                required: true,
                placeholder: 'Select a Reason',
            },
              {
                fieldId: 'comment',
                type: 'textarea',
                label: 'Comment',
                required: false,
                placeholder: 'Enter description'
            }
            ]
        }
    ];

    constructor(
        private uiService: UiService,
        private http: HttpService,
        private pdfService:PdfService
    ) {}

    ngOnInit(): void {
        //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
        //Add 'implements OnInit' to the class.
        this.fetchRtdList(this.currentSelectedTableFilterStatus);
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
      } else if(event.key === 'linkApproval') {
        await this.handleLinkApproval();
      } else if(event.key === 'approve') {
        this.uiService.toggleLoader(true);
        const {id, tblRtdApproval} = this.selectedRowItems[0] || {};
        try {
          const response: any = await this.http.post('geortd/RtdApproval/GetCurrentStep',{rtdId: id, approvalId: tblRtdApproval?.id} );
          const routes: any = await this.http.get('geortd/rtd/GetById', {}, id);
          const {attributes} = routes.data;
          const parsedAttributes = JSON.parse(attributes);
          console.log(parsedAttributes);
          
          this.mapObject = {
            source: routes.data.source,
            destination: routes.data.destination,
            routeData: parsedAttributes?.route,
          }
          
          this.formSteps = [
            {
                stepId: 'arrove_rtd',
                title: '',
                fields: [
                    {
                        fieldId: 'next_available_steps',
                        type: 'dropdown',
                        label: 'Available Next Steps',
                        required: true,
                        placeholder: 'Select a Step',
                        dependsOn: null,
                        options: response?.data?.steps.map((step: any) => ({
                            name: step?.name,
                            id: step
                        }))
                    },
                    {
                        fieldId: 'comment',
                        type: 'text',
                        label: 'Comment',
                        required: true,
                        placeholder: 'Enter a name'
                    },
                   
                ]
            }
          ]
          this.uiService.openDrawer(this.approveRtdContent, 'Approve Rtd','!w-[98vw] md:!w-[98vw] lg:!w-[98vw] rounded-l-2xl');
        } catch (error: any) {
          this.uiService.showToast('error', 'Error', error?.error?.data);
        } finally {
          this.uiService.toggleLoader(false);
        }
      } else if(event.key === 'op46Download') {
        try {
            const response: any = await this.http.get('geortd/rtd/GetById', {}, this.selectedRowItems[0].id);
            const { source, destination, attributes } = response.data;
            const {route} = JSON.parse(attributes);
            const {StD, DtoS} = route;
            const pdfObject = {
                source,
                StD,
                DtoS,
                destination
            }
            this.pdfService.generateOpCertificate(pdfObject)
        } catch (error) {
            
        }
      }
    }

    async handleLinkApproval(): Promise<void> {
        this.uiService.openDrawer(this.linkRtdAproval, 'View Route');

        this.formSteps = [
            {
                stepId: 'link_approval_to_rtd',
                title: '',
                fields: [
                    {
                        fieldId: 'approval',
                        type: 'dropdown',
                        apiType: 'RtdApproval',
                        label: 'Approval',
                        required: true,
                        placeholder: 'Select A Flow',
                        dependsOn: null,
                        autoFetch:true
                    },
                ]
            }
        ]
    }

    async handleRouteWithTolls(): Promise<void> {
        this.uiService.toggleLoader(true);
        
        try {
          // First get the route data
          const routeResponse: any = await this.http.get('geortd/rtd/GetById', {}, this.selectedRowItems[0]?.id)
            .catch(error => {
              console.error('Error fetching route data:', error);
              throw new Error('Failed to fetch route data');
            });
          
          if (!routeResponse?.data) {
            throw new Error('Invalid route data received');
          }
          
          const { source,sourceDept, destination,destinationDept, attributes, startDate,endDate } = routeResponse.data;
          
          // Handle potential JSON parsing errors
          let parsedAttributes: any = {};
          try {
            parsedAttributes = attributes ? JSON.parse(attributes) : {};
          } catch (jsonError) {
            console.error('Error parsing route attributes:', jsonError);
            // Continue with empty attributes rather than failing
          }
          
          // Then get the tolls data
          const tollsResponse: any = await this.http.get('geortd/rtdtoll/list', {}, this.selectedRowItems[0]?.id)
            .catch(error => {
              console.error('Error fetching tolls data:', error);
              // Return an object with empty data array instead of failing
              return { data: [] };
            });
          
          // Combine all data into mapObject with fallbacks for missing data
          this.mapObject = {
            source: source || '',
            sourceDept,
            destination: destination || '',
            destinationDept,
            routeData: parsedAttributes?.route || [],
            tolls: tollsResponse?.data || [],
            startDate,
            endDate,
          };
          
          // Open drawer with combined data
          this.uiService.openDrawer(
            this.checkRouteTollsContent, 
            'View RTD', 
            '!w-[98vw] md:!w-[98vw] lg:!w-[98vw] rounded-l-2xl'
          );
        } catch (error: any) {
          console.error('Error in handleRouteWithTolls:', error);
          
          // Set empty defaults to prevent UI issues
          this.mapObject = {
            source: '',
            destination: '',
            routeData: [],
            tolls: []
          };
          
          // Show user-friendly error message
          const errorMessage = error?.error?.data || error?.message || 'An unexpected error occurred';
          this.uiService.showToast('error', 'Error', errorMessage);
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
                        type: 'date',
                        selectionMode: 'single',
                        dateFormat: 'yy-mm-dd',
                        label: 'Start Date',
                        required: true,
                        placeholder: 'Enter a date'
                    },
                    {
                        fieldId: 'endDate',
                        type: 'date',
                        selectionMode: 'single',
                        dateFormat: 'yy-mm-dd',
                        label: 'End Date',
                        required: true,
                        placeholder: 'Enter a date'
                    },
                    {
                        fieldId: 'reason',
                        type: 'dropdown',
                        options: [
                            { name: 'First Time Geo-RTD', id: 'First Time Geo-RTD' },
                            { name: 'Renew of Geo-RTD', id: 'Renew of Geo-RTD' },
                            { name: 'Route Not utilized for 1 year or more', id: 'Route Not utilized for 1 year or more' },
                            { name: 'New Route Identified', id: 'New Route Identified' },
                            { name: 'Any Other', id: 'Any Other' }
                        ],
                        label: 'Reason for New RTD',
                        required: true,
                        placeholder: 'Select a Reason',
                    },
                      {
                        fieldId: 'comment',
                        type: 'textarea',
                        label: 'Comment',
                        required: false,
                        placeholder: 'Enter description'
                    }
                ]
            }
        ];
        this.isEditMode = true;
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.get('geortd/rtd/GetById', {}, this.selectedRowItems[0].id);
            const { source, destination, sourceDept, destinationDept, name, attributes, startDate, endDate } = response.data;
            this.selectedSource = source;
            this.selectedDestination = destination;
            const route = JSON.parse(attributes);
            
            this.editRouteJson = route?.route;
            
            this.editData = {
                name,
                source_address: source,
                destination_address: destination,
                destination_department: destinationDept,
                source_department: sourceDept,
                endDate,
                startDate
            };
            this.uiService.openDrawer(this.createUpdateRouteContent, 'RTD Management', '!w-[98vw] md:!w-[98vw] lg:!w-[98vw] rounded-l-2xl');
        } catch (error: any) {
            this.uiService.showToast('error', 'Error', error?.error?.data);
        } finally {
            this.uiService.toggleLoader(false);
        }
    }

    async deleteSelectedRoute(): Promise<void> {
      this.uiService.toggleLoader(true);
      try {
        const response: any = await this.http.delete('geortd/rtd/delete', this.selectedRowItems[0].id);
        this.uiService.showToast('success', 'Success', 'Route deleted successfully');
        await this.fetchRtdList(this.currentSelectedTableFilterStatus); // Refresh the address list after deletion
      } catch (error: any) {
        this.uiService.showToast('error', 'Error',  error?.error?.data);
      } finally {
        this.uiService.toggleLoader(false);
      }
    }

    async fetchRtdList(status:string): Promise<void> {
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.get('geortd/rtd/list',{ statusType: status });
            this.tableData = response.data; // Assuming the response has a 'data' property containing the list of departments
            // Handle the response data as needed
            this.selectedRowItems = []; // Reset selected items after fetching new data
        } catch (error: any) {
            this.uiService.showToast('error', 'Error',  error?.error?.data);
        } finally {
            this.uiService.toggleLoader(false);
        }
    }

    openNew() {
        this.selectedRowItems = [];
        this.isEditMode = false;
        this.selectedSource = null;
        this.selectedDestination = null;
        this.selectedRouteJson = null;
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
                        type: 'date',
                        selectionMode: 'single',
                        dateFormat: 'yy-mm-dd',
                        label: 'Start Date',
                        required: true,
                        placeholder: 'Enter a date'
                    },
                    {
                        fieldId: 'endDate',
                        type: 'date',
                        selectionMode: 'single',
                        dateFormat: 'yy-mm-dd',
                        label: 'End Date',
                        required: true,
                        placeholder: 'Enter a date'
                    },
                    {
                        fieldId: 'reason',
                        type: 'dropdown',
                        options: [
                            { name: 'First Time Geo-RTD', id: 'First Time Geo-RTD' },
                            { name: 'Renew of Geo-RTD', id: 'Renew of Geo-RTD' },
                            { name: 'Route Not utilized for 1 year or more', id: 'Route Not utilized for 1 year or more' },
                            { name: 'New Route Identified', id: 'New Route Identified' },
                            { name: 'Any Other', id: 'Any Other' }
        
                        ],
                        label: 'Reason for New RTD',
                        required: true,
                        placeholder: 'Select a Reason',
                    },
                      {
                        fieldId: 'comment',
                        type: 'textarea',
                        label: 'Comment',
                        required: false,
                        placeholder: 'Enter description'
                    }
                ]
            }
        ];
        this.editData = null;
        this.editRouteJson = null;
        this.uiService.openDrawer(this.createUpdateRouteContent, 'RTD Management', '!w-[98vw] md:!w-[98vw] lg:!w-[98vw] rounded-l-2xl');
    }

    onStepChange(event: { stepIndex: number; data: any }) {
        // Here you could call an API to validate the step if needed
    }

    async onLinkApprovalFormSubmit(formData: any): Promise<void> {
        this.uiService.toggleLoader(true);
        const { approval } = formData;
        const payload = {
            rtdId: this.selectedRowItems[0].id,
            approvalId: approval?.id
        }
        
        try {
          const response = await this.http.post('geortd/RtdApproval/LinkApprovalToRtd', payload);
          this.uiService.showToast('success', 'Success', 'Route linked successfully');
          this.uiService.closeDrawer(); // Close the drawer after submission
          await this.fetchRtdList(this.currentSelectedTableFilterStatus); // Refresh the department list after successful submission
        } catch (error: any) {
            console.error('Error submitting form:', error);
            this.uiService.showToast('error', 'Error', error?.error?.data);
          } finally {
          this.uiService.toggleLoader(false);
        }
    }

    async onApproveRtdFormSubmit(formData: any): Promise<void> {
        this.uiService.toggleLoader(true);
        const { comment, next_available_steps } = formData;
        const payload = {
            rtdId: this.selectedRowItems[0].id,
            comment,
            selectedStep: next_available_steps?.id
        }
        
        try {
          const response = await this.http.post('geortd/RtdApproval/MoveToNextStep', payload);
          this.uiService.showToast('success', 'Success', 'Route approved successfully');
          this.uiService.closeDrawer(); // Close the drawer after submission
          await this.fetchRtdList(this.currentSelectedTableFilterStatus); // Refresh the department list after successful submission
        } catch (error: any) {
            console.error('Error submitting form:', error);
            this.uiService.showToast('error', 'Error', error?.error?.data);
          } finally {
          this.uiService.toggleLoader(false);
        }
    }

    async onFormSubmit(formData: any): Promise<void> {
      if(this.isEditMode) {
        this.uiService.toggleLoader(true);
        const { name, startDate, endDate, destination_department, source_department, reason,comment } = formData;
        const payload = {
          id: this.selectedRowItems[0].id,
          name,
          startDate,
          endDate,
          sourceId:this.editData.source_address?.id,
          destinationId: this.editData.destination_address?.id,
          sourceDeptId:source_department?.id,
          destinationDeptId: destination_department?.id,
          reason: reason,
          comment,
          attributes: JSON.stringify( { route: this.selectedRouteJson } )
        }
        
        try {
          const response = await this.http.put('geortd/rtd/modify', this.selectedRowItems[0].id, payload);
          this.uiService.showToast('success', 'Success', 'Route updated successfully');
          this.uiService.closeDrawer(); // Close the drawer after submission
          await this.fetchRtdList(this.currentSelectedTableFilterStatus); // Refresh the department list after successful submission
        } catch (error: any) {
            console.error('Error submitting form:', error);
            this.uiService.showToast('error', 'Error', error?.error?.data);
          } finally {
          this.uiService.toggleLoader(false);
        }

      } else {
        this.uiService.toggleLoader(true);
        const { name, startDate, endDate, destination_address, destination_department, source_address, source_department, reason, comment } = formData;
        const payload = {
          name,
          startDate,
          endDate,
          sourceId:source_address?.id,
          destinationId: destination_address?.id,
          sourceDeptId:source_department?.id,
          destinationDeptId: destination_department?.id,
          reason: reason,
          comment,
          attributes:JSON.stringify({route:this.selectedRouteJson})
        }

          try {
              const response = await this.http.post('geortd/rtd/create', payload);
              this.uiService.showToast('success', 'Success', 'Route created successfully');
              this.uiService.closeDrawer(); // Close the drawer after submission
              await this.fetchRtdList(this.currentSelectedTableFilterStatus); // Refresh the department list after successful submission
            } catch (error: any) {
                console.error('Error submitting form:', error);
                this.uiService.showToast('error', 'Error', error?.error?.data);
              } finally {
              this.uiService.toggleLoader(false);
          }
      }
    }

    handleRowSelectionChange(event: any): void {
        this.selectedRowItems = event || [];
    }

    onLocationChange(): void {
        // The route will be automatically created by the GoogleMapsComponent
        // when both source and destination coordinates are provided
    }

    onRoutesCreated(event: {
        StD: { selected: google.maps.DirectionsResult; suggested: google.maps.DirectionsResult[] };
        DtoS: { selected: google.maps.DirectionsResult; suggested: google.maps.DirectionsResult[] };
    }) {
        this.selectedRouteJson = event;
    }

    onRouteSelected(event: {
        StD: { selected: google.maps.DirectionsResult; suggested: google.maps.DirectionsResult[] };
        DtoS: { selected: google.maps.DirectionsResult; suggested: google.maps.DirectionsResult[] };
    }) {
        this.selectedRouteJson = event;
    }

    handleStepperAutoComplete({ value, fieldId }: any) {
        if (fieldId === 'source_address') {
            this.selectedSource = value;
        } else {
            this.selectedDestination = value;
        }
    }

    async handleTableFilterByStatus(event: any): Promise<void> {
      this.currentSelectedTableFilterStatus = event
      await this.fetchRtdList(this.currentSelectedTableFilterStatus);
      
    }
}
