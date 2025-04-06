import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Loader } from '@googlemaps/js-api-loader';
import { GoogleMapsModule } from '@angular/google-maps';

export interface MarkerPosition {
  lat: number;
  lng: number;
}

export interface RouteWaypoint {
  location: MarkerPosition;
  stopover?: boolean;
}

// Define travel mode as string type for use before Google Maps is loaded
export type TravelMode = 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';

export interface RouteData {
  origin: MarkerPosition;
  destination: MarkerPosition;
  waypoints?: RouteWaypoint[];
  travelMode?: TravelMode;
  roundTrip: boolean;
  routeId?: string;
}

@Component({
  selector: 'app-enhanced-google-map',
  standalone: true,
  imports: [FormsModule, CommonModule, GoogleMapsModule],
  template: `
    <div class="map-container-wrapper">
      <div #mapContainer class="map-container" [style.height.px]="height"></div>
      
      <!-- Geofence Radius Control - Only visible in address mode -->
      <div *ngIf="mode === 'address'" class="control-panel top-panel">
        <label for="radiusSlider">Geofence Radius: {{ geofenceRadius }} meters</label>
        <input
          id="radiusSlider"
          type="range"
          min="50"
          max="5000"
          step="100"
          [(ngModel)]="geofenceRadius"
          (input)="updateGeofence()"
        />
      </div>

      <!-- Route Controls - Only visible in route mode -->
      <div *ngIf="mode === 'route'" class="control-panel bottom-panel">
        <div class="route-options">
          <label>
            <input type="checkbox" [(ngModel)]="roundTrip" (change)="updateRoute()">
            Round Trip
          </label>
          <select [(ngModel)]="travelMode" (change)="updateRoute()">
            <option value="DRIVING">Driving</option>
            <option value="WALKING">Walking</option>
            <option value="BICYCLING">Bicycling</option>
            <option value="TRANSIT">Transit</option>
          </select>
          <button *ngIf="routeExists" (click)="clearRoute()">Clear Route</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-container-wrapper {
      width: 100%;
      position: relative;
    }
    .map-container {
      width: 100%;
    }
    .control-panel {
      position: absolute;
      background: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      z-index: 1;
      min-width: 220px;
    }
    .top-panel {
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
    }
    .bottom-panel {
      bottom: 10px;
      left: 10px;
    }
    .route-options {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    button {
      padding: 4px 8px;
      cursor: pointer;
    }
  `]
})
export class EnhancedGoogleMapComponent implements AfterViewInit, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  // Common inputs
  @Input() apiKey = '';
  @Input() height = 400;
  @Input() initialLatitude = 40.730610;
  @Input() initialLongitude = -73.935242;
  @Input() initialZoom = 18;
  @Input() mapId = 'DEMO_MAP_ID';
  @Input() mode: 'address' | 'route' = 'address';

  // Address mode inputs
  @Input() geofenceRadius = 500;
  @Input() existingAddress: MarkerPosition | null = null;

  // Route mode inputs
  @Input() existingRoute: RouteData | null = null;
  @Input() roundTrip = false;
  @Input() travelMode: TravelMode = 'DRIVING';
  @Input() outboundColor = '#0088FF';
  @Input() returnColor = '#FF8800';

  // Common outputs
  @Output() mapReady = new EventEmitter<any>();
  @Output() mapClick = new EventEmitter<MarkerPosition>();

  // Address mode outputs
  @Output() radiusChanged = new EventEmitter<number>();
  @Output() markerMoved = new EventEmitter<MarkerPosition>();
  @Output() addressSelected = new EventEmitter<{
    position: MarkerPosition,
    radius: number
  }>();

  // Route mode outputs
  @Output() routeCreated = new EventEmitter<RouteData>();
  @Output() routeUpdated = new EventEmitter<RouteData>();
  @Output() routeCleared = new EventEmitter<void>();

  // Map objects
  map: any;
  private marker: any = null;
  private geofence: any = null;
  
  // Route objects
  private directionsService: any;
  private directionsRenderer: any;
  private returnDirectionsRenderer: any;
  private routeMarkers: any[] = [];
  private waypoints: MarkerPosition[] = [];
  routeExists = false;
  
  // Google libraries
  private google: any;

  constructor() {}

  async ngAfterViewInit() {
    await this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Handle changes to existing address or route when map is already initialized
    if (this.map) {
      if (changes['existingAddress'] && this.mode === 'address' && this.existingAddress) {
        this.updateMarkerPosition(this.existingAddress);
        console.log('1');
        
      }
      
      if (changes['existingRoute'] && this.mode === 'route' && this.existingRoute) {
        this.loadExistingRoute(this.existingRoute);
      }
      
      if (changes['mode'] && changes['mode'].currentValue !== changes['mode'].previousValue) {
        this.resetMap();
        if (this.mode === 'address') {
          this.setupAddressMode();
          if (this.existingAddress) {
            this.updateMarkerPosition(this.existingAddress);
            console.log('2');
            
          }
        } else if (this.mode === 'route') {
          this.setupRouteMode();
          if (this.existingRoute) {
            this.loadExistingRoute(this.existingRoute);
          }
        }
      }
    }
  }

  private async initMap() {
    try {
      const loader = new Loader({
        apiKey: this.apiKey,
        version: "weekly",
        libraries: ['places', 'maps', 'marker', 'drawing', 'routes']
      });

      await loader.load();
      
      // Store google globally in component
      this.google = google;
      
      // Import required libraries
      const { Map } = await google.maps.importLibrary("maps") as any;
      
      // Initialize map
      const mapOptions = {
        center: { lat: this.initialLatitude, lng: this.initialLongitude },
        zoom: this.initialZoom,
        mapTypeControl: true,
        mapId: this.mapId,
      };

      this.map = new Map(this.mapContainer.nativeElement, mapOptions);
      
      // Initialize directions service
      this.directionsService = new google.maps.DirectionsService();
      
      // Initialize directions renderers
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: this.outboundColor,
          strokeWeight: 5
        }
      });
      
      this.returnDirectionsRenderer = new google.maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: this.returnColor,
          strokeWeight: 5,
          strokeOpacity: 0.7
        }
      });
      
      // Setup map based on mode
      if (this.mode === 'address') {
        this.setupAddressMode();
        if (this.existingAddress) {
          this.updateMarkerPosition(this.existingAddress);
          console.log('3');
          
        }
      } else if (this.mode === 'route') {
        this.setupRouteMode();
        if (this.existingRoute) {
          this.loadExistingRoute(this.existingRoute);
        }
      }
      
      // Emit map instance to parent
      this.mapReady.emit(this.map);
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
    }
  }

  private resetMap() {
    // Clear address components
    if (this.marker) {
      this.marker.map = null;
      this.marker = null;
    }
    
    if (this.geofence) {
      this.geofence.setMap(null);
      this.geofence = null;
    }
    
    // Clear route components
    this.directionsRenderer.setMap(null);
    this.returnDirectionsRenderer.setMap(null);
    this.routeMarkers.forEach((marker: any) => marker.map = null);
    this.routeMarkers = [];
    this.waypoints = [];
    this.routeExists = false;
  }

  private async setupAddressMode() {
    // Import marker library
    const { AdvancedMarkerElement } = await this.google.maps.importLibrary("marker") as any;
    
    // Create marker
    this.marker = new AdvancedMarkerElement({
      position: { lat: this.initialLatitude, lng: this.initialLongitude },
      map: this.map,
      gmpDraggable: true,
      title: "Drag me to set location",
    });

    // Initialize Geofence
    this.geofence = new this.google.maps.Circle({
      center: this.marker.position,
      radius: this.geofenceRadius,
      map: this.map,
      fillColor: "#FF0000",
      fillOpacity: 0.3,
      strokeColor: "#FF0000",
      strokeOpacity: 0.6,
      strokeWeight: 2
    });

    this.setupAddressEventListeners();
  }

  private setupRouteMode() {
    this.directionsRenderer.setMap(this.map);
    if (this.roundTrip) {
      this.returnDirectionsRenderer.setMap(this.map);
    } else {
      this.returnDirectionsRenderer.setMap(null);
    }
    
    this.setupRouteEventListeners();
  }

  private setupAddressEventListeners() {
    // Listen for map clicks
    this.map.addListener('click', (event: any) => {
      if (event.latLng && this.mode === 'address') {
        this.updateMarkerAndGeofence(event.latLng);
        this.mapClick.emit({
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        });
        console.log('click');
        
        this.emitAddressData();
        
      }
    });

    // Listen for marker drag events
    if (this.marker) {
      this.marker.addListener('dragend', () => {
        const position = this.marker.position;
        if (position && this.geofence) {
          this.geofence.setCenter(position);
          this.markerMoved.emit({ lat: position.lat, lng: position.lng });
        console.log('drag');

          this.emitAddressData();
        }
      });
    }
  }

  private setupRouteEventListeners() {
    // Map click handler for routes
    this.map.addListener('click', (event: any) => {
      if (event.latLng && this.mode === 'route') {
        this.handleRouteMapClick(event.latLng);
      }
    });
  }

  private async handleRouteMapClick(latLng: any) {
    const { AdvancedMarkerElement } = await this.google.maps.importLibrary("marker") as any;
    
    const latLngObj = { lat: latLng.lat(), lng: latLng.lng() };
    this.mapClick.emit(latLngObj);
    
    // Create a marker at the clicked position
    const marker = new AdvancedMarkerElement({
      position: latLng,
      map: this.map,
      gmpDraggable: true,
      title: this.routeMarkers.length === 0 ? "Origin" : 
             this.routeMarkers.length === 1 ? "Destination" : "Waypoint",
    });
    
    // Add marker to the list
    this.routeMarkers.push(marker);
    
    // Set up drag listener for this marker
    marker.addListener('dragend', () => {
      const position = marker.position;
      if (position) {
        const index = this.routeMarkers.indexOf(marker);
        if (index !== -1) {
          this.waypoints[index] = { lat: position.lat, lng: position.lng };
          this.updateRoute();
        }
      }
    });
    
    // Add the waypoint
    this.waypoints.push(latLngObj);
    
    // If we have at least 2 points, calculate and display the route
    if (this.waypoints.length >= 2) {
      this.updateRoute();
    }
  }

  updateGeofence() {
    if (this.geofence) {
      this.geofence.setRadius(this.geofenceRadius);
      this.radiusChanged.emit(this.geofenceRadius);      
      this.emitAddressData();
    }
  }

  // Public method to update marker position from parent
  updateMarkerPosition(latLng: MarkerPosition) {
    if (this.map && this.google && this.mode === 'address') {
      const position = new this.google.maps.LatLng(latLng.lat, latLng.lng);
      this.updateMarkerAndGeofence(position);
      
      // Center map on the new position
      this.map.setCenter(position);
      if (this.map.getZoom() < 14) {
        this.map.setZoom(14);
      }
      console.log('updatemarer');
      
      this.emitAddressData();
    }
  }

  private updateMarkerAndGeofence(latLng: any) {
    if (this.marker && this.geofence) {
      this.marker.position = latLng;
      this.geofence.setCenter(latLng);
    }
  }

  private emitAddressData() {
    if (this.marker && this.marker.position) {
      const position = this.marker.position;
      this.addressSelected.emit({
        position: { lat: position.lat, lng: position.lng },
        radius: this.geofenceRadius
      });
    }
  }

  // Route methods
  updateRoute() {
    if (!this.google || this.waypoints.length < 2) return;
    
    const origin = this.waypoints[0];
    const destination = this.roundTrip ? this.waypoints[0] : this.waypoints[this.waypoints.length - 1];
    
    let waypointObjects: any[] = [];
    
    if (this.waypoints.length > 2) {
      // For non-round trip, use all intermediate points as waypoints
      // For round trip, use all points except the first as waypoints
      const waypointStart = 1;
      const waypointEnd = this.roundTrip ? this.waypoints.length : this.waypoints.length - 1;
      
      waypointObjects = this.waypoints
        .slice(waypointStart, waypointEnd)
        .map(point => ({
          location: new this.google.maps.LatLng(point.lat, point.lng),
          stopover: true
        }));
    }
    
    // Convert string travel mode to Google Maps travel mode
    const googleTravelMode = this.getGoogleTravelMode(this.travelMode);
    
    // Main route
    this.directionsService.route({
      origin: new this.google.maps.LatLng(origin.lat, origin.lng),
      destination: new this.google.maps.LatLng(destination.lat, destination.lng),
      waypoints: waypointObjects,
      travelMode: googleTravelMode,
      optimizeWaypoints: false
    }, (result: any, status: any) => {
      if (status === this.google.maps.DirectionsStatus.OK && result) {
        this.directionsRenderer.setDirections(result);
        this.routeExists = true;
        
        // If round trip, calculate the return route
        if (this.roundTrip && this.waypoints.length > 2) {
          this.calculateReturnRoute();
        } else {
          this.returnDirectionsRenderer.setMap(null);
        }
        
        this.emitRouteData();
      }
    });
  }
  
  private calculateReturnRoute() {
    if (!this.google) return;
    
    // For return route in round trip, reverse the waypoints
    const reversedWaypoints = [...this.waypoints.slice(1)].reverse();
    
    const waypointObjects = reversedWaypoints.slice(0, -1).map(point => ({
      location: new this.google.maps.LatLng(point.lat, point.lng),
      stopover: true
    }));
    
    // Convert string travel mode to Google Maps travel mode
    const googleTravelMode = this.getGoogleTravelMode(this.travelMode);
    
    this.directionsService.route({
      origin: new this.google.maps.LatLng(this.waypoints[this.waypoints.length - 1].lat, this.waypoints[this.waypoints.length - 1].lng),
      destination: new this.google.maps.LatLng(this.waypoints[0].lat, this.waypoints[0].lng),
      waypoints: waypointObjects,
      travelMode: googleTravelMode,
      optimizeWaypoints: false
    }, (result: any, status: any) => {
      if (status === this.google.maps.DirectionsStatus.OK && result) {
        this.returnDirectionsRenderer.setMap(this.map);
        this.returnDirectionsRenderer.setDirections(result);
      }
    });
  }
  
  // Helper function to convert string travel mode to Google Maps travel mode
  private getGoogleTravelMode(travelMode: TravelMode): any {
    if (this.google) {
      switch (travelMode) {
        case 'WALKING':
          return this.google.maps.TravelMode.WALKING;
        case 'BICYCLING':
          return this.google.maps.TravelMode.BICYCLING;
        case 'TRANSIT':
          return this.google.maps.TravelMode.TRANSIT;
        case 'DRIVING':
        default:
          return this.google.maps.TravelMode.DRIVING;
      }
    }
    return null;
  }
  
  clearRoute() {
    this.directionsRenderer.setMap(null);
    this.returnDirectionsRenderer.setMap(null);
    this.routeMarkers.forEach((marker: any) => marker.map = null);
    this.routeMarkers = [];
    this.waypoints = [];
    this.routeExists = false;
    
    // Reset renderers
    this.directionsRenderer.setMap(this.map);
    if (this.roundTrip) {
      this.returnDirectionsRenderer.setMap(this.map);
    }
    
    this.routeCleared.emit();
  }
  
  private loadExistingRoute(routeData: RouteData) {
    // Clear existing data
    this.clearRoute();
    
    // Set round trip option from data
    this.roundTrip = routeData.roundTrip;
    
    // Set travel mode if provided
    if (routeData.travelMode) {
      this.travelMode = routeData.travelMode;
    }
    
    // Add origin point
    this.waypoints.push(routeData.origin);
    
    // Add waypoints if any
    if (routeData.waypoints && routeData.waypoints.length > 0) {
      routeData.waypoints.forEach(wp => {
        this.waypoints.push(wp.location);
      });
    }
    
    // Add destination point
    if (!this.roundTrip || 
        routeData.destination.lat !== routeData.origin.lat || 
        routeData.destination.lng !== routeData.origin.lng) {
      this.waypoints.push(routeData.destination);
    }
    
    // Create markers for each point
    this.createMarkersForWaypoints();
    
    // Update route
    this.updateRoute();
  }
  
  private async createMarkersForWaypoints() {
    if (!this.google) return;
    
    const { AdvancedMarkerElement } = await this.google.maps.importLibrary("marker") as any;
    
    this.waypoints.forEach((waypoint, index) => {
      const marker = new AdvancedMarkerElement({
        position: new this.google.maps.LatLng(waypoint.lat, waypoint.lng),
        map: this.map,
        gmpDraggable: true,
        title: index === 0 ? "Origin" : 
               index === this.waypoints.length - 1 ? "Destination" : "Waypoint",
      });
      
      // Set up drag listener
      marker.addListener('dragend', () => {
        const position = marker.position;
        if (position) {
          this.waypoints[index] = { lat: position.lat, lng: position.lng };
          this.updateRoute();
        }
      });
      
      this.routeMarkers.push(marker);
    });
  }
  
  private emitRouteData() {
    if (!this.routeExists || this.waypoints.length < 2) return;
    
    const routeData: RouteData = {
      origin: this.waypoints[0],
      destination: this.waypoints[this.waypoints.length - 1],
      roundTrip: this.roundTrip,
      travelMode: this.travelMode
    };
    
    // Add waypoints if there are any
    if (this.waypoints.length > 2) {
      routeData.waypoints = this.waypoints.slice(1, -1).map(wp => ({
        location: wp,
        stopover: true
      }));
    }
    
    // If we're editing an existing route, include the route ID
    if (this.existingRoute && this.existingRoute.routeId) {
      routeData.routeId = this.existingRoute.routeId;
      this.routeUpdated.emit(routeData);
    } else {
      this.routeCreated.emit(routeData);
    }
  }
}