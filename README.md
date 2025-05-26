# Katago UI
A client to play with Katago

# How it looks?
![IMAGE ALT TEXT HERE](https://raw.githubusercontent.com/maksimKorzh/kata-ui/main/assets/scr.png)

# How it works?
You just have a GTP console forwarded to an ElectronJS web interface,
all the actions, e.g. playing games or analyzing is done purely
via GTP commands, type "help" for more details. Board is synced
with **showboard** command, printing board in the console.
Whenever you click on board square a move is sent as a GTP command.

# Loading SGF
Use katago **loadsgf** command

# Shortcuts
 - Placing stone on board sends **play** command
 - Mouse scroll down navigates to the next SGF move
 - Mouse scroll up takes the move back
 - Mouse right click runs **genmove** command
 - Mouse middle click toggles analysis mode, you can also use **kata-analyze 1** and **stop**

# How to install it
    git clone https://github.com/maksimKorzh/igs-client
    cd igs-client
    npm install
    npm start

    NOTE: Before first run make sure to adjust katago path in main.js,
          otherwise app would not work.
