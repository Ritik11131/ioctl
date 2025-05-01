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

interface RouteOptions {
  route: google.maps.DirectionsResult;
  distance: string;
  duration: string;
  color: string;
  isSelected: boolean;
}

interface RouteData {
  StD: {
    selected: google.maps.DirectionsResult;
    suggested: google.maps.DirectionsResult[];
  };
  DtoS: {
    selected: google.maps.DirectionsResult;
    suggested: google.maps.DirectionsResult[];
  };
}

@Component({
  selector: 'app-generic-view-on-map',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  template: `
  <div class="flex flex-col lg:flex-row gap-6 p-4 bg-slate-50 rounded-xl shadow-sm">
    <!-- Left Panel: Route Controls -->
    <div class="lg:w-80 flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
      <!-- Source to Destination Routes -->
      @if (routeData && routeData.StD?.suggested?.length) {
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
                    <div class="w-3 h-8 rounded-full" [style.background-color]="'#2196F3'"></div>
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
      }
      
      <!-- Destination to Source Routes -->
      @if (routeData && routeData.DtoS?.suggested?.length) {
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
                    <div class="w-3 h-8 rounded-full" [style.background-color]="'#9C27B0'"></div>
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
      }
      
      <!-- Empty state message when no routes -->
      @if ((!routeData?.StD?.suggested?.length && !routeData?.DtoS?.suggested?.length)) {
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
export class GenericViewOnMapComponent implements AfterViewInit {
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
  @Input() routeData: RouteData | null = null;
  
  @Output() mapReady = new EventEmitter<google.maps.Map>();
  
  map!: google.maps.Map;
  sourceMarker!: google.maps.marker.AdvancedMarkerElement;
  destinationMarker!: google.maps.marker.AdvancedMarkerElement;
  sourceGeofence!: google.maps.Circle;
  destinationGeofence!: google.maps.Circle;
  tollMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  infoWindow!: google.maps.InfoWindow;

  // Route related properties
  routeOptions: RouteOptions[] = [];
  returnRouteOptions: RouteOptions[] = [];
  routeRenderers: google.maps.DirectionsRenderer[] = [];
  returnRouteRenderers: google.maps.DirectionsRenderer[] = [];

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

  private async displayRoutes() {
    console.log(this.routeData);
    
    if (!this.routeData) return;

    // Clear existing renderers
    this.clearRouteRenderers();

    // Display source to destination routes
    if (this.routeData.StD?.suggested?.length) {
      // First display the selected route
      if (this.routeData.StD.selected) {
        await this.createRouteRenderers(this.routeData.StD.selected, false, true);
      }
      
      // Then display all suggested routes
      for (const route of this.routeData.StD.suggested) {
        if (route && route !== this.routeData.StD.selected) {
          await this.createRouteRenderers(route, false, false);
        }
      }
    }

    // Display destination to source routes
    if (this.routeData.DtoS?.suggested?.length) {
      // First display the selected route
      if (this.routeData.DtoS.selected) {
        await this.createRouteRenderers(this.routeData.DtoS.selected, true, true);
      }
      
      // Then display all suggested routes
      for (const route of this.routeData.DtoS.suggested) {
        if (route && route !== this.routeData.DtoS.selected) {
          await this.createRouteRenderers(route, true, false);
        }
      }
    }
  }

  private async createRouteRenderers(result: google.maps.DirectionsResult, isReturn: boolean, isSelected: boolean = false) {
    if (!result || !result.routes) return null;

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
      if (!route) return null;

      const leg = route.legs?.[0];
      
      // Create a proper DirectionsResult object for the route option
      const routeResult: google.maps.DirectionsResult = {
        routes: [route],
        request: result.request,
        geocoded_waypoints: result.geocoded_waypoints || []
      };
      
      // Get color based on direction
      const color = this.getRouteColor(index, sortedRoutes.length, isReturn);
      
      // Add route option with isSelected flag
      routeOptionsRef.push({
        route: routeResult,
        distance: leg?.distance?.text || '',
        duration: leg?.duration?.text || '',
        color: color,
        isSelected: isSelected
      });

      const renderer = new DirectionsRenderer({
        map: this.map,
        directions: routeResult,
        suppressMarkers: true,
        draggable: false,
        polylineOptions: {
          strokeColor: color,
          strokeWeight: isSelected ? (isReturn ? 6 : 7) : (isReturn ? 3 : 4),
          strokeOpacity: isSelected ? 1 : 0.4,
          zIndex: isSelected ? 1000 : 0
        },
        preserveViewport: true
      });

      return renderer;
    }).filter(Boolean) as google.maps.DirectionsRenderer[];

    // Add new renderers to our array
    routeRenderersRef.push(...newRenderers);
    return newRenderers[0];
  }

  private getRouteColor(index: number, totalRoutes: number, isReturn: boolean): string {
    // Use blue for Source to Destination and purple for Destination to Source
    return isReturn ? '#9C27B0' : '#2196F3';
  }

  private clearRouteRenderers() {
    this.routeRenderers.forEach(renderer => renderer.setMap(null));
    this.returnRouteRenderers.forEach(renderer => renderer.setMap(null));
    this.routeRenderers = [];
    this.returnRouteRenderers = [];
    this.routeOptions = [];
    this.returnRouteOptions = [];
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

    // Update the routeData to reflect the new selection
    if (isReturn) {
      if (this.routeData?.DtoS?.suggested?.[index]) {
        this.routeData.DtoS.selected = this.routeData.DtoS.suggested[index];
      }
    } else {
      if (this.routeData?.StD?.suggested?.[index]) {
        this.routeData.StD.selected = this.routeData.StD.suggested[index];
      }
    }

    // Force map update by triggering a resize event
    setTimeout(() => {
      if (this.map) {
        google.maps.event.trigger(this.map, 'resize');
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
    }, 100);
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