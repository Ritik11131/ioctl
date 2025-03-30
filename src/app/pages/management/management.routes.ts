import { Routes } from '@angular/router';
import { UserComponent } from './user/user.component';
import { DepartmentComponent } from './department/department.component';
import { AddressComponent } from './address/address.component';


export default [
    { path: 'user', component: UserComponent },
    { path: 'department', component: DepartmentComponent },
    { path: 'address', component: AddressComponent },
] as Routes;
