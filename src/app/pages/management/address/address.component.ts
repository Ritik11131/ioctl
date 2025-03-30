import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Table, TableModule } from 'primeng/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { RatingModule } from 'primeng/rating';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { RadioButtonModule } from 'primeng/radiobutton';
import { InputNumberModule } from 'primeng/inputnumber';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { InputIconModule } from 'primeng/inputicon';
import { IconFieldModule } from 'primeng/iconfield';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Product } from '../../service/product.service';
import { UiService } from '../../../layout/service/ui.service';

interface Column {
  field: string;
  header: string;
  customExportHeader?: string;
}

interface ExportColumn {
  title: string;
  dataKey: string;
}

@Component({
  selector: 'app-address',
  imports: [ CommonModule,
          TableModule,
          FormsModule,
          ButtonModule,
          RippleModule,
          ToastModule,
          ToolbarModule,
          RatingModule,
          InputTextModule,
          TextareaModule,
          SelectModule,
          RadioButtonModule,
          InputNumberModule,
          DialogModule,
          TagModule,
          InputIconModule,
          IconFieldModule,
          ConfirmDialogModule],
  templateUrl: './address.component.html',
  styleUrl: './address.component.scss'
})
export class AddressComponent {

   productDialog: boolean = false;
  
      products = signal<Product[]>([]);
  
      product!: Product;
  
      selectedProducts!: Product[] | null;
  
      submitted: boolean = false;
  
      statuses!: any[];
  
      @ViewChild('dt') dt!: Table;
  
      exportColumns!: ExportColumn[];
  
      cols!: Column[];

      constructor(private uiService: UiService) {

      }


  openNew() {
    this.product = {};
    this.submitted = false;
    this.productDialog = true;
    this.uiService.showToast('error', 'Error', 'Failed to fetch user list');

}

}
