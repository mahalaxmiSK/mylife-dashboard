import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';

export const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'routines',
    canActivate: [AuthGuard],
    loadComponent: () => import('./routines/routines.component').then(m => m.RoutinesComponent)
  },
  {
    path: 'eq',
    canActivate: [AuthGuard],
    loadComponent: () => import('./eq/eq.component').then(m => m.EqComponent)
  },
  {
    path: 'feel-alive',
    canActivate: [AuthGuard],
    loadComponent: () => import('./feel-alive/feel-alive.component').then(m => m.FeelAliveComponent)
  },
  {
    path: 'tech-reads',
    canActivate: [AuthGuard],
    loadComponent: () => import('./tech-reads/tech-reads.component').then(m => m.TechReadsComponent)
  },
  {
    path: 'habits',
    canActivate: [AuthGuard],
    loadComponent: () => import('./habits/habits.component').then(m => m.HabitsComponent)
  },
  {
    path: 'challenges',
    canActivate: [AuthGuard],
    loadComponent: () => import('./challenges/challenges.component').then(m => m.ChallengesComponent)
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  },
  { path: '**', redirectTo: '' }
];
