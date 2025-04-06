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
    { name: 'Connaught Place', position: { lat: 28.6315, lng: 77.2167 } },
    { name: 'Karol Bagh', position: { lat: 28.6512, lng: 77.1905 } },
    { name: 'Chandni Chowk', position: { lat: 28.6562, lng: 77.2301 } },
    { name: 'Lajpat Nagar', position: { lat: 28.5677, lng: 77.2432 } },
    { name: 'Saket', position: { lat: 28.5245, lng: 77.2066 } },
    { name: 'Dwarka', position: { lat: 28.5921, lng: 77.0460 } },
    { name: 'Vasant Kunj', position: { lat: 28.5243, lng: 77.1551 } },
    { name: 'Rajouri Garden', position: { lat: 28.6426, lng: 77.1242 } },
    { name: 'Rohini', position: { lat: 28.7383, lng: 77.0900 } },
    { name: 'Mayur Vihar', position: { lat: 28.6090, lng: 77.2952 } }
  ]
  ;
  
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
    console.log();
    
    console.log('Route created with', path, 'points');
    // You can handle this event, for example save the route to your backend
  }

  onRouteUpdated(path: google.maps.LatLngLiteral[]) {
    console.log('Route updated with', path, 'points');
    // You can handle this event, for example save the updated route to your backend
  }

}
