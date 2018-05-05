import { Component } from '@angular/core';
import { AdalAngularTSConfig, AdalAngularTSService } from 'Adal-Angular-TS';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'app';

  constructor(
    private adalService: AdalAngularTSService,
  ){
    this.adalService.login();
  }
}
