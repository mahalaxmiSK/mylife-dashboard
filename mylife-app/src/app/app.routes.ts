import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'routines',
    canActivate: [authGuard],
    loadComponent: () => import('./routines/routines.component').then(m => m.RoutinesComponent)
  },
  {
    path: 'eq',
    canActivate: [authGuard],
    loadComponent: () => import('./eq/eq.component').then(m => m.EqComponent)
  },
  {
    path: 'feel-alive',
    canActivate: [authGuard],
    loadComponent: () => import('./feel-alive/feel-alive.component').then(m => m.FeelAliveComponent)
  },
  {
    path: 'tech-reads',
    canActivate: [authGuard],
    loadComponent: () => import('./tech-reads/tech-reads.component').then(m => m.TechReadsComponent)
  },
  {
    path: 'habits',
    canActivate: [authGuard],
    loadComponent: () => import('./habits/habits.component').then(m => m.HabitsComponent)
  },
  {
    path: 'challenges',
    canActivate: [authGuard],
    loadComponent: () => import('./challenges/challenges.component').then(m => m.ChallengesComponent)
  },
  { path: '**', redirectTo: '' }
];
