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
});
