import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Loader } from '@googlemaps/js-api-loader';
import { GoogleMapsModule } from '@angular/google-maps';
import { GmLoaderService } from '../../../pages/service/gm-loader.service';

export interface MarkerPosition {
  lat: number;
  lng: number;
}

@Component({
  selector: 'app-generic-gm-address',
  standalone: true,
  imports: [FormsModule, CommonModule, GoogleMapsModule],
  template: `
    <div class="map-container-wrapper">
      <div #mapContainer class="map-container" [style.height.px]="height"></div>
      
      <!-- Geofence Radius Control -->
      
         <div class="control-panel top-panel">
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
  `]
})
export class GenericGmAddressComponent implements AfterViewInit, OnChanges {

    @ViewChild('mapContainer') mapContainer!: ElementRef;
  
    // Common inputs
    @Input() apiKey = '';
    @Input() height = 400;
    @Input() initialLatitude = 40.730610;
    @Input() initialLongitude = -73.935242;
    @Input() initialZoom = 18;
    @Input() mapId = 'DEMO_MAP_ID';
  
    // Address mode inputs
    @Input() geofenceRadius = 500;
    @Input() existingAddress: MarkerPosition | null = null;
  
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
  
    // Map objects
    map: any;
    private marker: any = null;
    private geofence: any = null;
    
    // Google libraries
    private google: any;
  
    constructor(private googleMapsLoader:GmLoaderService) {}
  
    async ngAfterViewInit() {
      await this.initMap();
    }
  
    ngOnChanges(changes: SimpleChanges) {
      // Handle changes to existing address when map is already initialized
      if (this.map) {
        if (changes['existingAddress'] && this.existingAddress) {
          this.updateMarkerPosition(this.existingAddress);
        }
      }
    }
  
    private async initMap() {
      try {
          // const loader = new Loader({
          //     apiKey: this.apiKey,
          //     version: 'weekly',
          //     libraries: ['places', 'maps', 'marker', 'drawing', 'routes']
          // });

          // await loader.load();

          await this.googleMapsLoader.initializeLoader()

          // Store google globally in component
          this.google = google;

          // Import required libraries
          const { Map } = (await google.maps.importLibrary('maps')) as any;

          // Initialize map
          const mapOptions = {
              center: { lat: this.initialLatitude, lng: this.initialLongitude },
              zoom: this.initialZoom,
              mapTypeControl: true,
              mapId: this.mapId
          };

          this.map = new Map(this.mapContainer.nativeElement, mapOptions);

          // Setup address mode
          this.setupAddressMode();
          if (this.existingAddress) {
              this.updateMarkerPosition(this.existingAddress);
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
  
    private setupAddressEventListeners() {
      // Listen for map clicks
      this.map.addListener('click', (event: any) => {
        if (event.latLng) {
          this.updateMarkerAndGeofence(event.latLng);
          this.mapClick.emit({
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          });
          
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
            this.emitAddressData();
          }
        });
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
      if (this.map && this.google) {
        const position = new this.google.maps.LatLng(latLng.lat, latLng.lng);
        this.updateMarkerAndGeofence(position);
        
        // Center map on the new position
        this.map.setCenter(position);
        if (this.map.getZoom() < 14) {
          this.map.setZoom(14);
        }
        
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

}
