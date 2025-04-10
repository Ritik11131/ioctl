import { CommonModule } from '@angular/common';
import { Component, Input, TemplateRef } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { UiService } from '../../../layout/service/ui.service';

@Component({
  selector: 'app-generic-drawer',
  imports: [CommonModule, DrawerModule, ButtonModule],
  template: ` <p-drawer [header]="header" [(visible)]="isOpen" [dismissible]="false" position="right" (onHide)="close()" [styleClass]="styleClass">
        <ng-template #closeicon>
            <p-button size="small" icon="pi pi pi-times" [severity]="'danger'" [rounded]="true" text />
        </ng-template>
        <ng-container *ngIf="contentTemplate; else defaultContent">
            <ng-container *ngTemplateOutlet="contentTemplate"></ng-container>
        </ng-container>
        <ng-template #defaultContent>
            <h2 class="text-xl font-semibold mb-4">Drawer Content</h2>
            <p>This is the default content of the drawer.</p>
        </ng-template>
    </p-drawer>`
})


export class GenericDrawerComponent {
  @Input() isOpen = false;
  @Input() styleClass = '!w-full md:!w-96 lg:!w-[40rem] rounded-l-2xl'
  @Input() header = 'Default Header';
  @Input() contentTemplate: TemplateRef<any> | null = null;

  constructor(private uiService: UiService) { }

  close() {
    this.uiService.closeDrawer();
  }
}
