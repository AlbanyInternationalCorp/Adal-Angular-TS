import { AdalConfig } from './service/adal.config';
import { AdalProvider } from './service/adal.provider';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthenticationContext } from "./service/adal";
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
            providers: [AdalProvider, { provide: 'config', useValue: config }]
        }
    }
}
