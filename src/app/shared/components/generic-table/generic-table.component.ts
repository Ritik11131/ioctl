import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { GenericDropdownComponent } from '../generic-dropdown/generic-dropdown.component';

@Component({
    selector: 'app-generic-table',
    imports: [ToolbarModule, ButtonModule, RippleModule, TableModule, IconFieldModule, InputIconModule, SplitButtonModule, InputTextModule, GenericDropdownComponent],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                @for (toolBarStartAction of toolBarStartActions; track toolBarStartAction.key) {
                    <p-button
                        [severity]="toolBarStartAction.severity"
                        [label]="toolBarStartAction.label"
                        class="mr-2"
                        [disabled]="toolBarStartAction.key === 'edit' || toolBarStartAction.key === 'delete' ? !(selectedItems.length === 1) : false"
                        [icon]="toolBarStartAction.icon"
                        [outlined]="toolBarStartAction.outlined"
                        (onClick)="onToolBarStartAction.emit(toolBarStartAction)"
                    />
                }

                @for (toolBarSplitAction of toolBarSplitActions; track toolBarSplitAction.key) {
                    <p-splitbutton outlined [label]="toolBarSplitAction?.label" [model]="toolBarSplitAction.items" [disabled]="selectedItems.length !== 1" />
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
            [stripedRows]="true"
            [paginator]="true"
            [rows]="10"
            [(selection)]="selectedItems"
            (selectionChange)="handleSelectionChange($event)"
            [rowsPerPageOptions]="[10, 20, 50]"
            [showCurrentPageReport]="true"
            [showGridlines]="true"
            responsiveLayout="scroll"
            [tableStyle]="{ 'min-width': '75rem' }"
            [globalFilterFields]="tableConfig.globalFilterFields"
        >
            <ng-template #caption>
                <div class="flex items-center justify-between">
                    <h5 class="m-0">{{ tableConfig?.title }}</h5>
                    <div class="flex align-items-center gap-2">
                        <p-iconfield iconPosition="left" class="ml-auto">
                            <p-inputicon styleClass="pi pi-search" />
                            <input pInputText type="text" (input)="onSearch(dt, $event)" placeholder="Search..." />
                        </p-iconfield>

                        <p-button label="Clear" outlined icon="pi pi-filter-slash" (click)="clearFilter(dt)"></p-button>
                    </div>
                </div>
                @if(tableConfig?.filterTableDrpdown) {
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mt-3 mb-3">
                        <app-generic-dropdown
                                                [id]="tableConfig.filterTableDrpdown.fieldId"
                                                [type]="tableConfig.filterTableDrpdown.apiType"
                                                [placeholder]="tableConfig.filterTableDrpdown.placeholder || 'Select'"
                                                [autoFetch]="tableConfig.filterTableDrpdown.autoFetch"
                                                (selected)="handleTableDropdownFilter($event)"
                                            />
                        </div>
                }
            </ng-template>

            <ng-template #header let-columns>
                <tr>
                    <th style="width: 4rem"><p-tableHeaderCheckbox /></th>
                    @for (col of columns; track $index) {
                        <th [style.min-width]="col.minWidth || '10rem'">
                            <div class="flex items-center">
                                {{ col.header }}
                                <p-columnFilter type="text" [field]="col.subfield ? col.field + '.' + col.subfield : col.field" display="menu" />
                            </div>
                        </th>
                    }
                </tr>
            </ng-template>
            <ng-template #body let-rowData let-columns="columns">
                <tr>
                    <td>
                        <p-tableCheckbox [value]="rowData" />
                    </td>
                    @for (col of columns; track $index) {
                        <td>
                            {{ col.subfield ? rowData[col.field]?.[col.subfield] || '--' : rowData[col.field] || '--' }}
                        </td>
                    }
                </tr>
            </ng-template>
        </p-table>
    `,
    styles: [
        `
            ::ng-deep .p-datatable .p-datatable-thead > tr > th {
                background-color: var(--p-primary-color);
                color: var(--p-primary-contrast-color);
                font-weight: 600;

                button {
                    color: var(--p-primary-contrast-color);
                }
            }
        `
    ]
})
export class GenericTableComponent {
    @Input() selectedItems: any[] = [];
    @Input() toolBarStartActions: any[] = [];
    @Input() toolBarSplitActions: any[] = [];
    @Input() tableConfig!: any;
    @Input() tableData!: any[];

    @Output() onToolBarStartAction = new EventEmitter<any>();
    @Output() onSelectionChange = new EventEmitter<any>(); // Event emitter for row select
    @Output() onTableDropdownFilter = new EventEmitter<any>();

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

    handleSelectionChange(event: any) {
        this.onSelectionChange.emit(event);
    }

    handleTableDropdownFilter(event: any) {
        this.onTableDropdownFilter.emit(event);
    }
}
