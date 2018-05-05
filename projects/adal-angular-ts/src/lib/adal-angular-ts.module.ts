import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdalAngularTSService } from "./adal-angular-ts.service";
import { AdalAngularTSConfig } from "./adal-angular-ts.config";
import { AuthenticationContext } from './adal-angular-ts';

@NgModule({
    imports: [CommonModule],
    declarations: [],
    exports: [],
    providers: []
})
export class AdalAngularTSModule {
    static forRoot(config: AdalAngularTSConfig): ModuleWithProviders {
        return {
            ngModule: AdalAngularTSModule,
            providers: [AdalAngularTSService, AdalAngularTSConfig, { provide: 'config', useValue: config }]
        }
    }
}

