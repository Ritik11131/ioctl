import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

interface Position {
  latitude: number;
  longitude: number;
}

interface TollPriceVehicleType {
  id: number;
  vehicleType: string;
  price: number;
  currency?: string;
}

interface Toll {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  rtdId?: number;
  rtd?: any;
  tollPriceVehicleTypes?: TollPriceVehicleType[];
}

interface Route {
  bounds: any;
  copyrights: string;
  legs: any[];
  overview_path: any[];
  overview_polyline: string;
  summary: string;
  warnings: any[];
  waypoint_order: any[];
}

interface RouteData {
  sourceToDestination: any;
  destinationToSource: any;
  suggestedDestinationRoutes: Route[];
  suggestedSourceRoutes: Route[];
}

@Component({
  selector: 'app-generic-view-on-map',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
  <div class="flex flex-col lg:flex-row gap-6 p-4 bg-slate-50 rounded-xl shadow-sm">
    <!-- Left Panel: Route Controls -->
    <div class="lg:w-80 flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
      <!-- Source to Destination Routes Section -->
      @if (routeData.suggestedSourceRoutes.length > 0) {
        <div class="route-panel">
          <div class="px-5 py-4 border-b border-slate-100">
            <h3 class="text-lg font-medium text-slate-800">
              <i class="pi pi-directions text-slate-400 mr-2"></i>
              Source to Destination
            </h3>
          </div>
          
          <div class="divide-y divide-slate-100">
            @for (route of routeData.suggestedSourceRoutes; track route; let i = $index) {
              <div 
                class="p-4 transition-all hover:bg-slate-50"
                [class.bg-blue-50]="selectedSourceRouteIndex === i">
                <div class="flex items-center justify-between space-y-3">
                  <!-- Route Indicator & Info -->
                  <div class="flex items-center gap-3">
                    <div class="w-3 h-12 rounded-full" [style.background-color]="sourceRouteColors[i]"></div>
                    <div>
                      <div class="flex items-center gap-2 text-sm text-slate-500">
                        <i class="pi pi-map-marker text-sm"></i>
                        <span>{{getRouteDistance(route)}}</span>
                      </div>
                      <div class="flex items-center gap-2 text-sm text-slate-500">
                        <i class="pi pi-clock text-sm"></i>
                        <span>{{getRouteDuration(route)}}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Selection Button using PrimeNG -->
                  <p-button
                    (onClick)="selectSourceRoute(i)"
                    [outlined]="selectedSourceRouteIndex !== i"
                    [severity]="selectedSourceRouteIndex === i ? 'info' : 'secondary'"
                    [label]="selectedSourceRouteIndex === i ? 'Selected' : 'Select'"
                    styleClass="text-sm"
                    size="small"
                    [icon]="selectedSourceRouteIndex === i ? 'pi pi-check' : 'pi pi-arrow-right'"
                    iconPos="right"
                  ></p-button>
                </div>
              </div>
            }
          </div>
        </div>
      }
      
      <!-- Destination to Source Routes Section -->
      @if (routeData.suggestedDestinationRoutes.length > 0) {
        <div class="route-panel mt-4">
          <div class="px-5 py-4 border-b border-slate-100">
            <h3 class="text-lg font-medium text-slate-800">
              <i class="pi pi-reply text-slate-400 mr-2"></i>
              Destination to Source
            </h3>
            <p class="text-xs text-slate-500 pl-6">Return Routes</p>
          </div>
          
          <div class="divide-y divide-slate-100">
            @for (route of routeData.suggestedDestinationRoutes; track route; let i = $index) {
              <div 
                class="p-4 transition-all hover:bg-slate-50"
                [class.bg-green-50]="selectedDestinationRouteIndex === i">
                <div class="flex items-center justify-between space-y-3">
                  <!-- Route Indicator & Info -->
                  <div class="flex items-center gap-3">
                    <div class="w-3 h-12 rounded-full" [style.background-color]="destinationRouteColors[i]"></div>
                    <div>
                      <div class="flex items-center gap-2 text-sm text-slate-500">
                        <i class="pi pi-map-marker text-sm"></i>
                        <span>{{getRouteDistance(route)}}</span>
                      </div>
                      <div class="flex items-center gap-2 text-sm text-slate-500">
                        <i class="pi pi-clock text-sm"></i>
                        <span>{{getRouteDuration(route)}}</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Selection Button using PrimeNG -->
                  <p-button
                    (onClick)="selectDestinationRoute(i)"
                    [outlined]="selectedDestinationRouteIndex !== i"
                    [severity]="selectedDestinationRouteIndex === i ? 'success' : 'secondary'"
                    [label]="selectedDestinationRouteIndex === i ? 'Selected' : 'Select'"
                    styleClass="text-sm"
                    size="small"
                    [icon]="selectedDestinationRouteIndex === i ? 'pi pi-check' : 'pi pi-arrow-right'"
                    iconPos="right"
                  ></p-button>
                </div>
              </div>
            }
          </div>
        </div>
      }
      
      <!-- Empty state message when no routes -->
      @if ((!routeData.suggestedSourceRoutes.length && !routeData.suggestedDestinationRoutes.length)) {
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
      </div>
    </div>
  </div>
`,
styles: []
})
export class GenericViewOnMapComponent {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  @Input() apiKey: string = '';
  @Input() mapId = 'DEMO_MAP_ID';
  @Input() initialZoom: number = 13;
  @Input() height = 800;
  @Input() source: any = null;
  @Input() destination: any = null;
  @Input() sourceGeofenceColor = '#4285F4';
  @Input() destinationGeofenceColor = '#EA4335';
  @Input() tolls: Toll[] = [];
  @Input() routeData: RouteData = { 
    sourceToDestination: {}, 
    destinationToSource: {},
    suggestedDestinationRoutes: [],
    suggestedSourceRoutes: []
  };
  
  @Output() mapReady = new EventEmitter<google.maps.Map>();
  
  map!: google.maps.Map;
  sourceMarker!: google.maps.marker.AdvancedMarkerElement;
  destinationMarker!: google.maps.marker.AdvancedMarkerElement;
  sourceGeofence!: google.maps.Circle;
  destinationGeofence!: google.maps.Circle;
  directionsService!: google.maps.DirectionsService;
  
  // Separate renderers for each direction
  sourceToDestRenderer!: google.maps.DirectionsRenderer;
  destToSourceRenderer!: google.maps.DirectionsRenderer;
  
  tollMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  infoWindow!: google.maps.InfoWindow;

  // Route selection properties
  selectedSourceRouteIndex: number = 0;
  selectedDestinationRouteIndex: number = 0;
  routePolylines: google.maps.Polyline[] = [];

  // Route colors
  ROUTE_COLORS = [
    '#4CAF50', // Green for shortest route
    '#FFC107', // Yellow for medium distance routes
    '#F44336', // Red for longest route
    '#9C27B0', // Purple for shortest return route
    '#BA68C8', // Light purple for medium distance return routes
    '#E91E63'  // Pink for longest return route
  ];

  sourceRouteColors: string[] = [];
  destinationRouteColors: string[] = [];

  private calculateRouteColors() {
    // Calculate source route colors
    this.sourceRouteColors = this.routeData.suggestedSourceRoutes.map((_, index) => {
      const totalRoutes = this.routeData.suggestedSourceRoutes.length;
      if (totalRoutes === 1) return '#4CAF50';
      if (index === 0) return '#4CAF50';
      if (index === totalRoutes - 1) return '#F44336';
      return '#FFC107';
    });

    // Calculate destination route colors
    this.destinationRouteColors = this.routeData.suggestedDestinationRoutes.map((_, index) => {
      const totalRoutes = this.routeData.suggestedDestinationRoutes.length;
      if (totalRoutes === 1) return '#9C27B0';
      if (index === 0) return '#9C27B0';
      if (index === totalRoutes - 1) return '#E91E63';
      return '#BA68C8';
    });
  }

  async ngAfterViewInit() {
    await this.initMap();
  }
  
  private async initMap() {
    try {
      const loader = new Loader({
        apiKey: this.apiKey,
        version: "weekly",
        libraries: ['places', 'maps', 'marker', 'drawing', 'routes']
      });
      
      await loader.load();
      
      // Import required libraries
      const { Map, InfoWindow } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      
      // Get source and destination coordinates
      const sourceAttributes = typeof this.source.attributes === 'string' ? 
        JSON.parse(this.source.attributes) : this.source.attributes;
      const destAttributes = typeof this.destination.attributes === 'string' ? 
        JSON.parse(this.destination.attributes) : this.destination.attributes;
      
      const sourcePosition = { 
        lat: this.source.position?.latitude || sourceAttributes.lat, 
        lng: this.source.position?.longitude || sourceAttributes.lng 
      };
      
      // Initialize map centered on source
      const mapOptions: google.maps.MapOptions = {
        center: sourcePosition,
        zoom: this.initialZoom,
        mapTypeControl: true,
        mapId: this.mapId,
      };
      
      this.map = new Map(this.mapContainer.nativeElement, mapOptions);
      
      // Initialize InfoWindow for tooltips
      this.infoWindow = new InfoWindow();
      
      // Initialize directions renderers - one for each direction with different colors
      this.sourceToDestRenderer = new google.maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#4285F4', // Blue for source to destination
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });
      
      this.destToSourceRenderer = new google.maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#9C27B0', // Red for destination to source
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });
      
      // Setup source, destination, tolls and display the routes
      await this.setupSourceAndDestination();
      await this.setupTolls();
      await this.displayRoutes();
      
      // Emit map instance to parent
      this.mapReady.emit(this.map);
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
    }
  }
  
  private async setupSourceAndDestination() {
    if (!this.source || !this.destination) return;
    
    // Parse source and destination attributes
    const sourceAttributes = typeof this.source.attributes === 'string' ? 
      JSON.parse(this.source.attributes) : this.source.attributes;
    const destAttributes = typeof this.destination.attributes === 'string' ? 
      JSON.parse(this.destination.attributes) : this.destination.attributes;
    
    const sourcePosition = { 
      lat: this.source.position?.latitude || sourceAttributes.lat, 
      lng: this.source.position?.longitude || sourceAttributes.lng 
    };
    
    const destPosition = { 
      lat: this.destination.position?.latitude || destAttributes.lat, 
      lng: this.destination.position?.longitude || destAttributes.lng 
    };
    
    // Import marker libraries with correct type casting
    const markerLibrary = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    const { PinElement, AdvancedMarkerElement } = markerLibrary;
    
    // Create source pin with custom style
    const sourcePinElement = new PinElement({
      glyph: 'S',
      glyphColor: 'white',
      background: this.sourceGeofenceColor,
      borderColor: this.sourceGeofenceColor,
      scale: 1.2
    });
    
    this.sourceMarker = new AdvancedMarkerElement({
      position: sourcePosition,
      map: this.map,
      title: this.source.name || sourceAttributes.name,
      content: sourcePinElement.element,
    });
    
    this.sourceGeofence = new google.maps.Circle({
      center: sourcePosition,
      radius: this.source.radius || sourceAttributes.radius,
      map: this.map,
      fillColor: this.sourceGeofenceColor,
      fillOpacity: 0.3,
      strokeColor: this.sourceGeofenceColor,
      strokeOpacity: 0.6,
      strokeWeight: 2
    });
    
    // Create destination pin with custom style
    const destPinElement = new PinElement({
      glyph: 'D',
      glyphColor: 'white',
      background: this.destinationGeofenceColor,
      borderColor: this.destinationGeofenceColor,
      scale: 1.2
    });
    
    this.destinationMarker = new AdvancedMarkerElement({
      position: destPosition,
      map: this.map,
      title: this.destination.name || destAttributes.name,
      content: destPinElement.element,
    });
    
    this.destinationGeofence = new google.maps.Circle({
      center: destPosition,
      radius: this.destination.radius || destAttributes.radius,
      map: this.map,
      fillColor: this.destinationGeofenceColor,
      fillOpacity: 0.3,
      strokeColor: this.destinationGeofenceColor,
      strokeOpacity: 0.6,
      strokeWeight: 2
    });
    
    // Fit bounds to show both source and destination
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(sourcePosition);
    bounds.extend(destPosition);
    this.map.fitBounds(bounds);
  }
  
  private async setupTolls() {
    if (!this.tolls || this.tolls.length === 0) return;
    
    // Import marker libraries with correct type casting
    const markerLibrary = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    const { PinElement, AdvancedMarkerElement } = markerLibrary;
    
    // Create toll markers
    for (const toll of this.tolls) {
      const tollPosition = { 
        lat: toll.latitude, 
        lng: toll.longitude 
      };
      
      const tollPinElement = new PinElement({
        glyph: 'T',
        glyphColor: 'white',
        background: 'orange',
        borderColor: 'darkorange',
      });
      
      const tollMarker = new AdvancedMarkerElement({
        position: tollPosition,
        map: this.map,
        title: toll.name,
        content: tollPinElement.element,
        gmpClickable:true
      });
      
      // Add click listener for the toll marker
      tollMarker.addEventListener('gmp-click', () => {
        this.showTollInfoWindow(toll, tollMarker);
      });
      
      this.tollMarkers.push(tollMarker);
    }
  }
  
  // Method to show toll info in an InfoWindow
  private showTollInfoWindow(toll: Toll, marker: google.maps.marker.AdvancedMarkerElement) {
    // Build the content for the info window
    let contentString = `
      <div style="min-width: 200px; max-width: 300px;">
        <h2 style="margin: 0 0 8px 0; font-size: 16px; color: #1A73E8;">${toll.name}</h2>
    `;
    
    // Add description if available
    if (toll.description) {
      contentString += `<p style="margin: 0 0 10px 0; font-size: 14px;">${toll.description}</p>`;
    }
    
    // Add toll prices by vehicle type if available
    if (toll.tollPriceVehicleTypes && toll.tollPriceVehicleTypes.length > 0) {
      contentString += `
        <div style="margin-top: 10px;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">Toll Prices:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 5px; font-size: 13px; border-bottom: 1px solid #ddd;">Vehicle Type</th>
                <th style="text-align: right; padding: 5px; font-size: 13px; border-bottom: 1px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      // Add each vehicle type and price
      toll.tollPriceVehicleTypes.forEach((vehicleType: any) => {
        const currency = vehicleType.currency || 'Rs.';
        contentString += `
          <tr>
            <td style="text-align: left; padding: 5px; font-size: 13px; border-bottom: 1px solid #eee;">${vehicleType?.vehicleType?.name}</td>
            <td style="text-align: right; padding: 5px; font-size: 13px; border-bottom: 1px solid #eee;">${currency}${vehicleType?.price.toFixed(2)}</td>
          </tr>
        `;
      });
      
      contentString += `
            </tbody>
          </table>
        </div>
      `;
    } else {
      contentString += `<p style="font-size: 13px; font-style: italic; color: #666;">No pricing information available</p>`;
    }
    
    // Add RTD info if available
    if (toll.rtd) {
      contentString += `<p style="margin: 10px 0 0 0; font-size: 13px;">RTD ID: ${toll.rtdId}</p>`;
    }
    
    contentString += `</div>`;
    
    // Set the content and position of the info window
    this.infoWindow.setContent(contentString);
    
    // Get the position of the marker
    const position = marker.position;
    if (position) {
      this.infoWindow.setPosition(position);
      this.infoWindow.open(this.map);
    }
  }
  
  private async displayRoutes() {
    // Clear existing polylines
    this.clearRoutePolylines();

    // Display main routes
    this.showSourceToDestinationRoute();
    this.showDestinationToSourceRoute();

    // Display suggested routes
    this.displaySuggestedRoutes();
  }

  private displaySuggestedRoutes() {
    // Calculate route colors
    this.calculateRouteColors();

    // Clear existing polylines
    this.clearRoutePolylines();

    // Display suggested source routes
    if (this.routeData?.suggestedSourceRoutes) {
      this.routeData.suggestedSourceRoutes.forEach((route, index) => {
        if (route?.overview_path) {
          const isSelected = index === this.selectedSourceRouteIndex;
          this.addRoutePolyline(route.overview_path, this.sourceRouteColors[index], isSelected);
        }
      });
    }

    // Display suggested destination routes
    if (this.routeData?.suggestedDestinationRoutes) {
      this.routeData.suggestedDestinationRoutes.forEach((route, index) => {
        if (route?.overview_path) {
          const isSelected = index === this.selectedDestinationRouteIndex;
          this.addRoutePolyline(route.overview_path, this.destinationRouteColors[index], isSelected);
        }
      });
    }
  }

  private addRoutePolyline(path: any[], color: string, isSelected: boolean) {
    if (!path || !Array.isArray(path) || path.length === 0) return;

    try {
      const polyline = new google.maps.Polyline({
        path: path.map(point => {
          if (point && typeof point.lat === 'number' && typeof point.lng === 'number') {
            return new google.maps.LatLng(point.lat, point.lng);
          }
          return null;
        }).filter(Boolean) as google.maps.LatLng[],
        geodesic: true,
        strokeColor: color,
        strokeOpacity: isSelected ? 1.0 : 0.3, // Reduced opacity for non-selected routes
        strokeWeight: isSelected ? 5 : 3, // Thinner lines for non-selected routes
        map: this.map
      });

      this.routePolylines.push(polyline);
    } catch (error) {
      console.error('Error creating polyline:', error);
    }
  }

  private clearRoutePolylines() {
    this.routePolylines.forEach(polyline => polyline.setMap(null));
    this.routePolylines = [];
  }

  public selectSourceRoute(index: number) {
    if (this.routeData?.suggestedSourceRoutes && index >= 0 && index < this.routeData.suggestedSourceRoutes.length) {
      this.selectedSourceRouteIndex = index;
      this.displayRoutes();
    }
  }

  public selectDestinationRoute(index: number) {
    if (this.routeData?.suggestedDestinationRoutes && index >= 0 && index < this.routeData.suggestedDestinationRoutes.length) {
      this.selectedDestinationRouteIndex = index;
      this.displayRoutes();
    }
  }

  public getRouteDistance(route: Route): string {
    if (!route) return 'Unknown distance';
    if (route.legs && route.legs.length > 0 && route.legs[0].distance) {
      return route.legs[0].distance.text || 'Unknown distance';
    }
    return 'Unknown distance';
  }

  public getRouteDuration(route: Route): string {
    if (!route) return 'Unknown duration';
    if (route.legs && route.legs.length > 0 && route.legs[0].duration) {
      return route.legs[0].duration.text || 'Unknown duration';
    }
    return 'Unknown duration';
  }
  
  // Public methods that can be called from parent component
  
  public showSourceToDestinationRoute() {
    if (!this.routeData?.sourceToDestination) return;
    
    try {
      const path = this.routeData.sourceToDestination.polylinePath;
      if (!path || !Array.isArray(path)) return;

      const color = this.ROUTE_COLORS[0]; // Use first color for main route
      this.addRoutePolyline(path, color, true);
    } catch (error) {
      console.error("Error displaying source to destination route:", error);
    }
  }
  
  public showDestinationToSourceRoute() {
    if (!this.routeData?.destinationToSource) return;
    
    try {
      const path = this.routeData.destinationToSource.polylinePath;
      if (!path || !Array.isArray(path)) return;

      const color = this.ROUTE_COLORS[1]; // Use second color for main route
      this.addRoutePolyline(path, color, true);
    } catch (error) {
      console.error("Error displaying destination to source route:", error);
    }
  }
  
  // Helper method to decode path from route data
  private decodePath(routeData: any): google.maps.LatLng[] {
    const path: google.maps.LatLng[] = [];
    
    // If route data contains encoded polyline
    if (routeData.overview_polyline && routeData.overview_polyline.points) {
      return google.maps.geometry.encoding.decodePath(routeData.overview_polyline.points);
    }
    
    // If route data contains path as array of point objects
    if (routeData.path && Array.isArray(routeData.path)) {
      return routeData.path.map((point: any) => 
        new google.maps.LatLng(point.lat, point.lng)
      );
    }
    
    // If route data contains steps with path
    if (routeData.steps && Array.isArray(routeData.steps)) {
      routeData.steps.forEach((step: any) => {
        if (step.path && Array.isArray(step.path)) {
          step.path.forEach((point: any) => {
            path.push(new google.maps.LatLng(point.lat, point.lng));
          });
        }
      });
      return path;
    }
    
    // If we don't have path data, create a simple line from source to destination
    const sourceAttributes = typeof this.source.attributes === 'string' ? 
      JSON.parse(this.source.attributes) : this.source.attributes;
    const destAttributes = typeof this.destination.attributes === 'string' ? 
      JSON.parse(this.destination.attributes) : this.destination.attributes;
    
    const sourcePosition = { 
      lat: this.source.position?.latitude || sourceAttributes.lat, 
      lng: this.source.position?.longitude || sourceAttributes.lng 
    };
    
    const destPosition = { 
      lat: this.destination.position?.latitude || destAttributes.lat, 
      lng: this.destination.position?.longitude || destAttributes.lng 
    };
    
    return [
      new google.maps.LatLng(sourcePosition.lat, sourcePosition.lng),
      new google.maps.LatLng(destPosition.lat, destPosition.lng)
    ];
  }
  
  public async addMarker(markerData: { 
    position: {lat: number, lng: number}, 
    title: string, 
    glyph: string, 
    color: string 
  }) {
    // Generic method to add various marker types in the future
    const markerLibrary = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    const { PinElement, AdvancedMarkerElement } = markerLibrary;
    
    const pinElement = new PinElement({
      glyph: markerData.glyph,
      glyphColor: 'white',
      background: markerData.color,
      borderColor: this.adjustColor(markerData.color, -30),
    });
    
    return new AdvancedMarkerElement({
      position: markerData.position,
      map: this.map,
      title: markerData.title,
      content: pinElement.element,
    });
  }
  
  // Helper method to darken a color for border
  private adjustColor(color: string, amount: number): string {
    return color;  // In a real implementation, this would darken/lighten colors
  }
}