import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  template: `<h1>Hello {{nameTypo}}</h1>`,
})
export class AppComponent  { name = 'Angular'; }
