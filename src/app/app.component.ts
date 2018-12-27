import { Component } from '@angular/core';
import { AdalAngularTSService } from 'Adal-Angular-TS';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  constructor(
    private adalService: AdalAngularTSService,
  ) {
    this.adalService.login();
  }
}
