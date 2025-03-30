import { Component } from '@angular/core';
import { UiService } from '../../../layout/service/ui.service';
import { GenericTableComponent } from "../../../shared/components/generic-table/generic-table.component";

@Component({
  selector: 'app-address',
  imports: [GenericTableComponent],
  templateUrl: './address.component.html',
  styleUrl: './address.component.scss'
})
export class AddressComponent {

  toolBarStartActions = [
    {
      key: 'new',
      label: 'New',
      icon: 'pi pi-plus',
      severity: 'primary',
      outlined: false,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      severity: 'danger',
      outlined: true,
    }
  ];


 tableConfig = {
    title: 'Manage Address',
    columns: [
      { field: 'address1', header: 'Address Line 1', minWidth: '15rem' },
      { field: 'address2', header: 'Address Line 2', minWidth: '12rem' },
      { field: 'address3', header: 'Address Line 3', minWidth: '12rem' },
      { field: 'city', header: 'City', minWidth: '8rem' },
      { field: 'stateName', header: 'State', minWidth: '10rem' },
      { field: 'countryName', header: 'Country', minWidth: '10rem' },
      { field: 'geofenceName', header: 'Geofence Name', minWidth: '12rem' },
      { field: 'zipCode', header: 'Zip Code', minWidth: '8rem' },
      { field: 'geofenceColor', header: 'Geofence Color', minWidth: '10rem' },
      { field: 'geofenceCode', header: 'Geofence Code', minWidth: '10rem' },
      { field: 'addressUses', header: 'Address Uses', minWidth: '8rem' },
      { field: 'formattedCity', header: 'Formatted City', minWidth: '10rem' },
      { field: 'addressStatus', header: 'Address Status', minWidth: '10rem' },
      { field: 'geofenceImage', header: 'Geofence Image', minWidth: '12rem' },
      { field: 'latitude', header: 'Latitude', minWidth: '12rem' },
      { field: 'longitude', header: 'Longitude', minWidth: '12rem' },
      { field: 'geofenceRadius', header: 'Geofence Radius', minWidth: '10rem' },
      { field: 'geofenceCenterLatitude', header: 'Geofence Center Latitude', minWidth: '12rem' },
      { field: 'geofenceCenterLongitude', header: 'Geofence Center Longitude', minWidth: '12rem' }
    ],
    globalFilterFields: [
      'address1',
      'address2',
      'address3',
      'city',
      'stateName',
      'countryName',
      'geofenceName',
      'zipCode',
    ],
    dataKey: 'addressId',
    
  };

  tableData = [
    {
      addressId: 582570,
      address1: "Indian Oil Corporation Limited  Plot. No.1, Sector",
      address2: "Industrial Growth Centre, Maneri  Tehsil. Niwas",
      address3: null,
      city: "Mandla",
      stateName: "Madhya Pradesh",
      countryName: "India",
      geofenceName: "Jabalpur BP(3385)",
      geofenceTypeId: 596705,
      zipCode: "481885",
      geofenceOpacity: 0.5,
      geofenceBorderColor: "#000000",
      geofenceColor: "#5d27b0",
      geofenceCode: "CIRCLE",
      addressUses: 1,
      formattedCity: "Mandla",
      formattedStateName: "Madhya Pradesh",
      formattedCountryName: "India",
      formattedGeofenceType: "Circle",
      formattedGeofenceOpacity: 50,
      addressStatus: "Active",
      formattedColorCode: "#5d27b0",
      formattedGeofenceBorderColor: "#000000",
      stateId: 68,
      countryId: 100000,
      geofenceId: 1565100,
      geofenceArea: null,
      geofenceBorderWidth: 2,
      geofenceBorderOpacity: 0.0035,
      geofenceImage: null,
      formattedGeofenceBorderOpacity: 0,
      latitude: "23.113582567386135",
      longitude: "80.21701417843536",
      companyId: 14904564,
      geofenceRadius: "100",
      geofenceCenterLatitude: "23.113582567386135",
      geofenceCenterLongitude: "80.21701417843536",
      sapCode: "3385",
      addressUsage: null,
      formattedCityStateZipDetails: "Mandla, Madhya Pradesh, India 481885"
    },
    {
      addressId: 582571,
      address1: "Bharat Petroleum Depot",
      address2: "Gondia Industrial Area",
      address3: "Near NH-6",
      city: "Gondia",
      stateName: "Maharashtra",
      countryName: "India",
      geofenceName: "Gondia Depot",
      geofenceTypeId: 596706,
      zipCode: "441601",
      geofenceOpacity: 0.7,
      geofenceBorderColor: "#FF0000",
      geofenceColor: "#FF5733",
      geofenceCode: "POLYGON",
      addressUses: 2,
      formattedCity: "Gondia",
      formattedStateName: "Maharashtra",
      formattedCountryName: "India",
      formattedGeofenceType: "Polygon",
      formattedGeofenceOpacity: 70,
      addressStatus: "Inactive",
      formattedColorCode: "#FF5733",
      formattedGeofenceBorderColor: "#FF0000",
      stateId: 69,
      countryId: 100000,
      geofenceId: 1565101,
      geofenceArea: 200,
      geofenceBorderWidth: 3,
      geofenceBorderOpacity: 0.005,
      geofenceImage: null,
      formattedGeofenceBorderOpacity: 1,
      latitude: "21.454545",
      longitude: "80.198765",
      companyId: 14904565,
      geofenceRadius: "200",
      geofenceCenterLatitude: "21.454545",
      geofenceCenterLongitude: "80.198765",
      sapCode: "4416",
      addressUsage: 3,
      formattedCityStateZipDetails: "Gondia, Maharashtra, India 441601"
    },
  ];
  
  
  

      constructor(private uiService: UiService) {

      }


  openNew() {
    // this.product = {};
    // this.submitted = false;
    // this.productDialog = true;
    // this.uiService.showToast('error', 'Error', 'Failed to fetch user list');

}

}
