import { AuthenticationContext } from "./service/adal";
import { AdalConfig } from './service/adal.config';
import { AdalProvider } from './service/adal.provider';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
    imports: [CommonModule],
    declarations: [],
    exports: [],
    providers: [AuthenticationContext]
})
export class AdalModule {
    static forRoot(config: AdalConfig): ModuleWithProviders {
        return {
            ngModule: AdalModule,
            providers: [AdalProvider, AdalConfig, { provide: 'config', useValue: config }]
        }
    }
}
