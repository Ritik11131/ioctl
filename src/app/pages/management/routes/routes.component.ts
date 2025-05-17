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
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-routes',
    imports: [GenericTableComponent, FormsModule, DatePipe, CurrencyPipe, ButtonModule, GenericGmRouteComponent, GenericStepperComponent, GenericViewOnMapComponent],
    templateUrl: './routes.component.html'
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
    allToolBarActions = [
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
            label: 'OP46',
            icon: 'pi pi-download',
            severity: 'primary',
            outlined: true,
            dependentOnRow: true
        }
    ];

    tableConfig = {
        title: 'Manage RTD',
        columns: [
            { field: 'name', header: 'Route Name', minWidth: '12rem' },
            { field: 'source', header: 'Source Address', subfield: 'name', minWidth: '15rem' },
            { field: 'destination', header: 'Destination Address', subfield: 'name', minWidth: '15rem' },
            { field: 'selectedRoute', header: 'Suggested Route', minWidth: '15rem' },
            { field: 'status', header: 'Status', minWidth: '15rem' },
            { field: 'tblRtdApproval', subfield: 'aprrovedBy', header: 'Approved by', minWidth: '15rem', date: true },
            { field: 'tblRtdApproval', subfield: 'nextApprovedBy', header: 'Next To Approved By', minWidth: '15rem', date: true },
            // { field: 'endDate', header: 'Toll Price', minWidth: '15rem', date: true },
            { field: 'totalDistanceKm', header: 'Total RTD (Km)', minWidth: '15rem' },
            { field: 'tollPrice', header: 'Toll Price (Rs)', minWidth: '15rem' },
            { field: 'startDate', header: 'Start Date', minWidth: '15rem', date: true },
            { field: 'endDate', header: 'End Date', minWidth: '15rem', date: true },
            { field: 'version', header: 'Version', minWidth: '15rem' },
            { field: 'creationTime', header: 'Created On', minWidth: '15rem', date: true },
            { field: 'document', header: 'Document', minWidth: '10rem', download: true }
        ],
        globalFilterFields: [],
        dataKey: 'id'
    };

    tableFilterByStatusConfig = [
        { label: 'All', value: 'all' },
        { label: 'Pending', value: 'pending' },
        { label: 'Completed', value: 'completed' }
    ];

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
                    label: 'Destination Department',
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
                        { name: 'Reverification of Geo-RTD', id: 'Reverification of Geo-RTD' },
                        { name: 'Route Not utilized for 1 year or more', id: 'Route Not utilized for 1 year or more' },
                        { name: 'New Route Identified', id: 'New Route Identified' },
                        { name: 'Any Other', id: 'Any Other' }
                    ],
                    label: 'Reason for New RTD',
                    required: true,
                    placeholder: 'Select a Reason'
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
        private pdfService: PdfService
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
        } else if (event.key === 'linkApproval') {
            await this.handleLinkApproval();
        } else if (event.key === 'approve') {
            this.uiService.toggleLoader(true);
            const { id, tblRtdApproval } = this.selectedRowItems[0] || {};
            try {
                const response: any = await this.http.post('geortd/RtdApproval/GetCurrentStep', { rtdId: id, approvalId: tblRtdApproval?.id });
                const routes: any = await this.http.get('geortd/rtd/GetById', {}, id);
                const { attributes } = routes.data;
                const parsedAttributes = JSON.parse(attributes);
                console.log(parsedAttributes);

                this.mapObject = {
                    source: routes.data.source,
                    destination: routes.data.destination,
                    routeData: parsedAttributes?.route
                };

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
                                type: 'textarea',
                                label: 'Comment',
                                required: true,
                                placeholder: 'Enter a name'
                            }
                        ]
                    }
                ];
                this.uiService.openDrawer(this.approveRtdContent, 'Approve Rtd', '!w-[98vw] md:!w-[98vw] lg:!w-[98vw] rounded-l-2xl');
            } catch (error: any) {
                this.uiService.showToast('error', 'Error', error?.error?.data);
            } finally {
                this.uiService.toggleLoader(false);
            }
        } else if (event.key === 'op46Download') {
            await this.handleOp46Download();
        }
    }

async handleOp46Download(): Promise<void> {
  this.uiService.toggleLoader(true);
  try {
    const selectedId = this.selectedRowItems?.[0]?.id;
    if (!selectedId) {
      throw new Error('No row selected');
    }

    const [routeResponse, tollsResponse, approvalResponse]: any[] = await Promise.all([
      this.http.get('geortd/rtd/GetById', {}, selectedId),
      this.http.get('geortd/rtdtoll/list', {}, selectedId).catch(() => ({ data: [] })),
      this.http.get('geortd/RtdApproval/GetRtdApprovalStatusByRtdId', {},selectedId)
    ]);


    console.log(approvalResponse,'ress');
    
    const { source, destination, attributes, name, startDate, endDate, totalDistanceKm, destinationDept, rtdFor, id, tollPrice } = routeResponse?.data;
    const { route } = JSON.parse(attributes || '{}');
    const { StD, DtoS } = route || {};

    const { comments } = approvalResponse?.data;
    const parsedComments = JSON.parse(comments)

    const pdfData = {
      source,
      destination,
      StD,
      DtoS,
      rtdName: name,
      destinationDept,
      rtdFor,
      tollPrice,
      id,
      totalDistanceKm,
      startDate: new Date(startDate).toLocaleDateString('en-US'),
      endDate: new Date(endDate).toLocaleDateString('en-US'),
      tolls: tollsResponse?.data || [],
      comments: parsedComments.map((comment: any) => ({...comment,timestamp: new Date(comment.timestamp).toLocaleString('en-IN')}))

    };

    console.log(pdfData);
    

    this.pdfService.generateOpCertificate(pdfData);
  } catch (error: any) {
    console.error('Error in handleOp46Download:', error);
    this.uiService.showToast('error', 'Download Error', error?.error?.data || 'Something went wrong');
  } finally {
    this.uiService.toggleLoader(false);
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
                        autoFetch: true
                    }
                ]
            }
        ];
    }

    async handleRouteWithTolls(): Promise<void> {
        this.uiService.toggleLoader(true);

        try {
            // First get the route data
            const routeResponse: any = await this.http.get('geortd/rtd/GetById', {}, this.selectedRowItems[0]?.id).catch((error) => {
                console.error('Error fetching route data:', error);
                throw new Error('Failed to fetch route data');
            });

            if (!routeResponse?.data) {
                throw new Error('Invalid route data received');
            }

            const { source, sourceDept, destination, destinationDept, attributes, startDate, endDate, reason, totalDistanceKm, totalTime } = routeResponse.data;

            // Handle potential JSON parsing errors
            let parsedAttributes: any = {};
            try {
                parsedAttributes = attributes ? JSON.parse(attributes) : {};
            } catch (jsonError) {
                console.error('Error parsing route attributes:', jsonError);
                // Continue with empty attributes rather than failing
            }

            // Then get the tolls data
            const tollsResponse: any = await this.http.get('geortd/rtdtoll/list', {}, this.selectedRowItems[0]?.id).catch((error) => {
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
                reason,
                totalDistanceKm,
                totalTime
            };

            // Open drawer with combined data
            this.uiService.openDrawer(this.checkRouteTollsContent, 'View RTD', '!w-[98vw] md:!w-[98vw] lg:!w-[98vw] rounded-l-2xl');
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
                        label: 'Destination Department',
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
                            { name: 'Reverification of Geo-RTD', id: 'Reverification of Geo-RTD' },
                            { name: 'Route Not utilized for 1 year or more', id: 'Route Not utilized for 1 year or more' },
                            { name: 'New Route Identified', id: 'New Route Identified' },
                            { name: 'Any Other', id: 'Any Other' }
                        ],
                        label: 'Reason for New RTD',
                        required: true,
                        placeholder: 'Select a Reason'
                    },
                     {
                        fieldId: 'rtdFor',
                        type: 'dropdown',
                        options: [
                            { name: 'Bulk', id: 'Bulk' },
                            { name: 'Packed', id: 'Packed' }
                        ],
                        label: 'RTD For',
                        required: true,
                        placeholder: 'Select a Reason'
                    },
                    {
                        fieldId: 'comment',
                        type: 'textarea',
                        label: 'Comment',
                        required: false,
                        placeholder: 'Enter description'
                    },
                    {
                        fieldId: 'document',
                        type: 'fileupload',
                        label: 'Document',
                        fileUploadConfig: {
                            accept: '.pdf,.txt,image/*',
                            maxFileSize: 5000000,
                            multiple: false,
                            customUpload: true
                        },
                        required: false
                    }
                ]
            }
        ];
        this.isEditMode = true;
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.get('geortd/rtd/GetById', {}, this.selectedRowItems[0].id);
            const { source, destination, sourceDept, destinationDept, name, attributes, startDate, endDate, reason, rtdFor, comment, version } = response.data;
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
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                reason,
                rtdFor,
                comment,
                version
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
            this.uiService.showToast('error', 'Error', error?.error?.data);
        } finally {
            this.uiService.toggleLoader(false);
        }
    }

    async fetchRtdList(status: string): Promise<void> {
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.get('geortd/rtd/list', { statusType: status });
            this.tableData = response.data; // Assuming the response has a 'data' property containing the list of departments
            // Handle the response data as needed
            this.selectedRowItems = []; // Reset selected items after fetching new data
        } catch (error: any) {
            this.uiService.showToast('error', 'Error', error?.error?.data);
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
                        label: 'Destination Department',
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
                            { name: 'Reverification of Geo-RTD', id: 'Reverification of Geo-RTD' },
                            { name: 'Route Not utilized for 1 year or more', id: 'Route Not utilized for 1 year or more' },
                            { name: 'New Route Identified', id: 'New Route Identified' },
                            { name: 'Any Other', id: 'Any Other' }
                        ],
                        label: 'Reason for New RTD',
                        required: true,
                        placeholder: 'Select a Reason'
                    },
                     {
                        fieldId: 'rtdFor',
                        type: 'dropdown',
                        options: [
                            { name: 'Bulk', id: 'Bulk' },
                            { name: 'Packed', id: 'Packed' }
                        ],
                        label: 'RTD For',
                        required: true,
                        placeholder: 'Select a Reason'
                    },
                    {
                        fieldId: 'comment',
                        type: 'textarea',
                        label: 'Comment',
                        required: false,
                        placeholder: 'Enter description'
                    },
                    {
                        fieldId: 'document',
                        type: 'fileupload',
                        label: 'Gazette Document',
                        fileUploadConfig: {
                            accept: '.pdf,.txt,image/*',
                            maxFileSize: 5000000,
                            multiple: false,
                            customUpload: true
                        },
                        required: false
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
        };

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
        };

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

    parseDurationToMinutes(durationText: string): number {
        if (!durationText) return 0;

        const hourMatch = durationText.match(/(\d+)\s*hour/);
        const minMatch = durationText.match(/(\d+)\s*min/);

        const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
        const minutes = minMatch ? parseInt(minMatch[1]) : 0;

        return hours * 60 + minutes;
    }

    formatMinutesToDurationText(totalMinutes: number): string {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours > 0 ? `${hours} hour${hours > 1 ? 's' : ''}` : ''}${hours && minutes ? ' ' : ''}${minutes ? `${minutes} min${minutes > 1 ? 's' : ''}` : ''}`.trim();
    }

    async onFormSubmit(formData: any): Promise<void> {
        const totalRTDKm = parseFloat(this.selectedRouteJson?.DtoS.selected?.routes[0]?.legs[0]?.distance?.text) + parseFloat(this.selectedRouteJson?.StD.selected?.routes[0]?.legs[0]?.distance?.text);
        const totalMins = [this.selectedRouteJson?.DtoS?.selected?.routes[0]?.legs[0]?.duration?.text, this.selectedRouteJson?.StD?.selected?.routes[0]?.legs[0]?.duration?.text].reduce((sum, t) => sum + this.parseDurationToMinutes(t || ''), 0);
        const totalRTDDurationInMinutes = this.formatMinutesToDurationText(totalMins);

        if (this.isEditMode) {
            this.uiService.toggleLoader(true);
            const { name, startDate, endDate, destination_department, source_department, reason, rtdFor, comment, document } = formData;
            const payload = {
                id: this.selectedRowItems[0].id,
                name,
                startDate,
                endDate,
                sourceId: this.editData.source_address?.id,
                destinationId: this.editData.destination_address?.id,
                sourceDeptId: source_department?.id,
                destinationDeptId: destination_department?.id,
                reason: typeof reason === 'string' ? reason : reason?.id,
                rtdFor: typeof rtdFor === 'string' ? rtdFor : rtdFor?.id,
                version: this.editData.version,
                selectedRoute: this.selectedRouteJson?.DtoS.selected?.routes[0]?.summary,
                comment,
                totalDistanceKm: totalRTDKm,
                totalTime: totalRTDDurationInMinutes,
                document: !document ? this.selectedRowItems[0]?.document : document,
                attributes: JSON.stringify({ route: this.selectedRouteJson })
            };

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
            const { name, startDate, endDate, destination_address, destination_department, source_address, source_department, reason, rtdFor, comment, document } = formData;
            const payload = {
                name,
                startDate,
                endDate,
                sourceId: source_address?.id,
                destinationId: destination_address?.id,
                sourceDeptId: source_department?.id,
                destinationDeptId: destination_department?.id,
                reason: reason?.id,
                rtdFor: rtdFor?.id,
                selectedRoute: this.selectedRouteJson?.DtoS.selected?.routes[0]?.summary,
                comment,
                totalDistanceKm: totalRTDKm,
                document,
                totalTime: totalRTDDurationInMinutes,
                attributes: JSON.stringify({ route: this.selectedRouteJson })
            };

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

    onRoutesCreated(event: { StD: { selected: google.maps.DirectionsResult; suggested: google.maps.DirectionsResult[] }; DtoS: { selected: google.maps.DirectionsResult; suggested: google.maps.DirectionsResult[] } }) {
        this.selectedRouteJson = event;
    }

    onRouteSelected(event: { StD: { selected: google.maps.DirectionsResult; suggested: google.maps.DirectionsResult[] }; DtoS: { selected: google.maps.DirectionsResult; suggested: google.maps.DirectionsResult[] } }) {
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
        this.currentSelectedTableFilterStatus = event;
        console.log(event);

        // Ensure we have a clean master list to build from
        if (!this.allToolBarActions) {
            this.allToolBarActions = [...this.toolBarStartActions]; // Store full list once
        }

        // Start with the master list
        let updatedActions = [...this.allToolBarActions];

        // Remove 'approve' based on condition
        if (event !== 'pending') {
            updatedActions = updatedActions.filter((action) => action.key !== 'approve');
        }

        // Apply the filtered toolbar
        this.toolBarStartActions = updatedActions;

        // Now fetch data
        await this.fetchRtdList(this.currentSelectedTableFilterStatus);
    }

    onViewRouteSelected(event: any): void {
        console.log(event);
        const totalRTDKm = parseFloat(event?.DtoS.selected?.routes[0]?.legs[0]?.distance?.text) + parseFloat(event?.StD.selected?.routes[0]?.legs[0]?.distance?.text);
        const totalMins = [event?.DtoS?.selected?.routes[0]?.legs[0]?.duration?.text, event?.StD?.selected?.routes[0]?.legs[0]?.duration?.text].reduce((sum, t) => sum + this.parseDurationToMinutes(t || ''), 0);
        const totalRTDDurationInMinutes = this.formatMinutesToDurationText(totalMins);
        this.mapObject.totalDistanceKm = totalRTDKm;
        this.mapObject.totalTime = totalRTDDurationInMinutes;
    }
}
