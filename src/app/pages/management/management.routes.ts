import { Routes } from '@angular/router';
import { UserComponent } from './user/user.component';
import { DepartmentComponent } from './department/department.component';
import { AddressComponent } from './address/address.component';
import { RoutesComponent } from './routes/routes.component';


export default [
    { path: 'user', component: UserComponent },
    { path: 'department', component: DepartmentComponent },
    { path: 'address', component: AddressComponent },
    { path: 'routes', component: RoutesComponent },
] as Routes;
