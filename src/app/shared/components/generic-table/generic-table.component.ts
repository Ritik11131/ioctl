import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';

@Component({
    selector: 'app-generic-table',
    imports: [ToolbarModule, ButtonModule, RippleModule, TableModule, IconFieldModule, InputIconModule, InputTextModule],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                @for (toolBarStartAction of toolBarStartActions; track toolBarStartAction.key) {
                    <p-button
                        [severity]="toolBarStartAction.severity"
                        [label]="toolBarStartAction.label"
                        class="mr-2"
                        [icon]="toolBarStartAction.icon"
                        [outlined]="toolBarStartAction.outlined"
                        (onClick)="onToolBarStartAction.emit(toolBarStartAction)"
                    />
                }
            </ng-template>

            <ng-template #end>
                <p-button label="Export" icon="pi pi-upload" severity="secondary" />
            </ng-template>
        </p-toolbar>

        <p-table
            #dt
            [columns]="tableConfig.columns"
            [value]="tableData"
            [dataKey]="tableConfig.dataKey"
            [rowHover]="true"
            [showGridlines]="true"
            responsiveLayout="scroll"
            [tableStyle]="{ 'min-width': '75rem' }"
            [globalFilterFields]="tableConfig.globalFilterFields"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">{{ tableConfig?.title }}</h5>
                    <div class="flex align-items-center gap-2">
                        <p-iconfield>
                            <p-inputicon styleClass="pi pi-search" />
                            <input pInputText type="text" (input)="onSearch(dt, $event)" placeholder="Search..." />
                        </p-iconfield>

                        <button pButton label="Clear" class="p-button-outlined mb-2" icon="pi pi-filter-slash" (click)="clearFilter(dt)"></button>
                    </div>
                </div>
            </ng-template>

            <ng-template #header let-columns>
                <tr>
                    @for (col of columns; track $index) {
                        <th [style.min-width]="col.minWidth || '10rem'">
                            <div class="flex items-center">
                                {{ col.header }}
                                <p-columnFilter type="text" [field]="col.field" display="menu" />
                            </div>
                        </th>
                    }
                </tr>
            </ng-template>
            <ng-template #body let-rowData let-columns="columns">
                <tr>
                    @for (col of columns; track $index) {
                        <td>
                            {{ rowData[col.field] }}
                        </td>
                    }
                </tr>
            </ng-template>
        </p-table>
    `
})
export class GenericTableComponent {
    @Input() toolBarStartActions: any[] = [];
    @Input() tableConfig!: any;
    @Input() tableData!: any[];

    @Output() onToolBarStartAction = new EventEmitter<any>();

    onSearch(dt: Table, event: Event) {
        const input = event.target as HTMLInputElement;
        if (input) {
            dt.filterGlobal(input.value, 'contains');
        }
    }

    clearFilter(table: Table) {
        table.clear();
        // this.filter.nativeElement.value = '';
    }
}
