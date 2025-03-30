import { Injectable, signal, TemplateRef } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private isDrawerOpenSignal = signal(false)
  private drawerContentSignal = signal<TemplateRef<any> | null>(null)
  private drawerHeaderSignal = signal<string>("Drawer")

  isDrawerOpen = this.isDrawerOpenSignal.asReadonly()
  drawerContent = this.drawerContentSignal.asReadonly()
  drawerHeader = this.drawerHeaderSignal.asReadonly()

  constructor(private messageService: MessageService) { }


  showToast(severity: "success" | "info" | "warn" | "error", summary: string, detail: string) {
    this.messageService.add({ severity, summary, detail })
  }

  openDrawer(content: TemplateRef<any>, header = "Drawer") {
    this.drawerContentSignal.set(content)
    this.drawerHeaderSignal.set(header)
    this.isDrawerOpenSignal.set(true)
  }

  closeDrawer() {
    this.isDrawerOpenSignal.set(false)
    this.drawerContentSignal.set(null)
    this.drawerHeaderSignal.set("Drawer")
  }
}
