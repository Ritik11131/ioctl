import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling, withComponentInputBinding, withViewTransitions  } from '@angular/router';
import Aura from '@primeng/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';
import { MessageService } from 'primeng/api';
import { apiInterceptor } from './app/pages/service/interceptors/interceptor';
import { Title } from '@angular/platform-browser';

export const appConfig: ApplicationConfig = {
    providers: [
        MessageService, 
        provideRouter(appRoutes, 
            withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), 
            withEnabledBlockingInitialNavigation(),
            withComponentInputBinding(),
            withViewTransitions()
        ),
        Title, 
        // provideHttpClient(withFetch()),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
        provideHttpClient(withInterceptors([apiInterceptor])),

    ]
};
