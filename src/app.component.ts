import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { GenericLoaderComponent } from "./app/shared/components/generic-loader/generic-loader.component";
import { UiService } from './app/layout/service/ui.service';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, ToastModule, GenericLoaderComponent],
    template: `
    <router-outlet></router-outlet>
    @if(uiService.isLoading()) {
        <app-generic-loader></app-generic-loader>
    }
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
