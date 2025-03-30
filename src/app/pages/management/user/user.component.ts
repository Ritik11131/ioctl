import { Component } from '@angular/core';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';

@Component({
  selector: 'app-user',
  imports: [GenericTableComponent],
  templateUrl: './user.component.html',
  styleUrl: './user.component.scss'
})
export class UserComponent {

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
  title: "Manage Users",
  dataKey: "userId",
  columns: [
      { field: "userName", header: "Username", minWidth: "12rem" },
      { field: "employeeNumber", header: "Employee Number", minWidth: "12rem" },
      { field: "emailAddress", header: "Email Address", minWidth: "15rem" },
      { field: "mobileNumber", header: "Mobile Number", minWidth: "12rem" },
      { field: "roles", header: "Role", minWidth: "10rem" },
      { field: "status", header: "Status", minWidth: "10rem" },
      { field: "userFirstName", header: "First Name", minWidth: "10rem" },
      { field: "userLastName", header: "Last Name", minWidth: "10rem" },
      { field: "formattedDepartmentName", header: "Department", minWidth: "15rem" },
      { field: "formattedStatus", header: "Formatted Status", minWidth: "12rem" },
      { field: "formattedVendorName", header: "Vendor Name", minWidth: "12rem" },
  ],
  globalFilterFields: [
      "userId", "userName", "employeeNumber", "emailAddress", 
      "mobileNumber", "roles", "status", "formattedDepartmentName", 
      "formattedStatus", "licenseNumber", "formattedLicenseExpDate", 
      "gpsLastLatitude", "gpsLastLongitude", "vehicleNumber", "formattedVendorName"
  ]
    
  };

  tableData = [
    {
      userId: 19267783,
      userName: "asdefrgthjkl",
      companyId: 14904564,
      countryIsdCode: null,
      departmentCode: "MAH",
      departmentName: "Maharashtra State Office",
      departmentId: 20481526,
      emailAddress: "tre@gmail.com",
      employeeNumber: "EMP1290",
      formattedAddress: null,
      geofenceName: null,
      latitude: null,
      longitude: null,
      mobileNumber: "9876543210",
      roleCodes: "DRIVER",
      roles: "Driver",
      status: "A",
      userFirstName: "Zz",
      userMiddleName: null,
      userLastName: "Dd",
      userStatus: "ACTIVE",
      formattedName: "Zz Dd",
      formattedMobileNumber: "",
      formattedUserType: null,
      formattedStatus: "Active",
      formattedDepartmentName: "Maharashtra State Office (MAH)",
      addressWithGeofence: "",
      dutyStatus: null,
      lastLongSyncTime: null,
      formattedLastLongSyncTime: null,
      licenseNumber: "MH-12345",
      licenseExpDate: "2025-07-10",
      formattedLicenseExpDate: "July 10, 2025",
      licenseIssueCountryId: 1,
      licenseIssueCountryName: "India",
      licenseIssueCountryCode: "IN",
      licenseIssueStateId: 27,
      licenseIssueStateCode: "MH",
      gpsDateTime: null,
      formattedGpsDateTime: null,
      gpsLastLatitude: 19.076,
      gpsLastLongitude: 72.8777,
      vehicleId: 9876, 
      vehicleNumber: "MH12AB1234",
      lastSpeed: 60,
      formattedLastSpeed: "60 km/h",
      vendorId: 1234,
      formattedVendorName: "XYZ Logistics",
      cellProvider: "Airtel"
  },
  {
      userId: 19267784,
      userName: "qwertyuiop",
      companyId: 14904565,
      countryIsdCode: null,
      departmentCode: "DEL",
      departmentName: "Delhi Regional Office",
      departmentId: 20481527,
      emailAddress: "example@gmail.com",
      employeeNumber: "EMP1291",
      formattedAddress: null,
      geofenceName: null,
      latitude: null,
      longitude: null,
      mobileNumber: "9876543211",
      roleCodes: "MANAGER",
      roles: "Manager",
      status: "I",
      userFirstName: "John",
      userMiddleName: "A",
      userLastName: "Doe",
      userStatus: "INACTIVE",
      formattedName: "John A Doe",
      formattedMobileNumber: "",
      formattedUserType: null,
      formattedStatus: "Inactive",
      formattedDepartmentName: "Delhi Regional Office (DEL)",
      addressWithGeofence: "",
      dutyStatus: null,
      lastLongSyncTime: null,
      formattedLastLongSyncTime: null,
      licenseNumber: "DL-56789",
      licenseExpDate: "2026-08-15",
      formattedLicenseExpDate: "August 15, 2026",
      licenseIssueCountryId: 1,
      licenseIssueCountryName: "India",
      licenseIssueCountryCode: "IN",
      licenseIssueStateId: 7,
      licenseIssueStateCode: "DL",
      gpsDateTime: null,
      formattedGpsDateTime: null,
      gpsLastLatitude: 28.6139,
      gpsLastLongitude: 77.209,
      vehicleId: 9877,
      vehicleNumber: "DL8CA1234",
      lastSpeed: 45,
      formattedLastSpeed: "45 km/h",
      vendorId: 1235,
      formattedVendorName: "ABC Transport",
      cellProvider: "Jio"
  }
  ];

}
