# Katago UI
A client to play with Katago

# How it looks?
![IMAGE ALT TEXT HERE](https://raw.githubusercontent.com/maksimKorzh/kata-ui/main/assets/scr.png)

# Shortcuts
 - Placing stone on board sends **play** command
 - ArrowRight / Mouse scroll down navigates to the next SGF move
 - ArrowLeft / Mouse scroll up takes the move back
 - ArrowDown navigates 10 moves forward
 - ArrowUp navigates 10 moves backward
 - Ctrl / Mouse right click runs **genmove** command
 - Space / Mouse middle click toggles analysis mode, you can also use **kata-analyze 1** and **stop**

# How to install it
    git clone https://github.com/maksimKorzh/igs-client
    cd igs-client
    npm install
    npm start

    NOTE: Before first run make sure to adjust katago path in main.js
          otherwise app would not work. Optionally you may adjust "game.sgf"
          path in renderer.js to auto load SGF file.
