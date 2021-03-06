import { Component, OnInit } from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';
import { Router } from '@angular/router'
import { ErrorComponent } from '../error/error.component';

import { SettingsService, Settings, notSet } from '../../providers/settings.service';

const electronDialog = require('electron').remote.dialog;
const fs = require('fs-extra');
const path = require('path');

const filterImg = item => /[.](svg|jpg|jpeg|png)/.test(path.extname(item))

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  public settings: Settings;
  public stimuliPathValidationMessage = '';
  public responsesPathValidationMessage = '';

  constructor(
      private router: Router,
      private dialog: MdDialog,
      private dialogRef: MdDialogRef<SettingsComponent>,
      private settingsService: SettingsService) {

      this.settings = settingsService.settings;
  }

  ngOnInit() {
  }

  changeStimuliPath() {
    const pth: any = electronDialog.showOpenDialog({
      properties: ['openDirectory'],
      defaultPath: this.settings.stimuliPath
    });
    if (pth && pth.length === 1) {
      this.settings.stimuliPath = pth[0];
      this.validateStimuliPath();
    }
  }

  changeResponsesPath() {
    const pth: any = electronDialog.showOpenDialog({
      properties: ['openDirectory'],
      defaultPath: this.settings.responsesPath
    });
    if (pth && pth.length === 1) {
      this.settings.responsesPath = pth[0];
      this.validateResponsesPath();
    }
  }

  cancelSettings() {
    this.dialogRef.close();
  }


  saveSettings() {
    this.settingsService.saveSettings()
      .then(() => { this.dialogRef.close(); })
      .catch((error) => {
        console.error(error)
        this.dialog.open(ErrorComponent, {
          data: {
            title: 'Ooops!',
            content: 'Settings could not be saved.'
          }
        })
      });
  }

  validateSettings() {
    this.validateStimuliPath();
    this.validateResponsesPath();
    return this.responsesPathValidationMessage === '' && this.stimuliPathValidationMessage === '';
  }

  changeBlockSize(by: number) {
    if (by) {
      this.settings.blockSize += by;
    }
    if (this.settings.blockSize < 1) {
      this.settings.blockSize = 1;
    }
    if (this.settings.blockSize > 100) {
      this.settings.blockSize = 100;
    }
  }

  changeResponseLength(by: number) {
    if (by) {
      this.settings.responseLength += by;
    }
    if (this.settings.responseLength < 1) {
      this.settings.responseLength = 1;
    }
    if (this.settings.responseLength > 10) {
      this.settings.responseLength = 10;
    }
  }

  changeRepetitions(by: number) {
    if (by) {
      this.settings.repetitions += by;
    }
    if (this.settings.repetitions < 1) {
      this.settings.repetitions = 1;
    }
    if (this.settings.repetitions > 10) {
      this.settings.repetitions = 10;
    }
  }


  validateStimuliPath() {
    if (!this.settings.stimuliPath || this.settings.stimuliPath === notSet) {
      this.stimuliPathValidationMessage = 'Stimuli folder not set';
      return;
    }
    if (!fs.pathExistsSync(this.settings.stimuliPath)) {
      this.stimuliPathValidationMessage = 'Stimuli folder does not exist';
      return;
    }
    const stimuli = fs.readdirSync(this.settings.stimuliPath).filter(filterImg);
    if (stimuli.length === 0) {
      this.stimuliPathValidationMessage = 'No Images files in stimuli folder';
      return;
    }
    this.stimuliPathValidationMessage = '';
  }

  validateResponsesPath() {
    if (!this.settings.responsesPath || this.settings.responsesPath === notSet) {
      this.responsesPathValidationMessage = 'Responses folder not set';
      return;
    }
    try {
      fs.accessSync(this.settings.responsesPath, fs.W_OK);
    } catch (err) {
      this.responsesPathValidationMessage = 'Cannot write to Responses folder';
      return;
    }
    this.responsesPathValidationMessage = '';
  }

}


const validateSettings = (settings: any)  => {

  return new Promise((resolve, reject) => {
    if (!settings.stimuliPath || settings.responsesPath === notSet) {
      reject('Stimuli folder not set');
    }
    if (!fs.pathExistsSync(settings.stimuliPath)) {
      reject('Stimuli folder does not exist')
    }
    const stimuli = fs.readdirSync(this.settings.stimuliPath).filter(filterImg);
    if (stimuli.length === 0) {
      reject('No image files in stimuli folder');
    }
    if (!settings.responsesPath || settings.responsesPath === notSet) {
      reject('Responses folder not set');
    }
    try {
      fs.accessSync(settings.responsesPath, fs.W_OK);
    } catch (err) {
      reject('Cannot write to Responses folder');
    }
    resolve();
  });
}
