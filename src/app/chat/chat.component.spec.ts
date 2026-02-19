import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ChatComponent } from './chat.component';

const mockScript = {
  title: 'Test Script',
  lines: [
    { actor: 'System', dialogue: 'Hello there!' },
    { actor: 'System', dialogue: 'How can I help?' },
    { actor: 'System', dialogue: 'Goodbye!' }
  ]
};

describe('ChatComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ChatComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne('assets/script.json');
    req.flush(mockScript);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load script and show initial system message', () => {
    const fixture = TestBed.createComponent(ChatComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne('assets/script.json');
    req.flush(mockScript);

    expect(fixture.componentInstance.messages.length).toBe(1);
    expect(fixture.componentInstance.messages[0].type).toBe('system');
    expect(fixture.componentInstance.messages[0].text).toBe('Hello there!');
  });

  it('should add user message and system response when sendMessage is called', fakeAsync(() => {
    const fixture = TestBed.createComponent(ChatComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne('assets/script.json');
    req.flush(mockScript);

    fixture.componentInstance.userInput = 'Hello';
    fixture.componentInstance.sendMessage();

    expect(fixture.componentInstance.messages[1].type).toBe('user');
    expect(fixture.componentInstance.messages[1].text).toBe('Hello');
    expect(fixture.componentInstance.userInput).toBe('');

    tick(400);
    expect(fixture.componentInstance.messages[2].type).toBe('system');
    expect(fixture.componentInstance.messages[2].text).toBe('How can I help?');
  }));

  it('should not send empty message', () => {
    const fixture = TestBed.createComponent(ChatComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne('assets/script.json');
    req.flush(mockScript);

    const initialLength = fixture.componentInstance.messages.length;
    fixture.componentInstance.userInput = '   ';
    fixture.componentInstance.sendMessage();
    expect(fixture.componentInstance.messages.length).toBe(initialLength);
  });

  it('should cycle through dialogues', fakeAsync(() => {
    const fixture = TestBed.createComponent(ChatComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne('assets/script.json');
    req.flush(mockScript);

    fixture.componentInstance.userInput = 'msg1';
    fixture.componentInstance.sendMessage();
    tick(400);

    fixture.componentInstance.userInput = 'msg2';
    fixture.componentInstance.sendMessage();
    tick(400);

    const systemMessages = fixture.componentInstance.messages.filter(m => m.type === 'system');
    expect(systemMessages[0].text).toBe('Hello there!');
    expect(systemMessages[1].text).toBe('How can I help?');
    expect(systemMessages[2].text).toBe('Goodbye!');
  }));

  it('should show error message when script fails to load', () => {
    const fixture = TestBed.createComponent(ChatComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne('assets/script.json');
    req.error(new ProgressEvent('error'));

    expect(fixture.componentInstance.messages.length).toBe(1);
    expect(fixture.componentInstance.messages[0].type).toBe('system');
    expect(fixture.componentInstance.messages[0].text).toContain('Failed to load');
  });

  it('should send message on Enter key', () => {
    const fixture = TestBed.createComponent(ChatComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne('assets/script.json');
    req.flush(mockScript);

    fixture.componentInstance.userInput = 'Test message';
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false });
    spyOn(event, 'preventDefault');
    fixture.componentInstance.onKeydown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    const userMessages = fixture.componentInstance.messages.filter(m => m.type === 'user');
    expect(userMessages.length).toBe(1);
    expect(userMessages[0].text).toBe('Test message');
  });

  it('should not send message on Shift+Enter', () => {
    const fixture = TestBed.createComponent(ChatComponent);
    fixture.detectChanges();
    const req = httpMock.expectOne('assets/script.json');
    req.flush(mockScript);

    fixture.componentInstance.userInput = 'Test message';
    const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
    fixture.componentInstance.onKeydown(event);

    const userMessages = fixture.componentInstance.messages.filter(m => m.type === 'user');
    expect(userMessages.length).toBe(0);
  });
});
