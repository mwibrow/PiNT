import { Component, OnInit, HostListener } from '@angular/core';
import { AudioService, AudioPlayer, AudioRecorder } from '../../providers/audio.service';
import { Router } from '@angular/router';
import { MdDialog, MdDialogRef } from '@angular/material';

const fs = require('fs-extra');
const path = require('path');
const sprintf = require ('sprintf-js');
const storage = require('electron-json-storage');
const _ = require('lodash');

import { ErrorComponent } from '../error/error.component';
import { FinishComponent } from '../finish/finish.component';
import { ReadyComponent } from '../ready/ready.component';
import { BreakComponent } from '../break/break.component';
import { SettingsService, Settings } from '../../providers/settings.service';
import { Visualiser } from '../../visualiser';

const filterImg = item => /[.](jpg|jpeg|png)/.test(path.extname(item))

const COLOR_COUNT = 16;
const DIRECTIONS: Array<string> =  ['top', 'bottom', 'left', 'right'];
const STYLE_OUT = 'out';
const STYLE_IN = 'in';

class Tile {
  constructor(
    public color: number,
    public stack: string,
    public direction: string,
    public style: string,
    public imageSrc: string,
    public visualiserStyle: any) {};
}

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss'],
})
export class TaskComponent implements OnInit {

  private settings: Settings;
  private stimuli: Array<any>;
  private trial: number;
  private participantFolder: string;
  private now: Date;

  private recorder: AudioRecorder;

  private keyboardBuffer: Array<string>;
  private enableSpaceKey: boolean;
  private onSpaceKey: any;

  private escapeCombo: string;

  private dialogRefs: any;

  private finish: boolean;
  private abort: boolean;
  private taskRunning: boolean;
  private trialRunning: boolean;

  public tiles: Array<Tile>;
  private incomingTileIndex: number;
  private savedTileColor: number;

  private imageSrc: string;

  private visualiser: Visualiser;
  private style: any = {};
  constructor(
      private router: Router,
      private audio: AudioService,
      public dialog: MdDialog,
      public settingsService: SettingsService) {

    this.audio.initialise();
    this.recorder = audio.recorder;
    this.recorder.initialise();

    this.visualiser = new Visualiser(this.audio.getContext());
    this.recorder.clearNodes();
    this.recorder.addNode(this.visualiser.analyser);
    this.recorder.monitor = false;

    this.keyboardBuffer = [];
    this.enableSpaceKey = false;
    this.onSpaceKey = null;

    this.stimuli = new Array<any>();
    this.settings = settingsService.settings;

    this.trial = 0;
    this.taskRunning = false;
    this.trialRunning = false;
    this.dialogRefs = {};
    this.abort = false;

    this.tiles = new Array<Tile>();
    this.tiles.push(new Tile(0, 'back', 'top', 'out', null, {visibility: 'hidden'}));
    this.tiles.push(new Tile(0, 'front', 'left', 'in', null, {visibility: 'hidden'}));
    this.incomingTileIndex = 0;
    this.savedTileColor = null;

    this.imageSrc = null;

    this.escapeCombo = this.settings.escapeCombo;
  }


  private loadStimuli() {
    return new Promise((resolve, reject) => {
      console.log(`Loading image file paths from ${this.settings.stimuliPath}`);
      this.stimuli = fs.readdirSync(this.settings.stimuliPath)
        .filter(filterImg)
        .map(wav => path.join(this.settings.stimuliPath, wav));
      if (this.stimuli.length === 0) {
        this.openDialog('error', ErrorComponent, {
          data: {
            title: 'Ooops!',
            content: 'There were no image files in the stimuli folder'
          }
        },
        () => {
            this.router.navigateByUrl('');
          });
      }
      console.log(`Loaded ${this.stimuli.length} paths.`);
      if (this.settings.repetitions > 1) {
        this.stimuli = _.flatten(_.times(this.settings.repetitions, () => this.stimuli));
      }
      console.log(`Total stimuli (including repetitions): ${this.stimuli.length}`)
      resolve();
    });
  }

  private runTask() {
    const now = new Date();
    this.participantFolder = sprintf.sprintf('%04d%02d%02d-%02d%02d-%02d',
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds());
    const participantPath = path.normalize(path.join(this.settings.responsesPath, this.participantFolder));
    fs.mkdirpSync(participantPath,
      (err) => {
        console.error(`Could not create folder '${participantPath}'`)
      });
    this.stimuli = _.shuffle(this.stimuli);
    this.finish = false;
    this.abort = false;
    this.taskRunning = true;
    this.runTrial();
  }

  private runTrial() {
    this.startTrial()
      .then(() => this.loadStimulus())
      .then(() => this.recordResponse())
      .then(() => this.saveResponse())
      .then(() => this.endTrial());
  }

  private startTrial() {
    this.trialRunning = true;
    return new Promise((resolve, reject) => {
      this.recorder.record();
      resolve();
    });
  }

  private loadStimulus()  {
    let i: number;
    return new Promise((resolve, reject) => {
      i = this.trial % this.stimuli.length;
      this.updateTiles(this.stimuli[i]);
      setTimeout(() => {
        this.enableSpaceKey = true;
        this.visualiser.onvisualise = (data) => {
          this.tiles[this.incomingTileIndex].visualiserStyle = {
            width: `${(Math.floor((data[0] / 255) * 15) + 1) * 16}px`
          }
        }
        this.visualiser.start()
        resolve();
      }, 2000);
    });
  }

  private recordResponse()  {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.onSpaceKey = null;
        this.enableSpaceKey = false;
        resolve()
      }, this.settings.responseLength * 1000);
      this.onSpaceKey = () => {
        clearTimeout(timeoutId);
        if (this.onSpaceKey) {
          this.enableSpaceKey = false;
          this.onSpaceKey = null;
          setTimeout(() => resolve(), 1000);
        }
      };
    })
  }


  private saveResponse() {
    return new Promise((resolve, reject) => {
      this.visualiser.stop()
      this.visualiser.onvisualise = null;
      this.tiles[this.incomingTileIndex].visualiserStyle = {width: '0px'}
      this.recorder.stop().then(() => {
        const wavPath: string = this.getResponseFile();
        console.log(`Saving wav to ${wavPath}`);
        this.recorder.saveWav(wavPath).then(() => resolve());
      });
    });
  }

  private getResponseFile() {
    let i: number;
    const isWindows: boolean = path.sep === '//';
    const pathApi = isWindows ? path.win32 : path;
    i = this.trial % this.stimuli.length;
    return path.normalize(path.join(
      this.settings.responsesPath, this.participantFolder,
      `${sprintf.sprintf('%03d', this.trial + 1)}-${pathApi.basename(this.stimuli[i], pathApi.extname(this.stimuli[i]))}.wav`
    ));
  }

  private endTrial() {
    this.trial ++;
    if (this.abort) {
      return;
    }
    if (this.trial >= this.stimuli.length) {
      this.updateTiles(null);
      setTimeout(() => this.endTask(), 2000);
    } else {
      if (this.trial % this.settings.blockSize === 0) {
        this.updateTiles(null);
        setTimeout(() => this.break(), 1500);
      } else {
        this.runTrial();
      }
    }
  }

  private updateTiles(imageSrc?: string) {
    let newColor: number;
    const i = this.trial % this.stimuli.length;
    const outgoingTileIndex: number = this.incomingTileIndex;
    this.incomingTileIndex = 1 - this.incomingTileIndex;

    if (imageSrc) {
      newColor = this.savedTileColor ? this.savedTileColor : this.tiles[outgoingTileIndex].color;
      this.tiles[this.incomingTileIndex].color = (newColor % COLOR_COUNT) + 1;
      this.savedTileColor = null;
    } else {
      this.savedTileColor = this.tiles[outgoingTileIndex].color;
      this.tiles[this.incomingTileIndex].color = 0
    }
    if (imageSrc) {
      fs.readFile(imageSrc, (err, buffer) =>  {
        this.tiles[this.incomingTileIndex].imageSrc = buffer.toString('base64')
        this.tiles[this.incomingTileIndex].style = STYLE_IN;
        this.tiles[outgoingTileIndex].style = STYLE_OUT;
        const directions = _.sampleSize(DIRECTIONS, 2);
        this.tiles[this.incomingTileIndex].direction = directions[0];
        this.tiles[outgoingTileIndex].direction = directions[1];
        setTimeout(() => this.tiles[outgoingTileIndex].imageSrc = null, 2000)
      });
    } else {
      this.tiles[this.incomingTileIndex].imageSrc = null;
      this.tiles[this.incomingTileIndex].style = STYLE_IN;
      this.tiles[outgoingTileIndex].style = STYLE_OUT;
      const directions = _.sampleSize(DIRECTIONS, 2);
      this.tiles[this.incomingTileIndex].direction = directions[0];
      this.tiles[outgoingTileIndex].direction = directions[1];
      setTimeout(() => this.tiles[outgoingTileIndex].imageSrc = null, 2000)
    }
  }

  public tileImageSrc(i: number) {
    return `data:image/png;base64,${this.tiles[i].imageSrc}`
  }

  private endTask() {
    this.openDialog('finish', FinishComponent,  {
      disableClose: true
    },
    () => {
      this.router.navigateByUrl('');
    });
  }

  private break() {
    this.openDialog('break', BreakComponent,  {
      disableClose: true,
      data: {
        escapeCombo: this.escapeCombo
      }
    },
    () => {
      this.runTrial();
    });
  }

  @HostListener('document:keydown', ['$event'])
  keydown(event: KeyboardEvent) {
    this.handleKeyboardEvents(event);
  }

  @HostListener('document:keyup', ['$event'])
  keyup(event: KeyboardEvent) {
    this.handleKeyboardEvents(event);
  }

  handleKeyboardEvents(event: KeyboardEvent) {
    const key = event.which || event.keyCode;
    switch (event.type) {
      case 'keydown':
        if (event.keyCode === 32 && this.enableSpaceKey && this.onSpaceKey) {
          this.onSpaceKey();
        }
        this.keyboardBuffer.push(event.key);
        setTimeout(() => this.keyboardBuffer = [], 1000)
        if (this.keyboardBuffer.join('|') === this.escapeCombo) {
            this.abort = true;
            this.closeDialog();
            return this.router.navigateByUrl('');
        }
        break;
      default:
    }
    return false;
  }

  ngOnInit() {
    this.settingsService.loadSettings().then(() => {
      this.settings = this.settingsService.settings;
      this.loadStimuli().then(() => {
        setTimeout(() => {
          this.openDialog('start', ReadyComponent,  {
            disableClose: true,
          },
          () => {
            this.runTask();
          });
        }, 1000);
      })
    });
  }

  openDialog(id: string, target: any, options: any, afterClose: any) {
    if (this.abort || this.finish) {
      return
    }
    if (this.dialogRefs.hasOwnProperty(id)) {
      this.dialogRefs[id].close();
    }
    this.dialogRefs[id] = this.dialog.open(target, options);
    this.dialogRefs[id].afterClosed().subscribe(() => {
      if (this.dialogRefs.hasOwnProperty(id)) {
        delete this.dialogRefs[id];
      }
      if (!this.abort) {
        afterClose();
      }
    });
  }

  closeDialog(dialogId?: string) {
    if (dialogId) {
      if (this.dialogRefs.hasOwnProperty(dialogId)) {
        this.dialogRefs[dialogId].close();
        delete this.dialogRefs[dialogId];
      }
    } else {
      for (const id in this.dialogRefs) {
          if (this.dialogRefs.hasOwnProperty(id)) {
          this.dialogRefs[id].close();
          delete this.dialogRefs[id];
        }
      }
    }
  }

}
