import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _messages = new Subject<string>();
  messages$ = this._messages.asObservable();

  show(message: string): void {
    this._messages.next(message);
  }
}
