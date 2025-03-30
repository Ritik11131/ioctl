import { Component } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-generic-loader',
  imports: [],
  templateUrl: './generic-loader.component.html',
  styleUrl: './generic-loader.component.scss',
  animations: [
    trigger('scaleAnimation', [
      transition(':enter', [
        style({ transform: 'scale(1.5)', opacity: 0 }),
        animate('1s ease-out', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
  ],
})
export class GenericLoaderComponent {

  constructor() { 
  }

}
