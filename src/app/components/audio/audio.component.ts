import { Component, OnInit } from '@angular/core';
import { MdDialogRef } from '@angular/material';

import { AudioService, AudioPlayer, AudioRecorder } from '../../providers/audio.service';
import { Visualiser } from '../../visualiser';
@Component({
  selector: 'app-audio',
  templateUrl: './audio.component.html',
  styleUrls: ['./audio.component.scss']
})
export class AudioComponent implements OnInit {

  player: AudioPlayer;
  recorder: AudioRecorder;
  inputVisualiser: Visualiser;
  outputVisualiser: Visualiser;
  inputLevel: any = {};
  inputErrorMessage: string;
  constructor(private audio: AudioService, private dialogRef: MdDialogRef<AudioComponent>) {
    this.inputErrorMessage = '';
    this.audio.initialise();
  }

  initialise () {
    this.recorder = this.audio.recorder;
    this.recorder.initialise().then((arg) => {
      this.recorder.clearNodes();
      this.inputVisualiser = new Visualiser(this.audio.getContext());
      this.inputVisualiser.frameRate = 2;
      this.recorder.addNode(this.inputVisualiser.analyser);
      this.inputVisualiser.onvisualise = (data) => {
        this.inputLevel = {
          width: `${Math.floor(data[0] / 255 * 20) * 5}%`
        }
      }
      this.inputVisualiser.start();
      this.recorder.monitorAudio();
    }).catch((err) => {
      this.inputErrorMessage = err.message || 'Unknown error. Please restart.'
    })
  }

  ngOnInit() {
    this.initialise();
  }

  finished() {
    if (this.inputVisualiser) {
      this.inputVisualiser.stop();
      this.recorder.stop();
    }
    this.dialogRef.close();
  }
}
