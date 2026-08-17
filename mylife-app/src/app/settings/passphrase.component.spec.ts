import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PassphraseComponent } from './passphrase.component';

describe('PassphraseComponent', () => {
  let component: PassphraseComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassphraseComponent],
      providers: [provideRouter([])]
    }).compileComponents();
    component = TestBed.createComponent(PassphraseComponent).componentInstance;
  });

  it('refuses a six-digit code', () => {
    // The whole point of the change. The sign-in endpoint allows about 1,800
    // guesses an hour per address, cannot be lowered, and has no lockout, so a
    // million-possibility secret is not defensible however memorable it is.
    component.passphrase = '986532';
    component.confirmation = '986532';

    expect(component.canSubmit).toBe(false);
    expect(component.tooShort).toBe(true);
  });

  it('accepts four ordinary words', () => {
    component.passphrase = 'copper lantern drift almond';
    component.confirmation = 'copper lantern drift almond';

    expect(component.canSubmit).toBe(true);
    expect(component.tooShort).toBe(false);
  });

  it('will not save until both boxes agree', () => {
    component.passphrase = 'copper lantern drift almond';
    component.confirmation = 'copper lantern drift almonds';

    expect(component.mismatch).toBe(true);
    expect(component.canSubmit).toBe(false);
  });

  it('says nothing about length before anything is typed', () => {
    expect(component.tooShort).toBe(false);
    expect(component.mismatch).toBe(false);
    expect(component.canSubmit).toBe(false);
  });

  it('counts a passphrase exactly at the minimum as long enough', () => {
    const exact = 'a'.repeat(component.minimum);
    component.passphrase = exact;
    component.confirmation = exact;

    expect(component.canSubmit).toBe(true);
  });

  it('keeps spaces, so a phrase is not silently trimmed into something shorter', () => {
    const spaced = 'four words with spaces';
    component.passphrase = spaced;
    component.confirmation = spaced;

    expect(component.passphrase.length).toBe(spaced.length);
    expect(component.canSubmit).toBe(true);
  });
});
