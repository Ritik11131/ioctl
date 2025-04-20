import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';

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

@Component({
  selector: 'app-generic-view-on-map',
  imports: [],
  template: `
  <div #mapContainer class="w-full h-full rounded-xl overflow-hidden shadow-lg"></div>
`,
styles: []
})
export class GenericViewOnMapComponent {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  @Input() apiKey: string = '';
  @Input() mapId = 'DEMO_MAP_ID';
  @Input() initialZoom: number = 13;
  @Input() source: any = null;
  @Input() destination: any = null;
  @Input() sourceGeofenceColor = '#4285F4';
  @Input() destinationGeofenceColor = '#EA4335';
  @Input() tolls: Toll[] = [];
  @Input() routeData: any = { sourceToDestination: {}, destinationToSource: {} };
  
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
    // If we have route data, use it directly
    if (this.routeData && this.routeData.sourceToDestination && this.routeData.destinationToSource) {
      this.showSourceToDestinationRoute();
      this.showDestinationToSourceRoute();
    } else {
      // If no route data is available, we need to calculate it
      await this.calculateRoutes();
    }
  }
  
  private async calculateRoutes() {
    if (!this.source || !this.destination) return;
    
    try {
      this.directionsService = new google.maps.DirectionsService();
      
      // Parse source and destination positions
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
      
      // Calculate source to destination route
      const sourceToDestRequest: google.maps.DirectionsRequest = {
        origin: sourcePosition,
        destination: destPosition,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      };
      
      // Calculate destination to source route
      const destToSourceRequest: google.maps.DirectionsRequest = {
        origin: destPosition,
        destination: sourcePosition,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: true
      };
      
      // Get source to destination route
      const sourceToDestResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        this.directionsService.route(sourceToDestRequest, (result: any, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            resolve(result);
          } else {
            reject(status);
          }
        });
      });
      
      // Display source to destination route
      this.sourceToDestRenderer.setDirections(sourceToDestResponse);
      
      // Get destination to source route
      const destToSourceResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
        this.directionsService.route(destToSourceRequest, (result: any, status) => {
          if (status === google.maps.DirectionsStatus.OK) {
            resolve(result);
          } else {
            reject(status);
          }
        });
      });
      
      // Display destination to source route
      this.destToSourceRenderer.setDirections(destToSourceResponse);
      
    } catch (error) {
      console.error("Error calculating routes:", error);
    }
  }
  
  // Public methods that can be called from parent component
  
  public showSourceToDestinationRoute() {
    if (!this.routeData || !this.routeData.sourceToDestination) return;
    
    try {
      // Use provided route data to render the path
      const path = this.decodePath(this.routeData.sourceToDestination);
      
      // Create a new DirectionsResult object from the path
      const directionsResult = {
        routes: [{
          bounds: new google.maps.LatLngBounds(),
          overview_path: path,
          legs: [{
            steps: [{
              path: path
            }]
          }]
        }]
      } as google.maps.DirectionsResult;
      
      this.sourceToDestRenderer.setDirections(directionsResult);
    } catch (error) {
      console.error("Error displaying source to destination route:", error);
    }
  }
  
  public showDestinationToSourceRoute() {
    if (!this.routeData || !this.routeData.destinationToSource) return;
    
    try {
      // Use provided route data to render the path
      const path = this.decodePath(this.routeData.destinationToSource);
      
      // Create a new DirectionsResult object from the path
      const directionsResult = {
        routes: [{
          bounds: new google.maps.LatLngBounds(),
          overview_path: path,
          legs: [{
            steps: [{
              path: path
            }]
          }]
        }]
      } as google.maps.DirectionsResult;
      
      this.destToSourceRenderer.setDirections(directionsResult);
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