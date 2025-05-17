export const MENU_ITEMS = [
    {
        routerLink: ['/pages'],
        items: [
            {
                label: 'Approval',
                icon: 'pi pi-fw pi-sitemap',
                routerLink: ['/pages/rtd-approval']
            },
            {
                label: 'Management',
                icon: 'pi pi-fw pi-warehouse',
                items: [
                    {
                        label: 'User',
                        icon: 'pi pi-fw pi-users',
                        routerLink: ['/pages/management/user']
                    },
                    {
                        label: 'Department',
                        icon: 'pi pi-fw pi-building',
                        routerLink: ['/pages/management/department']
                    },
                    {
                        label: 'Address',
                        icon: 'pi pi-fw pi-address-book',
                        routerLink: ['/pages/management/address']
                    },
                    {
                        label: 'RTD',
                        icon: 'pi pi-fw pi-map',
                        routerLink: ['/pages/management/routes']
                    },
                    {
                        label: 'Role',
                        icon: 'pi pi-fw pi-user',
                        routerLink: ['/pages/management/role']
                    },
                    {
                        label: 'Tolls',
                        icon: 'pi pi-fw pi-map-marker',
                        routerLink: ['/pages/management/tolls']
                    },
                ]
            },
        ]
    },
];