import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface WorkspaceCard {
  icon: string;
  title: string;
  subtitle: string;
  route: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  today = new Date();

  cards: WorkspaceCard[] = [
    { icon: '🌤', title: 'Day Routines',  subtitle: 'Lazy · Reset · Creative · Focused', route: '/routines' },
    { icon: '💛', title: 'EQ Check-in',   subtitle: 'Name · Explore · Heal',             route: '/eq' },
    { icon: '✨', title: 'Feel Alive',     subtitle: 'Spin the wheel · Random pick',      route: '/feel-alive' },
    { icon: '📚', title: 'Tech Reads',     subtitle: 'Topics · Progress · Random',        route: '/tech-reads' },
    { icon: '🌱', title: 'Habit Tracker',  subtitle: 'Daily habits · Streaks',            route: '/habits' },
    { icon: '🏆', title: 'Challenges',     subtitle: 'Rules · Track · Conquer',           route: '/challenges' },
  ];
}
