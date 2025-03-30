import { Injectable, signal, TemplateRef } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  private isDrawerOpenSignal = signal(false)
  private drawerContentSignal = signal<TemplateRef<any> | null>(null)
  private drawerHeaderSignal = signal<string>("Drawer")
  private isLoadingSignal = signal(false);

  isDrawerOpen = this.isDrawerOpenSignal.asReadonly()
  drawerContent = this.drawerContentSignal.asReadonly()
  drawerHeader = this.drawerHeaderSignal.asReadonly()
  isLoading = this.isLoadingSignal.asReadonly()

  constructor(private messageService: MessageService) { }

  toggleLoader(state: boolean) {
    this.isLoadingSignal.set(state);
  }


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
