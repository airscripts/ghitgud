import figlet from "figlet";

const asciiArt = figlet.textSync("Ghitgud", {
    width: 80,
    font: "Standard",
    whitespaceBreak: true,
    verticalLayout: "default",
    horizontalLayout: "default",
});

export default asciiArt;
