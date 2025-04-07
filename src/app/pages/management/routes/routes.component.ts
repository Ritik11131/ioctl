import { Component, TemplateRef, ViewChild } from '@angular/core';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';
import { GenericStepperComponent, StepConfig } from '../../../shared/components/generic-stepper/generic-stepper.component';
import { UiService } from '../../../layout/service/ui.service';
import { FormsModule } from '@angular/forms';
import { GenericGmRouteComponent } from "../../../shared/components/generic-gm-route/generic-gm-route.component";
import { environment } from '../../../../environments/environment.prod';

interface Location {
  name: string;
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-routes',
  imports: [GenericTableComponent, GenericStepperComponent, FormsModule, GenericGmRouteComponent],
  templateUrl: './routes.component.html',
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    h1 {
      text-align: center;
      margin-bottom: 20px;
      color: #333;
    }

    .location-selectors {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }

    .location-selector {
      flex: 1;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #333;
    }

    select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
      background-color: white;
      cursor: pointer;
    }

    select:focus {
      outline: none;
      border-color: #4285F4;
      box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
    }

    select:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }
  `]
})
export class RoutesComponent {

//   @ViewChild('createUpdateRouteContent') createUpdateRouteContent!: TemplateRef<any>;
  

//   selectedRowItems: any[] = [];
//   isEditMode = false;

//   editData: any = null;


//   toolBarStartActions = [
//       {
//           key: 'new',
//           label: 'New',
//           icon: 'pi pi-plus',
//           severity: 'primary',
//           outlined: false
//       },
//       {
//           key: 'edit',
//           label: 'Edit',
//           icon: 'pi pi-pen-to-square',
//           severity: 'secondary',
//           outlined: false
//       },
//       {
//           key: 'delete',
//           label: 'Delete',
//           icon: 'pi pi-trash',
//           severity: 'danger',
//           outlined: true
//       }
//   ];

//   tableConfig = {
//       title: 'Manage Routes',
//       columns: [
//           { field: 'name', header: 'Route Name', minWidth: '15rem' },
         
//       ],
//       globalFilterFields: [],
//       dataKey: 'id'
//   };

//    formSteps: StepConfig[] = [
//           {
//               stepId: 'location',
//               title: 'Location',
//               fields: [
//                   {
//                       fieldId: 'routeMap',
//                       type: 'map',
//                       label: '',
//                       mode: 'route'
//                   },
//                   {
//                       fieldId: 'source',
//                       type: 'dropdown',
//                       apiType: 'SearchAddress',
//                       label: 'Select Source',
//                       required: true,
//                       placeholder: 'Select a Loaction',
//                       dependsOn: null
//                   },
//                   {
//                       fieldId: 'destination',
//                       type: 'dropdown',
//                       apiType: 'SearchAddress',
//                       label: 'Select Destination',
//                       required: true,
//                       placeholder: 'Select a Loaction',
//                       dependsOn: null,
//                   },
//               ]
//           }
//       ];

//   tableData = [];

//   constructor(private uiService:UiService) {}

//   async handleToolBarActions(event: any): Promise<void> {
//     if (event.key === 'new') {
//       this.openNew();
//     }
//   }

//   openNew() {
//     this.selectedRowItems = []; // Reset selected items when opening new form\
//     this.isEditMode = false;
//     this.editData = null
//     this.uiService.openDrawer(this.createUpdateRouteContent, 'Route Management');
//   }

//   onStepChange(event: { stepIndex: number; data: any }) {
//     console.log('Step changed:', event);
//     // Here you could call an API to validate the step if needed
// }

// async onFormSubmit(formData: any): Promise<void> {

// }

// handleRowSelectionChange(event: any): void {
//   console.log(event);
//   this.selectedRowItems = event;
// }


locations: Location[] = [
  { name: 'Connaught Place, Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'Ranchi, Jharkhand', lat: 23.3441, lng: 85.3096 },
  { name: 'Mumbai CST', lat: 18.9398, lng: 72.8354 },
  { name: 'Bangalore MG Road', lat: 12.9754, lng: 77.6043 },
  { name: 'Kolkata Howrah', lat: 22.5958, lng: 88.2636 },
  { name: 'Chennai Central', lat: 13.0827, lng: 80.2707 },
  { name: 'Hyderabad Charminar', lat: 17.3616, lng: 78.4747 },
  { name: 'Ahmedabad Sabarmati', lat: 23.0225, lng: 72.5714 },
  { name: 'Pune Station', lat: 18.5204, lng: 73.8567 },
  { name: 'Jaipur Hawa Mahal', lat: 26.9239, lng: 75.8267 }
];

selectedSource: Location | null = null;
selectedDestination: Location | null = null;
googleMapsApiKey = environment.googleMapsApiKey

onLocationChange(): void {
  // The route will be automatically created by the GoogleMapsComponent
  // when both source and destination coordinates are provided
}

onRouteCreated(route: any): void {
  console.log('Route created:', route);
}

onRouteSelected(route: any): void {
  console.log('Route selected:', route);
}


}
