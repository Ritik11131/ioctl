import { Injectable } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../../../environments/environment.prod';


@Injectable({
  providedIn: 'root'
})
export class GmLoaderService {
  private loader: Loader | null = null;
  private isInitialized = false;

  constructor() {}

  async initializeLoader(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      this.loader = new Loader({
        apiKey: environment.googleMapsApiKey,
        version: 'weekly',
        libraries: ['places', 'maps', 'marker', 'drawing', 'routes']
      });

      await this.loader.load();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing Google Maps loader:', error);
      throw error;
    }
  }

  isLoaderInitialized(): boolean {
    return this.isInitialized;
  }
}