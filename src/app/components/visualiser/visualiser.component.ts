import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-visualiser',
  templateUrl: './visualiser.component.html',
  styleUrls: ['./visualiser.component.css']
})
export class VisualiserComponent implements OnInit {

  public analyser: AnalyserNode;
  public data: Uint8Array;
  private visualise: boolean;
  public onvisualise: any;
  constructor() { }

  ngOnInit() {


  }

  initialise(audioContext: AudioContext) {
      this.analyser = audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.data = new Uint8Array(512);
      this.visualise = true;
      this.onvisualise = null;
    }


  public start() {
    this.visualise = true;
    requestAnimationFrame(() => this.analyse());
  }

  public stop() {
    this.visualise = false;
  }

  private analyse() {
    this.analyser.getByteFrequencyData(this.data);
    this.onvisualise && this.onvisualise(this.data);
    requestAnimationFrame(() => this.analyse())
  }

}
