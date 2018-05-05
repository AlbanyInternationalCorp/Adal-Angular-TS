import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AdalAngularTSModule, TokenInterceptor } from 'Adal-Angular-TS';

import { AppComponent } from './app.component';

const adalConfig = {
  clientId: '11111111-1111-1111-1111-11111111111',
  tenant: 'companyName.onmicrosoft.com',
  redirectUri: null,
  postLogoutRedirectUrl: window.location.origin,
  instance: 'https://login.microsoftonline.com/',
};


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AdalAngularTSModule.forRoot(adalConfig)
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
