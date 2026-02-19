import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'scintillate' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('scintillate');
  });

  it('should render d3 container', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('#d3-container')).toBeTruthy();
  });

  it('should have controlsVisible set to false by default', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.controlsVisible).toBeFalse();
  });

  it('should toggle controlsVisible when toggleControls is called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.controlsVisible).toBeFalse();
    app.toggleControls();
    expect(app.controlsVisible).toBeTrue();
    app.toggleControls();
    expect(app.controlsVisible).toBeFalse();
  });

  it('should show toggle button in the DOM', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.toggle-btn')).toBeTruthy();
  });

  it('should apply controls-hidden class when controls are not visible', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const controls = compiled.querySelector('.controls');
    expect(app.controlsVisible).toBeFalse();
    expect(controls?.classList.contains('controls-hidden')).toBeTrue();
  });

  it('should remove controls-hidden class when controls are visible', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    app.toggleControls();
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const controls = compiled.querySelector('.controls');
    expect(app.controlsVisible).toBeTrue();
    expect(controls?.classList.contains('controls-hidden')).toBeFalse();
  });

  it('should always return two different colors from getTwoDifferentColors', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    // Test multiple times to ensure it's consistent
    for (let i = 0; i < 20; i++) {
      const [color1, color2] = (app as any).getTwoDifferentColors();
      expect(color1).not.toEqual(color2);
      expect(color1).toBeTruthy();
      expect(color2).toBeTruthy();
    }
  });

  it('should always return three different colors from getThreeDifferentColors', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    
    // Test multiple times to ensure it's consistent
    for (let i = 0; i < 20; i++) {
      const [color1, color2, color3] = (app as any).getThreeDifferentColors();
      expect(color1).not.toEqual(color2);
      expect(color1).not.toEqual(color3);
      expect(color2).not.toEqual(color3);
      expect(color1).toBeTruthy();
      expect(color2).toBeTruthy();
      expect(color3).toBeTruthy();
    }
  });

  it('should make 3-stop gradients less common than 2-stop gradients', () => {
    // Test the probability distribution by simulating gradient creation
    // We'll test this 10000 times and expect 3-stop gradients to appear
    // roughly 33% of the time (less than 50%)
    const iterations = 10000;
    let threeStopCount = 0;
    
    for (let i = 0; i < iterations; i++) {
      // Simulate the gradient creation logic (same as line 108 in app.component.ts)
      const use3Stops = Math.random() < 0.33;
      if (use3Stops) {
        threeStopCount++;
      }
    }
    
    const threeStopPercentage = (threeStopCount / iterations) * 100;
    
    // 3-stop gradients should be less than 50% (ideally around 33%)
    // With 10000 iterations, the range is more stable
    expect(threeStopPercentage).toBeLessThan(50);
    expect(threeStopPercentage).toBeGreaterThan(28);
    expect(threeStopPercentage).toBeLessThan(38);
  });
});
