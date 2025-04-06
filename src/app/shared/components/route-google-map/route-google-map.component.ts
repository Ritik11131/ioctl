import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Loader } from '@googlemaps/js-api-loader';
import { UiService } from '../../../layout/service/ui.service';

@Component({
  selector: 'app-route-google-map',
  imports: [FormsModule],
  template: `
    <div class="map-container-wrapper">
      <div #mapContainer class="map-container" [style.height.px]="height"></div>
      
      <!-- Control Panel -->
      <div class="map-controls">
        @if(isEditing) {
          <div class="segment-controls">
            <div class="segment-header">
              <h4>Editing Route Segments</h4>
              <span class="segment-info">{{ currentSegmentIndex + 1 }} of {{ routeSegments.length }}</span>
            </div>
            
            <div class="segment-navigation">
              <button (click)="previousSegment()" [disabled]="currentSegmentIndex === 0">Previous</button>
              <button (click)="nextSegment()" [disabled]="currentSegmentIndex === routeSegments.length - 1">Next</button>
            </div>
            
            <div class="segment-actions">
              <button (click)="saveRoute()">Save Route</button>
              <button (click)="cancelEditing()">Cancel</button>
            </div>
          </div>
        }
        
        @if(!isEditing && routePath.length > 0) {
          <div class="route-actions">
            <button (click)="startEditing()">Edit Route</button>
            <button (click)="reverseRoute()">Reverse Direction</button>
            <button (click)="clearRoute()">Clear Route</button>
          </div>
        }
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
    .map-controls {
      position: absolute;
      top: 10px;
      right: 10px;
      background: white;
      padding: 10px;
      border-radius: 5px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
      z-index: 1;
      min-width: 200px;
    }
    .segment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .segment-header h4 {
      margin: 0;
    }
    .segment-navigation, .segment-actions, .route-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
    }
    button {
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      background-color: #4285F4;
      color: white;
      cursor: pointer;
      font-size: 14px;
    }
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    button:not(:disabled):hover {
      background-color: #3367D6;
    }
  `]
})
export class RouteGoogleMapComponent implements AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  @Input() apiKey = '';
  @Input() height = 400;
  @Input() initialLatitude = 40.730610;
  @Input() initialLongitude = -73.935242;
  @Input() initialZoom = 12;
  @Input() mapId = 'DEMO_MAP_ID';
  @Input() numSegments = 10; // Default number of segments to split route into
  @Input() markerStartContent: any; // Custom marker element for start
  @Input() markerEndContent: any; // Custom marker element for end
  @Input() markerWaypointContent: any; // Custom marker element for waypoints

  @Output() mapReady = new EventEmitter<google.maps.Map>();
  @Output() routeCreated = new EventEmitter<google.maps.LatLngLiteral[]>();
  @Output() routeUpdated = new EventEmitter<google.maps.LatLngLiteral[]>();
  @Output() segmentSelected = new EventEmitter<{index: number, points: google.maps.LatLngLiteral[]}>();

  map!: google.maps.Map;
  directionsService!: google.maps.DirectionsService;
  directionsRenderer!: any;
  
  startMarker!: google.maps.marker.AdvancedMarkerElement;
  endMarker!: google.maps.marker.AdvancedMarkerElement;
  waypointMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  
  routePath: google.maps.LatLngLiteral[] = [];
  routeSegments: google.maps.LatLngLiteral[][] = [];
  segmentPolylines: google.maps.Polyline[] = [];
  currentSegmentIndex = 0;
  isEditing = false;
  
  // For segment editing
  segmentEditPolyline!: google.maps.Polyline;
  segmentEditMarkers: google.maps.marker.AdvancedMarkerElement[] = [];
  
  // Colors for segments
  segmentColors = [
    '#34A853', // Google green
    '#FBBC05', // Google yellow
    '#EA4335', // Google red
    '#673AB7', // Purple
    '#3F51B5', // Indigo
    '#00BCD4', // Cyan
    '#009688', // Teal
  ];

  constructor(private ngZone: NgZone, private uiService:UiService) {}

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

      // Initialize map
      const mapOptions: google.maps.MapOptions = {
        center: { lat: this.initialLatitude, lng: this.initialLongitude },
        zoom: this.initialZoom,
        mapTypeControl: true,
        mapId: this.mapId,
      };

      this.map = new Map(this.mapContainer.nativeElement, mapOptions);
      
      // Initialize Directions service
      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        map: this.map,
        suppressMarkers: true, // We'll handle markers separately
        preserveViewport: true,
        // Initially hide the directions renderer
        polylineOptions: {
          visible: false
        }
      });

      // Emit map instance to parent
      this.mapReady.emit(this.map);
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
    }
  }

  /**
   * Creates a route between two points with optional waypoints
   * @param start Starting point
   * @param end Ending point
   * @param makeRoundTrip Whether to make this a round trip
   * @param waypoints Optional waypoints
   */
  createRoute(start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral, makeRoundTrip = false, waypoints: google.maps.LatLngLiteral[] = []) {
    // Clear any existing route first
    this.clearRoute();
    
    if (this.uiService) {
      this.uiService.toggleLoader(true);
    }

    const request: google.maps.DirectionsRequest = {
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    if (waypoints.length > 0) {
      request.waypoints = waypoints.map(point => ({
        location: point,
        stopover: true
      }));
    }

    // Add round trip if needed
    if (makeRoundTrip) {
      // For a round trip, we make the destination same as origin and add the original destination as a waypoint
      const roundTripWaypoints = [...(request.waypoints || []), {
        location: end,
        stopover: true
      }];
      
      request.destination = start;
      request.waypoints = roundTripWaypoints;
    }

    this.directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        // Display the route with different color for round trip
        this.directionsRenderer.setOptions({
          polylineOptions: {
            visible: true,
            strokeColor: makeRoundTrip ? '#FF6B6B' : '#4285F4', // Red for round trip, blue for normal route
            strokeWeight: 5
          }
        });
        this.directionsRenderer.setDirections(result);
        
        // Extract the route points from the result
        this.extractRoutePoints(result);
        
        // Add markers
        this.addRouteMarkers(start, end, waypoints);
        
        // Fit map to the route bounds
        if (result.routes[0]?.bounds) {
          this.map.fitBounds(result.routes[0].bounds);
        }
        
        // Emit route created event
        this.routeCreated.emit(this.routePath);
        
        if (this.uiService) {
          this.uiService.toggleLoader(false);
        }
      } else {
        console.error('Directions request failed:', status);
        if (this.uiService) {
          this.uiService.toggleLoader(false);
          this.uiService.showToast('error','Failed to create route', 'error');
        }
      }
    });
  }

  /**
   * Extract the detailed route points from directions result
   */
  private extractRoutePoints(result: google.maps.DirectionsResult) {
    this.routePath = [];
    
    if (result.routes.length > 0 && result.routes[0].legs.length > 0) {
      // Go through each leg (segment between waypoints)
      result.routes[0].legs.forEach(leg => {
        // Go through each step in the leg
        leg.steps.forEach(step => {
          // Add detailed path points from this step
          if (step.path) {
            step.path.forEach(point => {
              this.routePath.push({
                lat: point.lat(),
                lng: point.lng()
              });
            });
          }
        });
      });
    }
    
    // Split the route into segments
    this.splitRouteIntoSegments();
  }

  /**
   * Split the route into editable segments
   */
  private splitRouteIntoSegments() {
    this.routeSegments = [];
    
    if (this.routePath.length < 2) {
      return;
    }
    
    // Optimize segment creation for large routes
    const numPoints = this.routePath.length;
    
    // Dynamically adjust number of segments based on route size
    const adjustedNumSegments = numPoints > 1000 ? 
      Math.min(this.numSegments, Math.ceil(numPoints / 100)) : 
      this.numSegments;
    
    const pointsPerSegment = Math.max(2, Math.floor(numPoints / adjustedNumSegments));
    
    // For very large routes, we'll sample points instead of using every point
    const shouldSample = numPoints > 5000;
    const samplingRate = shouldSample ? Math.ceil(numPoints / 5000) : 1;
    
    const sampledPath = shouldSample ? 
      this.routePath.filter((_, i) => i % samplingRate === 0 || i === 0 || i === numPoints - 1) : 
      this.routePath;
    
    const sampledNumPoints = sampledPath.length;
    const sampledPointsPerSegment = Math.max(2, Math.floor(sampledNumPoints / adjustedNumSegments));
    
    for (let i = 0; i < adjustedNumSegments; i++) {
      const start = i * sampledPointsPerSegment;
      const end = (i === adjustedNumSegments - 1) ? sampledNumPoints : (i + 1) * sampledPointsPerSegment;
      
      if (start >= sampledNumPoints) break;
      
      this.routeSegments.push(sampledPath.slice(start, end));
    }
  }

  /**
   * Add markers to the route (start, end, waypoints)
   */
  private addRouteMarkers(
    start: google.maps.LatLngLiteral, 
    end: google.maps.LatLngLiteral, 
    waypoints: google.maps.LatLngLiteral[]
  ) {
    this.clearMarkers();
    
    const createMarker = async (position: google.maps.LatLngLiteral, customContent?: any, title?: string): Promise<google.maps.marker.AdvancedMarkerElement> => {
      const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
      
      // Create default pin if no custom content
      let content;
      if (!customContent) {
        const pin = new PinElement({
          background: title === 'Start' ? '#4285F4' : title === 'End' ? '#DB4437' : '#F4B400',
          borderColor: '#FFFFFF',
          glyphColor: '#FFFFFF',
          glyph: title?.charAt(0) || '',
        });
        content = pin.element;
      } else {
        content = customContent;
      }
      
      return new AdvancedMarkerElement({
        position,
        map: this.map,
        title: title || '',
        content
      });
    };
    
    // Create start and end markers
    createMarker(start, this.markerStartContent, 'Start').then(marker => this.startMarker = marker);
    createMarker(end, this.markerEndContent, 'End').then(marker => this.endMarker = marker);
    
    // Create waypoint markers
    waypoints.forEach((waypoint, index) => {
      createMarker(waypoint, this.markerWaypointContent, `Waypoint ${index + 1}`)
        .then(marker => this.waypointMarkers.push(marker));
    });
  }

  /**
   * Start editing the route segments
   */
  startEditing() {
    this.isEditing = true;
    
    // Show loader
    if (this.uiService) {
      this.uiService.toggleLoader(true);
    }
    
    // Hide the directions renderer during editing
    this.directionsRenderer.setOptions({
      polylineOptions: {
        visible: false
      }
    });
    
    // Draw segments progressively to avoid freezing
    this.progressivelyDrawSegments().then(() => {
      // Select the first segment
      this.selectSegment(0);
      
      if (this.uiService) {
        this.uiService.toggleLoader(false);
      }
    });
  }

  /**
   * Progressively draw segments to avoid UI freezing
   */
  private async progressivelyDrawSegments(): Promise<void> {
    return new Promise<void>((resolve) => {
      // Clear existing polylines
      this.clearSegmentPolylines();
      
      if (this.routeSegments.length === 0) {
        resolve();
        return;
      }
      
      // Draw segments in batches
      const batchSize = Math.min(5, Math.ceil(this.routeSegments.length / 4));
      let currentIndex = 0;
      
      const drawNextBatch = () => {
        const endIndex = Math.min(currentIndex + batchSize, this.routeSegments.length);
        
        // Draw a batch of segments
        for (let i = currentIndex; i < endIndex; i++) {
          this.drawSingleSegment(i);
        }
        
        currentIndex = endIndex;
        
        // Update loader progress
        if (this.uiService) {
          const progress = Math.round((currentIndex / this.routeSegments.length) * 100);
          console.log(progress);
          
          this.uiService.toggleLoader(true);
        }
        
        // If there are more segments to draw, schedule the next batch
        if (currentIndex < this.routeSegments.length) {
          setTimeout(() => {
            this.ngZone.run(() => {
              drawNextBatch();
            });
          }, 10); // Small delay to allow UI to update
        } else {
          resolve();
        }
      };
      
      // Start drawing
      drawNextBatch();
    });
  }

  /**
   * Draw a single segment
   */
  private drawSingleSegment(index: number) {
    const segment = this.routeSegments[index];
    
    if (segment.length < 2) return;
    
    const color = this.segmentColors[index % this.segmentColors.length];
    
    const polyline = new google.maps.Polyline({
      path: segment,
      strokeColor: color,
      strokeOpacity: 0.7,
      strokeWeight: 5,
      map: this.map,
      zIndex: 1
    });
    
    this.segmentPolylines.push(polyline);
    
    // Add click listener to select this segment
    polyline.addListener('click', () => {
      this.selectSegment(index);
    });
  }

  /**
   * Select a segment for editing
   */
  selectSegment(index: number) {
    if (index < 0 || index >= this.routeSegments.length) return;
    
    // Clear previous edit markers
    this.clearEditMarkers();
    
    this.currentSegmentIndex = index;
    const segment = this.routeSegments[index];
    
    // Highlight the selected segment
    this.segmentPolylines.forEach((polyline, i) => {
      polyline.setOptions({
        strokeOpacity: i === index ? 1.0 : 0.5,
        strokeWeight: i === index ? 7 : 5,
        zIndex: i === index ? 2 : 1
      });
    });
    
    // Add edit polyline for the selected segment
    const color = this.segmentColors[index % this.segmentColors.length];
    this.segmentEditPolyline = new google.maps.Polyline({
      path: segment,
      strokeColor: color,
      strokeOpacity: 0.0, // Invisible, we just want the editor
      strokeWeight: 5,
      map: this.map,
      zIndex: 3,
      editable: true,
      draggable: false
    });
    
    // Add markers at each point for easier editing
    this.addEditMarkers(segment, color);
    
    // Emit event
    this.segmentSelected.emit({
      index,
      points: segment
    });
    
    // Center map on the segment
    if (segment.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      segment.forEach(point => bounds.extend(point));
      this.map.fitBounds(bounds);
    }
  }

  /**
   * Add edit markers to make editing more user-friendly
   */
  private async addEditMarkers(segment: google.maps.LatLngLiteral[], color: string) {
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
    
    // For large segments, only add a few key markers
    const numMarkersToAdd = segment.length > 100 ? 5 : Math.min(10, segment.length);
    const markerIndices = [];
    
    // Always include start and end
    markerIndices.push(0);
    markerIndices.push(segment.length - 1);
    
    // Add some intermediate markers
    if (numMarkersToAdd > 2) {
      const step = segment.length / (numMarkersToAdd - 1);
      for (let i = 1; i < numMarkersToAdd - 1; i++) {
        markerIndices.push(Math.floor(i * step));
      }
    }
    
    // Create markers for the selected indices
    for (const i of markerIndices) {
      const point = segment[i];
      if (!point) continue;
      
      const editMarker = new AdvancedMarkerElement({
        position: point,
        map: this.map,
        gmpDraggable: true,
        title: i === 0 ? "Segment Start" : i === segment.length - 1 ? "Segment End" : `Edit Point ${i}`,
      });
      
      // Add listener for drag events
      editMarker.addListener('dragend', () => {
        const position = editMarker.position as google.maps.LatLng;
        if (position) {
          this.updateSegmentPath();
        }
      });
      
      this.segmentEditMarkers.push(editMarker);
    }
  }

  /**
   * Update the segment path from the edit polyline
   */
  private updateSegmentPath() {
    if (!this.segmentEditPolyline) return;
    
    const path = this.segmentEditPolyline.getPath();
    const newSegment: google.maps.LatLngLiteral[] = [];
    
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      newSegment.push({
        lat: point.lat(),
        lng: point.lng()
      });
    }
    
    // Update the segment in our data
    this.routeSegments[this.currentSegmentIndex] = newSegment;
    
    // Update the visual polyline
    this.segmentPolylines[this.currentSegmentIndex].setPath(newSegment);
  }

  /**
   * Navigate to the next segment
   */
  nextSegment() {
    if (this.currentSegmentIndex < this.routeSegments.length - 1) {
      this.updateSegmentPath(); // Save current changes
      this.selectSegment(this.currentSegmentIndex + 1);
    }
  }

  /**
   * Navigate to the previous segment
   */
  previousSegment() {
    if (this.currentSegmentIndex > 0) {
      this.updateSegmentPath(); // Save current changes
      this.selectSegment(this.currentSegmentIndex - 1);
    }
  }

  /**
   * Save the edited route
   */
  saveRoute() {
    if (this.uiService) {
      this.uiService.toggleLoader(true);
    }
    
    // Update the current segment
    this.updateSegmentPath();
    
    // Rebuild the full route path from segments
    this.routePath = [];
    this.routeSegments.forEach(segment => {
      this.routePath = [...this.routePath, ...segment];
    });
    
    // Clean up editing UI
    this.clearEditMarkers();
    this.clearSegmentPolylines();
    
    // Show the updated route using the directions renderer
    this.showUpdatedRoute().then(() => {
      this.isEditing = false;
      
      // Emit event
      this.routeUpdated.emit(this.routePath);
      
      if (this.uiService) {
        this.uiService.toggleLoader(false);
        this.uiService.showToast('success','Route updated successfully', 'success');
      }
    }).catch(error => {
      console.error('Error saving route:', error);
      if (this.uiService) {
        this.uiService.toggleLoader(false);
        this.uiService.showToast('error','Error saving route', 'error');
      }
    });
  }

  /**
   * Show the updated route after editing
   */
  private async showUpdatedRoute(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // For large routes, reduce the number of points to avoid API limits
      const MAX_WAYPOINTS = 8; // Google allows max 8 waypoints in the free tier
      
      // Choose key points from our route to use as waypoints
      let waypoints: google.maps.LatLngLiteral[] = [];
      
      if (this.routePath.length > 100) {
        // For large routes, select waypoints strategically
        const waypointIndices = [];
        
        for (let i = 1; i <= MAX_WAYPOINTS; i++) {
          waypointIndices.push(Math.floor(i * this.routePath.length / (MAX_WAYPOINTS + 1)));
        }
        
        waypoints = waypointIndices.map(index => this.routePath[index]);
      }
      
      // Create route from start to end with the waypoints
      const request: google.maps.DirectionsRequest = {
        origin: this.routePath[0],
        destination: this.routePath[this.routePath.length - 1],
        waypoints: waypoints.map(point => ({
          location: point,
          stopover: true
        })),
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false  // We want to keep the order
      };
      
      this.directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          this.directionsRenderer.setOptions({
            polylineOptions: {
              visible: true,
              strokeColor: '#4285F4',
              strokeWeight: 5
            }
          });
          this.directionsRenderer.setDirections(result);
          resolve();
        } else {
          console.error('Failed to update route:', status);
          
          // Fallback: create a simple polyline with our path
          new google.maps.Polyline({
            path: this.routePath,
            strokeColor: '#4285F4',
            strokeWeight: 5,
            map: this.map
          });
          
          if (status === google.maps.DirectionsStatus.ZERO_RESULTS) {
            resolve(); // This is fine, we just use our fallback
          } else {
            reject(status);
          }
        }
      });
    });
  }

  /**
   * Cancel editing and revert to the original route
   */
  cancelEditing() {
    if (this.uiService) {
      this.uiService.toggleLoader(true);
    }
    
    this.clearEditMarkers();
    this.clearSegmentPolylines();
    
    // Show the original route again
    this.directionsRenderer.setOptions({
      polylineOptions: {
        visible: true
      }
    });
    
    this.isEditing = false;
    
    if (this.uiService) {
      this.uiService.toggleLoader(false);
    }
  }

  /**
   * Reverse the route direction
   */
  reverseRoute() {
    if (this.routePath.length < 2) return;
    
    if (this.uiService) {
      this.uiService.toggleLoader(true);
    }
    
    // Reverse the route path
    this.routePath.reverse();
    
    // Re-split into segments
    this.splitRouteIntoSegments();
    
    // Update the directions renderer
    const start = this.routePath[0];
    const end = this.routePath[this.routePath.length - 1];
    
    // Choose key points from our route to use as waypoints
    const MAX_WAYPOINTS = 8;
    const waypointIndices = [];
    
    for (let i = 1; i <= MAX_WAYPOINTS; i++) {
      waypointIndices.push(Math.floor(i * this.routePath.length / (MAX_WAYPOINTS + 1)));
    }
    
    const waypoints = waypointIndices.map(index => this.routePath[index]);
    
    // Create route
    this.createRoute(start, end, false, waypoints);
    
    // Emit event
    this.routeUpdated.emit(this.routePath);
    
    if (this.uiService) {
      this.uiService.toggleLoader(false);
    }
  }

  /**
   * Clear the current route
   */
  clearRoute() {
    if (this.uiService) {
      this.uiService.toggleLoader(true);
    }
    
    // Clear directions
    this.directionsRenderer.setDirections({
      routes: [],
    });
    
    // Clear markers
    this.clearMarkers();
    
    // Clear polylines
    this.clearSegmentPolylines();
    this.clearEditMarkers();
    
    // Reset data
    this.routePath = [];
    this.routeSegments = [];
    this.isEditing = false;
    
    if (this.uiService) {
      this.uiService.toggleLoader(false);
    }
  }

  /**
   * Clear all markers
   */
  private clearMarkers() {
    if (this.startMarker) {
      this.startMarker.map = null;
    }
    
    if (this.endMarker) {
      this.endMarker.map = null;
    }
    
    this.waypointMarkers.forEach(marker => {
      marker.map = null;
    });
    
    this.waypointMarkers = [];
  }

  /**
   * Clear segment polylines
   */
  private clearSegmentPolylines() {
    this.segmentPolylines.forEach(polyline => {
      polyline.setMap(null);
    });
    
    this.segmentPolylines = [];
    
    if (this.segmentEditPolyline) {
      this.segmentEditPolyline.setMap(null);
    }
  }

  /**
   * Clear edit markers
   */
  private clearEditMarkers() {
    this.segmentEditMarkers.forEach(marker => {
      marker.map = null;
    });
    
    this.segmentEditMarkers = [];
    
    if (this.segmentEditPolyline) {
      this.segmentEditPolyline.setMap(null);
    }
  }

  /**
   * Public method to create a route from locations selected in a dropdown
   * @param start Starting location
   * @param end Ending location
   * @param isRoundTrip Whether this is a round trip
   */
  createRouteFromSelection(start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral, isRoundTrip = false) {
    this.createRoute(start, end, isRoundTrip);
  }

  /**
   * Set custom pin elements for the markers
   */
  setCustomPins(startPin: any, endPin: any, waypointPin: any) {
    this.markerStartContent = startPin;
    this.markerEndContent = endPin;
    this.markerWaypointContent = waypointPin;
    
    // If route already exists, update markers
    if (this.routePath.length > 0) {
      this.addRouteMarkers(
        this.routePath[0], 
        this.routePath[this.routePath.length - 1], 
        []
      );
    }
  }
}