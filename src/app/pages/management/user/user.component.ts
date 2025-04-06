import { Component, ViewChild } from '@angular/core';
import { GenericTableComponent } from '../../../shared/components/generic-table/generic-table.component';
import { SelectModule } from 'primeng/select';
import { RouteGoogleMapComponent } from '../../../shared/components/route-google-map/route-google-map.component';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment.prod';

interface LocationOption {
  name: string;
  position: { lat: number, lng: number };
}

@Component({
  selector: 'app-user',
  imports: [SelectModule, RouteGoogleMapComponent, FormsModule],
  template: `
  <div class="container">
    <h2>Route Planner</h2>
    
    <div class="location-selectors">
      <div class="location-group">
        <label for="startLocation">Start Location:</label>
        <p-select
          id="startLocation" 
          [options]="locationOptions" 
          [(ngModel)]="selectedStartLocation" 
          optionLabel="name"
          placeholder="Select start location">
        </p-select>
      </div>
      
      <div class="location-group">
        <label for="endLocation">End Location:</label>
        <p-select
          id="endLocation" 
          [options]="locationOptions" 
          [(ngModel)]="selectedEndLocation" 
          optionLabel="name"
          placeholder="Select end location">
        </p-select>
      </div>
      
      <div class="round-trip-toggle">
        <label>
          <input type="checkbox" [(ngModel)]="isRoundTrip">
          Round Trip
        </label>
      </div>
      
      <button (click)="createRoute()" [disabled]="!canCreateRoute()">Create Route</button>
    </div>
    
    <app-route-google-map 
      #routeMap
      [apiKey]="googleMapsApiKey"
      [height]="600"
      [initialLatitude]="initialLat"
      [initialLongitude]="initialLng"
      [initialZoom]="10"
      (mapReady)="onMapReady($event)"
      (routeCreated)="onRouteCreated($event)"
      (routeUpdated)="onRouteUpdated($event)">
    </app-route-google-map>
  </div>
`,
styles: [`
  .container {
    padding: 20px;
  }
  .location-selectors {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    align-items: flex-end;
  }
  .location-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  button {
    padding: 8px 16px;
    background-color: #4285F4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:disabled {
    background-color: #cccccc;
  }
  .round-trip-toggle {
    display: flex;
    align-items: center;
  }
`]
})
export class UserComponent {

  @ViewChild('routeMap') routeMap!: RouteGoogleMapComponent;
  
  googleMapsApiKey = environment.googleMapsApiKey;
  
  locationOptions: LocationOption[] = [
    { name: 'New York', position: { lat: 40.7128, lng: -74.0060 } },
    { name: 'Los Angeles', position: { lat: 34.0522, lng: -118.2437 } },
    { name: 'Chicago', position: { lat: 41.8781, lng: -87.6298 } },
    { name: 'Houston', position: { lat: 29.7604, lng: -95.3698 } },
    { name: 'Phoenix', position: { lat: 33.4484, lng: -112.0740 } },
    { name: 'Philadelphia', position: { lat: 39.9526, lng: -75.1652 } },
    { name: 'San Antonio', position: { lat: 29.4241, lng: -98.4936 } },
    { name: 'San Diego', position: { lat: 32.7157, lng: -117.1611 } }
  ];
  
  selectedStartLocation: LocationOption | null = null;
  selectedEndLocation: LocationOption | null = null;
  isRoundTrip = false;
  
  map: google.maps.Map | null = null;
  customStartPin: any = null;
  customEndPin: any = null;
  customWaypointPin: any = null;
  initialLat = environment.intialLat
  initialLng = environment.initialLng

  ngOnInit() {
    // Initialize custom pins if needed
    this.initCustomPins();
  }

  onMapReady(map: google.maps.Map) {
    this.map = map;
    console.log('Map ready', map);
    
    // Set custom pins if they're initialized
    if (this.customStartPin && this.customEndPin && this.customWaypointPin) {
      this.routeMap.setCustomPins(this.customStartPin, this.customEndPin, this.customWaypointPin);
    }
  }

  async initCustomPins() {
    try {
      // Wait for Google Maps to load
      await new Promise<void>((resolve) => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          // This is simplified, in a real app you might want to use a more robust approach
          const checkGoogleMaps = setInterval(() => {
            if (window.google && window.google.maps) {
              clearInterval(checkGoogleMaps);
              resolve();
            }
          }, 100);
        }
      });
      
      // Create custom pins once Google Maps is loaded
      const { PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      
      this.customStartPin = new PinElement({
        background: '#4285F4',
        borderColor: '#FFFFFF',
        glyphColor: '#FFFFFF',
        glyph: 'S',
      }).element;
      
      this.customEndPin = new PinElement({
        background: '#DB4437',
        borderColor: '#FFFFFF',
        glyphColor: '#FFFFFF',
        glyph: 'E',
      }).element;
      
      this.customWaypointPin = new PinElement({
        background: '#F4B400',
        borderColor: '#FFFFFF',
        glyphColor: '#FFFFFF',
        glyph: 'W',
      }).element;
      
      // If map is already initialized, set the pins
      if (this.routeMap) {
        this.routeMap.setCustomPins(this.customStartPin, this.customEndPin, this.customWaypointPin);
      }
    } catch (error) {
      console.error('Error initializing custom pins:', error);
    }
  }

  canCreateRoute(): boolean {
    return !!this.selectedStartLocation && !!this.selectedEndLocation;
  }

  createRoute() {
    if (!this.canCreateRoute()) return;
    
    this.routeMap.createRouteFromSelection(
      this.selectedStartLocation!.position,
      this.selectedEndLocation!.position,
      this.isRoundTrip
    );
  }

  onRouteCreated(path: google.maps.LatLngLiteral[]) {
    console.log('Route created with', path.length, 'points');
    // You can handle this event, for example save the route to your backend
  }

  onRouteUpdated(path: google.maps.LatLngLiteral[]) {
    console.log('Route updated with', path.length, 'points');
    // You can handle this event, for example save the updated route to your backend
  }

}
