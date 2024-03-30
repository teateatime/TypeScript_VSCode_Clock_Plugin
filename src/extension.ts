// *Name: Tim Truong
// *Course name: Software Engineering 1
// *Assignment: Design1
// *Instructor’s name: Dr. James Daly
// *Date: 9/28/23
// *Sources Of Help: StackOverflow, W3Schools, VS Code Extension API Site

import * as vscode from 'vscode';

// Global Variables
const TIMER_DURATION_KEY = 'tDuration';

const HOURS_IN_SECONDS = 3600;
const MINUTES_IN_SECONDS = 60;
const SECONDS_IN_MILLI = 1000;

let timer: NodeJS.Timeout;
let timerEndTime: number;
let timerDurationStr: string = '00:00:00';
let clockItem: vscode.StatusBarItem;
let showClock: boolean = false;
let isTimerRunning: boolean = false;

// Utilized https://www.w3schools.com/typescript/index.php to learn TypeScript, usually my go to site to learn
// a new language.
// Function to create and update clock
function updateClock() {
    try {
        if (!clockItem) {
            clockItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        }

        if (showClock) {
            if (isTimerRunning) {
                // Display remaining time
                const currentTime = Date.now();
                const remainingTime = Math.max(timerEndTime - currentTime, 0);

                conversion(remainingTime);

                clockItem.color = new vscode.ThemeColor('statusBar.foreground');
                clockItem.backgroundColor = new vscode.ThemeColor('statusBar.background');
            } else {
                // Display current time
                const currentTime = new Date();
                const clockText = currentTime.toLocaleTimeString();
                clockItem.text = `$(clock) ${clockText}`;
                clockItem.tooltip = "Current Time";
            }

            clockItem.command = 'timer.startTimer';
            clockItem.show();
        } else {
            // Hide the clock
            clockItem.hide();
        }
    } catch (error) {
        console.error('Error updating clock:', error);
    }
}

// Function to start the timer
function startTimer() {
    // Helper function to check if users are running a timer when a timer is already in use and creates warning msg
    checkTimerRunning();

    if (isTimerRunning) {
        return; // Prevent starting a new timer if one is already running
    }

    vscode.window.showInputBox({ prompt: "Enter timer duration (hh:mm:ss)",
    placeHolder: "Enter timer duration (hh:mm:ss)", value: timerDurationStr })
        .then((value) => {
            if (value) {
                const [hours, minutes, seconds] = value.split(':');

                let num_hrs = parseInt(hours); 
                let num_mins = parseInt(minutes);
                let num_secs = parseInt(seconds);

                if (!isNaN(num_hrs) && !isNaN(num_mins) && !isNaN(num_secs)) {
                    const timerDuration = num_hrs * HOURS_IN_SECONDS + num_mins * MINUTES_IN_SECONDS + num_secs;

                    vscode.workspace.getConfiguration().update(TIMER_DURATION_KEY, timerDuration, vscode.ConfigurationTarget.Global);

                    timerEndTime = Date.now() + timerDuration * SECONDS_IN_MILLI;

                    updateTimerDisplay();
                    timer = setInterval(updateTimerDisplay, SECONDS_IN_MILLI);
                    isTimerRunning = true;

                    timerDurationStr = value;
                } else {
                    vscode.window.showErrorMessage('Invalid timer duration format. Please use hh:mm:ss.');
                }
            }
        });
}

// Function to update the timer display
function updateTimerDisplay() {
    const currentTime = Date.now();
    const remainingTime = Math.max(timerEndTime - currentTime, 0);

    if (remainingTime === 0) {
        clearInterval(timer);
        isTimerRunning = false;
        showClock = false;

        // Notify the user when the timer elapses
        vscode.window.showInformationMessage('Timer elapsed!', 'Dismiss').then((action) => {
            if (action === 'Dismiss') {
                showClock = true;
                updateClock();
            }
        });
    } else {
        showClock = true;
        updateClock();
    }
}

// Helper function to register the commands
function register_comms(context: vscode.ExtensionContext) {
    // https://code.visualstudio.com/api/get-started/your-first-extension - Site helped me alot
    // Had some quick videos and extensive documentation to help guide me on making my first extension and regsitering
    // commands on package.json and in the .ts file itself.
    context.subscriptions.push(vscode.commands.registerCommand('timer.startClock', () => {
        showClock = true;
        updateClock();
        setInterval(updateClock, SECONDS_IN_MILLI);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('timer.startTimer', () => {
        startTimer();
        setInterval(updateClock, SECONDS_IN_MILLI);
    }));
}

// Helper function to check if the timer is on
function checkTimerRunning() {
    if (isTimerRunning) {
        vscode.window.showWarningMessage('Timer is already running. Please wait for it to finish.');
        return;
    }
}

// Helper function to convert the remaining time to separate entities
function conversion(remainingTime: number) {
    const time = new Date(remainingTime);
    const str_hours = time.getUTCHours().toString();
    const str_mins = time.getUTCMinutes().toString();
    const str_secs = time.getUTCSeconds().toString();

    clockItem.text = `$(clock) ${str_hours.padStart(2, '0')}:${str_mins.padStart(2, '0')}:${str_secs.padStart(2, '0')}`;
    clockItem.tooltip = "Remaining Time";
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "Timer" is now active!');

    register_comms(context);
}

export function deactivate() {
    console.log('Congratulations, your extension "Timer" is deactivated!');

    if (timer) {
        clearInterval(timer);
    }
}
