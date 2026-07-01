import figlet from "figlet";
import pc from "picocolors";

const WIDTH = 80;
const TITLE = "Gitfleet";
const FONT = "Standard";
const WHITESPACE_BREAK = true;
const VERTICAL_LAYOUT = "default";
const HORIZONTAL_LAYOUT = "default";

const asciiArt = figlet.textSync(TITLE, {
  font: FONT,
  width: WIDTH,
  verticalLayout: VERTICAL_LAYOUT,
  whitespaceBreak: WHITESPACE_BREAK,
  horizontalLayout: HORIZONTAL_LAYOUT,
});

const lines = asciiArt.split("\n");
const colors = [pc.magenta, pc.blue, pc.cyan, pc.blue, pc.magenta];

const coloredAscii = lines
  .map((line, index) => {
    const colorFn = colors[index % colors.length];
    return colorFn(line);
  })
  .join("\n");

export default coloredAscii;
