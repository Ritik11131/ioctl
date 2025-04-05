import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { UiService } from '../../../layout/service/ui.service';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';
import { GenericLocationSearchComponent } from '../../../shared/components/generic-location-search/generic-location-search.component';
import { GenericGoogleMapComponent } from '../../../shared/components/generic-google-map/generic-google-map.component';
import { environment } from '../../../../environments/environment.prod';
import { GenericStepperComponent, StepConfig } from '../../../shared/components/generic-stepper/generic-stepper.component';
import { HttpService } from '../../service/http.service';

@Component({
    selector: 'app-address',
    imports: [GenericTableComponent, GenericStepperComponent],
    templateUrl: './address.component.html',
    styleUrl: './address.component.scss'
})
export class AddressComponent implements OnInit {
    // ViewChild reference to map component for access to its methods
    @ViewChild('createUpdateUserContent') createUpdateUserContent!: TemplateRef<any>;
    @ViewChild('mapComponent') mapComponent!: GenericGoogleMapComponent;
    @ViewChild('searchComponent') searchComponent!: GenericLocationSearchComponent;

    googleMapsApiKey = environment.googleMapsApiKey; // Replace with your API key
    initialLat = 40.73061;
    initialLng = -73.935242;
    isEditMode = false;
    editData: any = null;

    selectedLocation: any = null;
    geofenceRadius = 1000;

    toolBarStartActions = [
        {
            key: 'new',
            label: 'New',
            icon: 'pi pi-plus',
            severity: 'primary',
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
        title: 'Manage Address',
        columns: [
            { field: 'address1', header: 'Address Line 1', minWidth: '15rem' },
            { field: 'address2', header: 'Address Line 2', minWidth: '12rem' },
            { field: 'address3', header: 'Address Line 3', minWidth: '12rem' },
            { field: 'city', header: 'City', minWidth: '8rem' },
            { field: 'state', header: 'State', minWidth: '10rem', subfield:'name' },
            { field: 'country', header: 'Country', minWidth: '10rem', subfield:'name' },
            { field: 'name', header: 'Geofence Name', minWidth: '12rem' },
            { field: 'zipCode', header: 'Zip Code', minWidth: '10rem' },
            // { field: 'geofenceColor', header: 'Geofence Color', minWidth: '12rem' },
            // { field: 'geofenceCode', header: 'Geofence Code', minWidth: '12rem' },
            // { field: 'addressUses', header: 'Address Uses', minWidth: '10rem' },
            // { field: 'formattedCity', header: 'Formatted City', minWidth: '12rem' },
            // { field: 'addressStatus', header: 'Status', minWidth: '10rem' },
            // { field: 'geofenceImage', header: 'Geofence Image', minWidth: '12rem' },
            // { field: 'latitude', header: 'Latitude', minWidth: '12rem' },
            // { field: 'longitude', header: 'Longitude', minWidth: '12rem' },
            // { field: 'geofenceRadius', header: 'Radius', minWidth: '10rem' },
            // { field: 'geofenceCenterLatitude', header: 'Geofence Latitude', minWidth: '15rem' },
            // { field: 'geofenceCenterLongitude', header: 'Geofence Longitude', minWidth: '15rem' }
        ],
        globalFilterFields: ['address1', 'address2', 'address3', 'city', 'geofenceName', 'zipCode'],
        dataKey: 'addressId'
    };

    tableData = [];

    formSteps: StepConfig[] = [
        {
            stepId: 'basic',
            title: 'Basic Information',
            fields: [
                {
                    fieldId: 'geofenceName',
                    type: 'text',
                    label: 'Geofence Name',
                    required: true,
                    placeholder: 'Enter geofence name'
                },
                {
                    fieldId: 'zipCode',
                    type: 'text',
                    label: 'Zip/ Postal Code',
                    required: true,
                    placeholder: 'Enter zip code'
                }
            ]
        },
        {
            stepId: 'location',
            title: 'Location',
            fields: [
                {
                    fieldId: 'locationMap',
                    type: 'map',
                    label: ''
                },
                {
                    fieldId: 'locationPlace1',
                    type: 'place',
                    label: 'Enter Location 1',
                    required: true
                },
                {
                    fieldId: 'locationPlace2',
                    type: 'text',
                    label: 'Enter Location 2',
                    required: true
                },
                {
                    fieldId: 'locationPlace3',
                    type: 'text',
                    label: 'Enter Location 3',
                    required: true
                },
                {
                  fieldId: 'country',
                  type: 'dropdown',
                  apiType: 'country',
                  label: 'Select Country',
                  required: true,
                  placeholder: 'Select a Country',
                  dependsOn: null
                },
                {
                  fieldId: 'state',
                  type: 'dropdown',
                  apiType: 'state',
                  label: 'Select State',
                  required: true,
                  placeholder: 'Select a State',
                  dependsOn: 'country',
                  autoFetch: true
                },
                {
                  fieldId: 'city',
                  type: 'text',
                  label: 'Enter City',
                  required: true
              },
            ]
        }
    ];

    constructor(
        private uiService: UiService,
        private http: HttpService
    ) {}


    ngOnInit(): void {
        this.fetchAddressList();
    }

    onStepChange(event: { stepIndex: number; data: any }) {
        console.log('Step changed:', event);
        // Here you could call an API to validate the step if needed
    }

    async fetchAddressList(): Promise<void> {
        this.uiService.toggleLoader(true);
        try {
            const response: any = await this.http.get('geortd/address/list');
            console.log(response, 'response');
            this.tableData = response.data; // Assuming the response has a 'data' property containing the list of addresses
            // Handle the response data as needed
        } catch (error) {
            console.error('Error fetching address list:', error);
            this.uiService.showToast('error', 'Error', 'Failed to fetch address list');
        } finally {
            this.uiService.toggleLoader(false);
        }
    }

    async onFormSubmit(formData: any): Promise<void> {
        console.log('Form submitted with data:', formData);
        this.uiService.toggleLoader(true);
        const  { city, country, geofenceName, state, zipCode, locationPlace3, locationPlace2, locationPlace1 } = formData;
        const payload = {
            searchBy: 'map',
            name: geofenceName,
            address1: locationPlace1.address,
            address2: locationPlace2,
            address3: locationPlace3,
            city,
            stateId: state?.id,
            countryId: country?.id,
            zipcode: zipCode,
            exCode: null,
            attributes: JSON.stringify(locationPlace1)
        };
        try {
            const response = await this.http.post('geortd/address/create', payload);
            console.log(response, 'response');
            this.uiService.showToast('success', 'Success', 'Address created successfully');
            this.uiService.closeDrawer(); // Close the drawer after submission
            await this.fetchAddressList(); // Refresh the address list after successful submission
        } catch (error) {
            console.error('Error submitting form:', error);
            this.uiService.showToast('error', 'Error', 'Failed to submit form');
        } finally {
            this.uiService.toggleLoader(false);
        }
        // Handle form submission
    }

    handleToolBarActions(event: any) {
        console.log(event, 'event');
        if (event.key === 'new') {
            this.openNew();
        } else if (event.key === 'delete') {
            // this.deleteSelectedUsers();
        }
    }
    openNew() {
        this.uiService.openDrawer(this.createUpdateUserContent, 'Address Management');
        this.isEditMode = true;
        this.editData = this.tableData[0]; // For demo purposes, using the first item in the list
        const { address1, address2, address3, city, state, country, zipCode, name, attributes } = this.tableData[this.tableData.length - 1];
        this.editData = {
            city,
            country,
            geofenceName: name,
            state,
            zipCode,
            locationPlace3: address3,
            locationPlace2: address2,
            locationPlace1: JSON.parse("{\"lat\": 28.651027000000003, \"lng\": 77.1562196, \"name\": \"Shadipur\", \"address\": \"Shadipur, New Delhi, Delhi, India\"}")
        };

        // this.product = {};
        // this.submitted = false;
        // this.productDialog = true;
        // this.uiService.showToast('error', 'Error', 'Failed to fetch user list');
    }

    // onMapReady(map: google.maps.Map) {
    //     // Connect the search component to the map
    //     if (this.searchComponent) {
    //         console.log('if');

    //         this.searchComponent.setupSearchFunctionality(map);
    //     } else {
    //         // If search component isn't ready yet, try again in a tick
    //         setTimeout(() => {
    //             if (this.searchComponent) {
    //                 this.searchComponent.setupSearchFunctionality(map);
    //             }
    //         });
    //     }
    // }

    // onPlaceSelected(place: any) {
    //     this.selectedLocation = place;

    //     // Update the map marker
    //     if (this.mapComponent) {
    //         this.mapComponent.updateMarkerPosition({
    //             lat: place.lat,
    //             lng: place.lng
    //         });
    //     }
    // }

    // onMapClick(coords: google.maps.LatLngLiteral) {
    //     // Update selected location when map is clicked
    //     this.selectedLocation = {
    //         lat: coords.lat,
    //         lng: coords.lng,
    //         name: 'Custom location',
    //         address: ''
    //     };
    // }

    // onMarkerMoved(coords: google.maps.LatLngLiteral) {
    //     // Update selected location when marker is dragged
    //     if (this.selectedLocation) {
    //         this.selectedLocation.lat = coords.lat;
    //         this.selectedLocation.lng = coords.lng;
    //     } else {
    //         this.selectedLocation = {
    //             lat: coords.lat,
    //             lng: coords.lng,
    //             name: 'Custom location',
    //             address: ''
    //         };
    //     }
    // }

    // onRadiusChanged(radius: number) {
    //     this.geofenceRadius = radius;
    // }
}
