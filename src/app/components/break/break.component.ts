import { Component, OnInit } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import { Router } from '@angular/router';

@Component({
  selector: 'app-break',
  templateUrl: './break.component.html',
  styleUrls: ['./break.component.scss'],
  host: {
    '(document:keydown)': 'handleKeyboardEvents($event)',
    '(document:keyup)': 'handleKeyboardEvents($event)'
  }
})
export class BreakComponent implements OnInit {

  private keyboardBuffer: Array<string>;
  constructor(private dialogRef: MdDialogRef<BreakComponent>, private router: Router) { 
    this.keyboardBuffer = new Array<string>();

  }

  ngOnInit() {
  }

  handleKeyboardEvents(event: KeyboardEvent) {
    let key = event.which || event.keyCode;
    switch (event.type) {
      case 'keydown':
        if (event.keyCode === 32) {
          return this.dialogRef.close();
        }
        this.keyboardBuffer.push(event.key);

        if (this.keyboardBuffer.join('|') === 'Control|Shift|Escape') { 
            this.dialogRef.close();
            this.router.navigateByUrl('');
        }
        break;
      case 'keyup':
          this.keyboardBuffer = [];
      default:
    }
    return false;
  }
}
