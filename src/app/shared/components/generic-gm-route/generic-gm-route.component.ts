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
            <h4>Available Routes</h4>
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
                    (click)="selectRoute($index)"
                  >
                    {{ option.isSelected ? 'Selected' : 'Select' }}
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <!-- Saved Routes -->
        <div class="saved-routes">
          <h4>Saved Routes</h4>
          <ul>
            @for (route of savedRoutes; track $index) {
              <li>
                {{ route?.source || 'Unknown source' }} → {{ route?.destination || 'Unknown destination' }}
                <button pButton class="btn btn-sm btn-info" (click)="editRoute(route, $index)">Edit</button>
              </li>
            }
          </ul>
        </div>
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

  @Input() routeToBeEdited = null
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
  private mapListeners: google.maps.MapsEventListener[] = [];
  public isEditing = false;
  private currentRouteIndex = -1;
  private selectedRouteIndex = -1;

  // Public properties
  routeOptions: RouteOption[] = [];
  savedRoutes: SavedRoute[] = [];
  currentRoute: SavedRoute | null = null;

  constructor(
    private uiService: UiService, 
    private googleMapsLoader: GmLoaderService
  ) {}

  ngOnInit() {
    
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes);
    
    // Handle geofence radius changes
    if (changes['sourceGeofenceRadius'] && !changes['sourceGeofenceRadius'].firstChange && this.sourceGeofence) {
      this.updateSourceGeofence();
    }
    
    if (changes['destinationGeofenceRadius'] && !changes['destinationGeofenceRadius'].firstChange && this.destinationGeofence) {
      this.updateDestinationGeofence();
    }
    
    // Check if coordinates changed and create route
    if (changes['sourceLat'] || changes['sourceLng'] || 
        changes['destinationLat'] || changes['destinationLng']) {
      console.log(changes['sourceLat'], this.sourceLat,'ohh');
      
      if (this.sourceLat && this.sourceLng && 
          this.destinationLat && this.destinationLng) {
            if(this.map) {

        this.createRouteFromCoordinates(
          this.sourceLat,
          this.sourceLng,
          this.destinationLat,
          this.destinationLng
        );
      }

      }
    }
  }

  async ngAfterViewInit() {
    try {
      await this.initMap();
       // Check if we have coordinates to create a route after map initialization
    if (this.sourceLat && this.sourceLng && this.destinationLat && this.destinationLng && this.routeToBeEdited) {
     this.editRoute(this.routeToBeEdited,0)
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
      const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes") as google.maps.RoutesLibrary;
      
      // Set initial map center
      const mapOptions: google.maps.MapOptions = {
        center: { lat: environment.intialLat, lng: environment.initialLng },
        zoom: 5,
        mapTypeControl: true,
        mapId: this.mapId,
      };

      this.map = new Map(this.mapContainer.nativeElement, mapOptions);
      this.directionsService = new DirectionsService();
      
      // Setup markers and geofences
      this.setupMarkers();
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

  private setupMarkers() {
    // Create source marker
    const sourcePinElement = new google.maps.marker.PinElement({
      glyph: 'S',
      glyphColor: 'white',
      background: this.sourceGeofenceColor,
      borderColor: this.sourceGeofenceColor,
      scale: 1.2
    });

    this.sourceMarker = new google.maps.marker.AdvancedMarkerElement({
      position: this.map.getCenter(),
      map: null, // Don't add to map initially
      gmpDraggable: false,
      title: "Source Location",
      content: sourcePinElement.element,
    });

    // Create destination marker
    const destinationPinElement = new google.maps.marker.PinElement({
      glyph: 'D',
      glyphColor: 'white',
      background: this.destinationGeofenceColor,
      borderColor: this.destinationGeofenceColor,
      scale: 1.2
    });

    this.destinationMarker = new google.maps.marker.AdvancedMarkerElement({
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
      center: this.sourceMarker.position!,
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
      center: this.destinationMarker.position!,
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
    console.log(sourceLat,destinationLat,'andrr');
    
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

      const request: google.maps.DirectionsRequest = {
        origin: sourceLatLng,
        destination: destinationLatLng,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      };

      const result = await this.directionsService.route(request);
      
      if (!result || !result.routes || result.routes.length === 0) {
        throw new Error('No routes found');
      }

      // Clear existing route options
      this.routeOptions = [];

      // Create route renderers and options
      this.routeRenderers = result.routes.map((route, index) => {
        const leg = route.legs?.[0];
        
        // Add route option
        this.routeOptions.push({
          route: route,
          distance: leg?.distance?.text || '',
          duration: leg?.duration?.text || '',
          color: this.getRouteColor(index, result.routes.length),
          isSelected: index === 0 // Select first route by default
        });

        const directions: google.maps.DirectionsResult = {
          routes: [route],
          request: request,
          geocoded_waypoints: result.geocoded_waypoints || []
        };

        const renderer = new google.maps.DirectionsRenderer({
          map: this.map,
          directions: directions,
          suppressMarkers: true, // We'll use our own markers
          draggable: false,
          polylineOptions: {
            strokeColor: this.getRouteColor(index, result.routes.length),
            strokeWeight: index === 0 ? 7 : 5,
            strokeOpacity: index === 0 ? 1 : 0.7
          }
        });

        return renderer;
      });

      // Set current route to first route
      if (this.routeOptions.length > 0) {
        this.selectRoute(0);
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
      console.error('Error creating route from coordinates:', error);
      alert('Error creating route. Please check the coordinates and try again.');
    } finally {
      this.uiService.toggleLoader(false);
    }
  }

  saveRoute() {
    if (!this.currentRoute) {
      alert('No route to save');
      return;
    }

    try {
      // Create a deep copy of the route to save
      const routeToSave: SavedRoute = {
        source: this.currentRoute.source,
        destination: this.currentRoute.destination,
        directions: {
          routes: [...this.currentRoute.directions.routes],
          request: {
            origin: this.currentRoute.directions.request.origin,
            destination: this.currentRoute.directions.request.destination,
            travelMode: this.currentRoute.directions.request.travelMode
          },
          geocoded_waypoints: [...(this.currentRoute.directions.geocoded_waypoints || [])]
        },
        distance: this.currentRoute.distance,
        duration: this.currentRoute.duration,
        startLocation: this.currentRoute.startLocation,
        endLocation: this.currentRoute.endLocation
      };

      // Add to saved routes and persist to local storage
      this.savedRoutes.push(routeToSave);
      localStorage.setItem('savedRoutes', JSON.stringify(this.savedRoutes));
      
      this.clearRoute();
    } catch (error) {
      console.error('Error saving route:', error);
      alert('Error saving route. Please try again.');
    }
  }

  private updateRouteAfterDrag() {
    if (!this.isEditing || this.currentRouteIndex === -1) return;

    const renderer = this.routeRenderers[0];
    if (!renderer) return;

    const directions = renderer.getDirections();
    if (!directions || !directions.routes || directions.routes.length === 0) return;

    const route = directions.routes[0];
    const leg = route.legs?.[0];
    if (!leg) return;
    
    const startLocation = leg.start_location?.toJSON();
    const endLocation = leg.end_location?.toJSON();

    if (startLocation && endLocation) {
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
        startLocation,
        endLocation
      };

      // Emit route updated event
      this.routeSelected.emit(this.currentRoute);
    }
  }

  editRoute(route: SavedRoute, index: number) {
    console.log(route,'route');
    if (!route || !route.directions) {
      console.error('Invalid route data:', route);
      alert('Invalid route data. Cannot edit this route.');
      return;
    }

    try {
      this.clearRoute();

          // Create LatLng objects
      const sourceLatLng = new google.maps.LatLng(this.sourceLat, this.sourceLng);
      const destinationLatLng = new google.maps.LatLng(this.destinationLat, this.destinationLng);

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

      // Recreate the directions result
      const directions: google.maps.DirectionsResult = {
        routes: [...route.directions.routes],
        request: {
          origin: new google.maps.LatLng(route.startLocation?.lat || 0, route.startLocation?.lng || 0),
          destination: new google.maps.LatLng(route.endLocation?.lat || 0, route.endLocation?.lng || 0),
          travelMode: google.maps.TravelMode.DRIVING
        },
        geocoded_waypoints: [...(route.directions.geocoded_waypoints || [])]
      };

      // Create a new renderer for the route
      const renderer = new google.maps.DirectionsRenderer({
        map: this.map,
        directions: directions,
        suppressMarkers: true,
        draggable: true,
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 5,
          strokeOpacity: 0.7
        }
      });

      // Add drag listener
      renderer.addListener('directions_changed', () => {
        this.updateRouteAfterDrag();
      });

      this.routeRenderers.push(renderer);

      const leg = directions.routes[0]?.legs?.[0];
      if (leg) {
        // Update markers and geofences
        this.sourceMarker.position = leg.start_location;
        this.destinationMarker.position = leg.end_location;
        this.sourceGeofence.setCenter(leg.start_location);
        this.destinationGeofence.setCenter(leg.end_location);
      }

      // Update current route
      this.currentRoute = route;
      
      this.isEditing = true;
      this.currentRouteIndex = index;

      // Fit map to show the route
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(leg?.start_location!);
      bounds.extend(leg?.end_location!);
      this.map.fitBounds(bounds);

    } catch (error) {
      console.error('Error editing route:', error);
      alert('Error editing route. Please try again.');
      this.clearRoute();
    }
  }

  clearRoute() {
    // Clear all renderers
    this.routeRenderers.forEach(renderer => {
      renderer.setMap(null);
    });
     // Remove markers and geofences from map
  this.sourceMarker.map = null;
  this.destinationMarker.map = null;
  this.sourceGeofence.setMap(null);
  this.destinationGeofence.setMap(null);
    
    // Reset state
    this.routeRenderers = [];
    this.routeOptions = [];
    this.currentRoute = null;
    this.isEditing = false;
    this.currentRouteIndex = -1;
    this.selectedRouteIndex = -1;
  }

  private getRouteColor(index: number, totalRoutes: number): string {
    if (totalRoutes === 1) return '#4285F4';
    if (index === 0) return '#34A853';
    if (index === totalRoutes - 1) return '#EA4335';
    return '#FBBC05';
  }

  selectRoute(index: number) {
    if (this.routeOptions.length > 0) {
      // Update selection state
      this.routeOptions.forEach(option => option.isSelected = false);
      this.routeOptions[index].isSelected = true;
      this.selectedRouteIndex = index;

      // Update route renderers to show selection
      this.routeRenderers.forEach((renderer, i) => {
        const polylineOptions = {
          strokeColor: this.getRouteColor(i, this.routeRenderers.length),
          strokeWeight: i === index ? 7 : 5,
          strokeOpacity: i === index ? 1 : 0.7
        };
        renderer.setOptions({ polylineOptions });
      });

      // Update current route with selected route data
      const selectedRoute = this.routeOptions[index];
      const leg = selectedRoute.route.legs?.[0];
      
      if (leg) {
        this.currentRoute = {
          source: (`${this.sourceLat}, ${this.sourceLng}`),
          destination: (`${this.destinationLat}, ${this.destinationLng}`),
          directions: {
            routes: [selectedRoute.route],
            request: {
              origin: new google.maps.LatLng(this.sourceLat, this.sourceLng),
              destination: new google.maps.LatLng(this.destinationLat, this.destinationLng),
              travelMode: google.maps.TravelMode.DRIVING
            },
            geocoded_waypoints: []
          },
          distance: selectedRoute.distance,
          duration: selectedRoute.duration,
          startLocation: leg.start_location?.toJSON(),
          endLocation: leg.end_location?.toJSON()
        };

        // Emit route selected event
        this.routeSelected.emit(this.currentRoute);
      }
    }
  }
}