import { Routes } from '@angular/router';
import { Documentation } from './documentation/documentation';
import { Crud } from './crud/crud';
import { Empty } from './empty/empty';
import { RtdApprovalComponent } from './rtd-approval/rtd-approval.component';

export default [
    { path: 'documentation', component: Documentation },
    { path: 'crud', component: Crud },
    { path: 'empty', component: Empty },
    { path: 'rtd-approval', component: RtdApprovalComponent},
    { path: 'management', loadChildren: () => import('./management/management.routes').then(m => m.default) },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
