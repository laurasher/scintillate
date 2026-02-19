import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface ChatMessage {
  type: 'user' | 'system';
  text: string;
}

interface ScriptLine {
  actor: string;
  dialogue: string;
}

interface Script {
  title: string;
  lines: ScriptLine[];
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.less'
})
export class ChatComponent implements OnInit, AfterViewChecked {
  messages: ChatMessage[] = [];
  userInput = '';
  private dialogues: string[] = [];
  private dialogueIndex = 0;
  private shouldScrollToBottom = false;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef<HTMLElement>;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.http.get<Script>('assets/script.json').subscribe({
        next: script => {
          this.dialogues = script.lines.map(line => line.dialogue);
          this.addSystemMessage(this.dialogues[this.dialogueIndex % this.dialogues.length]);
          this.dialogueIndex++;
        },
        error: () => {
          this.addSystemMessage('Failed to load script. Please refresh the page.');
        }
      });
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text) return;

    this.messages.push({ type: 'user', text });
    this.userInput = '';
    this.shouldScrollToBottom = true;

    if (this.dialogues.length > 0) {
      const response = this.dialogues[this.dialogueIndex % this.dialogues.length];
      this.dialogueIndex++;
      setTimeout(() => {
        this.addSystemMessage(response);
      }, 400);
    }
  }

  onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private addSystemMessage(text: string) {
    this.messages.push({ type: 'system', text });
    this.shouldScrollToBottom = true;
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.nativeElement.scrollTop =
        this.messagesContainer.nativeElement.scrollHeight;
    }
  }
}
