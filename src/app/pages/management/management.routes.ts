import { Routes } from '@angular/router';
import { UserComponent } from './user/user.component';
import { DepartmentComponent } from './department/department.component';
import { AddressComponent } from './address/address.component';
import { RoutesComponent } from './routes/routes.component';
import { RoleComponent } from './role/role.component';


export default [
    { path: 'address', component: AddressComponent },
    { path: 'department', component: DepartmentComponent },
    { path: 'routes', component: RoutesComponent },
    { path: 'role', component: RoleComponent },
    { path: 'user', component: UserComponent },

] as Routes;
