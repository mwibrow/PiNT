![PiNT logo](./logo-pint.png)
# PiNT

**PiNT** is an [Electron](https://electron.atom.io/)
app for performing picture naming task experiments.

## Building

The following instructions apply to all platforms (Linux, MacOS and Windows):

1. install the latest version of [node](https://nodejs.org/en/)
for the relevant platform.

2. Clone the repository or download the zip of the master branch

3. Change to the project root and execute:
    ```
    npm install
    ```
4. After a while (and possibly a bunch of warnings depending on the platform)
execute:
    ```
    npm run build
    ```
5. After an even longer while *PiNT* can be run using:

    ```
    electron ./dist
    ```

## Using PiNT

Use the settings to sey the source folder for the pictures
and the destination folder for the recordings on the Settings.
Recordings will be saved
inside timestamped folders inside the destination folder.

In general, it is advisable set up the microphone prior to
running *PiNT*.
If a microphone is unavailable then it will (or at least should)
not be possible to run the task and an appropriate warning
will be displayed.

Pressing `Escape` three times rapidly while the
picture naming task is running should return the app
to the home screen.

## Acknowledgements

This project would never have got off the ground without
[angular-electron](https://github.com/maximegris/angular-electron).
