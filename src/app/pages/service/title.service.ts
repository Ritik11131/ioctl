// title.service.ts - Simplified to show only current label + IOCL
import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MENU_ITEMS } from '../../core/constants/sidebar';

@Injectable({
  providedIn: 'root'
})
export class TitleService {
  // Use IOCL as the app name
  private readonly appName = 'IOCL';
  
  // Define menu structure directly in the service
  // This mirrors your PrimeNG menu configuration
  private menuItems: any = MENU_ITEMS;

  constructor(
    private router: Router,
    private titleService: Title
  ) {}

  /**
   * Initialize the title service to update title based on menu items
   */
  init() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Get the current URL
      const currentUrl = event.urlAfterRedirects;
      
      // Find the matching menu item
      const titleInfo = this.findTitleFromMenuByUrl(currentUrl);
      
      if (titleInfo) {
        // Only show the current label + IOCL (no parent > child format)
        this.titleService.setTitle(`${titleInfo.label} | ${this.appName}`);
      } else {
        // Fallback: Generate title from URL if no menu match found
        const urlSegments = currentUrl.split('/').filter(segment => segment);
        if (urlSegments.length > 0) {
          const lastSegment = urlSegments[urlSegments.length - 1];
          const formattedTitle = this.formatTitleFromUrl(lastSegment);
          this.titleService.setTitle(`${formattedTitle} | ${this.appName}`);
        } else {
          // Default title
          this.titleService.setTitle(this.appName);
        }
      }
    });
  }

  /**
   * Find title info from menu structure by URL
   * @returns Object with label and optional parent
   */
  private findTitleFromMenuByUrl(url: string): { label: string, parent?: string } | null {
    // Normalize URL format (some menu items might have array format links)
    let normalizedUrl = url;
    if (normalizedUrl.startsWith('/')) {
      normalizedUrl = normalizedUrl.substring(1);
    }
    
    // Check top-level items
    for (const item of this.menuItems) {
      const itemUrl = this.normalizeRouterLink(item.routerLink);
      
      if (itemUrl && normalizedUrl === itemUrl) {
        return { label: item.label };
      }
      
      // Check nested items
      if (item.items) {
        for (const subItem of item.items) {
          const subItemUrl = this.normalizeRouterLink(subItem.routerLink);
          
          if (subItemUrl && normalizedUrl === subItemUrl) {
            return { 
              label: subItem.label // Only return the child label
            };
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Normalize routerLink to string format
   * Handles both string and array formats
   */
  private normalizeRouterLink(routerLink: any): string | null {
    if (!routerLink) return null;
    
    if (typeof routerLink === 'string') {
      // Remove leading slash if present
      return routerLink.startsWith('/') ? routerLink.substring(1) : routerLink;
    } else if (Array.isArray(routerLink)) {
      // Join array parts and remove leading slash if present
      const joined = routerLink.join('/');
      return joined.startsWith('/') ? joined.substring(1) : joined;
    }
    
    return null;
  }

  /**
   * Format a URL segment into a presentable title
   */
  private formatTitleFromUrl(segment: string): string {
    // Replace hyphens and underscores with spaces
    let formatted = segment.replace(/[-_]/g, ' ');
    // Capitalize first letter of each word
    formatted = formatted.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return formatted;
  }

  /**
   * Set the title manually for special cases
   */
  setTitle(title: string) {
    this.titleService.setTitle(`${title} | ${this.appName}`);
  }
  
  /**
   * Update menu structure (useful when menu is loaded dynamically)
   */
  updateMenuItems(menuItems: any[]) {
    this.menuItems = menuItems;
  }
}