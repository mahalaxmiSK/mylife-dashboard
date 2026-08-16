import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule]
    }).compileComponents();
    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('should render 6 workspace cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.workspace-card');
    expect(cards.length).toBe(6);
  });

  it('should display greeting', () => {
    const greeting = fixture.nativeElement.querySelector('.greeting');
    expect(greeting.textContent).toContain('✦');
  });

  it('should display today\'s date', () => {
    const date = fixture.nativeElement.querySelector('.date');
    expect(date).toBeTruthy();
  });

  it('uses emoji for every card icon, not abstract glyphs', () => {
    // REQ-HOME-01. Code point range is the wrong test: plenty of real emoji sit
    // low (✨ is U+2728, ⭐ is U+2B50). What separates an emoji from a glyph is
    // presentation — either it renders as emoji by default, or it carries the
    // U+FE0F selector asking for it. The glyphs replaced here (☀ ❋ ✦ ◈ ◉ ⚑)
    // do neither, which is exactly why they rendered as flat line art.
    const rendersAsEmoji = (s: string) => /\p{Emoji_Presentation}/u.test(s) || s.includes('️');

    for (const card of fixture.componentInstance.cards) {
      expect(rendersAsEmoji(card.icon)).toBe(true, `${card.title} still uses a glyph`);
    }
  });

  it('rejects the glyphs it was meant to replace', () => {
    // Guards the check above against being trivially true.
    const rendersAsEmoji = (s: string) => /\p{Emoji_Presentation}/u.test(s) || s.includes('️');

    for (const glyph of ['☀', '❋', '✦', '◈', '◉', '⚑']) {
      expect(rendersAsEmoji(glyph)).toBe(false, `${glyph} should not count as emoji`);
    }
  });

  it('points every card at a route the app actually serves', () => {
    const served = ['/routines', '/eq', '/feel-alive', '/tech-reads', '/habits', '/challenges'];

    expect(fixture.componentInstance.cards.map(c => c.route).sort()).toEqual(served.sort());
  });

  it('does not promise a step the EQ module does not have', () => {
    // REQ-HOME-02. The card read "Name it · Explore · Act"; there is no Act.
    const eq = fixture.componentInstance.cards.find(c => c.route === '/eq')!;

    expect(eq.subtitle).not.toContain('Act');
  });
});
