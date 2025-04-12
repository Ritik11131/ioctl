import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment.prod';
import { ButtonModule } from 'primeng/button';
import { UiService } from '../../../layout/service/ui.service';
import { GmLoaderService } from '../../../pages/service/gm-loader.service';


interface RouteOption {
  route: google.maps.DirectionsRoute;
  distance: string;
  duration: string;
  color: string;
  isSelected: boolean;
}

interface SavedRoute {
  source: string;
  destination: string;
  directions: google.maps.DirectionsResult;
  distance: string;
  duration: string;
  startLocation?: google.maps.LatLngLiteral;
  endLocation?: google.maps.LatLngLiteral;
}

@Component({
  selector: 'app-generic-gm-route',
  imports: [FormsModule, ButtonModule],
  template: `
    <div class="maps-container">
      <!-- Route Controls -->
      <div class="route-controls">
        <div class="route-inputs">
          <!-- <button pButton class="btn btn-primary" (click)="createRoute()">Create Route</button> -->
          <button pButton class="btn btn-success" (click)="saveRoute()" [disabled]="!currentRoute">Save Route</button>
          <button pButton class="btn btn-secondary" (click)="clearRoute()">Clear Route</button>
        </div>

        <!-- Available Routes -->
        @if(routeOptions.length > 0) {
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
                <button pButton class="btn btn-sm btn-danger" (click)="deleteRoute(route)">Delete</button>
              </li>
            }
          </ul>
        </div>
      </div>

      <div #mapContainer class="map-container" [style.height.px]="height"></div>
      
      <!-- Radius Control -->
      <!-- <div class="radius-control">
        <label for="radiusSlider">Geofence Radius: {{ geofenceRadius }} meters</label>
        <input
          id="radiusSlider"
          type="range"
          min="100"
          max="5000"
          step="100"
          [(ngModel)]="geofenceRadius"
          (input)="updateGeofence()"
        />
      </div> -->
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
    .radius-control {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      z-index: 1;
    }
  `]
})
export class GenericGmRouteComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {


  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @ViewChild('sourceInput') sourceInput!: ElementRef;
  @ViewChild('destinationInput') destinationInput!: ElementRef;

  @Input() apiKey = '';
  @Input() height = 400;
  @Input() initialZoom = 12;
  @Input() mapId = 'DEMO_MAP_ID';
  @Input() sourceLat = 0;
  @Input() sourceLng = 0;
  @Input() destinationLat = 0;
  @Input() destinationLng = 0;

  @Output() placeSelected = new EventEmitter<any>();
  @Output() mapClick = new EventEmitter<google.maps.LatLngLiteral>();
  @Output() radiusChanged = new EventEmitter<number>();
  @Output() routeCreated = new EventEmitter<any>();
  @Output() routeSelected = new EventEmitter<any>();

  private map!: google.maps.Map;
  private sourceMarker!: google.maps.marker.AdvancedMarkerElement;
  private destinationMarker!: google.maps.marker.AdvancedMarkerElement;
  private geofence!: google.maps.Circle;
  private directionsService!: google.maps.DirectionsService;
  private directionsRenderer!: google.maps.DirectionsRenderer;
  private autoCompleteToken!: google.maps.places.AutocompleteSessionToken;
  private debounceTimer: any;
  private routeRenderers: google.maps.DirectionsRenderer[] = [];
  routeOptions: RouteOption[] = [];
  private isEditing = false;
  private currentRouteIndex = -1;
  private mapListeners: google.maps.MapsEventListener[] = [];
  private selectedRouteIndex: number = -1;
  
  geofenceRadius = 1000;
  savedRoutes: SavedRoute[] = [];
  currentRoute: SavedRoute | null = null;

  constructor(private uiService:UiService, private googleMapsLoader:GmLoaderService) {
    // this.loadSavedRoutes();
  }

  // private loadSavedRoutes() {
  //   try {
  //     const savedRoutesStr = localStorage.getItem('savedRoutes');
  //     if (savedRoutesStr) {
  //       const parsedRoutes = JSON.parse(savedRoutesStr);
  //       this.savedRoutes = Array.isArray(parsedRoutes) ? parsedRoutes : [];
  //       console.log('Loaded routes from localStorage:', this.savedRoutes);
  //     }
  //   } catch (error) {
  //     console.error('Error loading saved routes:', error);
  //     this.savedRoutes = [];
  //   }
  // }

  ngOnInit() {
    // Remove the automatic route creation from here since it's now handled in ngOnChanges
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(changes,'changes');
    
    // Check if any of the coordinate inputs changed
    if (changes['sourceLat'] || changes['sourceLng'] || 
        changes['destinationLat'] || changes['destinationLng']) {
      console.log(changes['sourceLat'],changes['destinationLat']);
      
      // Only create route if all coordinates are provided and map is initialized
      if (
          this.sourceLat && this.sourceLng && 
          this.destinationLat && this.destinationLng) {
        this.createRouteFromCoordinates(
          this.sourceLat,
          this.sourceLng,
          this.destinationLat,
          this.destinationLng
        );
      }
    }
  }

  async ngAfterViewInit() {
    try {
      await this.initMap();
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

      await this.googleMapsLoader.initializeLoader()
      
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { DirectionsService, DirectionsRenderer } = await google.maps.importLibrary("routes") as google.maps.RoutesLibrary;
      
      this.autoCompleteToken = new google.maps.places.AutocompleteSessionToken();
      
      // Set initial map center to India
      const mapOptions: google.maps.MapOptions = {
        center: { lat: environment.intialLat, lng: environment.initialLng }, // Center of India
        zoom: 5,
        mapTypeControl: true,
        mapId: this.mapId,
      };

      this.map = new Map(this.mapContainer.nativeElement, mapOptions);
      this.directionsService = new DirectionsService();
      this.directionsRenderer = new DirectionsRenderer({
        map: this.map,
        draggable: true,
        panel: null,
        suppressMarkers: true
      });

      this.setupMarkers();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      throw error;
    }
  }

  private setupMarkers() {
    const sourcePinElement = new google.maps.marker.PinElement({
      glyph: 'S',
      glyphColor: 'white',
      background: '#4285F4',
      borderColor: '#4285F4',
      scale: 1.2
    });

    this.sourceMarker = new google.maps.marker.AdvancedMarkerElement({
      position: this.map.getCenter(),
      map: this.map,
      gmpDraggable: false,
      title: "Source Location",
      content: sourcePinElement.element,
    });

    const destinationPinElement = new google.maps.marker.PinElement({
      glyph: 'D',
      glyphColor: 'white',
      background: '#EA4335',
      borderColor: '#EA4335',
      scale: 1.2
    });

    this.destinationMarker = new google.maps.marker.AdvancedMarkerElement({
      position: this.map.getCenter(),
      map: this.map,
      gmpDraggable: false,
      title: "Destination Location",
      content: destinationPinElement.element,
    });

    this.geofence = new google.maps.Circle({
      center: this.sourceMarker.position!,
      radius: this.geofenceRadius,
      map: this.map,
      fillColor: "#FF0000",
      fillOpacity: 0.3,
      strokeColor: "#FF0000",
      strokeOpacity: 0.6,
      strokeWeight: 2
    });
  }

  // async createRoute() {
  //   if (!this.sourceAddress || !this.destinationAddress) {
  //     alert('Please enter both source and destination addresses');
  //     return;
  //   }

  //   try {
  //     this.clearRoute();

  //     const request: google.maps.DirectionsRequest = {
  //       origin: this.sourceAddress,
  //       destination: this.destinationAddress,
  //       travelMode: google.maps.TravelMode.DRIVING,
  //       provideRouteAlternatives: true
  //     };

  //     const result = await this.directionsService.route(request);
      
  //     if (!result || !result.routes || result.routes.length === 0) {
  //       throw new Error('No routes found');
  //     }

  //     // Clear existing route options
  //     this.routeOptions = [];

  //     // Get the first route's start and end locations for markers
  //     const firstRoute = result.routes[0];
  //     const firstLeg = firstRoute.legs?.[0];
      
  //     if (firstLeg) {
  //       // Update marker positions
  //       this.sourceMarker.position = firstLeg.start_location;
  //       this.destinationMarker.position = firstLeg.end_location;
  //       this.geofence.setCenter(firstLeg.start_location);
  //     }

  //     // Create route renderers and options
  //     this.routeRenderers = result.routes.map((route, index) => {
  //       const leg = route.legs?.[0];
        
  //       // Add route option
  //       this.routeOptions.push({
  //         route: route,
  //         distance: leg?.distance?.text || '',
  //         duration: leg?.duration?.text || '',
  //         color: this.getRouteColor(index, result.routes.length),
  //         isSelected: index === 0 // Select first route by default
  //       });

  //       const directions: google.maps.DirectionsResult = {
  //         routes: [route],
  //         request: request,
  //         geocoded_waypoints: result.geocoded_waypoints || []
  //       };

  //       const renderer = new google.maps.DirectionsRenderer({
  //         map: this.map,
  //         directions: directions,
  //         suppressMarkers: true, // We'll use our own markers
  //         draggable: false,
  //         polylineOptions: {
  //           strokeColor: this.getRouteColor(index, result.routes.length),
  //           strokeWeight: index === 0 ? 7 : 5,
  //           strokeOpacity: index === 0 ? 1 : 0.7
  //         }
  //       });

  //       return renderer;
  //     });

  //     // Set current route to first route
  //     if (this.routeOptions.length > 0) {
  //       this.selectRoute(0);
  //     }

  //     // Fit map to show all routes and markers
  //     const bounds = new google.maps.LatLngBounds();
  //     result.routes.forEach(route => {
  //       route.legs?.forEach(leg => {
  //         bounds.extend(leg.start_location);
  //         bounds.extend(leg.end_location);
  //       });
  //     });
  //     this.map.fitBounds(bounds);

  //   } catch (error) {
  //     console.error('Error creating route:', error);
  //     alert('Error creating route. Please check the addresses and try again.');
  //   }
  // }

  async createRouteFromCoordinates(
    sourceLat: number,
    sourceLng: number,
    destinationLat: number,
    destinationLng: number
  ) {
    console.log(sourceLat,sourceLng,destinationLat,destinationLng);
    
    try {
      this.uiService.toggleLoader(true);
      this.clearRoute();

      // Create LatLng objects
      const sourceLatLng = new google.maps.LatLng(sourceLat, sourceLng);
      const destinationLatLng = new google.maps.LatLng(destinationLat, destinationLng);

      // Update marker positions
      this.sourceMarker.position = sourceLatLng;
      this.destinationMarker.position = destinationLatLng;
      this.geofence.setCenter(sourceLatLng);

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
      this.uiService.toggleLoader(false)
    }
  }

  saveRoute() {
    if (!this.currentRoute) {
      alert('No route to save');
      return;
    }

    try {
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
      // Update marker positions
      this.sourceMarker.position = leg.start_location;
      this.destinationMarker.position = leg.end_location;
      this.geofence.setCenter(leg.start_location);

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

      // Update the route renderer with new options
      renderer.setOptions({
        draggable: true,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#4285F4',
          strokeWeight: 5,
          strokeOpacity: 0.7
        }
      });

      // Emit route updated event
      this.routeSelected.emit(this.currentRoute);
    }
  }

  editRoute(route: SavedRoute, index: number) {
    if (!route || !route.directions) {
      console.error('Invalid route data:', route);
      alert('Invalid route data. Cannot edit this route.');
      return;
    }

    try {
      this.clearRoute();

      const directions: google.maps.DirectionsResult = {
        routes: [...route.directions.routes],
        request: {
          origin: new google.maps.LatLng(route.startLocation?.lat || 0, route.startLocation?.lng || 0),
          destination: new google.maps.LatLng(route.endLocation?.lat || 0, route.endLocation?.lng || 0),
          travelMode: google.maps.TravelMode.DRIVING
        },
        geocoded_waypoints: [...(route.directions.geocoded_waypoints || [])]
      };

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
        this.sourceMarker.position = leg.start_location;
        this.destinationMarker.position = leg.end_location;
        this.geofence.setCenter(leg.start_location);
      }

      this.currentRoute = {
        source: route.source,
        destination: route.destination,
        directions: directions,
        distance: leg?.distance?.text || route.distance || '',
        duration: leg?.duration?.text || route.duration || '',
        startLocation: leg?.start_location?.toJSON(),
        endLocation: leg?.end_location?.toJSON()
      };
      
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
    this.routeRenderers.forEach(renderer => {
      renderer.setMap(null);
    });
    this.routeRenderers = [];
    this.routeOptions = [];
    this.currentRoute = null;
    this.isEditing = false;
    this.currentRouteIndex = -1;
    this.selectedRouteIndex = -1;
  }

  deleteRoute(route: SavedRoute) {
    try {
      this.savedRoutes = this.savedRoutes.filter(r => r !== route);
      localStorage.setItem('savedRoutes', JSON.stringify(this.savedRoutes));
      if (this.currentRoute === route) {
        this.clearRoute();
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      alert('Error deleting route. Please try again.');
    }
  }

  private getRouteColor(index: number, totalRoutes: number): string {
    if (totalRoutes === 1) return '#4285F4';
    if (index === 0) return '#34A853';
    if (index === totalRoutes - 1) return '#EA4335';
    return '#FBBC05';
  }

  private setupEventListeners() {
    this.mapListeners.push(
      this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          this.updateMarkerAndGeofence(event.latLng);
          this.mapClick.emit(event.latLng.toJSON());
        }
      })
    );

    this.mapListeners.push(
      this.sourceMarker.addListener('dragend', () => {
        const position = this.sourceMarker.position as google.maps.LatLng;
        if (position) {
          this.geofence.setCenter(position);
          this.placeSelected.emit(position.toJSON());
        }
      })
    );

    this.mapListeners.push(
      this.destinationMarker.addListener('dragend', () => {
        const position = this.destinationMarker.position as google.maps.LatLng;
        if (position) {
          this.geofence.setCenter(position);
          this.placeSelected.emit(position.toJSON());
        }
      })
    );
  }

  private updateMarkerAndGeofence(latLng: google.maps.LatLng) {
    this.sourceMarker.position = latLng;
    this.destinationMarker.position = latLng;
    this.geofence.setCenter(latLng);
  }

  updateGeofence() {
    this.geofence.setRadius(this.geofenceRadius);
    this.radiusChanged.emit(this.geofenceRadius);
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
