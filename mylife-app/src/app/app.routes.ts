import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'routines',
    loadComponent: () => import('./routines/routines.component').then(m => m.RoutinesComponent)
  },
  {
    path: 'eq',
    loadComponent: () => import('./eq/eq.component').then(m => m.EqComponent)
  },
  {
    path: 'feel-alive',
    loadComponent: () => import('./feel-alive/feel-alive.component').then(m => m.FeelAliveComponent)
  },
  {
    path: 'tech-reads',
    loadComponent: () => import('./tech-reads/tech-reads.component').then(m => m.TechReadsComponent)
  },
  {
    path: 'habits',
    loadComponent: () => import('./habits/habits.component').then(m => m.HabitsComponent)
  },
  {
    path: 'challenges',
    loadComponent: () => import('./challenges/challenges.component').then(m => m.ChallengesComponent)
  },
  { path: '**', redirectTo: '' }
];
