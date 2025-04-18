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
    <!-- Available Routes Section -->
    @if (routeOptions.length > 0 && !isEditing) {
      <div class="route-panel">
        <div class="px-5 py-4 border-b border-slate-100">
          <h3 class="text-lg font-medium text-slate-800">Source to Destination</h3>
        </div>
        
        <div class="divide-y divide-slate-100">
          @for (option of routeOptions; track $index) {
            <div 
              class="p-4 transition-all hover:bg-slate-50"
              [class.bg-blue-50]="option.isSelected">
              <div class="flex items-center justify-between space-y-3">
                <!-- Route Indicator & Info -->
                <div class="flex items-center gap-3">
                  <div class="w-3 h-12 rounded-full" [style.background-color]="option.color"></div>
                  <div>
                    <div class="flex items-center gap-2 text-sm text-slate-500">
                      <i class="pi pi-map-marker text-sm"></i>
                      <span>{{ option.distance }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-slate-500">
                      <i class="pi pi-clock text-sm"></i>
                      <span>{{ option.duration }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Selection Button using PrimeNG -->
                <p-button
                  (onClick)="selectRoute($index, false)"
                  [outlined]="!option.isSelected"
                  [severity]="option.isSelected ? 'info' : 'secondary'"
                  [label]="option.isSelected ? 'Selected' : 'Select'"
                  styleClass="text-sm"
                  size="small"
                  [icon]="option.isSelected ? 'pi pi-check' : 'pi pi-arrow-right'"
                  iconPos="right"
                ></p-button>
              </div>
            </div>
          }
        </div>
      </div>
    }
    
    <!-- Return Routes Section -->
    @if (returnRouteOptions.length > 0 && !isEditing) {
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
              class="p-4 transition-all hover:bg-slate-50"
              [class.bg-green-50]="option.isSelected">
              <div class="flex items-center justify-between space-y-3">
                <!-- Route Indicator & Info -->
                <div class="flex items-center gap-3">
                  <div class="w-3 h-12 rounded-full" [style.background-color]="option.color"></div>
                  <div>
                    <div class="flex items-center gap-2 text-sm text-slate-500">
                      <i class="pi pi-map-marker text-sm"></i>
                      <span>{{ option.distance }}</span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-slate-500">
                      <i class="pi pi-clock text-sm"></i>
                      <span>{{ option.duration }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Selection Button using PrimeNG -->
                <p-button
                  (onClick)="selectRoute($index, true)"
                  [outlined]="!option.isSelected"
                  [severity]="option.isSelected ? 'success' : 'secondary'"
                  [label]="option.isSelected ? 'Selected' : 'Select'"
                  styleClass="text-sm"
                  size="small"
                  [icon]="option.isSelected ? 'pi pi-check' : 'pi pi-arrow-right'"
                  iconPos="right"
                ></p-button>
              </div>
            </div>
          }
        </div>
      </div>
    }
    
    <!-- Empty state message when no routes -->
    @if ((routeOptions.length === 0 || returnRouteOptions.length === 0) && !isEditing) {
      <div class="p-6 flex flex-col items-center justify-center text-center gap-3">
        <i class="pi pi-map text-4xl text-slate-300"></i>
        <h4 class="text-lg font-medium text-slate-600">No Routes Available</h4>
        <p class="text-sm text-slate-500">Select source and destination points on the map</p>
      </div>
    }
  </div>
  
  <!-- Right Section: Map Container -->
  <div class="flex-grow">
    <div class="relative">
      <div #mapContainer class="w-full rounded-xl overflow-hidden shadow-lg" [style.height.px]="height"></div>
      
      <!-- Map controls overlay -->
      <!-- <div class="absolute top-4 right-4 bg-white rounded-lg shadow-md p-2 flex flex-col gap-2">
        <button pButton class="p-button-text p-button-rounded" icon="pi pi-plus"></button>
        <button pButton class="p-button-text p-button-rounded" icon="pi pi-minus"></button>
        <button pButton class="p-button-text p-button-rounded" icon="pi pi-map"></button>
      </div> -->
    </div>
  </div>
</div>
  `
})
export class GenericGmRouteComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // Input properties with default values
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
  @Input() routeToBeEdited!: {sourceToDestination: SavedRoute | null, destinationToSource: SavedRoute | null};

  // Output events
  @Output() placeSelected = new EventEmitter<any>();
  @Output() mapClick = new EventEmitter<google.maps.LatLngLiteral>();
  @Output() sourceRadiusChanged = new EventEmitter<number>();
  @Output() destinationRadiusChanged = new EventEmitter<number>();
  // @Output() routeCreated = new EventEmitter<SavedRoute>();
  // Change the routeCreated Output
@Output() routeCreated = new EventEmitter<{sourceToDestination: SavedRoute | null, destinationToSource: SavedRoute | null}>();
@Output() routeSelected = new EventEmitter<{sourceToDestination: SavedRoute | null, destinationToSource: SavedRoute | null}>();

  // @Output() routeSelected = new EventEmitter<SavedRoute>();

  // Private properties
  private map!: google.maps.Map;
  private sourceMarker!: google.maps.marker.AdvancedMarkerElement;
  private destinationMarker!: google.maps.marker.AdvancedMarkerElement;
  private sourceGeofence!: google.maps.Circle;
  private destinationGeofence!: google.maps.Circle;
  private directionsService!: google.maps.DirectionsService;
  private routeRenderers: google.maps.DirectionsRenderer[] = [];
  private returnRouteRenderers: google.maps.DirectionsRenderer[] = [];
  private mapListeners: google.maps.MapsEventListener[] = [];
  private customPolyline: google.maps.Polyline | null = null;
  
  // Public properties
  isEditing = false;
  currentRouteIndex = -1;
  selectedRouteIndex = -1;
  selectedReturnRouteIndex = -1;
  routeOptions: RouteOption[] = [];
  returnRouteOptions: RouteOption[] = [];
  savedRoutes: SavedRoute[] = [];
  currentRoute: SavedRoute | null = null;
  showReturnRoutes = false;

  // Add this property to track both selected routes
selectedRoutes: {
  sourceToDestination: SavedRoute | null;
  destinationToSource: SavedRoute | null;
} = {
  sourceToDestination: null,
  destinationToSource: null
};

  constructor(
    private uiService: UiService, 
    private googleMapsLoader: GmLoaderService
  ) {}

  ngOnInit() {
    // Initialization logic
  }

  ngOnChanges(changes: SimpleChanges) {
    // Check if map is initialized
    if (!this.map) return;
    
    // Handle geofence radius changes
    if (changes['sourceGeofenceRadius'] && !changes['sourceGeofenceRadius'].firstChange && this.sourceGeofence) {
      this.updateSourceGeofence();
    }
    
    if (changes['destinationGeofenceRadius'] && !changes['destinationGeofenceRadius'].firstChange && this.destinationGeofence) {
      this.updateDestinationGeofence();
    }
    
    // Check if coordinates changed and create route
    if ((changes['sourceLat'] || changes['sourceLng'] || 
        changes['destinationLat'] || changes['destinationLng']) &&
        this.sourceLat && this.sourceLng && 
        this.destinationLat && this.destinationLng && this.map) {
      
      this.createRouteFromCoordinates(
        this.sourceLat,
        this.sourceLng,
        this.destinationLat,
        this.destinationLng
      );
    }
  }

  async ngAfterViewInit() {
    try {
      await this.initMap();
      
      // Check if we have coordinates or route to edit after map initialization
      if (this.routeToBeEdited && this.sourceLat && this.sourceLng && this.destinationLat && this.destinationLng) {
        
        this.editRoute(this.routeToBeEdited, 0);
        console.log(this.routeToBeEdited,'routeToBeEdited');
      }
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }

  ngOnDestroy() {
    this.cleanupMapListeners();
    this.clearRoute();
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
      
      // Set initial map center
      const mapOptions: google.maps.MapOptions = {
        center: { lat: environment.intialLat || 0, lng: environment.initialLng || 0 },
        zoom: this.initialZoom,
        mapTypeControl: true,
        mapId: this.mapId,
      };

      this.map = new Map(this.mapContainer.nativeElement, mapOptions);
      this.directionsService = new DirectionsService();
      
      // Setup markers and geofences
      await this.setupMarkers();
      this.setupGeofences();
      
      // Add map click listener
      const clickListener = this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          this.mapClick.emit(event.latLng.toJSON());
        }
      });
      
      this.mapListeners.push(clickListener);
      
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
      position: this.map.getCenter(),
      map: null, // Don't add to map initially
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
      position: this.map.getCenter(),
      map: null, // Don't add to map initially
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
      map: null, // Don't add to map initially
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
      map: null, // Don't add to map initially
      fillColor: this.destinationGeofenceColor,
      fillOpacity: 0.3,
      strokeColor: this.destinationGeofenceColor,
      strokeOpacity: 0.6,
      strokeWeight: 2,
      visible: true
    });
  }

  // Update source geofence radius
  updateSourceGeofence() {
    if (this.sourceGeofence) {
      this.sourceGeofence.setRadius(this.sourceGeofenceRadius);
      this.sourceRadiusChanged.emit(this.sourceGeofenceRadius);
    }
  }

  // Update destination geofence radius
  updateDestinationGeofence() {
    if (this.destinationGeofence) {
      this.destinationGeofence.setRadius(this.destinationGeofenceRadius);
      this.destinationRadiusChanged.emit(this.destinationGeofenceRadius);
    }
  }

  async createRouteFromCoordinates(
    sourceLat: number,
    sourceLng: number,
    destinationLat: number,
    destinationLng: number
  ) {
    try {
      this.uiService.toggleLoader(true);
      this.clearRoute();

      // Create LatLng objects
      const sourceLatLng = new google.maps.LatLng(sourceLat, sourceLng);
      const destinationLatLng = new google.maps.LatLng(destinationLat, destinationLng);

      // Update marker and geofence positions
      this.sourceMarker.position = sourceLatLng;
      this.destinationMarker.position = destinationLatLng;
      this.sourceGeofence.setCenter(sourceLatLng);
      this.destinationGeofence.setCenter(destinationLatLng);

      // Add markers and geofences to map
      this.sourceMarker.map = this.map;
      this.destinationMarker.map = this.map;
      this.sourceGeofence.setMap(this.map);
      this.destinationGeofence.setMap(this.map);

      // Source to Destination route
      const requestStoD: google.maps.DirectionsRequest = {
        origin: sourceLatLng,
        destination: destinationLatLng,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      };

      // Destination to Source route (return route)
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

      // Set current route to first source-to-destination route
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

      // Emit route created event
      if (this.currentRoute) {
        this.routeCreated.emit(this.selectedRoutes);
      }

    } catch (error) {
      console.error('Error creating routes from coordinates:', error);
      alert('Error creating routes. Please check the coordinates and try again.');
    } finally {
      this.uiService.toggleLoader(false);
    }
  }

  // Helper method to create route renderers for both S->D and D->S routes
  private async createRouteRenderers(result: google.maps.DirectionsResult, isReturn: boolean) {
    const { DirectionsRenderer } = await google.maps.importLibrary("routes") as google.maps.RoutesLibrary;
    
    // Sort routes by distance
    const sortedRoutes = [...result.routes].sort((a, b) => {
      const distanceA = a.legs?.[0]?.distance?.value || 0;
      const distanceB = b.legs?.[0]?.distance?.value || 0;
      return distanceA - distanceB;
    });

    // Reference to the appropriate arrays based on route direction
    const routeOptionsRef = isReturn ? this.returnRouteOptions : this.routeOptions;
    const routeRenderersRef = isReturn ? this.returnRouteRenderers : this.routeRenderers;

    // Create route renderers and options
    const newRenderers = sortedRoutes.map((route, index) => {
      const leg = route.legs?.[0];
      
      // Capture polyline path for later use when editing
      const polylinePath: google.maps.LatLngLiteral[] = [];
      if (route.overview_path) {
        route.overview_path.forEach(point => {
          polylinePath.push(point.toJSON());
        });
      }
      
      // Add route option
      routeOptionsRef.push({
        route: route,
        distance: leg?.distance?.text || '',
        duration: leg?.duration?.text || '',
        color: this.getRouteColor(index, sortedRoutes.length, isReturn),
        isSelected: index === 0 && !isReturn // Select first route by default for S->D only
      });

      const directions: google.maps.DirectionsResult = {
        routes: [route],
        request: result.request,
        geocoded_waypoints: result.geocoded_waypoints || []
      };

      const renderer = new DirectionsRenderer({
        map: this.map,
        directions: directions,
        suppressMarkers: true, // We'll use our own markers
        draggable: false,
        polylineOptions: {
          strokeColor: this.getRouteColor(index, sortedRoutes.length, isReturn),
          strokeWeight: isReturn ? 4 : 5, // Make return routes slightly thinner
          strokeOpacity: isReturn ? 0.5 : 0.7 // Make return routes slightly more transparent
        },
        // Hide return routes by default
        preserveViewport: true,
        // Only show the source->destination routes initially
        // visible: !isReturn
      });

      // If this is the first source-to-destination route, update current route
      if (index === 0 && !isReturn && leg) {
        this.currentRoute = {
          source: `${this.sourceLat}, ${this.sourceLng}`,
          destination: `${this.destinationLat}, ${this.destinationLng}`,
          directions: directions,
          distance: leg.distance?.text || '',
          duration: leg.duration?.text || '',
          startLocation: leg.start_location.toJSON(),
          endLocation: leg.end_location.toJSON(),
          polylinePath: polylinePath,
          isReturn: false
        };
      }

      return renderer;
    });

    // Add new renderers to our array
    routeRenderersRef.push(...newRenderers);

    // After creating all renderers, select the first route to ensure proper highlighting
    if (!isReturn && this.routeOptions.length > 0) {
      this.selectRoute(0, false);
    }
  }

  private updateRouteAfterDrag() {
    if (!this.isEditing) return;

    const renderer = this.routeRenderers[0];
    if (!renderer) return;

    const directions = renderer.getDirections();
    if (!directions || !directions.routes || directions.routes.length === 0) return;

    const route = directions.routes[0];
    const leg = route.legs?.[0];
    if (!leg) return;
    
    // Capture polyline path after drag
    const polylinePath: google.maps.LatLngLiteral[] = [];
    if (route.overview_path) {
      route.overview_path.forEach(point => {
        polylinePath.push(point.toJSON());
      });
    }

    // Update marker and geofence positions
    this.sourceMarker.position = leg.start_location;
    this.destinationMarker.position = leg.end_location;
    this.sourceGeofence.setCenter(leg.start_location);
    this.destinationGeofence.setCenter(leg.end_location);

   // Update the source to destination route if dragged
  if (this.routeRenderers.length > 0) {
    const stoD = this.updateDraggedRoute(this.routeRenderers[0], false);
    if (stoD) {
      this.selectedRoutes.sourceToDestination = stoD;
    }
  }
  
  // Update the destination to source route if dragged
  if (this.returnRouteRenderers.length > 0) {
    const dtoS = this.updateDraggedRoute(this.returnRouteRenderers[0], true);
    if (dtoS) {
      this.selectedRoutes.destinationToSource = dtoS;
    }
  }

 // Fit map to show all updated routes
 const bounds = new google.maps.LatLngBounds();
  
 // Add source and destination markers to bounds
 if (this.sourceMarker.position) bounds.extend(this.sourceMarker.position as google.maps.LatLng);
 if (this.destinationMarker.position) bounds.extend(this.destinationMarker.position as google.maps.LatLng);
 
 this.map.fitBounds(bounds);

 // Emit both routes
 this.routeCreated.emit(this.selectedRoutes);
  }


  private updateDraggedRoute(renderer: google.maps.DirectionsRenderer, isReturn: boolean): SavedRoute | null {
    const directions = renderer.getDirections();
    if (!directions || !directions.routes || directions.routes.length === 0) return null;
  
    const route = directions.routes[0];
    const leg = route.legs?.[0];
    if (!leg) return null;
    
    // Capture polyline path after drag
    const polylinePath: google.maps.LatLngLiteral[] = [];
    if (route.overview_path) {
      route.overview_path.forEach(point => {
        polylinePath.push(point.toJSON());
      });
    }
  
    // Only update markers and geofences for the primary route to avoid conflicts
    if (!isReturn) {
      this.sourceMarker.position = leg.start_location;
      this.destinationMarker.position = leg.end_location;
      this.sourceGeofence.setCenter(leg.start_location);
      this.destinationGeofence.setCenter(leg.end_location);
    }
  
    // Create updated route object
    return {
      source: leg.start_address || '',
      destination: leg.end_address || '',
      directions: directions,
      distance: leg.distance?.text || '',
      duration: leg.duration?.text || '',
      startLocation: leg.start_location.toJSON(),
      endLocation: leg.end_location.toJSON(),
      polylinePath: polylinePath,
      isReturn: isReturn
    };
  }

  async editRoute(routes: {sourceToDestination: SavedRoute | null, destinationToSource: SavedRoute | null}, index: number) {
    // Clear previous routes
    this.clearRoute();
    this.isEditing = true;
    this.currentRouteIndex = index;
    
    try {
      this.uiService.toggleLoader(true);
      
      // Process source to destination route
      if (routes.sourceToDestination) {
        await this.processEditedRoute(routes.sourceToDestination, false);
      }
      
      // Process destination to source route
      if (routes.destinationToSource) {
        await this.processEditedRoute(routes.destinationToSource, true);
      }
      
      // Update selectedRoutes object
      this.selectedRoutes = {
        sourceToDestination: routes.sourceToDestination,
        destinationToSource: routes.destinationToSource
      };
      
      // Calculate bounds to show all routes
      const bounds = new google.maps.LatLngBounds();
      
      // Add source and destination locations to bounds
      if (routes.sourceToDestination?.startLocation) {
        bounds.extend(new google.maps.LatLng(
          routes.sourceToDestination.startLocation.lat,
          routes.sourceToDestination.startLocation.lng
        ));
      }
      
      if (routes.sourceToDestination?.endLocation) {
        bounds.extend(new google.maps.LatLng(
          routes.sourceToDestination.endLocation.lat,
          routes.sourceToDestination.endLocation.lng
        ));
      }
      
      this.map.fitBounds(bounds);
      
    } catch (error) {
      console.error('Error editing routes:', error);
      alert('Error editing routes. Please try again.');
      this.clearRoute();
    } finally {
      this.uiService.toggleLoader(false);
    }
  }
  
  // Helper method to process each edited route
  private async processEditedRoute(route: SavedRoute, isReturn: boolean) {
    if (!route || !route.directions) {
      console.error('Invalid route data:', route);
      return;
    }
  
    // Check if we have valid location data
    if (!route.startLocation || !route.endLocation) {
      console.error('Invalid location data in route:', route);
      return;
    }
  
    // Create LatLng objects from the saved coordinates
    const sourceLatLng = new google.maps.LatLng(
      route.startLocation.lat,
      route.startLocation.lng
    );
    
    const destinationLatLng = new google.maps.LatLng(
      route.endLocation.lat,
      route.endLocation.lng
    );
  
    // Set markers and geofences only once (for the primary route)
    if (!isReturn) {
      // Update marker and geofence positions
      this.sourceMarker.position = sourceLatLng;
      this.destinationMarker.position = destinationLatLng;
      this.sourceGeofence.setCenter(sourceLatLng);
      this.destinationGeofence.setCenter(destinationLatLng);
  
      // Add markers and geofences to map
      this.sourceMarker.map = this.map;
      this.destinationMarker.map = this.map;
      this.sourceGeofence.setMap(this.map);
      this.destinationGeofence.setMap(this.map);
    }
  
    // Restore or recalculate the route
    if (route.polylinePath && route.polylinePath.length > 0) {
      await this.restoreRouteUsingPolyline(route, sourceLatLng, destinationLatLng);
    } else {
      await this.recalculateRoute(route, sourceLatLng, destinationLatLng);
    }
  }

  private updatePolylinePath() {
    if (!this.customPolyline || !this.currentRoute) return;
    
    // Get the current path of the polyline
    const path = this.customPolyline.getPath();
    const pathArray: google.maps.LatLngLiteral[] = [];
    
    // Convert MVCArray to array of LatLngLiteral
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      pathArray.push(point.toJSON());
    }
    
    // Update current route
    this.currentRoute.polylinePath = pathArray;
    
    // Calculate bounds after path update
    const bounds = new google.maps.LatLngBounds();
    pathArray.forEach(point => {
      bounds.extend(point);
    });
    
    // Add padding to the bounds
    this.map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
    
    // Emit updated route
    this.routeSelected.emit(this.selectedRoutes);
  }

// Update both private helper functions to fully handle the isReturn parameter
private async restoreRouteUsingPolyline(
  route: SavedRoute, 
  sourceLatLng: google.maps.LatLng, 
  destinationLatLng: google.maps.LatLng
) {
  // Convert saved path to LatLng objects
  const path = route.polylinePath!.map(point => 
    new google.maps.LatLng(point.lat, point.lng)
  );

  // Create a directions result with waypoints
  const { DirectionsRenderer } = await google.maps.importLibrary("routes") as google.maps.RoutesLibrary;
  
  // Determine color based on whether this is a return route
  const routeColor = route.isReturn ? '#9C27B0' : '#4285F4';
  
  // First attempt: Try to recreate the route with DirectionsRenderer
  try {
    // Create a minimal directions result
    const directions: any = {
      routes: [{
        legs: [{
          start_address: route.source,
          end_address: route.destination,
          start_location: sourceLatLng,
          end_location: destinationLatLng,
          distance: { text: route.distance, value: 0 },
          duration: { text: route.duration, value: 0 },
          steps: [{
            path: path,
            start_location: sourceLatLng,
            end_location: destinationLatLng,
            distance: { text: route.distance, value: 0 },
            duration: { text: route.duration, value: 0 },
            travel_mode: google.maps.TravelMode.DRIVING,
            instructions: ""
          }]
        }],
        overview_path: path,
        waypoint_order: [],
        bounds: new google.maps.LatLngBounds(sourceLatLng, destinationLatLng)
      }],
      request: {
        origin: sourceLatLng,
        destination: destinationLatLng,
        travelMode: google.maps.TravelMode.DRIVING
      },
      geocoded_waypoints: []
    };

    const renderer = new DirectionsRenderer({
      map: this.map,
      directions: directions,
      suppressMarkers: true,
      draggable: true,
      polylineOptions: {
        strokeColor: routeColor,
        strokeWeight: route.isReturn ? 4 : 5,
        strokeOpacity: route.isReturn ? 0.7 : 0.8
      }
    });

    // Add drag listener
    const dragListener = renderer.addListener('directions_changed', () => {
      this.updateRouteAfterDrag();
    });
    
    this.mapListeners.push(dragListener);
    
    // Add to appropriate renderer array
    if (route.isReturn) {
      this.returnRouteRenderers.push(renderer);
    } else {
      this.routeRenderers.push(renderer);
    }

    // Wait for the map to be fully loaded and rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Calculate bounds after renderer is added to map
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(sourceLatLng);
    bounds.extend(destinationLatLng);
    
    // Include all points in the path
    path.forEach(point => {
      bounds.extend(point);
    });
    
    // Add padding to the bounds
    this.map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  } 
  catch (error) {
    console.error('Failed to create DirectionsRenderer, falling back to Polyline', error);
    
    // Fallback to simple polyline
    this.customPolyline = new google.maps.Polyline({
      map: this.map,
      path: path,
      strokeColor: routeColor,
      strokeWeight: route.isReturn ? 4 : 5,
      strokeOpacity: route.isReturn ? 0.7 : 0.8,
      editable: true,
      draggable: true
    });

    // Add polyline change listeners
    const pathChangeListener = google.maps.event.addListener(
      this.customPolyline.getPath(), 
      'set_at', 
      () => this.updatePolylinePath()
    );
    
    const insertListener = google.maps.event.addListener(
      this.customPolyline.getPath(), 
      'insert_at', 
      () => this.updatePolylinePath()
    );
    
    const removeListener = google.maps.event.addListener(
      this.customPolyline.getPath(), 
      'remove_at', 
      () => this.updatePolylinePath()
    );
    
    this.mapListeners.push(pathChangeListener, insertListener, removeListener);

    // Wait for the polyline to be fully loaded and rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Calculate bounds after polyline is added to map
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(sourceLatLng);
    bounds.extend(destinationLatLng);
    
    // Include all points in the path
    path.forEach(point => {
      bounds.extend(point);
    });
    
    // Add padding to the bounds
    this.map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
  }
}

private async recalculateRoute(
  route: SavedRoute, 
  sourceLatLng: google.maps.LatLng, 
  destinationLatLng: google.maps.LatLng
) {
  try {
    const request: google.maps.DirectionsRequest = {
      origin: sourceLatLng,
      destination: destinationLatLng,
      travelMode: google.maps.TravelMode.DRIVING
    };

    const result = await this.directionsService.route(request);
    
    if (!result || !result.routes || result.routes.length === 0) {
      throw new Error('No routes found');
    }

    const { DirectionsRenderer } = await google.maps.importLibrary("routes") as google.maps.RoutesLibrary;
    
    // Determine color based on whether this is a return route
    const routeColor = route.isReturn ? '#9C27B0' : '#4285F4';
    
    // Use the first route
    const renderer = new DirectionsRenderer({
      map: this.map,
      directions: result,
      suppressMarkers: true,
      draggable: true,
      polylineOptions: {
        strokeColor: routeColor,
        strokeWeight: route.isReturn ? 4 : 5,
        strokeOpacity: route.isReturn ? 0.7 : 0.8
      }
    });

    // Add drag listener
    const dragListener = renderer.addListener('directions_changed', () => {
      this.updateRouteAfterDrag();
    });
    
    this.mapListeners.push(dragListener);
    
    // Add to appropriate renderer array
    if (route.isReturn) {
      this.returnRouteRenderers.push(renderer);
    } else {
      this.routeRenderers.push(renderer);
    }

    // Update route data
    const leg = result.routes[0]?.legs?.[0];
    if (leg) {
      // Capture polyline path
      const polylinePath: google.maps.LatLngLiteral[] = [];
      if (result.routes[0].overview_path) {
        result.routes[0].overview_path.forEach(point => {
          polylinePath.push(point.toJSON());
        });
      }

      // Update route
      route.directions = result;
      route.distance = leg.distance?.text || route.distance;
      route.duration = leg.duration?.text || route.duration;
      route.polylinePath = polylinePath;
    }
  } catch (error) {
    console.error('Error recalculating route:', error);
    throw error;
  }
}


// Update clearRoute to handle return routes properly
clearRoute() {
  // Clear all renderers
  this.routeRenderers.forEach(renderer => {
    renderer.setMap(null);
  });
  this.returnRouteRenderers.forEach(renderer => {
    renderer.setMap(null);
  });
  
  // Remove markers and geofences from map
  this.sourceMarker.map = null;
  this.destinationMarker.map = null;
  this.sourceGeofence.setMap(null);
  this.destinationGeofence.setMap(null);
  
  // Clear custom polyline if it exists
  if (this.customPolyline) {
    this.customPolyline.setMap(null);
    this.customPolyline = null;
  }
  
  // Reset state
  this.routeRenderers = [];
  this.returnRouteRenderers = [];
  this.routeOptions = [];
  this.returnRouteOptions = [];
  this.currentRoute = null;
  this.isEditing = false;
  this.currentRouteIndex = -1;
  this.selectedRouteIndex = -1;
  this.selectedReturnRouteIndex = -1;
  this.showReturnRoutes = false;
}

// Updated getRouteColor function to handle return routes
private getRouteColor(index: number, totalRoutes: number, isReturn: boolean = false): string {
  // Colors based on route distance (shortest to longest)
  if (isReturn) {
    // Use purple hues for return routes
    if (totalRoutes === 1) return '#9C27B0'; // Purple for single return route
    
    // For multiple return routes
    if (index === 0) return '#9C27B0'; // Purple for shortest return route
    if (index === totalRoutes - 1) return '#E91E63'; // Pink for longest return route
    return '#BA68C8'; // Light purple for medium distance return routes
  } else {
    // Use green/yellow/red for source to destination routes
    if (totalRoutes === 1) return '#4CAF50'; // Green for single route
    
    // For multiple routes
    if (index === 0) return '#4CAF50'; // Green for shortest route
    if (index === totalRoutes - 1) return '#F44336'; // Red for longest route
    return '#FFC107'; // Yellow for medium distance routes
  }
}

// Updated selectRoute function to handle return routes
selectRoute(index: number, isReturn: boolean = false) {
  // Reference to the appropriate arrays based on route direction
  const routeOptionsRef = isReturn ? this.returnRouteOptions : this.routeOptions;
  const routeRenderersRef = isReturn ? this.returnRouteRenderers : this.routeRenderers;
  
  if (routeOptionsRef.length <= index) {
    console.error(`Invalid route index: ${index}`);
    return;
  }

  // Update selection state
  routeOptionsRef.forEach(option => option.isSelected = false);
  routeOptionsRef[index].isSelected = true;
  
  if (isReturn) {
    this.selectedReturnRouteIndex = index;
    
    // Show the selected return route and hide others
    this.returnRouteRenderers.forEach((renderer, i) => {
      const isSelected = i === index;
      const color = this.getRouteColor(i, this.returnRouteRenderers.length, true);
      
      // Create new renderer options
      const options = {
        polylineOptions: {
          strokeColor: color,
          strokeWeight: isSelected ? 5 : 3, // Return routes slightly thinner
          strokeOpacity: isSelected ? 0.9 : 0.3,
          zIndex: isSelected ? 1 : 0
        },
        suppressMarkers: true,
        draggable: false,
        visible: isSelected // Only show the selected return route
      };

      // Apply options to renderer
      renderer.setOptions(options);
      
      // Force a redraw of the route
      const directions = renderer.getDirections();
      if (directions) {
        renderer.setDirections(directions);
      }
    });
  } else {
    this.selectedRouteIndex = index;
    
    // Update route renderers to show selection (source to destination)
    this.routeRenderers.forEach((renderer, i) => {
      const isSelected = i === index;
      const color = this.getRouteColor(i, this.routeRenderers.length, false);
      
      // Create new renderer options
      const options = {
        polylineOptions: {
          strokeColor: color,
          strokeWeight: isSelected ? 6 : 4,
          strokeOpacity: isSelected ? 1 : 0.4,
          zIndex: isSelected ? 1 : 0
        },
        suppressMarkers: true,
        draggable: false
      };

      // Apply options to renderer
      renderer.setOptions(options);
      
      // Force a redraw of the route
      const directions = renderer.getDirections();
      if (directions) {
        renderer.setDirections(directions);
      }
    });
  }

  // Update current route with selected route data
  const selectedRoute = routeOptionsRef[index];
  const leg = selectedRoute.route.legs?.[0];

  // Capture polyline path for later use when editing
  const polylinePath: google.maps.LatLngLiteral[] = [];
  if (selectedRoute?.route.overview_path) {
    selectedRoute?.route.overview_path.forEach(point => {
      polylinePath.push(point.toJSON());
    });
  }
  
  if (leg) {
    this.currentRoute = {
      source: isReturn 
        ? `${this.destinationLat}, ${this.destinationLng}`
        : `${this.sourceLat}, ${this.sourceLng}`,
      destination: isReturn 
        ? `${this.sourceLat}, ${this.sourceLng}`
        : `${this.destinationLat}, ${this.destinationLng}`,
      directions: {
        routes: [selectedRoute.route],
        request: {
          origin: new google.maps.LatLng(
            isReturn ? this.destinationLat : this.sourceLat, 
            isReturn ? this.destinationLng : this.sourceLng
          ),
          destination: new google.maps.LatLng(
            isReturn ? this.sourceLat : this.destinationLat, 
            isReturn ? this.sourceLng : this.destinationLng
          ),
          travelMode: google.maps.TravelMode.DRIVING
        },
        geocoded_waypoints: []
      },
      distance: selectedRoute.distance,
      duration: selectedRoute.duration,
      startLocation: leg.start_location?.toJSON(),
      endLocation: leg.end_location?.toJSON(),
      polylinePath: polylinePath,
      isReturn: isReturn
    };

    // Update the appropriate route in the selectedRoutes object
  if (isReturn) {
    this.selectedRoutes.destinationToSource = this.currentRoute;
  } else {
    this.selectedRoutes.sourceToDestination = this.currentRoute;
  }

    // Calculate bounds for the selected route
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(leg.start_location);
    bounds.extend(leg.end_location);
    
    // Include all points in the path
    if (selectedRoute.route.overview_path) {
      selectedRoute.route.overview_path.forEach(point => {
        bounds.extend(point);
      });
    }
    
    // Add padding to the bounds
    this.map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

    // Emit route selected event
    this.routeSelected.emit(this.selectedRoutes);
  }
}
}