import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { GenericLoaderComponent } from "./app/shared/components/generic-loader/generic-loader.component";
import { UiService } from './app/layout/service/ui.service';
import { GenericDrawerComponent } from './app/shared/components/generic-drawer/generic-drawer.component';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, ToastModule, GenericLoaderComponent, GenericDrawerComponent],
    template: `
    <router-outlet></router-outlet>
    @if(uiService.isLoading()) {
        <app-generic-loader />
    }

   
        <app-generic-drawer [isOpen]="uiService.isDrawerOpen()" [contentTemplate]="uiService.drawerContent()" [header]="uiService.drawerHeader()" />   
    

    <p-toast [life]="2000" [breakpoints]="{
    '920px': { width: '50%' },
    '768px': { width: '60%' },
    '640px': { width: '70%' }, 
    '568px': { width: '80%' },
    '480px': { width: '90%' },
    '414px': { width: '80%' },
    '375px': { width: '80%' },
    '320px': { width: '80%' } 
    }"
/>
    `
})
export class AppComponent {
    constructor( public uiService: UiService) {}
}
