import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Loader } from '@googlemaps/js-api-loader';

@Component({
  selector: 'app-generic-google-map',
  imports: [FormsModule],
  template: `
    <div class="map-container-wrapper">
      <div #mapContainer class="map-container" [style.height.px]="height"></div>
      
      <!-- Radius Control -->
      <div class="radius-control">
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
export class GenericGoogleMapComponent {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  @Input() apiKey = '';
  @Input() height = 400;
  @Input() initialLatitude = 40.730610;
  @Input() initialLongitude = -73.935242;
  @Input() initialZoom = 12;
  @Input() mapId = 'DEMO_MAP_ID';

  @Output() mapReady = new EventEmitter<google.maps.Map>();
  @Output() mapClick = new EventEmitter<google.maps.LatLngLiteral>();
  @Output() radiusChanged = new EventEmitter<number>();
  @Output() markerMoved = new EventEmitter<any>();

  map!: google.maps.Map;
  private marker!: google.maps.marker.AdvancedMarkerElement;
  private geofence!: google.maps.Circle;
  geofenceRadius = 50; // Default 1km radius

  constructor() {}

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
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
      const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      
      // Initialize map
      const mapOptions: google.maps.MapOptions = {
        center: { lat: this.initialLatitude, lng: this.initialLongitude },
        zoom: this.initialZoom,
        mapTypeControl: true,
        mapId: this.mapId,
      };

      this.map = new Map(this.mapContainer.nativeElement, mapOptions);

      // Create marker with custom pin
      // const pinElement = new PinElement({
      //   glyph: 'S',
      //   glyphColor: 'white',
      //   background: 'blue',
      //   borderColor: 'blue',
      // });

      this.marker = new AdvancedMarkerElement({
        position: mapOptions.center,
        map: this.map,
        gmpDraggable: true,
        title: "This marker is draggable.",
        // content: pinElement.element,
      });

      // Initialize Geofence
      this.geofence = new google.maps.Circle({
        center: this.marker.position!,
        radius: this.geofenceRadius,
        map: this.map,
        fillColor: "#FF0000",
        fillOpacity: 0.3,
        strokeColor: "#FF0000",
        strokeOpacity: 0.6,
        strokeWeight: 2
      });

      console.log(this.geofence.getBounds());
      

      this.setupEventListeners();
      
      // Emit map instance to parent for search component
      this.mapReady.emit(this.map);
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
    }
  }

  updateGeofence() {
    if (this.geofence) {
      this.geofence.setRadius(this.geofenceRadius);
      this.radiusChanged.emit(this.geofenceRadius);
    }
  }

  // Public method to update marker position from parent
  updateMarkerPosition(latLng: {lat: number, lng: number}) {
    const position = new google.maps.LatLng(latLng.lat, latLng.lng);
    this.updateMarkerAndGeofence(position);
    
    // Center map on the new position
    this.map.setCenter(position);
    this.map.setZoom(18);
    // if (this.map.getZoom() < 14) {
    // }
  }

  private setupEventListeners() {
    // Listen for map clicks
    this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        this.updateMarkerAndGeofence(event.latLng);
        this.mapClick.emit(event.latLng.toJSON());
      }
    });

    // Listen for marker drag events
    this.marker.addListener('dragend', () => {
      const position = this.marker.position as google.maps.LatLng;
      if (position) {
        this.geofence.setCenter(position);
        this.markerMoved.emit({ lat: position.lat, lng: position.lng });
      }
    });
  }

  private updateMarkerAndGeofence(latLng: google.maps.LatLng) {
    this.marker.position = latLng;
    this.geofence.setCenter(latLng);
  }
}
