import figlet from "figlet";

const ascii = figlet.textSync("Ghitgud", {
    width: 80,
    font: "Standard",
    whitespaceBreak: true,
    verticalLayout: "default",
    horizontalLayout: "default",
});

export default ascii;
