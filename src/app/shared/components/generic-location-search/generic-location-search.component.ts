import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
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
      (keydown.enter)="$event.preventDefault()"
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
export class GenericLocationSearchComponent {
  @ViewChild('autoComplete') autoComplete!: ElementRef;

  @Input() apiKey = '';
  @Input() placeholder = 'Search for a location';
  @Input() mapInstance: google.maps.Map | null = null;

  @Output() placeSelected = new EventEmitter<any>();

  private autoCompleteToken!: google.maps.places.AutocompleteSessionToken;
  private debounceTimer: any;
  
  @Input() searchText: string = '';
  suggestions: any[] = [];
  loading: boolean = false;

  constructor() {}

  ngOnInit() {
    // Initialize the autocomplete token when the component initializes
    if (window.google && window.google.maps && window.google.maps.places) {
      this.autoCompleteToken = new google.maps.places.AutocompleteSessionToken();
    }
  }

  setupSearchFunctionality(map: google.maps.Map) {
    this.mapInstance = map;
    this.autoCompleteToken = new google.maps.places.AutocompleteSessionToken();
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
    clearTimeout(this.debounceTimer);
    
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

  private async fetchAutocompleteSuggestions(input: string) {
    if (!this.mapInstance) {
      console.error("Map is not initialized");
      this.loading = false;
      return;
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
          originalSuggestion: suggestion
        };
      });
      
      // Create results list for compatibility
      const resultsElement = document.getElementById("results");
      if (resultsElement && suggestions.length > 0) {
        // Clear previous list items
        resultsElement.innerHTML = '';
        
        // Create and append result items
        suggestions.forEach((suggestion, index) => {
          const placePrediction: any = suggestion.placePrediction;
          const listItem = document.createElement("li");
          
          listItem.textContent = placePrediction.text.text;
          listItem.style.cursor = "pointer";
          
          // Add click handler to select this suggestion
          listItem.addEventListener('click', () => this.selectSuggestion(suggestion));
          
          resultsElement.appendChild(listItem);
        });
        
        // Automatically process the first suggestion
        // if (suggestions.length > 0) {
        //   await this.selectSuggestion(suggestions[0]);
        // }
      }
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error);
      this.suggestions = [];
    } finally {
      this.loading = false;
    }
  }
  
  onSuggestionSelect(event: any) {
    console.log(event);
    
    if (event && event.value.originalSuggestion) {
      this.selectSuggestion(event.value.originalSuggestion);
    }
  }
  
  private async selectSuggestion(suggestion: google.maps.places.AutocompleteSuggestion) {
    if (!this.mapInstance) return;
    
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
          address: place.formattedAddress || ''
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