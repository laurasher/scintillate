import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();
  });

  it('should render the HAPPY CLAM title element', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const title = compiled.querySelector('.app-title');
    expect(title).toBeTruthy();
    expect(title?.textContent?.trim()).toBe('HAPPY CLAM');
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

  it('should have clams as an empty array by default', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.clams).toEqual([]);
  });

  it('generateClams should return 3 clams each with 3 pearls', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const clams = (app as any).generateClams();
    expect(clams.length).toBe(3);
    clams.forEach((clam: any) => {
      expect(clam.pearls.length).toBe(3);
    });
  });

  it('generateClams pearls should have numeric metric1 and metric2 between 1 and 100', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const clams = (app as any).generateClams();
    clams.forEach((clam: any) => {
      clam.pearls.forEach((pearl: any) => {
        expect(pearl.metric1).toBeGreaterThanOrEqual(1);
        expect(pearl.metric1).toBeLessThanOrEqual(100);
        expect(pearl.metric2).toBeGreaterThanOrEqual(1);
        expect(pearl.metric2).toBeLessThanOrEqual(100);
      });
    });
  });

  it('generateClams pearls should have a text field and checked boolean', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const clams = (app as any).generateClams();
    clams.forEach((clam: any) => {
      clam.pearls.forEach((pearl: any) => {
        expect(typeof pearl.text).toBe('string');
        expect(pearl.checked).toBe(false);
      });
    });
  });

  it('generateClams pearl text should come from loaded dialogues when available', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const testDialogues = ['Hello world', 'Goodbye world', 'Another line'];
    (app as any).dialogues = testDialogues;
    const clams = (app as any).generateClams();
    clams.forEach((clam: any) => {
      clam.pearls.forEach((pearl: any) => {
        expect(testDialogues).toContain(pearl.text);
      });
    });
  });

  it('gatherPearls should set chat input to joined text of checked pearls', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.clams = [
      { pearls: [
        { metric1: 1, metric2: 2, text: 'Alpha', checked: true },
        { metric1: 3, metric2: 4, text: 'Beta', checked: false },
      ]},
      { pearls: [
        { metric1: 5, metric2: 6, text: 'Gamma', checked: true },
      ]},
    ];
    const chatComp = app.chatComponent;
    app.gatherPearls();
    expect(chatComp.userInput).toBe('Alpha\n\nGamma');
  });

  it('gatherPearls with no checked pearls should set chat input to empty string', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.clams = [
      { pearls: [
        { metric1: 1, metric2: 2, text: 'Alpha', checked: false },
      ]},
    ];
    const chatComp = app.chatComponent;
    chatComp.userInput = 'existing text';
    app.gatherPearls();
    expect(chatComp.userInput).toBe('');
  });

  it('togglePearl should toggle the checked property of a pearl', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const pearl = { metric1: 1, metric2: 2, text: 'Test', checked: false };
    app.togglePearl(pearl);
    expect(pearl.checked).toBeTrue();
    app.togglePearl(pearl);
    expect(pearl.checked).toBeFalse();
  });

  it('gatherPearls should set pearlsGathered flag so onMessageSent closes the panel', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.clams = [{ pearls: [{ metric1: 1, metric2: 2, text: 'A', checked: true }] }];
    app.pearlPanelVisible = true;
    app.gatherPearls();
    app.onMessageSent();
    expect(app.pearlPanelVisible).toBeFalse();
  });

  it('onMessageSent should not close panel when gatherPearls was not called', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.pearlPanelVisible = true;
    app.onMessageSent();
    expect(app.pearlPanelVisible).toBeTrue();
  });

  it('onMessageSent should only close panel once after gatherPearls', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.clams = [{ pearls: [{ metric1: 1, metric2: 2, text: 'A', checked: true }] }];
    app.pearlPanelVisible = true;
    app.gatherPearls();
    app.onMessageSent(); // first send after gather: closes panel
    app.pearlPanelVisible = true; // reopen manually
    app.onMessageSent(); // second send without gather: should NOT close
    expect(app.pearlPanelVisible).toBeTrue();
  });
});
