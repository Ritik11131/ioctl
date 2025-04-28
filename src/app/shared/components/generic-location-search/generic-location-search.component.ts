import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule } from '@angular/google-maps';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generic-location-search',
  standalone: true,
  imports: [FormsModule, GoogleMapsModule, AutoCompleteModule, ProgressSpinnerModule, CommonModule],
  template: `
  <div class="search-container">
    <p-autoComplete
      [(ngModel)]="searchText"
      [suggestions]="suggestions"
      [placeholder]="placeholder"
      [field]="'text'"
      (completeMethod)="onSearchInput($event)"
      (onSelect)="onSuggestionSelect($event)"
      (keydown.enter)="handleEnterKey($event)"
      inputStyleClass="w-full"
    >
    </p-autoComplete>
    
    <div style="display:none" id="searchResults">
      <div id="title" class="search-title"></div>
      <div id="prediction" class="prediction-result"></div>
      <ul id="results" class="results-list"></ul>
    </div>
  </div>
  `,
  styles: [`
    .search-container {
      width: 100%;
      position: relative;
      margin-bottom: 10px;
    }
    .search-title {
      font-weight: bold;
      margin-top: 10px;
    }
    .prediction-result {
      margin: 5px 0;
    }
    .results-list {
      padding-left: 20px;
    }
    .loader-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
    }
    :host ::ng-deep .p-autocomplete {
      width: 100%;
    }
  `]
})
export class GenericLocationSearchComponent implements OnChanges {
  @ViewChild('autoComplete') autoComplete!: ElementRef;

  @Input() apiKey = '';
  @Input() placeholder = 'Search for a location or enter lat,lng';
  @Input() mapInstance: google.maps.Map | null = null;

  @Output() placeSelected = new EventEmitter<any>();

  private autoCompleteToken: google.maps.places.AutocompleteSessionToken | null = null;
  private debounceTimer: any;
  private geocoder: google.maps.Geocoder | null = null;
  
  @Input() searchText: string = '';
  suggestions: any[] = [];
  loading: boolean = false;

  // Regular expression to match latitude,longitude format
  private latLngRegex = /^(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)$/;

  constructor() {}

  ngOnChanges(changes: SimpleChanges): void {
    // Check if mapInstance has been set or changed
    if (changes['mapInstance'] && changes['mapInstance'].currentValue) {
      this.initializeServicesIfNeeded();
    }
  }

  /**
   * The original setupSearchFunctionality method that the parent stepper component calls
   * This keeps the original API intact
   */
  setupSearchFunctionality(map: google.maps.Map) {
    this.mapInstance = map;
    
    try {
      // Initialize the autocomplete token when the component initializes
      if (window.google && window.google.maps && window.google.maps.places) {
        this.autoCompleteToken = new google.maps.places.AutocompleteSessionToken();
      } else {
        console.warn("Google Maps Places API is not available");
      }
      
      // Initialize the geocoder safely
      if (window.google && window.google.maps) {
        this.geocoder = new google.maps.Geocoder();
      }
    } catch (error) {
      console.error("Error in setupSearchFunctionality:", error);
    }
  }

  private initializeServicesIfNeeded(): void {
    // Only initialize if we have a map instance and Google Maps is available
    if (!this.mapInstance || !window.google?.maps) {
      return;
    }

    try {
      // Initialize Places service if available and not already initialized
      if (window.google.maps.places && !this.autoCompleteToken) {
        this.autoCompleteToken = new google.maps.places.AutocompleteSessionToken();
      }

      // Initialize Geocoder if not already initialized
      if (!this.geocoder) {
        this.geocoder = new google.maps.Geocoder();
      }
    } catch (error) {
      console.error("Error initializing Google services:", error);
    }
  }

  private clearResults() {
    const titleElement = document.getElementById("title");
    const predictionElement = document.getElementById("prediction");
    const resultsElement = document.getElementById("results");
    
    if (titleElement) titleElement.innerHTML = '';
    if (predictionElement) predictionElement.innerHTML = '';
    if (resultsElement) resultsElement.innerHTML = '';
  }

  onSearchInput(event: any) {
    const inputText = event.query;
    
    // Clear previous timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Check if input looks like lat,lng
    if (this.isLatLngFormat(inputText)) {
      const latLng = this.parseLatLng(inputText);
      if (latLng) {
        this.suggestions = [{
          text: `Set location to coordinates: ${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`,
          isLatLng: true,
          latLng: latLng
        }];
      } else {
        this.suggestions = [];
      }
      return;
    }
    
    // Only search if text is 3+ characters
    if (inputText.length > 2) {
      this.loading = true;
      
      this.debounceTimer = setTimeout(() => {
        this.fetchAutocompleteSuggestions(inputText);
      }, 300); // 300ms debounce
    } else {
      this.suggestions = [];
      this.clearResults();
    }
  }

  /**
   * Check if the input text matches lat,lng format
   */
  private isLatLngFormat(input: string): boolean {
    return this.latLngRegex.test(input.trim());
  }

  /**
   * Parse latitude and longitude from comma-separated string
   */
  private parseLatLng(input: string): {lat: number, lng: number} | null {
    const match = input.trim().match(this.latLngRegex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);
      
      // Validate lat/lng ranges
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    return null;
  }

  /**
   * Handle geocoding for lat,lng inputs
   */
  private async handleLatLngInput(latLng: {lat: number, lng: number}) {
    if (!this.mapInstance) {
      console.error("Map instance is not available");
      return;
    }
    
    this.loading = true;
    
    try {
      // Update map
      this.mapInstance.setCenter(latLng);
      this.mapInstance.setZoom(14);
      
      let address = '';
      let name = `${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}`;
      
      // Try to reverse geocode to get address if geocoder is available
      if (this.geocoder) {
        try {
          const response = await this.geocoder.geocode({ location: latLng });
          
          if (response.results && response.results.length > 0) {
            address = response.results[0].formatted_address || '';
            // Use the first component as name if available
            if (response.results[0].address_components && response.results[0].address_components.length > 0) {
              name = response.results[0].address_components[0].long_name;
            }
          }
        } catch (geocodeError) {
          console.warn("Geocoding failed:", geocodeError);
          // Continue with coordinates only
        }
      }
      
      // Emit selected place with both coordinates and address if available
      this.placeSelected.emit({
        lat: latLng.lat,
        lng: latLng.lng,
        name: name,
        address: address,
        isLatLng: true
      });
      
      // Display place info
      const predictionElement = document.getElementById("prediction");
      if (predictionElement) {
        predictionElement.textContent = `Selected coordinates: ${latLng.lat.toFixed(6)}, ${latLng.lng.toFixed(6)}${address ? ` (${address})` : ''}`;
      }
    } catch (error) {
      console.error("Error handling lat/lng input:", error);
    } finally {
      this.loading = false;
    }
  }

  private async fetchAutocompleteSuggestions(input: string) {
    if (!this.mapInstance) {
      console.error("Map is not initialized");
      this.loading = false;
      return;
    }
    
    // Initialize services if not already done (safety check)
    this.initializeServicesIfNeeded();

    if (!window.google?.maps?.places?.AutocompleteSuggestion) {
      console.error("Places API is not available");
      this.loading = false;
      return;
    }

    if (!this.autoCompleteToken) {
      try {
        this.autoCompleteToken = new google.maps.places.AutocompleteSessionToken();
      } catch (error) {
        console.error("Failed to create autocomplete token:", error);
        this.loading = false;
        return;
      }
    }

    try {
      // Get user's map viewport for better location biasing
      const bounds = this.mapInstance.getBounds();
      
      const request: any = {
        input: input,
        sessionToken: this.autoCompleteToken,
        locationBias: bounds || {
          west: -122.44,
          north: 37.8,
          east: -122.39,
          south: 37.78,
        }
      };

      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      
      // Clear previous results
      this.clearResults();
      
      // Display title
      const titleElement = document.getElementById("title");
      if (titleElement) {
        titleElement.innerHTML = `Place predictions for "${input}"`;
      }

      // Format suggestions for AutoComplete component
      this.suggestions = suggestions.map(suggestion => {
        const placePrediction: any = suggestion.placePrediction;
        return {
          text: placePrediction.text.text,
          originalSuggestion: suggestion,
          isLatLng: false
        };
      });
      
      // Create results list for compatibility
      const resultsElement = document.getElementById("results");
      if (resultsElement && suggestions.length > 0) {
        // Clear previous list items
        resultsElement.innerHTML = '';
        
        // Create and append result items
        suggestions.forEach((suggestion) => {
          const placePrediction: any = suggestion.placePrediction;
          const listItem = document.createElement("li");
          
          listItem.textContent = placePrediction.text.text;
          listItem.style.cursor = "pointer";
          
          // Add click handler to select this suggestion
          listItem.addEventListener('click', () => this.selectSuggestion(suggestion));
          
          resultsElement.appendChild(listItem);
        });
      }
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error);
      this.suggestions = [];
    } finally {
      this.loading = false;
    }
  }
  
  onSuggestionSelect(event: any) {
    if (!event || !event.value) return;
    
    if (event.value.isLatLng && event.value.latLng) {
      // Handle lat,lng selection
      this.handleLatLngInput(event.value.latLng);
    } else if (event.value.originalSuggestion) {
      // Handle place selection
      this.selectSuggestion(event.value.originalSuggestion);
    }
  }
  
  handleEnterKey(event: any) {
    event.preventDefault();
    
    const currentValue = this.searchText.trim();
    
    // Check if input is in lat,lng format
    if (this.isLatLngFormat(currentValue)) {
      const latLng = this.parseLatLng(currentValue);
      if (latLng) {
        this.handleLatLngInput(latLng);
        return;
      }
    } 
    
    // If we have suggestions, select the first one
    if (this.suggestions.length > 0) {
      if (this.suggestions[0].isLatLng) {
        this.handleLatLngInput(this.suggestions[0].latLng);
      } else if (this.suggestions[0].originalSuggestion) {
        this.selectSuggestion(this.suggestions[0].originalSuggestion);
      }
    }
  }
  
  private async selectSuggestion(suggestion: google.maps.places.AutocompleteSuggestion) {
    if (!this.mapInstance) {
      console.error("Map instance is not available");
      return;
    }
    
    this.loading = true;

    try {
      const placePrediction: any = suggestion.placePrediction;
      const placeResponse = await placePrediction.toPlace().fetchFields({
        fields: ["displayName", "formattedAddress", "location", "viewport"]
      });
      const place = placeResponse.place;

      // Update map
      if (place.viewport) {
        this.mapInstance.fitBounds(place.viewport);
      } else if (place.location) {
        this.mapInstance.setCenter(place.location);
        this.mapInstance.setZoom(14);
      }
      
      if (place.location) {
        // Emit selected place to parent
        this.placeSelected.emit({ 
          lat: place.location.lat(), 
          lng: place.location.lng(),
          name: place.displayName || '',
          address: place.formattedAddress || '',
          isLatLng: false
        });
      }
      
      // Display place info
      const predictionElement = document.getElementById("prediction");
      if (predictionElement) {
        predictionElement.textContent = 
          `Selected place: ${place.displayName || ''} at ${place.formattedAddress || ''}`;
      }
    } catch (error) {
      console.error("Error selecting suggestion:", error);
    } finally {
      this.loading = false;
    }
  }
}