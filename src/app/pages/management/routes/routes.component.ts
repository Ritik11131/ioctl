import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';
import { GenericStepperComponent, StepConfig } from '../../../shared/components/generic-stepper/generic-stepper.component';
import { UiService } from '../../../layout/service/ui.service';
import { FormsModule } from '@angular/forms';
import { GenericGmRouteComponent } from "../../../shared/components/generic-gm-route/generic-gm-route.component";
import { environment } from '../../../../environments/environment.prod';
import { HttpService } from '../../service/http.service';
import { GenericAutocompleteComponent } from '../../../shared/components/generic-autocomplete/generic-autocomplete.component';

@Component({
  selector: 'app-routes',
  imports: [GenericTableComponent, GenericAutocompleteComponent, FormsModule, GenericGmRouteComponent],
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
export class RoutesComponent implements OnInit {

  @ViewChild('createUpdateRouteContent') createUpdateRouteContent!: TemplateRef<any>;
  

  selectedRowItems: any[] = [];
  isEditMode = false;

  editData: any = null;


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
      title: 'Manage Routes',
      columns: [
          { field: 'source', header: 'Source Name', subfield:'name', minWidth: '15rem'  },
          { field: 'destination', header: 'Destination Name', subfield:'name', minWidth: '15rem'  },
      ],
      globalFilterFields: [],
      dataKey: 'id'
  };

   formSteps: StepConfig[] = [
          {
              stepId: 'location',
              title: 'Location',
              fields: [
                  {
                      fieldId: 'routeMap',
                      type: 'map',
                      label: '',
                      mode: 'route'
                  },
                  {
                      fieldId: 'source',
                      type: 'dropdown',
                      apiType: 'SearchAddress',
                      label: 'Select Source',
                      required: true,
                      placeholder: 'Select a Loaction',
                      dependsOn: null
                  },
                  {
                      fieldId: 'destination',
                      type: 'dropdown',
                      apiType: 'SearchAddress',
                      label: 'Select Destination',
                      required: true,
                      placeholder: 'Select a Loaction',
                      dependsOn: null,
                  },
              ]
          }
      ];

  tableData = [];

  constructor(private uiService:UiService, private http:HttpService) {}

  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.fetchRtdList()
  }

  async handleToolBarActions(event: any): Promise<void> {
    if (event.key === 'new') {
      this.openNew();
    }
  }

  async fetchRtdList(): Promise<void> {
    this.uiService.toggleLoader(true);
    try {
        const response: any = await this.http.get('geortd/rtd/list');
        console.log(response, 'response');
        this.tableData = response.data; // Assuming the response has a 'data' property containing the list of departments
        // Handle the response data as needed
        this.selectedRowItems = []; // Reset selected items after fetching new data
    } catch (error) {
        console.error('Error fetching role list:', error);
        this.uiService.showToast('error', 'Error', 'Failed to fetch role list');
    } finally {
        this.uiService.toggleLoader(false);
    }
}

  openNew() {
    this.selectedRowItems = []; // Reset selected items when opening new form\
    this.isEditMode = false;
    this.editData = null
    this.uiService.openDrawer(this.createUpdateRouteContent, 'Route Management','!w-full md:!w-full lg:!w-full rounded-l-2xl');
  }

  onStepChange(event: { stepIndex: number; data: any }) {
    console.log('Step changed:', event);
    // Here you could call an API to validate the step if needed
}

async onFormSubmit(formData: any): Promise<void> {

}

handleRowSelectionChange(event: any): void {
  console.log(event);
  this.selectedRowItems = event;
}

selectedSource: any = null;
selectedDestination: any = null;
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

onSourceSelected(source: any) {
  console.log(source);
  this.selectedSource = source?.value;
}

onDestinationSelected(destination: any) {
  console.log('Selected destination:', destination);
  this.selectedDestination = destination?.value;
}


}
