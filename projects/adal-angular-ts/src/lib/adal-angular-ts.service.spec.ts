import { TestBed, inject } from '@angular/core/testing';

import { AdalAngularTSService } from './adal-angular-ts.service';

describe('AdalAngularTSService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdalAngularTSService]
    });
  });

  it('should be created', inject([AdalAngularTSService], (service: AdalAngularTSService) => {
    expect(service).toBeTruthy();
  }));
});
