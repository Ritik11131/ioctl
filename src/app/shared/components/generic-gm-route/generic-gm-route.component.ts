import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnDestroy, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment.prod';
import { ButtonModule } from 'primeng/button';
import { UiService } from '../../../layout/service/ui.service';
import { GmLoaderService } from '../../../pages/service/gm-loader.service';
import { SumDurationPipe } from '../../../core/pipes/sum-duration.pipe';

// Define clear interfaces
export interface RouteOption {
  route: google.maps.DirectionsRoute;
  distance: string;
  duration: string;
  color: string;
  isSelected: boolean;
  isCustom?: boolean; // Flag to indicate if this is a custom dragged route
}

export interface SavedRoute {
  source: string;
  destination: string;
  directions: google.maps.DirectionsResult;
  distance: string;
  duration: string;
  startLocation?: google.maps.LatLngLiteral;
  endLocation?: google.maps.LatLngLiteral;
  polylinePath?: google.maps.LatLngLiteral[];
  isReturn?: boolean;
  customPath?: google.maps.DirectionsResult; // Store custom dragged path
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
  imports: [FormsModule, ButtonModule, SumDurationPipe],
  template: `
   <div class="flex flex-col lg:flex-row gap-6 p-4 bg-slate-50 rounded-xl shadow-sm">
  <!-- Left Panel: Route Controls -->
  <div class="lg:w-80 flex-shrink-0 bg-white rounded-xl shadow-md overflow-hidden border border-slate-200">
    <!-- Source to Destination Routes -->
    <div class="route-panel">
      <div class="px-5 py-4 border-b border-slate-100">
        <h3 class="text-lg font-medium text-slate-800">Source to Destination</h3>
        <p class="text-xs text-slate-500 mt-1">Drag the selected route to customize</p>
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
                  <div class="flex items-center gap-2">
                    <div class="text-sm text-slate-600">Route {{ $index + 1 }}</div>
                    @if (option.isCustom) {
                      <span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Custom</span>
                    }
                  </div>
                  <div class="text-xs text-slate-500">{{ option.distance }} • {{ option.duration }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                @if (option.isCustom && option.isSelected) {
                  <button 
                    class="text-xs text-blue-600 hover:text-blue-800 underline"
                    (click)="resetToOriginalRoute($index, false, $event)">
                    Reset
                  </button>
                }
                @if (option.isSelected) {
                  <i class="pi pi-check text-blue-500"></i>
                }
              </div>
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
        <p class="text-xs text-slate-500 pl-6">Drag the selected route to customize</p>
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
                  <div class="flex items-center gap-2">
                    <div class="text-sm text-slate-600">Route {{ $index + 1 }}</div>
                    @if (option.isCustom) {
                      <span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Custom</span>
                    }
                  </div>
                  <div class="text-xs text-slate-500">{{ option.distance }} • {{ option.duration }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                @if (option.isCustom && option.isSelected) {
                  <button 
                    class="text-xs text-purple-600 hover:text-purple-800 underline"
                    (click)="resetToOriginalRoute($index, true, $event)">
                    Reset
                  </button>
                }
                @if (option.isSelected) {
                  <i class="pi pi-check text-purple-500"></i>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>



    <div class="bg-green-50 rounded-lg p-4">
  <h4 class="text-sm font-medium text-green-800 flex items-center mb-3">
    <i class="pi pi-compass mr-2 text-green-600"></i>
    Route Summary
  </h4>
  <div class="grid grid-cols-2 gap-3">
    <div>
      <p class="text-xs text-gray-500">Total Distance</p>
      <p class="text-sm text-gray-700">{{totalDistance }}</p>
    </div>
    <div>
      <p class="text-xs text-gray-500">Total Time</p>
      <p class="text-sm text-gray-700">{{ [routeOptions[selectedRouteIndex]?.duration, returnRouteOptions[selectedReturnRouteIndex]?.duration] | sumDuration }}</p>
    </div>
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
      customPath?: google.maps.DirectionsResult;
    };
    DtoS: {
      selected: google.maps.DirectionsResult;
      suggested: google.maps.DirectionsResult[];
      customPath?: google.maps.DirectionsResult;
    };
  }>();

  @Output() routeSelected = new EventEmitter<{
    StD: {
      selected: google.maps.DirectionsResult;
      suggested: google.maps.DirectionsResult[];
      customPath?: google.maps.DirectionsResult;
    };
    DtoS: {
      selected: google.maps.DirectionsResult;
      suggested: google.maps.DirectionsResult[];
      customPath?: google.maps.DirectionsResult;
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

  // Store original routes for reset functionality
  private originalStDRoutes: google.maps.DirectionsResult[] = [];
  private originalDtoSRoutes: google.maps.DirectionsResult[] = [];
  
  // Store custom paths
  private customStDPath: google.maps.DirectionsResult | null | any = null;
  private customDtoSPath: google.maps.DirectionsResult | null | any = null;

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
        await this.updateMarkers();
        this.updateGeofences();
        this.handleEditRouteJson(this.editRouteJson);
      }
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
      
      await this.updateMarkers();
      this.updateGeofences();
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
    this.cleanupMapListeners();
    this.clearRoute();

    if (this.sourceMarker) {
      this.sourceMarker.map = null;
    }
    if (this.destinationMarker) {
      this.destinationMarker.map = null;
    }

    if (this.sourceGeofence) {
      this.sourceGeofence.setMap(null);
    }
    if (this.destinationGeofence) {
      this.destinationGeofence.setMap(null);
    }

    this.routeRenderers = [];
    this.returnRouteRenderers = [];
    this.routeOptions = [];
    this.returnRouteOptions = [];
    this.mapListeners = [];
    this.originalStDRoutes = [];
    this.originalDtoSRoutes = [];
    this.customStDPath = null;
    this.customDtoSPath = null;

    this.selectedRouteIndex = 0;
    this.selectedReturnRouteIndex = 0;
    this.isMapInitialized = false;

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
      
      if (this.editRouteJson) {
        await this.handleEditRouteJson(this.editRouteJson);
        return;
      }
      
      const sourceLatLng = new google.maps.LatLng(this.sourceLat, this.sourceLng);
      const destinationLatLng = new google.maps.LatLng(this.destinationLat, this.destinationLng);
      
      const requestStoD: google.maps.DirectionsRequest = {
        origin: sourceLatLng,
        destination: destinationLatLng,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      };
      
      const requestDtoS: google.maps.DirectionsRequest = {
        origin: destinationLatLng,
        destination: sourceLatLng,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      };
      
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
      
      // Ensure we have at least 3 routes for both directions
      this.ensureMinimumRoutes(resultStoD);
      this.ensureMinimumRoutes(resultDtoS);
      
      // Store original routes
      this.originalStDRoutes = resultStoD.routes.map(route => ({
        ...resultStoD,
        routes: [route]
      }));
      
      this.originalDtoSRoutes = resultDtoS.routes.map(route => ({
        ...resultDtoS,
        routes: [route]
      }));
      
      this.routeOptions = [];
      this.returnRouteOptions = [];
      
      await Promise.all([
        this.createRouteRenderers(resultStoD, false),
        this.createRouteRenderers(resultDtoS, true)
      ]);
      
      const sourceToDestinationRoutes = resultStoD.routes.map(route => ({
        ...resultStoD,
        routes: [route]
      }));
      
      const destinationToSourceRoutes = resultDtoS.routes.map(route => ({
        ...resultDtoS,
        routes: [route]
      }));
      
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
      
      if (this.routeOptions.length > 0) {
        this.selectRoute(0, false);
      }
      if (this.returnRouteOptions.length > 0) {
        this.selectRoute(0, true);
      }
      
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

  private ensureMinimumRoutes(result: google.maps.DirectionsResult) {
    if (result.routes.length < 3) {
      const firstRoute = result.routes[0];
      while (result.routes.length < 3) {
        const routeCopy = JSON.parse(JSON.stringify(firstRoute));
        result.routes.push(routeCopy);
      }
    }
  }

  private async createRouteRenderers(result: google.maps.DirectionsResult, isReturn: boolean, isSelected: boolean = false) {
    const { DirectionsRenderer } = await google.maps.importLibrary("routes") as google.maps.RoutesLibrary;
    
    const sortedRoutes = Array.isArray(result.routes) 
      ? [...result.routes].sort((a, b) => {
          const distanceA = a.legs?.[0]?.distance?.value || 0;
          const distanceB = b.legs?.[0]?.distance?.value || 0;
          return distanceA - distanceB;
        })
      : [result.routes];

    const routeOptionsRef = isReturn ? this.returnRouteOptions : this.routeOptions;
    const routeRenderersRef = isReturn ? this.returnRouteRenderers : this.routeRenderers;

    const newRenderers = sortedRoutes.map((route, index) => {
      const leg = route.legs?.[0];
      
      routeOptionsRef.push({
        route: route,
        distance: leg?.distance?.text || '',
        duration: leg?.duration?.text || '',
        color: this.getRouteColor(index, sortedRoutes.length, isReturn),
        isSelected: isSelected || index === 0,
        isCustom: false
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
        draggable: false, // Initially not draggable
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

    routeRenderersRef.push(...newRenderers);
    return newRenderers[0];
  }

  private getRouteColor(index: number, totalRoutes: number, isReturn: boolean): string {
    return isReturn ? '#9C27B0' : '#2196F3';
  }

  public selectRoute(index: number, isReturn: boolean) {
    const routeOptionsRef = isReturn ? this.returnRouteOptions : this.routeOptions;
    const routeRenderersRef = isReturn ? this.returnRouteRenderers : this.routeRenderers;

    // Update selection state for all routes in the current direction
    routeOptionsRef.forEach((option, i) => {
      option.isSelected = i === index;
    });

    // Update renderer styles and draggable state
    routeRenderersRef.forEach((renderer, i) => {
      if (renderer) {
        const isSelected = i === index;
        const color = routeOptionsRef[i].color;
        
        // Make only the selected route draggable
        renderer.setOptions({
          draggable: isSelected,
          polylineOptions: {
            strokeColor: color,
            strokeWeight: isSelected ? (isReturn ? 6 : 7) : (isReturn ? 3 : 4),
            strokeOpacity: isSelected ? 1 : 0.4,
            zIndex: isSelected ? 1000 : 0
          }
        });

        // Add drag listener for selected route
        if (isSelected) {
          this.addDragListener(renderer, isReturn, index);
        }

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

    this.emitSelectedRoutes();

    // Update map bounds
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

  private addDragListener(renderer: google.maps.DirectionsRenderer, isReturn: boolean, routeIndex: number) {
    // Remove existing listeners for this renderer
    this.cleanupRendererListeners(renderer);

    // Add directions_changed listener
    const dragListener = renderer.addListener('directions_changed', () => {
      const newDirections = renderer.getDirections();
      if (newDirections) {
        this.handleRouteDragged(newDirections, isReturn, routeIndex);
      }
    });

    // Store the listener for cleanup
    this.mapListeners.push(dragListener);
  }

  private cleanupRendererListeners(renderer: google.maps.DirectionsRenderer) {
    // This is a simplified cleanup - in a real implementation you might want to track listeners more granularly
    google.maps.event.clearInstanceListeners(renderer);
  }

  private handleRouteDragged(newDirections: google.maps.DirectionsResult, isReturn: boolean, routeIndex: number) {
    const routeOptionsRef = isReturn ? this.returnRouteOptions : this.routeOptions;
    
    if (routeOptionsRef[routeIndex]) {
      try {
        // Update the route option to indicate it's custom
        routeOptionsRef[routeIndex].isCustom = true;
        routeOptionsRef[routeIndex].route = newDirections.routes[0];
        
        // Update distance and duration
        const leg = newDirections.routes[0].legs?.[0];
        if (leg) {
          routeOptionsRef[routeIndex].distance = leg.distance?.text || '';
          routeOptionsRef[routeIndex].duration = leg.duration?.text || '';
        }

        // Store the custom path with proper coordinate reconstruction
        const reconstructedDirections = this.reconstructDirectionsResult(newDirections);
        
        if (isReturn) {
          this.customDtoSPath = reconstructedDirections;
        } else {
          this.customStDPath = reconstructedDirections;
        }

        // Emit updated routes
        this.emitSelectedRoutes();
      } catch (error) {
        console.error('Error handling route drag:', error);
      }
    }
  }

  private emitSelectedRoutes() {
    // Get all routes for both directions, filtering out null values
    const allStDRoutes = this.routeRenderers
      .map(renderer => renderer.getDirections())
      .filter((route): route is google.maps.DirectionsResult => route !== null);

    const allDtoSRoutes = this.returnRouteRenderers
      .map(renderer => renderer.getDirections())
      .filter((route): route is google.maps.DirectionsResult => route !== null);

    // Prepare the emission data
    const emissionData = {
      StD: {
        selected: allStDRoutes[this.selectedRouteIndex],
        suggested: allStDRoutes.filter((_, i) => i !== this.selectedRouteIndex),
        customPath: this.customStDPath
      },
      DtoS: {
        selected: allDtoSRoutes[this.selectedReturnRouteIndex],
        suggested: allDtoSRoutes.filter((_, i) => i !== this.selectedReturnRouteIndex),
        customPath: this.customDtoSPath
      }
    };

    this.routeSelected.emit(emissionData);
  }

  public resetToOriginalRoute(index: number, isReturn: boolean, event: Event) {
    event.stopPropagation(); // Prevent route selection
    
    const routeOptionsRef = isReturn ? this.returnRouteOptions : this.routeOptions;
    const routeRenderersRef = isReturn ? this.returnRouteRenderers : this.routeRenderers;
    const originalRoutesRef = isReturn ? this.originalDtoSRoutes : this.originalStDRoutes;

    if (routeOptionsRef[index] && originalRoutesRef[index]) {
      try {
        // Reset to original route
        const originalRoute = originalRoutesRef[index];
        routeOptionsRef[index].isCustom = false;
        routeOptionsRef[index].route = originalRoute.routes[0];
        
        // Update distance and duration from original
        const leg = originalRoute.routes[0].legs?.[0];
        if (leg) {
          routeOptionsRef[index].distance = leg.distance?.text || '';
          routeOptionsRef[index].duration = leg.duration?.text || '';
        }

        // Clear custom path
        if (isReturn) {
          this.customDtoSPath = null;
        } else {
          this.customStDPath = null;
        }

        // Update the renderer with proper route reconstruction
        if (routeRenderersRef[index]) {
          const reconstructedRoute = this.reconstructDirectionsResult(originalRoute);
          routeRenderersRef[index].setDirections(reconstructedRoute);
          
          // Re-add drag listener if this is the selected route
          if (routeOptionsRef[index].isSelected) {
            setTimeout(() => {
              this.addDragListener(routeRenderersRef[index], isReturn, index);
            }, 100);
          }
        }

        // Emit updated routes
        this.emitSelectedRoutes();
      } catch (error) {
        console.error('Error resetting route:', error);
      }
    }
  }

  private clearRoute() {
    // Clear all renderers
    this.routeRenderers.forEach(renderer => {
      this.cleanupRendererListeners(renderer);
      renderer.setMap(null);
    });
    this.returnRouteRenderers.forEach(renderer => {
      this.cleanupRendererListeners(renderer);
      renderer.setMap(null);
    });
    
    // Reset state
    this.routeRenderers = [];
    this.returnRouteRenderers = [];
    this.routeOptions = [];
    this.returnRouteOptions = [];
    this.selectedRouteIndex = 0;
    this.selectedReturnRouteIndex = 0;
    this.originalStDRoutes = [];
    this.originalDtoSRoutes = [];
    this.customStDPath = null;
    this.customDtoSPath = null;
  }

  private async handleEditRouteJson(editRouteJson: any) {
    try {
      this.uiService.toggleLoader(true);
      this.clearRoute();

      console.log('Handling edit route json:', editRouteJson);
      
      // Sanitize and reconstruct route data to fix coordinate issues
      const sanitizedEditData = this.sanitizeRouteData(editRouteJson);
      
      // Handle custom paths if they exist
      if (sanitizedEditData.StD.customPath) {
        this.customStDPath = this.reconstructDirectionsResult(sanitizedEditData.StD.customPath);
      }
      if (sanitizedEditData.DtoS.customPath) {
        this.customDtoSPath = this.reconstructDirectionsResult(sanitizedEditData.DtoS.customPath);
      }

      // Store original routes with proper reconstruction
      const allStDRoutes = [
        this.reconstructDirectionsResult(sanitizedEditData.StD.selected), 
        ...(sanitizedEditData.StD.suggested || []).map((route: any) => this.reconstructDirectionsResult(route))
      ];
      const allDtoSRoutes = [
        this.reconstructDirectionsResult(sanitizedEditData.DtoS.selected), 
        ...(sanitizedEditData.DtoS.suggested || []).map((route: any) => this.reconstructDirectionsResult(route))
      ];
      
      this.originalStDRoutes = allStDRoutes;
      this.originalDtoSRoutes = allDtoSRoutes;

      // Create combined results for rendering
      const combinedStDResult: google.maps.DirectionsResult = {
        routes: allStDRoutes.map(result => result.routes[0]).filter(route => route),
        request: allStDRoutes[0]?.request || this.createDefaultRequest(false),
        geocoded_waypoints: allStDRoutes[0]?.geocoded_waypoints || []
      };

      const combinedDtoSResult: google.maps.DirectionsResult = {
        routes: allDtoSRoutes.map(result => result.routes[0]).filter(route => route),
        request: allDtoSRoutes[0]?.request || this.createDefaultRequest(true),
        geocoded_waypoints: allDtoSRoutes[0]?.geocoded_waypoints || []
      };

      // Create renderers only if we have valid routes
      const renderPromises = [];
      if (combinedStDResult.routes.length > 0) {
        renderPromises.push(this.createRouteRenderers(combinedStDResult, false));
      }
      if (combinedDtoSResult.routes.length > 0) {
        renderPromises.push(this.createRouteRenderers(combinedDtoSResult, true));
      }

      await Promise.all(renderPromises);

      // Apply custom paths after renderers are created
      await this.applyCustomPaths();

      // Select the first routes and make them draggable
      if (this.routeOptions.length > 0) {
        this.selectRoute(0, false);
      }
      if (this.returnRouteOptions.length > 0) {
        this.selectRoute(0, true);
      }

      // Fit map to show all routes and markers with proper bounds
      this.fitMapBounds();

      // Emit the complete route data including custom paths
      this.routesCreated.emit({
        StD: {
          selected: this.customStDPath || allStDRoutes[0],
          suggested: allStDRoutes.slice(1),
          customPath: this.customStDPath
        },
        DtoS: {
          selected: this.customDtoSPath || allDtoSRoutes[0],
          suggested: allDtoSRoutes.slice(1),
          customPath: this.customDtoSPath
        }
      });

    } catch (error) {
      console.error('Error handling edit route json:', error);
      alert('Error loading existing routes. Please try again.');
    } finally {
      this.uiService.toggleLoader(false);
    }
  }

  private sanitizeRouteData(editRouteJson: any): any {
    // Deep clone to avoid modifying original data
    return JSON.parse(JSON.stringify(editRouteJson));
  }

  private reconstructDirectionsResult(routeData: any): google.maps.DirectionsResult {
    if (!routeData || !routeData.routes || !routeData.routes[0]) {
      console.warn('Invalid route data:', routeData);
      return this.createEmptyDirectionsResult();
    }

    try {
      // Reconstruct the route with proper LatLng objects
      const route = routeData.routes[0];
      console.log(route,'routteee');
      
      const reconstructedRoute: google.maps.DirectionsRoute = {
        bounds: this.reconstructBounds(route.bounds),
        legs: this.reconstructLegs(route.legs),
        overview_path: this.reconstructPath(route.overview_path),
        overview_polyline: route.overview_polyline || '',
        warnings: route.warnings || [],
        waypoint_order: route.waypoint_order || [],
        fare: route.fare,
        summary: route.summary,
        copyrights: route.copyrights || ''
      };

      return {
        routes: [reconstructedRoute],
        request: routeData.request || this.createDefaultRequest(false),
        geocoded_waypoints: routeData.geocoded_waypoints || []
      };
    } catch (error) {
      console.error('Error reconstructing route:', error);
      return this.createEmptyDirectionsResult();
    }
  }

  private reconstructBounds(boundsData: any): google.maps.LatLngBounds {
    if (!boundsData || !boundsData.south || !boundsData.north || !boundsData.west || !boundsData.east) {
      return new google.maps.LatLngBounds(
        new google.maps.LatLng(this.sourceLat, this.sourceLng),
        new google.maps.LatLng(this.destinationLat, this.destinationLng)
      );
    }

    return new google.maps.LatLngBounds(
      new google.maps.LatLng(boundsData.south, boundsData.west),
      new google.maps.LatLng(boundsData.north, boundsData.east)
    );
  }

  private reconstructLegs(legsData: any[]): google.maps.DirectionsLeg[] {
    if (!legsData || !Array.isArray(legsData)) {
      return [];
    }

    return legsData.map(leg => ({
      distance: leg.distance || { text: '0 km', value: 0 },
      duration: leg.duration || { text: '0 mins', value: 0 },
      end_address: leg.end_address || '',
      end_location: this.reconstructLatLng(leg.end_location),
      start_address: leg.start_address || '',
      start_location: this.reconstructLatLng(leg.start_location),
      steps: this.reconstructSteps(leg.steps || []),
      traffic_speed_entry: leg.traffic_speed_entry || [],
      via_waypoints: this.reconstructPath(leg.via_waypoints || []),
      arrival_time: leg.arrival_time,
      departure_time: leg.departure_time,
      duration_in_traffic: leg.duration_in_traffic
    }));
  }

  private reconstructSteps(stepsData: any[]): any[] {
    if (!stepsData || !Array.isArray(stepsData)) {
      return [];
    }

    return stepsData.map(step => ({
      distance: step.distance || { text: '0 m', value: 0 },
      duration: step.duration || { text: '0 mins', value: 0 },
      end_location: this.reconstructLatLng(step.end_location),
      instructions: step.instructions || '',
      path: this.reconstructPath(step.path || []),
      start_location: this.reconstructLatLng(step.start_location),
      travel_mode: step.travel_mode || google.maps.TravelMode.DRIVING,
      encoded_lat_lngs: step.encoded_lat_lngs || '',
      polyline: step.polyline,
      maneuver: step.maneuver,
      transit: step.transit
    }));
  }

  private reconstructPath(pathData: any[]): google.maps.LatLng[] {
    if (!pathData || !Array.isArray(pathData)) {
      return [];
    }

    return pathData.map(point => this.reconstructLatLng(point)).filter(point => point);
  }

  private reconstructLatLng(coordData: any): google.maps.LatLng {
    if (!coordData) {
      return new google.maps.LatLng(0, 0);
    }

    // Handle different coordinate formats
    let lat = 0, lng = 0;

    if (typeof coordData.lat === 'function') {
      // Already a LatLng object
      return coordData;
    } else if (typeof coordData.lat === 'number' && typeof coordData.lng === 'number') {
      // Plain object with lat/lng
      lat = coordData.lat;
      lng = coordData.lng;
    } else if (coordData.latitude !== undefined && coordData.longitude !== undefined) {
      // Object with latitude/longitude
      lat = coordData.latitude;
      lng = coordData.longitude;
    } else if (Array.isArray(coordData) && coordData.length >= 2) {
      // Array format [lat, lng]
      lat = coordData[0];
      lng = coordData[1];
    }

    return new google.maps.LatLng(lat, lng);
  }

  private createDefaultRequest(isReturn: boolean): google.maps.DirectionsRequest {
    return {
      origin: isReturn 
        ? new google.maps.LatLng(this.destinationLat, this.destinationLng)
        : new google.maps.LatLng(this.sourceLat, this.sourceLng),
      destination: isReturn 
        ? new google.maps.LatLng(this.sourceLat, this.sourceLng)
        : new google.maps.LatLng(this.destinationLat, this.destinationLng),
      travelMode: google.maps.TravelMode.DRIVING,
      provideRouteAlternatives: true
    };
  }

  private createEmptyDirectionsResult(): google.maps.DirectionsResult {
    return {
      routes: [],
      request: this.createDefaultRequest(false),
      geocoded_waypoints: []
    };
  }

  private async applyCustomPaths() {
    // Apply custom StD path
    if (this.customStDPath && this.routeOptions.length > 0 && this.routeRenderers[0]) {
      try {
        this.routeOptions[0].isCustom = true;
        this.routeOptions[0].route = this.customStDPath.routes[0];
        
        const leg = this.customStDPath.routes[0].legs?.[0];
        if (leg) {
          this.routeOptions[0].distance = leg.distance?.text || '';
          this.routeOptions[0].duration = leg.duration?.text || '';
        }

        this.routeRenderers[0].setDirections(this.customStDPath);
      } catch (error) {
        console.error('Error applying custom StD path:', error);
      }
    }

    // Apply custom DtoS path
    if (this.customDtoSPath && this.returnRouteOptions.length > 0 && this.returnRouteRenderers[0]) {
      try {
        this.returnRouteOptions[0].isCustom = true;
        this.returnRouteOptions[0].route = this.customDtoSPath.routes[0];
        
        const leg = this.customDtoSPath.routes[0].legs?.[0];
        if (leg) {
          this.returnRouteOptions[0].distance = leg.distance?.text || '';
          this.returnRouteOptions[0].duration = leg.duration?.text || '';
        }

        this.returnRouteRenderers[0].setDirections(this.customDtoSPath);
      } catch (error) {
        console.error('Error applying custom DtoS path:', error);
      }
    }
  }

  private fitMapBounds() {
    try {
      const bounds = new google.maps.LatLngBounds();
      
      // Add source and destination markers
      bounds.extend(new google.maps.LatLng(this.sourceLat, this.sourceLng));
      bounds.extend(new google.maps.LatLng(this.destinationLat, this.destinationLng));
      
      // Add route bounds
      [...this.routeRenderers, ...this.returnRouteRenderers].forEach(renderer => {
        try {
          const directions = renderer.getDirections();
          if (directions?.routes?.[0]?.bounds) {
            bounds.union(directions.routes[0].bounds);
          }
        } catch (error) {
          console.warn('Could not add route bounds:', error);
        }
      });
      
      if (!bounds.isEmpty()) {
        this.map.fitBounds(bounds);
      }
    } catch (error) {
      console.error('Error fitting map bounds:', error);
      // Fallback to basic bounds
      const fallbackBounds = new google.maps.LatLngBounds();
      fallbackBounds.extend(new google.maps.LatLng(this.sourceLat, this.sourceLng));
      fallbackBounds.extend(new google.maps.LatLng(this.destinationLat, this.destinationLng));
      this.map.fitBounds(fallbackBounds);
    }
  }

  // Additional helper method to get current route data for saving
  public getCurrentRouteData() {
    const allStDRoutes = this.routeRenderers
      .map(renderer => renderer.getDirections())
      .filter((route): route is google.maps.DirectionsResult => route !== null);

    const allDtoSRoutes = this.returnRouteRenderers
      .map(renderer => renderer.getDirections())
      .filter((route): route is google.maps.DirectionsResult => route !== null);

    return {
      StD: {
        selected: allStDRoutes[this.selectedRouteIndex],
        suggested: allStDRoutes.filter((_, i) => i !== this.selectedRouteIndex),
        customPath: this.customStDPath
      },
      DtoS: {
        selected: allDtoSRoutes[this.selectedReturnRouteIndex],
        suggested: allDtoSRoutes.filter((_, i) => i !== this.selectedReturnRouteIndex),
        customPath: this.customDtoSPath
      }
    };
  }

  // Helper method to check if any routes have been customized
  public hasCustomRoutes(): boolean {
    return this.customStDPath !== null || this.customDtoSPath !== null ||
           this.routeOptions.some(option => option.isCustom) ||
           this.returnRouteOptions.some(option => option.isCustom);
  }

  get totalDistance(): string {
  const StD = this.routeOptions?.[this.selectedRouteIndex]?.distance; // e.g., "5.1 km"
  const DtoS = this.returnRouteOptions?.[this.selectedReturnRouteIndex]?.distance; // e.g., "5.1 km"
  const distances = [StD, DtoS]
    .filter(Boolean)
    .map(str => parseFloat(str.split(' ')[0]));
  if (distances.length === 0) return 'N/A';
  const sum = distances.reduce((a, b) => a + b, 0);
  return sum.toFixed(1) + ' km';
}

}