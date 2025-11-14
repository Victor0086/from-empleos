import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthEventsService {
  private loginSubject = new Subject<void>();
  private registerSubject = new Subject<void>();

  login$ = this.loginSubject.asObservable();
  register$ = this.registerSubject.asObservable();

  triggerLogin() {
    this.loginSubject.next();
  }

  triggerRegister() {
    this.registerSubject.next();
  }
}
