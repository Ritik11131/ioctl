import { Component, EventEmitter, Input, Output, ViewChildren, QueryList } from '@angular/core';
import { Popover } from 'primeng/popover';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { RippleModule } from 'primeng/ripple';
import { Table, TableModule } from 'primeng/table';
import { ToolbarModule } from 'primeng/toolbar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SplitButtonModule } from 'primeng/splitbutton';
import { PopoverModule } from 'primeng/popover';
import { GenericDropdownComponent } from '../generic-dropdown/generic-dropdown.component';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExportService } from '../../../pages/service/export.service';
import { ParseJsonPipe } from '../../../core/pipes/parse-json.pipe';
import { FormatTimestampPipe } from '../../../core/pipes/format-timestamp.pipe';

@Component({
    selector: 'app-generic-table',
    imports: [ToolbarModule, ButtonModule, RippleModule, FormsModule, TableModule, IconFieldModule, SelectButtonModule, InputIconModule, SplitButtonModule, InputTextModule, GenericDropdownComponent, DatePipe, PopoverModule, ParseJsonPipe, FormatTimestampPipe],
    template: `
        <p-toolbar styleClass="mb-6">
            <ng-template #start>
                @for (toolBarStartAction of toolBarStartActions; track toolBarStartAction.key) {
                    <p-button
                        [severity]="toolBarStartAction.severity"
                        [label]="toolBarStartAction.label"
                        class="mr-2"
                        [disabled]="toolBarStartAction?.dependentOnRow ? !(selectedItems.length === 1) : false"
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
                <p-button label="Export" icon="pi pi-upload" severity="secondary" (onClick)="handleDataExport()" />
            </ng-template>
        </p-toolbar>

        @if (tableFilterByStatusConfig.length) {
            <p-selectbutton class="mb-6" [options]="tableFilterByStatusConfig" [(ngModel)]="selectedRouteStatusType" (onChange)="handleTableFilterByStatusChange($event)" [allowEmpty]="false" />
        }

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
                @if (tableConfig?.filterTableDrpdown) {
                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mt-3 mb-3">
                        <app-generic-dropdown
                            [id]="tableConfig.filterTableDrpdown.fieldId"
                            [type]="tableConfig.filterTableDrpdown.apiType"
                            [placeholder]="tableConfig.filterTableDrpdown.placeholder || 'Select'"
                            [autoFetch]="tableConfig.filterTableDrpdown.autoFetch"
                            [selectedValue]="selectedDropdownValue"
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
                            @if (col.download) {
                                @if (rowData[col.field]) {
                                 <p-button text (onClick)="downloadFile(rowData[col.field])">
                                    <i class="pi pi-download" style="font-size: 1rem"></i>
                                    </p-button>

                                } @else {
                                    <span>{{ '-' }}</span>
                                }
                            } @else if (col.view) {
                                @if (rowData[col.field]) {
                                    <a [href]="rowData[col.field]" target="_blank" class="p-button p-button-text p-button-sm">
                                        <i class="pi pi-eye" style="font-size: 1rem"></i>
                                    </a>
                                } @else {
                                    <span>{{ '-' }}</span>
                                }
                            } @else if (col.customCol) {
                                <div>
                                    <div class="font-semibold">{{ col.customCol.subfield ? (rowData[col.customCol.field]?.[col.customCol.subfield] || '--') : rowData[col.customCol.field]}}</div>
                                    <div class="text-sm text-gray-500"><span>{{col?.customCol?.title}}</span><span>{{ col.customCol.subtext ? (rowData[col.customCol.text]?.[col.customCol.subtext] || '--') : (rowData[col.customCol.text]) }}</span></div>
                                </div>
                            } @else if (col.jsonString) {
                                @if (col.subfield ? rowData[col.field]?.[col.subfield] : rowData[col.field]) {
                                    @let commentData = col.subfield ? rowData[col.field]?.[col.subfield] : rowData[col.field];
                                    @let comments = commentData | parseJson;
                                    @let buttonId = 'commentBtn_' + rowData[tableConfig.dataKey] + '_' + col.field;
                                    <div>
                                        <p-button 
                                            #commentButton
                                            [id]="buttonId"
                                            [label]="'View Comments (' + comments.length + ')'" 
                                             
                                            severity="primary"
                                            size="small"
                                            (onClick)="toggleCommentPopover(commentButton, $event)">
                                        </p-button>
                                        <p-popover 
                                            #commentPopover
                                            [style]="{ width: '400px', maxWidth: '400px' }">
                                            <div class="p-2">
                                                <h6 class="mb-3 font-semibold">Comment History</h6>
                                                <div class="max-h-[300px] overflow-y-auto">
                                                    @for (comment of (commentData | parseJson); track $index) {
                                                        <div class="p-3 mb-3 last:mb-0 border-l-[3px] border-l-[var(--p-primary-color)] bg-gray-100 rounded">
                                                            <div class="flex justify-between items-center mb-2">
                                                                <span class="font-semibold text-sm text-gray-700">{{ comment.userName || '--' }}</span>
                                                                <span class="text-xs text-gray-500">{{ comment.timestamp | formatTimestamp }}</span>
                                                            </div>
                                                            <div class="text-sm text-gray-900 mb-1 break-words">{{ comment.comment || '--' }}</div>
                                                            @if (comment.refId) {
                                                                <div class="text-xs text-gray-500 italic">Ref: {{ comment.refId }}</div>
                                                            }
                                                        </div>
                                                    } @empty {
                                                        <div class="text-gray-400 text-center py-2">No comments</div>
                                                    }
                                                </div>
                                            </div>
                                        </p-popover>
                                    </div>
                                } @else {
                                    <span>{{ '-' }}</span>
                                }
                            } @else {
                                {{ col.subfield ? rowData[col.field]?.[col.subfield] || '--' : col.date ? (rowData[col.field] | date) || '--' : rowData[col.field] || '--' }}
                            }
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
    @Input() tableFilterByStatusConfig: any[] = []; // Filter by status config for the table
    @Input() tableConfig!: any;
    @Input() tableData!: any[];
    @Input() selectedDropdownValue!: any;

    @Output() onToolBarStartAction = new EventEmitter<any>();
    @Output() onSelectionChange = new EventEmitter<any>(); // Event emitter for row select
    @Output() onTableDropdownFilter = new EventEmitter<any>();
    @Output() onTableFilterByStatus = new EventEmitter<any>(); // Event emitter for filter by status

    @ViewChildren('commentPopover') commentPopovers!: QueryList<Popover>;

    selectedRouteStatusType: any = 'all';

    constructor(private exportService: ExportService) {}

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

    handleDataExport() {
        this.exportService.exportToSpreadsheet(this.tableData, this.tableConfig.exportFilename, this.tableConfig.columns, 'xlsx');
    }

    handleSelectionChange(event: any) {
        this.onSelectionChange.emit(event);
    }

    handleTableDropdownFilter(event: any) {
        this.onTableDropdownFilter.emit(event);
    }

    handleTableFilterByStatusChange(event: any) {
        this.onTableFilterByStatus.emit(event.value);
    }
    async downloadFile(url: string) {
    try {
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;

        // Extract filename or use default
        const fileName = url.split('/').pop() || 'download';
        a.download = fileName;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error('Download failed:', error);
    }
}

    toggleCommentPopover(button: any, event: Event) {
        const popovers = this.commentPopovers.toArray();
        const buttonElement = button.el?.nativeElement || button;
        const parent = buttonElement.parentElement;
        if (parent) {
            const popoverElement = Array.from(parent.children).find(
                (child: any) => child.tagName === 'P-POPOVER'
            ) as HTMLElement;
            if (popoverElement) {
                const popover = popovers.find(p => p.el.nativeElement === popoverElement);
                if (popover) {
                    popover.toggle(event);
                }
            }
        }
    }

}
