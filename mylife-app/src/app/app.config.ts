import { ApplicationConfig } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Hash routing keeps deep links working on GitHub Pages, which has no
    // server-side rewrite to index.html.
    provideRouter(routes, withHashLocation())
  ]
};
