![PiNT logo](./logo-pint.png)
# PiNT

**PiNT** is an [Electron](https://electron.atom.io/)
app for performing picture naming tasks.
Its somewhat over-colourful appearance reflects its original
development for use with children.

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
5. To run the `electron` command from the command line, execute:
    ```
    npm install -g electron
    ```
6. After an even longer while **PiNT** can be run using:

    ```
    electron ./dist
    ```

## Using PiNT

*PiNT* displays pictures and records a partipant's spoken 'name'
for the picture

Use the settings to set the source folder for the pictures
and the destibatio folder for the recordings.
The pictures should be square and of a reasonably high resolution,
(e.g., `512px x 512px`)
Recordings will be saved
inside time-stamped folders inside the destination folder.

In general, it is advisable set up the microphone prior to
running **PiNT**.
If a microphone is unavailable then it will (or at least should)
not be possible to run the task and an appropriate warning
will be displayed.
The `Audio` button on the home page can be used to monitor
the microphone while setting the system volume.
Note that this feature does not seem to work consistently
(or at all) on Windows.

Pressing `Escape` three times rapidly while the
picture naming task is running should return the app
to the home screen.

## Acknowledgements

This project would never have got off the ground without
[angular-electron](https://github.com/maximegris/angular-electron).
