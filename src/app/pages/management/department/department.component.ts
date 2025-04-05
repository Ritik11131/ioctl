import { Component } from '@angular/core';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';

@Component({
  selector: 'app-department',
  imports: [GenericTableComponent],
  templateUrl: './department.component.html',
  styleUrl: './department.component.scss'
})
export class DepartmentComponent {


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
  title: "Manage Departments",
  dataKey: "departmentId",
  columns: [
      { field: "departmentName", header: "Department Name", minWidth: "15rem" },
      { field: "departmentEmail", header: "Email", minWidth: "15rem" },
      { field: "telephoneNumber", header: "Telephone", minWidth: "12rem" },
      { field: "faxNumber", header: "Fax", minWidth: "12rem" },
      { field: "status", header: "Status", minWidth: "10rem" },
      { field: "noOfDrivers", header: "Drivers", minWidth: "8rem" },
      { field: "noOfVehicles", header: "Vehicles", minWidth: "8rem" },
      { field: "createdOn", header: "Created On", minWidth: "14rem" },
      { field: "formattedUserMobileNumber", header: "Contact Number", minWidth: "14rem" },
  ],
  globalFilterFields: ["departmentCode", "departmentName", "status", "departmentEmail"],
    
  };

  tableData = [
    {
      departmentId: 20481526,
      companyId: 14904564,
      departmentCode: "MAH",
      departmentName: "Maharashtra State Office",
      departmentDescription: "Handles operations in Maharashtra region",
      departmentEmail: "vkrai@indianoil.in",
      deptAdminUsername: "mso.iocl.rtd",
      telephoneNumber: "022-12345678",
      faxNumber: "022-87654321",
      status: "Active",
      noOfDrivers: 357,
      noOfVehicles: 302,
      areaCode: 400001,
      contactIsdCode: "+91",
      userEmailAddress: "vkrai@indianoil.in",
      userMobileNumber: "9876543210",
      createdOn: 1543492516000,
      countryIsdCode: "+91",
      userFirstName: "Maharashtra",
      userMiddleName: "State",
      userLastName: "Office",
      userId: 4589246,
      countryIsdId: 100000,
      deptCountryIsdId: 0,
      deptCountryIsdCode: null,
      formattedDeptAdminName: "Maharashtra State Office",
      formattedPhoneNumber: "+91-022-12345678",
      formmatedDepartmentName: "Maharashtra State Office (MAH)",
      formmatedCreatedOn: "29/11/2018 05:25:16 PM",
      formattedUserMobileNumber: "+91-9876543210",
      formattedTelephoneNumber: "022-12345678"
  },
  {
      departmentId: 20481527,
      companyId: 14904565,
      departmentCode: "DEL",
      departmentName: "Delhi Regional Office",
      departmentDescription: "Handles operations in Delhi region",
      departmentEmail: "delhi@indianoil.in",
      deptAdminUsername: "del.iocl.rtd",
      telephoneNumber: "011-22334455",
      faxNumber: "011-55443322",
      status: "Inactive",
      noOfDrivers: 200,
      noOfVehicles: 180,
      areaCode: 110001,
      contactIsdCode: "+91",
      userEmailAddress: "delhi@indianoil.in",
      userMobileNumber: "9876543211",
      createdOn: 1583492516000,
      countryIsdCode: "+91",
      userFirstName: "Delhi",
      userMiddleName: "Regional",
      userLastName: "Office",
      userId: 4589247,
      countryIsdId: 100000,
      deptCountryIsdId: 0,
      deptCountryIsdCode: null,
      formattedDeptAdminName: "Delhi Regional Office",
      formattedPhoneNumber: "+91-011-22334455",
      formmatedDepartmentName: "Delhi Regional Office (DEL)",
      formmatedCreatedOn: "06/03/2020 03:25:16 PM",
      formattedUserMobileNumber: "+91-9876543211",
      formattedTelephoneNumber: "011-22334455"
  },
  ];

}
