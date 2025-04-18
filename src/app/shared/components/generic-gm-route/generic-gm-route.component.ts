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
    <div class="maps-container">
      <!-- Route Controls -->
      <div class="route-controls">
        <!-- Available Routes -->
        @if(routeOptions.length > 0 && !isEditing ) {
          <div class="available-routes">
            <h4>Source to Destination Routes</h4>
            <div class="route-list">
              @for (option of routeOptions; track $index) {
                <div class="route-option" [class.selected]="option.isSelected">
                  <div class="route-info">
                    <div class="route-color" [style.background-color]="option.color"></div>
                    <div class="route-details">
                      <div>Distance: {{ option.distance }}</div>
                      <div>Duration: {{ option.duration }}</div>
                    </div>
                  </div>
                  <button 
                    class="btn btn-sm" 
                    pButton
                    [class.btn-primary]="!option.isSelected"
                    [class.btn-success]="option.isSelected"
                    (click)="selectRoute($index, false)"
                  >
                    {{ option.isSelected ? 'Selected' : 'Select' }}
                  </button>
                </div>
              }
            </div>
          </div>
        }
        
        <!-- Return Routes -->
        @if(returnRouteOptions.length > 0 && !isEditing ) {
          <div class="available-routes mt-3">
            <h4>Return Routes (Destination to Source)</h4>
            <div class="route-list">
              @for (option of returnRouteOptions; track $index) {
                <div class="route-option" [class.selected]="option.isSelected">
                  <div class="route-info">
                    <div class="route-color" [style.background-color]="option.color"></div>
                    <div class="route-details">
                      <div>Distance: {{ option.distance }}</div>
                      <div>Duration: {{ option.duration }}</div>
                    </div>
                  </div>
                  <button 
                    class="btn btn-sm" 
                    pButton
                    [class.btn-primary]="!option.isSelected"
                    [class.btn-success]="option.isSelected"
                    (click)="selectRoute($index, true)"
                  >
                    {{ option.isSelected ? 'Selected' : 'Select' }}
                  </button>
                </div>
              }
            </div>
          </div>
        }
      </div>

      <div #mapContainer class="map-container" [style.height.px]="height"></div>
    </div>
  `,
  styles: [`
    .maps-container {
      width: 100%;
      position: relative;
    }
    .map-container {
      width: 100%;
    }
    .route-controls {
      position: absolute;
      top: 10px;
      left: 10px;
      background: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      z-index: 1;
      max-width: 300px;
    }
    .route-inputs {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 10px;
    }
    .available-routes {
      margin: 10px 0;
      max-height: 200px;
      overflow-y: auto;
    }
    .mt-3 {
      margin-top: 15px;
    }
    .route-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .route-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #f8f9fa;
    }
    .route-option.selected {
      background: #e8f5e9;
      border-color: #4caf50;
    }
    .route-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .route-color {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }
    .route-details {
      font-size: 0.9em;
    }
    .saved-routes {
      margin-top: 10px;
    }
    .saved-routes ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .saved-routes li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
      border-bottom: 1px solid #eee;
    }
  `]
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
  @Input() routeToBeEdited: SavedRoute | null = null;

  // Output events
  @Output() placeSelected = new EventEmitter<any>();
  @Output() mapClick = new EventEmitter<google.maps.LatLngLiteral>();
  @Output() sourceRadiusChanged = new EventEmitter<number>();
  @Output() destinationRadiusChanged = new EventEmitter<number>();
  @Output() routeCreated = new EventEmitter<SavedRoute>();
  @Output() routeSelected = new EventEmitter<SavedRoute>();

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

      // Fit map to show all routes and markers
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(sourceLatLng);
      bounds.extend(destinationLatLng);
      this.map.fitBounds(bounds);

      // Emit route created event
      if (this.currentRoute) {
        this.routeCreated.emit(this.currentRoute);
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

    // Update current route
    this.currentRoute = {
      source: leg.start_address || this.currentRoute?.source || '',
      destination: leg.end_address || this.currentRoute?.destination || '',
      directions: directions,
      distance: leg.distance?.text || this.currentRoute?.distance || '',
      duration: leg.duration?.text || this.currentRoute?.duration || '',
      startLocation: leg.start_location.toJSON(),
      endLocation: leg.end_location.toJSON(),
      polylinePath: polylinePath,
      isReturn: this.currentRoute?.isReturn || false
    };

    // Fit map to show all routes and markers
    const sourceLatLng = new google.maps.LatLng(this.sourceLat, this.sourceLng);
    const destinationLatLng = new google.maps.LatLng(this.destinationLat, this.destinationLng);
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(sourceLatLng);
    bounds.extend(destinationLatLng);
    this.map.fitBounds(bounds);

    // Emit route updated event
    this.routeSelected.emit(this.currentRoute);
  }

  async editRoute(route: SavedRoute | null, index: number) {
    if (!route || !route.directions) {
      console.error('Invalid route data:', route);
      alert('Invalid route data. Cannot edit this route.');
      return;
    }

    try {
      this.uiService.toggleLoader(true);
      this.clearRoute();
      this.isEditing = true;
      this.currentRouteIndex = index;

      // Check if we have valid location data
      if (!route.startLocation || !route.endLocation) {
        console.error('Invalid location data in route:', route);
        alert('Invalid location data in route. Cannot edit.');
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

      // Two approaches to restore the route:
      // 1. If we have a saved polyline path, use it
      // 2. Otherwise, use the DirectionsService to recalculate

      if (route.polylinePath && route.polylinePath.length > 0) {
        // Approach 1: Restore using saved polyline path
        await this.restoreRouteUsingPolyline(route, sourceLatLng, destinationLatLng);
      } else {
        // Approach 2: Recalculate using DirectionsService
        await this.recalculateRoute(route, sourceLatLng, destinationLatLng);
      }

      // Fit map to show the route
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(sourceLatLng);
      bounds.extend(destinationLatLng);
      this.map.fitBounds(bounds);
      
      // Update current route
      this.currentRoute = route;

    } catch (error) {
      console.error('Error editing route:', error);
      alert('Error editing route. Please try again.');
      this.clearRoute();
    } finally {
      this.uiService.toggleLoader(false);
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
    this.routeSelected.emit(this.currentRoute);
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
    this.routeSelected.emit(this.currentRoute);
  }
}
}