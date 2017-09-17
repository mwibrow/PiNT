import { Component, OnInit } from '@angular/core';
import { SettingsService, Settings } from '../../providers/settings.service';

@Component({
  selector: 'app-instructions',
  templateUrl: './instructions.component.html',
  styleUrls: ['./instructions.component.scss']
})
export class InstructionsComponent implements OnInit {

  private settings: Settings;
  constructor(settingsService: SettingsService) {
    settingsService.loadSettings();
    this.settings = settingsService.settings;

  }

  ngOnInit() {
  }



}
