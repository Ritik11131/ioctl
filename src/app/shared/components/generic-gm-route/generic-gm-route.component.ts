import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment.prod';
import { ButtonModule } from 'primeng/button';
import { UiService } from '../../../layout/service/ui.service';
import { GmLoaderService } from '../../../pages/service/gm-loader.service';

// Define clear interfaces
export interface RouteOption {
  route: google.maps.DirectionsRoute;
  distance: string;
  duration: string;
  color: string;
  isSelected: boolean;
}

export interface SavedRoute {
  source: string;
  destination: string;
  directions: google.maps.DirectionsResult;
  distance: string;
  duration: string;
  startLocation?: google.maps.LatLngLiteral;
  endLocation?: google.maps.LatLngLiteral;
  polylinePath?: google.maps.LatLngLiteral[]; // Store the path points for reconstruction
  isReturn?: boolean; // Flag to indicate if this is a return route
}

export interface GeofenceOptions {
  radius: number;
  fillColor: string;
  fillOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
}

@Component({
  selector: 'app-generic-gm-route',
  imports: [FormsModule, ButtonModule],
  template: `
   <div class="flex flex-col lg:flex-row gap-6 p-4 bg-slate-50 rounded-xl shadow-sm">
  <!-- Left Panel: Route Controls -->
  <div class="lg:w-80 flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
    <!-- Source to Destination Routes -->
    <div class="route-panel">
      <div class="px-5 py-4 border-b border-slate-100">
        <h3 class="text-lg font-medium text-slate-800">Source to Destination</h3>
      </div>
      
      <div class="divide-y divide-slate-100">
        @for (option of routeOptions; track $index) {
          <div 
            class="p-4 transition-all hover:bg-slate-50 cursor-pointer"
            [class.bg-blue-50]="option.isSelected"
            (click)="selectRoute($index, false)">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-8 rounded-full" [style.background-color]="option.color"></div>
                <div>
                  <div class="text-sm text-slate-600">Route {{ $index + 1 }}</div>
                  <div class="text-xs text-slate-500">{{ option.distance }} • {{ option.duration }}</div>
                </div>
              </div>
              @if (option.isSelected) {
                <i class="pi pi-check text-blue-500"></i>
              }
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Destination to Source Routes -->
    <div class="route-panel mt-4">
      <div class="px-5 py-4 border-b border-slate-100">
        <h3 class="text-lg font-medium text-slate-800">
          <i class="pi pi-reply text-slate-400 mr-2"></i>
          Return Routes
        </h3>
        <p class="text-xs text-slate-500 pl-6">Destination to Source</p>
      </div>
      
      <div class="divide-y divide-slate-100">
        @for (option of returnRouteOptions; track $index) {
          <div 
            class="p-4 transition-all hover:bg-slate-50 cursor-pointer"
            [class.bg-purple-50]="option.isSelected"
            (click)="selectRoute($index, true)">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-8 rounded-full" [style.background-color]="option.color"></div>
                <div>
                  <div class="text-sm text-slate-600">Route {{ $index + 1 }}</div>
                  <div class="text-xs text-slate-500">{{ option.distance }} • {{ option.duration }}</div>
                </div>
              </div>
              @if (option.isSelected) {
                <i class="pi pi-check text-purple-500"></i>
              }
            </div>
          </div>
        }
      </div>
    </div>
  </div>
  
  <!-- Right Section: Map Container -->
  <div class="flex-grow">
    <div class="relative">
      <div #mapContainer class="w-full rounded-xl overflow-hidden shadow-lg" [style.height.px]="height"></div>
    </div>
  </div>
</div>
  `
})
export class GenericGmRouteComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  @Input() apiKey = '';
  @Input() height = 400;
  @Input() initialZoom = 12;
  @Input() mapId = 'DEMO_MAP_ID';
  @Input() sourceLat = 0;
  @Input() sourceLng = 0;
  @Input() destinationLat = 0;
  @Input() destinationLng = 0;
  @Input() sourceGeofenceRadius = 1000;
  @Input() destinationGeofenceRadius = 1000;
  @Input() sourceGeofenceColor = '#4285F4';
  @Input() destinationGeofenceColor = '#EA4335';

  @Input() editRouteJson: any = null;

  @Output() routesCreated = new EventEmitter<{
    StD: {
      selected: google.maps.DirectionsResult;
      suggested: google.maps.DirectionsResult[];
    };
    DtoS: {
      selected: google.maps.DirectionsResult;
      suggested: google.maps.DirectionsResult[];
    };
  }>();

  @Output() routeSelected = new EventEmitter<{
    StD: {
      selected: google.maps.DirectionsResult;
      suggested: google.maps.DirectionsResult[];
    };
    DtoS: {
      selected: google.maps.DirectionsResult;
      suggested: google.maps.DirectionsResult[];
    };
  }>();

  private map!: google.maps.Map;
  private sourceMarker!: google.maps.marker.AdvancedMarkerElement;
  private destinationMarker!: google.maps.marker.AdvancedMarkerElement;
  private sourceGeofence!: google.maps.Circle;
  private destinationGeofence!: google.maps.Circle;
  private directionsService!: google.maps.DirectionsService;
  private routeRenderers: google.maps.DirectionsRenderer[] = [];
  private returnRouteRenderers: google.maps.DirectionsRenderer[] = [];
  private mapListeners: google.maps.MapsEventListener[] = [];
  private isMapInitialized = false;
  private _timeout: any;
  private _interval: any;

  // Route options for both directions
  public routeOptions: any[] = [];
  public returnRouteOptions: any[] = [];
  public selectedRouteIndex = 0;
  public selectedReturnRouteIndex = 0;

  constructor(
    private googleMapsLoader: GmLoaderService,
    private uiService: UiService
  ) {}

  ngOnInit() {
    // No initialization here, moved to ngOnChanges
  }

  async ngAfterViewInit() {
    try {
      await this.initMap();
      this.isMapInitialized = true;
      if (this.editRouteJson && this.sourceLat && this.sourceLng && this.destinationLat && this.destinationLng) {
        console.log('EditRouteJson changed:', this.editRouteJson);
        // Update markers
      await this.updateMarkers();
      
      // Update geofences
      this.updateGeofences();
        this.handleEditRouteJson(this.editRouteJson);
      }
      // Initial setup will be handled by ngOnChanges
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.isMapInitialized) {
      return;
    }

    // Handle geofence radius changes
    if (changes['sourceGeofenceRadius'] && !changes['sourceGeofenceRadius'].firstChange) {
      this.updateSourceGeofence();
    }
    
    if (changes['destinationGeofenceRadius'] && !changes['destinationGeofenceRadius'].firstChange) {
      this.updateDestinationGeofence();
    }

    // Handle coordinate changes
    if ((changes['sourceLat'] || changes['sourceLng'] || 
        changes['destinationLat'] || changes['destinationLng']) &&
        this.sourceLat && this.sourceLng && 
        this.destinationLat && this.destinationLng && this.map) {
      this.updateMarkersAndRoutes();
    }
  }

  private updateSourceGeofence() {
    if (this.sourceGeofence) {
      this.sourceGeofence.setRadius(this.sourceGeofenceRadius);
      this.sourceGeofence.setOptions({
        fillColor: this.sourceGeofenceColor,
        strokeColor: this.sourceGeofenceColor
      });
    }
  }

  private updateDestinationGeofence() {
    if (this.destinationGeofence) {
      this.destinationGeofence.setRadius(this.destinationGeofenceRadius);
      this.destinationGeofence.setOptions({
        fillColor: this.destinationGeofenceColor,
        strokeColor: this.destinationGeofenceColor
      });
    }
  }

  private async updateMarkersAndRoutes() {
    try {
      this.uiService.toggleLoader(true);
      
      // Update markers
      await this.updateMarkers();
      
      // Update geofences
      this.updateGeofences();
      
      // Create new routes
      await this.createRoutes();
      
    } catch (error) {
      console.error('Error updating markers and routes:', error);
    } finally {
      this.uiService.toggleLoader(false);
    }
  }

  private async updateMarkers() {
    const { PinElement, AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    
    // Update source marker
    if (this.sourceMarker) {
      this.sourceMarker.position = { lat: this.sourceLat, lng: this.sourceLng };
    } else {
      const sourcePinElement = new PinElement({
        glyph: 'S',
        glyphColor: 'white',
        background: this.sourceGeofenceColor,
        borderColor: this.sourceGeofenceColor,
        scale: 1.2
      });

      this.sourceMarker = new AdvancedMarkerElement({
        position: { lat: this.sourceLat, lng: this.sourceLng },
        map: this.map,
        gmpDraggable: false,
        title: "Source Location",
        content: sourcePinElement.element,
      });
    }

    // Update destination marker
    if (this.destinationMarker) {
      this.destinationMarker.position = { lat: this.destinationLat, lng: this.destinationLng };
    } else {
      const destinationPinElement = new PinElement({
        glyph: 'D',
        glyphColor: 'white',
        background: this.destinationGeofenceColor,
        borderColor: this.destinationGeofenceColor,
        scale: 1.2
      });

      this.destinationMarker = new AdvancedMarkerElement({
        position: { lat: this.destinationLat, lng: this.destinationLng },
        map: this.map,
        gmpDraggable: false,
        title: "Destination Location",
        content: destinationPinElement.element,
      });
    }
  }

  private updateGeofences() {
    // Update source geofence
    if (this.sourceGeofence) {
      this.sourceGeofence.setCenter({ lat: this.sourceLat, lng: this.sourceLng });
    } else {
      this.sourceGeofence = new google.maps.Circle({
        center: { lat: this.sourceLat, lng: this.sourceLng },
        radius: this.sourceGeofenceRadius,
        map: this.map,
        fillColor: this.sourceGeofenceColor,
        fillOpacity: 0.3,
        strokeColor: this.sourceGeofenceColor,
        strokeOpacity: 0.6,
        strokeWeight: 2
      });
    }

    // Update destination geofence
    if (this.destinationGeofence) {
      this.destinationGeofence.setCenter({ lat: this.destinationLat, lng: this.destinationLng });
    } else {
      this.destinationGeofence = new google.maps.Circle({
        center: { lat: this.destinationLat, lng: this.destinationLng },
        radius: this.destinationGeofenceRadius,
        map: this.map,
        fillColor: this.destinationGeofenceColor,
        fillOpacity: 0.3,
        strokeColor: this.destinationGeofenceColor,
        strokeOpacity: 0.6,
        strokeWeight: 2
      });
    }
  }

  ngOnDestroy() {
    // Remove all map event listeners
    this.cleanupMapListeners();

    // Clear all route renderers
    this.clearRoute();

    // Remove markers from map
    if (this.sourceMarker) {
      this.sourceMarker.map = null;
    }
    if (this.destinationMarker) {
      this.destinationMarker.map = null;
    }

    // Remove geofences from map
    if (this.sourceGeofence) {
      this.sourceGeofence.setMap(null);
    }
    if (this.destinationGeofence) {
      this.destinationGeofence.setMap(null);
    }

    // Clear all arrays
    this.routeRenderers = [];
    this.returnRouteRenderers = [];
    this.routeOptions = [];
    this.returnRouteOptions = [];
    this.mapListeners = [];

    // Reset component state
    this.selectedRouteIndex = 0;
    this.selectedReturnRouteIndex = 0;
    this.isMapInitialized = false;

    // Clear any pending timeouts or intervals
    if (this._timeout) {
      clearTimeout(this._timeout);
    }
    if (this._interval) {
      clearInterval(this._interval);
    }
  }

  private cleanupMapListeners() {
    this.mapListeners.forEach(listener => listener.remove());
    this.mapListeners = [];
  }

  private async initMap() {
    try {
      await this.googleMapsLoader.initializeLoader();
      
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { DirectionsService } = await google.maps.importLibrary("routes") as google.maps.RoutesLibrary;
      
      const mapOptions: google.maps.MapOptions = {
        center: { lat: environment.intialLat || 0, lng: environment.initialLng || 0 },
        zoom: this.initialZoom,
        mapTypeControl: true,
        mapId: this.mapId,
      };

      this.map = new Map(this.mapContainer.nativeElement, mapOptions);
      this.directionsService = new DirectionsService();
      
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      throw error;
    }
  }

  private async setupMarkers() {
    const { PinElement, AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    
    // Create source marker
    const sourcePinElement = new PinElement({
      glyph: 'S',
      glyphColor: 'white',
      background: this.sourceGeofenceColor,
      borderColor: this.sourceGeofenceColor,
      scale: 1.2
    });

    this.sourceMarker = new AdvancedMarkerElement({
      position: { lat: this.sourceLat, lng: this.sourceLng },
      map: this.map,
      gmpDraggable: false,
      title: "Source Location",
      content: sourcePinElement.element,
    });

    // Create destination marker
    const destinationPinElement = new PinElement({
      glyph: 'D',
      glyphColor: 'white',
      background: this.destinationGeofenceColor,
      borderColor: this.destinationGeofenceColor,
      scale: 1.2
    });

    this.destinationMarker = new AdvancedMarkerElement({
      position: { lat: this.destinationLat, lng: this.destinationLng },
      map: this.map,
      gmpDraggable: false,
      title: "Destination Location",
      content: destinationPinElement.element,
    });
  }

  private setupGeofences() {
    // Source geofence
    this.sourceGeofence = new google.maps.Circle({
      center: this.sourceMarker.position as google.maps.LatLng,
      radius: this.sourceGeofenceRadius,
      map: this.map,
      fillColor: this.sourceGeofenceColor,
      fillOpacity: 0.3,
      strokeColor: this.sourceGeofenceColor,
      strokeOpacity: 0.6,
      strokeWeight: 2
    });

    // Destination geofence
    this.destinationGeofence = new google.maps.Circle({
      center: this.destinationMarker.position as google.maps.LatLng,
      radius: this.destinationGeofenceRadius,
      map: this.map,
      fillColor: this.destinationGeofenceColor,
      fillOpacity: 0.3,
      strokeColor: this.destinationGeofenceColor,
      strokeOpacity: 0.6,
      strokeWeight: 2
    });
  }

  private async createRoutes() {
    try {
      this.uiService.toggleLoader(true);
      this.clearRoute();

      // If we have editRouteJson, use it to show existing routes
      if (this.editRouteJson) {
        await this.handleEditRouteJson(this.editRouteJson);
        return;
      }

      // If no editRouteJson, proceed with normal route creation
      const sourceLatLng = new google.maps.LatLng(this.sourceLat, this.sourceLng);
      const destinationLatLng = new google.maps.LatLng(this.destinationLat, this.destinationLng);

      // Source to Destination route
      const requestStoD: google.maps.DirectionsRequest = {
        origin: sourceLatLng,
        destination: destinationLatLng,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      };

      // Destination to Source route
      const requestDtoS: google.maps.DirectionsRequest = {
        origin: destinationLatLng,
        destination: sourceLatLng,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      };

      // Get both directions concurrently
      const [resultStoD, resultDtoS] = await Promise.all([
        this.directionsService.route(requestStoD),
        this.directionsService.route(requestDtoS)
      ]);

      if (!resultStoD || !resultStoD.routes || resultStoD.routes.length === 0) {
        throw new Error('No source to destination routes found');
      }

      if (!resultDtoS || !resultDtoS.routes || resultDtoS.routes.length === 0) {
        throw new Error('No destination to source routes found');
      }

      // Clear existing route options
      this.routeOptions = [];
      this.returnRouteOptions = [];

      // Create renderers for both directions
      await Promise.all([
        this.createRouteRenderers(resultStoD, false),
        this.createRouteRenderers(resultDtoS, true)
      ]);

      // Create complete route objects
      const sourceToDestinationRoutes = resultStoD.routes.map(route => ({
        ...resultStoD,
        routes: [route]
      }));

      const destinationToSourceRoutes = resultDtoS.routes.map(route => ({
        ...resultDtoS,
        routes: [route]
      }));

      // Log the routes before emitting
      // console.log('TestingRoute: About to emit routesCreated', {
      //   StD: {
      //     selected: sourceToDestinationRoutes[0],
      //     suggested: sourceToDestinationRoutes.slice(1)
      //   },
      //   DtoS: {
      //     selected: destinationToSourceRoutes[0],
      //     suggested: destinationToSourceRoutes.slice(1)
      //   }
      // });

      // Emit the created routes
      this.routesCreated.emit({
        StD: {
          selected: sourceToDestinationRoutes[0],
          suggested: sourceToDestinationRoutes.slice(1)
        },
        DtoS: {
          selected: destinationToSourceRoutes[0],
          suggested: destinationToSourceRoutes.slice(1)
        }
      });

      // console.log('TestingRoute: routesCreated event emitted');

      // Select first routes by default
      if (this.routeOptions.length > 0) {
        this.selectRoute(0, false);
      }
      if (this.returnRouteOptions.length > 0) {
        this.selectRoute(0, true);
      }

      // Fit map to show all routes and markers
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(sourceLatLng);
      bounds.extend(destinationLatLng);
      this.map.fitBounds(bounds);

    } catch (error) {
      console.error('Error creating routes:', error);
      alert('Error creating routes. Please check the coordinates and try again.');
    } finally {
      this.uiService.toggleLoader(false);
    }
  }

  private async createRouteRenderers(result: google.maps.DirectionsResult, isReturn: boolean, isSelected: boolean = false) {
    const { DirectionsRenderer } = await google.maps.importLibrary("routes") as google.maps.RoutesLibrary;
    
    // Sort routes by distance if we have multiple routes
    const sortedRoutes = Array.isArray(result.routes) 
      ? [...result.routes].sort((a, b) => {
          const distanceA = a.legs?.[0]?.distance?.value || 0;
          const distanceB = b.legs?.[0]?.distance?.value || 0;
          return distanceA - distanceB;
        })
      : [result.routes];

    // Reference to the appropriate arrays based on route direction
    const routeOptionsRef = isReturn ? this.returnRouteOptions : this.routeOptions;
    const routeRenderersRef = isReturn ? this.returnRouteRenderers : this.routeRenderers;

    // Create route renderers and options
    const newRenderers = sortedRoutes.map((route, index) => {
      const leg = route.legs?.[0];
      
      // Add route option with isSelected flag
      routeOptionsRef.push({
        route: route,
        distance: leg?.distance?.text || '',
        duration: leg?.duration?.text || '',
        color: this.getRouteColor(index, sortedRoutes.length, isReturn),
        isSelected: isSelected || index === 0
      });

      const directions: google.maps.DirectionsResult = {
        routes: [route],
        request: result.request,
        geocoded_waypoints: result.geocoded_waypoints || []
      };

      const renderer = new DirectionsRenderer({
        map: this.map,
        directions: directions,
        suppressMarkers: true,
        draggable: false,
        polylineOptions: {
          strokeColor: this.getRouteColor(index, sortedRoutes.length, isReturn),
          strokeWeight: isSelected ? (isReturn ? 6 : 7) : (isReturn ? 3 : 4),
          strokeOpacity: isSelected ? 1 : 0.4,
          zIndex: isSelected ? 1000 : 0
        },
        preserveViewport: true
      });

      return renderer;
    });

    // Add new renderers to our array
    routeRenderersRef.push(...newRenderers);
    return newRenderers[0];
  }

  private getRouteColor(index: number, totalRoutes: number, isReturn: boolean): string {
    // Use blue for Source to Destination and purple for Destination to Source
    return isReturn ? '#9C27B0' : '#2196F3';
  }

  public selectRoute(index: number, isReturn: boolean) {
    const routeOptionsRef = isReturn ? this.returnRouteOptions : this.routeOptions;
    const routeRenderersRef = isReturn ? this.returnRouteRenderers : this.routeRenderers;

    // Update selection state for all routes in the current direction
    routeOptionsRef.forEach((option, i) => {
      option.isSelected = i === index;
    });

    // Update renderer styles for all routes in the current direction
    routeRenderersRef.forEach((renderer, i) => {
      if (renderer) {
        const isSelected = i === index;
        const color = routeOptionsRef[i].color;
        
        // Set different styles for selected vs non-selected routes
        renderer.setOptions({
          polylineOptions: {
            strokeColor: color,
            strokeWeight: isSelected ? (isReturn ? 6 : 7) : (isReturn ? 3 : 4),
            strokeOpacity: isSelected ? 1 : 0.4,
            zIndex: isSelected ? 1000 : 0
          }
        });

        // Force update the renderer
        renderer.setMap(null);
        renderer.setMap(this.map);
      }
    });

    // Update the selection indices
    if (isReturn) {
      this.selectedReturnRouteIndex = index;
    } else {
      this.selectedRouteIndex = index;
    }

    // Get all routes for both directions, filtering out null values
    const allStDRoutes = this.routeRenderers
      .map(renderer => renderer.getDirections())
      .filter((route): route is google.maps.DirectionsResult => route !== null);

    const allDtoSRoutes = this.returnRouteRenderers
      .map(renderer => renderer.getDirections())
      .filter((route): route is google.maps.DirectionsResult => route !== null);

    // Emit the selected and suggested routes
    this.routeSelected.emit({
      StD: {
        selected: allStDRoutes[this.selectedRouteIndex],
        suggested: allStDRoutes.filter((_, i) => i !== this.selectedRouteIndex)
      },
      DtoS: {
        selected: allDtoSRoutes[this.selectedReturnRouteIndex],
        suggested: allDtoSRoutes.filter((_, i) => i !== this.selectedReturnRouteIndex)
      }
    });

    // Update map bounds to show all routes
    const bounds = new google.maps.LatLngBounds();
    routeRenderersRef.forEach(renderer => {
      if (renderer.getDirections()?.routes?.[0]?.bounds) {
        bounds.union(renderer.getDirections()!.routes[0].bounds!);
      }
    });
    if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds);
    }
  }

  private clearRoute() {
    // Clear all renderers
    this.routeRenderers.forEach(renderer => {
      renderer.setMap(null);
    });
    this.returnRouteRenderers.forEach(renderer => {
      renderer.setMap(null);
    });
    
    // Reset state
    this.routeRenderers = [];
    this.returnRouteRenderers = [];
    this.routeOptions = [];
    this.returnRouteOptions = [];
    this.selectedRouteIndex = 0;
    this.selectedReturnRouteIndex = 0;
  }

  private async handleEditRouteJson(editRouteJson: any) {
    try {
      this.uiService.toggleLoader(true);
      this.clearRoute();

      console.log('Handling edit route json:', editRouteJson);
      
      // First create renderers for selected routes
      const selectedStDRenderer = await this.createRouteRenderers(editRouteJson.StD.selected, false, true);
      const selectedDtoSRenderer = await this.createRouteRenderers(editRouteJson.DtoS.selected, true, true);

      // Then create renderers for suggested routes
      if (editRouteJson.StD.suggested?.length > 0) {
        for (const route of editRouteJson.StD.suggested) {
          await this.createRouteRenderers(route, false, false);
        }
      }

      if (editRouteJson.DtoS.suggested?.length > 0) {
        for (const route of editRouteJson.DtoS.suggested) {
          await this.createRouteRenderers(route, true, false);
        }
      }

      // Select the previously selected routes
      if (this.routeOptions.length > 0) {
        this.selectRoute(0, false);
      }
      if (this.returnRouteOptions.length > 0) {
        this.selectRoute(0, true);
      }

      // Fit map to show all routes and markers
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(this.sourceLat, this.sourceLng));
      bounds.extend(new google.maps.LatLng(this.destinationLat, this.destinationLng));
      this.map.fitBounds(bounds);

      // Emit the complete route data
      this.routesCreated.emit({
        StD: {
          selected: editRouteJson.StD.selected,
          suggested: editRouteJson.StD.suggested || []
        },
        DtoS: {
          selected: editRouteJson.DtoS.selected,
          suggested: editRouteJson.DtoS.suggested || []
        }
      });

    } catch (error) {
      console.error('Error handling edit route json:', error);
    } finally {
      this.uiService.toggleLoader(false);
    }
  }

}