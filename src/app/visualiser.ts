export class Visualiser {

  public analyser: AnalyserNode;
  public data: Uint8Array;
  private visualise: boolean;
  public onvisualise: any;
  public frameRate: number = 1;
  private _frame;
  constructor(public audioContext: AudioContext, analyserParams?: any) {
    let params = Object.assign({
        fftSize: 512,
        bufferSize: 512,
        bufferType: Uint8Array,
    }, analyserParams || {});

    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = params.fftSize;
    this.data = new params.bufferType(params.bufferSize);
    this.visualise = true;
    this.onvisualise = null;
  }

  initialise() {

  }
  public start() {
    this.visualise = true;
    this._frame = 0;
    requestAnimationFrame(() => this.analyse());
  }

  public stop() {
    this.visualise = false;
  }

  private analyse() {
    this._frame = (this._frame + 1) % this.frameRate;
    this.analyser.getByteFrequencyData(this.data);
    if (this._frame === 0) this.onvisualise && this.onvisualise(this.data);
    this.visualise && requestAnimationFrame(() => this.analyse())
  }
}
