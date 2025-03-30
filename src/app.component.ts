import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ToastModule } from 'primeng/toast';


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterModule, ToastModule],
    template: `
    <router-outlet></router-outlet>
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
export class AppComponent {}
