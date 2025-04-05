import { Component, EventEmitter, Input, Output } from '@angular/core';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { HttpService } from '../../../pages/service/http.service';

@Component({
  selector: 'app-generic-autocomplete',
  imports: [],
  templateUrl: './generic-autocomplete.component.html',
  styleUrl: './generic-autocomplete.component.scss'
})
export class GenericAutocompleteComponent {
  @Input() placeholder = 'Select';
  @Input() type!: 'country' | 'state'; // extendable
  @Output() selected = new EventEmitter<any>();

  suggestions: any[] = [];
  selectedItem: any;
  private search$ = new Subject<string>();

  constructor(private http: HttpService) {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => this.fetchData(query))
      )
      .subscribe((res: any[]) => {
        this.suggestions = res;
      });
  }

  onInput(event: any) {
    const query = event.query;
    this.search$.next(query);
  }

  async fetchData(query: string): Promise<any[]> {
    const apiUrl = this.type === 'country' ? 'geortd/country/list' : 'https://api.example.com/states?country='; // replace with actual API
    const response: any = await this.http.get(apiUrl);
    return response?.data || []
  }



  onSelect(item: any) {
    this.selected.emit(item);
  }

  
}
