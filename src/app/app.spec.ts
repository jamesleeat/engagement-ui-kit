import { TestBed } from '@angular/core/testing';

import { App } from './app';

/** Smoke test for the supplied workbench shell. */
describe('App', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders the workbench', async () => {
    TestBed.configureTestingModule({ imports: [App] });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toContain('Engagement UI kit');
  });
});
